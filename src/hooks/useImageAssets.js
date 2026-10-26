import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { loadImageAsset, disposeImageAsset } from '../utils/imageAssets';

function imageAssetsReducer(state, action) {
    switch (action.type) {
        case 'upsert':
            if (state[action.id] === action.asset) {
                return state;
            }

            return {
                ...state,
                [action.id]: action.asset,
            };

        case 'prune': {
            let hasChanges = false;
            const nextState = {};

            Object.entries(state).forEach(([id, asset]) => {
                if (action.activeIds.has(id)) {
                    nextState[id] = asset;
                    return;
                }

                hasChanges = true;
            });

            return hasChanges ? nextState : state;
        }

        default:
            return state;
    }
}

export function useImageAssets(images, { onError, onToast }) {
    const isMountedRef = useRef(true);
    const activeImageIdsRef = useRef(new Set());
    const hasShownAllImagesFailedRef = useRef(false);
    const notifiedFailedImageIdsRef = useRef(new Set());
    const imageAssetCacheRef = useRef(new Map());
    const imageLoadPromisesRef = useRef(new Map());
    const imageLoadControllersRef = useRef(new Map());

    const [imageAssets, dispatchImageAssets] = useReducer(imageAssetsReducer, {});

    useEffect(() => {
        isMountedRef.current = true;
        const imageLoadControllers = imageLoadControllersRef.current;
        const imageLoadPromises = imageLoadPromisesRef.current;
        const imageAssetCache = imageAssetCacheRef.current;

        return () => {
            isMountedRef.current = false;
            imageLoadControllers.forEach((controller) => controller.abort());
            imageLoadControllers.clear();
            imageLoadPromises.clear();
            imageAssetCache.forEach((asset) => disposeImageAsset(asset));
            imageAssetCache.clear();
        };
    }, []);

    const ensureImageAsset = useCallback((image) => {
        const cachedAsset = imageAssetCacheRef.current.get(image.id);
        if (cachedAsset) {
            return Promise.resolve(cachedAsset);
        }

        const pendingAsset = imageLoadPromisesRef.current.get(image.id);
        if (pendingAsset) {
            return pendingAsset;
        }

        const controller = new AbortController();
        imageLoadControllersRef.current.set(image.id, controller);

        const loadPromise = loadImageAsset(image, controller.signal).then((asset) => {
            if (!asset) {
                return null;
            }

            if (controller.signal.aborted || !isMountedRef.current || !activeImageIdsRef.current.has(image.id)) {
                disposeImageAsset(asset);
                return null;
            }

            const previousAsset = imageAssetCacheRef.current.get(image.id);
            if (previousAsset && previousAsset !== asset) {
                disposeImageAsset(previousAsset);
            }
            imageAssetCacheRef.current.set(image.id, asset);

            if (isMountedRef.current) {
                dispatchImageAssets({ type: 'upsert', id: image.id, asset });
            }

            return asset;
        }).finally(() => {
            if (imageLoadControllersRef.current.get(image.id) === controller) {
                imageLoadPromisesRef.current.delete(image.id);
                imageLoadControllersRef.current.delete(image.id);
            }
        });

        imageLoadPromisesRef.current.set(image.id, loadPromise);
        return loadPromise;
    }, []);

    useEffect(() => {
        const nextActiveIds = new Set(images.map((image) => image.id));
        activeImageIdsRef.current = nextActiveIds;
        dispatchImageAssets({ type: 'prune', activeIds: nextActiveIds });
        notifiedFailedImageIdsRef.current.forEach((id) => {
            if (!nextActiveIds.has(id)) {
                notifiedFailedImageIdsRef.current.delete(id);
            }
        });

        for (const [id, asset] of imageAssetCacheRef.current.entries()) {
            if (!nextActiveIds.has(id)) {
                disposeImageAsset(asset);
                imageAssetCacheRef.current.delete(id);
            }
        }

        for (const [id, controller] of imageLoadControllersRef.current.entries()) {
            if (!nextActiveIds.has(id)) {
                controller.abort();
                imageLoadControllersRef.current.delete(id);
                imageLoadPromisesRef.current.delete(id);
            }
        }

        images.forEach((image) => {
            if (!imageAssetCacheRef.current.has(image.id)) {
                void ensureImageAsset(image);
            }
        });
    }, [images, ensureImageAsset]);

    const loadedImages = useMemo(() => {
        return images.map((image) => {
            const asset = imageAssets[image.id];

            return {
                ...image,
                width: asset?.width ?? null,
                height: asset?.height ?? null,
            };
        });
    }, [images, imageAssets]);

    const hasPendingImageMetadata = loadedImages.some((image) => image.width == null || image.height == null);
    const failedImageCount = loadedImages.filter((image) => imageAssets[image.id]?.status === 'error').length;
    const allImagesFailedToLoad = images.length > 0 && !hasPendingImageMetadata && failedImageCount === images.length;

    useEffect(() => {
        if (allImagesFailedToLoad) {
            if (!hasShownAllImagesFailedRef.current) {
                onError?.('画像を読み込めませんでした');
                hasShownAllImagesFailedRef.current = true;
            }
            return;
        }

        hasShownAllImagesFailedRef.current = false;
    }, [allImagesFailedToLoad, onError]);

    useEffect(() => {
        const failedImages = loadedImages.filter((image) => {
            const asset = imageAssets[image.id];
            return asset?.status === 'error' && !notifiedFailedImageIdsRef.current.has(image.id);
        });

        if (failedImages.length === 0) {
            return;
        }

        failedImages.forEach((image) => {
            notifiedFailedImageIdsRef.current.add(image.id);
        });

        if (allImagesFailedToLoad) {
            return;
        }

        onToast?.(
            failedImages.length === 1
                ? '1件の画像を読み込めませんでした'
                : `${failedImages.length}件の画像を読み込めませんでした`,
            'info'
        );
    }, [allImagesFailedToLoad, imageAssets, loadedImages, onToast]);

    const getAsset = useCallback((id) => imageAssetCacheRef.current.get(id), []);
    const isActive = useCallback(() => isMountedRef.current, []);
    return { loadedImages, hasPendingImageMetadata, ensureImageAsset, getAsset, isActive };
}
