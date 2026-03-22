import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
    ZoomIn,
    ZoomOut,
    Plus,
    Maximize,
    ArrowUpDown,
    ArrowUpAZ,
    ArrowDownAZ,
    CalendarArrowUp,
    CalendarArrowDown
} from 'lucide-react';
import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    rectIntersection,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { calculateLayout } from '../utils/gridLayout';
import { calculateRenderDimensions, calculateRenderPosition } from '../utils/anchor';
import './PreviewCanvas.css';

const SORT_DETAILS = {
    0: { label: 'Sort', Icon: ArrowUpDown },
    1: { label: 'Name (A-Z)', Icon: ArrowDownAZ },
    2: { label: 'Name (Z-A)', Icon: ArrowUpAZ },
    3: { label: 'Date (Old-New)', Icon: CalendarArrowUp },
    4: { label: 'Date (New-Old)', Icon: CalendarArrowDown },
};

const FILE_NAME_COLLATOR = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base',
});

const MIN_ZOOM = 0.1;
const MAX_MANUAL_ZOOM = 2;
const MAX_AUTO_FIT_ZOOM = 1;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const IMAGE_BITMAP_TIMEOUT_MS = 1500;
const IMAGE_LOAD_TIMEOUT_MS = 5000;

function disposeImageAsset(asset) {
    const drawable = asset?.drawable;
    if (!drawable) {
        return;
    }

    if (typeof ImageBitmap !== 'undefined' && drawable instanceof ImageBitmap) {
        drawable.close();
        return;
    }

    if (typeof HTMLImageElement !== 'undefined' && drawable instanceof HTMLImageElement) {
        drawable.onload = null;
        drawable.onerror = null;
        drawable.src = '';
    }
}

function loadImageElement(image, signal) {
    return new Promise((resolve) => {
        const element = new Image();
        let settled = false;
        let timeoutId = null;

        const handleAbort = () => {
            element.src = '';
            finalize(null);
        };

        const finalize = (value) => {
            if (settled) {
                return;
            }

            settled = true;
            if (timeoutId !== null) {
                window.clearTimeout(timeoutId);
            }
            element.onload = null;
            element.onerror = null;
            signal?.removeEventListener('abort', handleAbort);
            resolve(value);
        };

        if (signal?.aborted) {
            resolve(null);
            return;
        }

        element.decoding = 'async';
        element.onload = () => finalize(element);
        element.onerror = () => finalize(null);
        signal?.addEventListener('abort', handleAbort, { once: true });
        timeoutId = window.setTimeout(() => finalize(null), IMAGE_LOAD_TIMEOUT_MS);
        element.src = image.url;
    });
}

function loadImageBitmap(image, signal) {
    return new Promise((resolve, reject) => {
        let settled = false;
        let didTimeout = false;
        let timeoutId = null;

        const handleAbort = () => {
            finalize(() => resolve(null));
        };

        const finalize = (callback) => {
            if (settled) {
                return;
            }

            settled = true;
            if (timeoutId !== null) {
                window.clearTimeout(timeoutId);
            }
            signal?.removeEventListener('abort', handleAbort);
            callback();
        };

        if (signal?.aborted) {
            resolve(null);
            return;
        }

        signal?.addEventListener('abort', handleAbort, { once: true });
        timeoutId = window.setTimeout(() => {
            didTimeout = true;
            finalize(() => resolve(null));
        }, IMAGE_BITMAP_TIMEOUT_MS);

        createImageBitmap(image.file, {
            imageOrientation: 'from-image',
        }).then((bitmap) => {
            if (signal?.aborted || didTimeout || settled) {
                bitmap.close();
                return;
            }

            finalize(() => resolve({
                drawable: bitmap,
                width: bitmap.width || 100,
                height: bitmap.height || 100,
                status: 'ready',
            }));
        }).catch((error) => {
            if (signal?.aborted || settled) {
                return;
            }

            finalize(() => reject(error));
        });
    });
}

async function loadImageAsset(image, signal) {
    if (typeof createImageBitmap === 'function' && image.file instanceof Blob) {
        try {
            const bitmapAsset = await loadImageBitmap(image, signal);
            if (bitmapAsset || signal?.aborted) {
                return bitmapAsset;
            }
        } catch {
            // Fall through to the HTMLImageElement path below.
        }
    }

    if (signal?.aborted) {
        return null;
    }

    const element = await loadImageElement(image, signal);
    if (!element) {
        if (signal?.aborted) {
            return null;
        }

        return {
            drawable: null,
            width: 100,
            height: 100,
            status: 'error',
        };
    }

    return {
        drawable: element,
        width: element.naturalWidth || element.width || 100,
        height: element.naturalHeight || element.height || 100,
        status: 'ready',
    };
}

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

function getCellImagePlacement(cell, anchor = cell.settings.anchor) {
    if (
        Number.isFinite(cell.renderWidth) &&
        Number.isFinite(cell.renderHeight)
    ) {
        const { renderX, renderY } = calculateRenderPosition({
            cellWidth: cell.width,
            cellHeight: cell.height,
            renderW: cell.renderWidth,
            renderH: cell.renderHeight,
            anchor
        });

        return {
            renderW: cell.renderWidth,
            renderH: cell.renderHeight,
            renderX,
            renderY
        };
    }

    const isContain = cell.settings.fitMode === 'max_dimensions';
    const { renderW, renderH } = calculateRenderDimensions({
        cellWidth: cell.width,
        cellHeight: cell.height,
        imgRatio: cell.imgRatio,
        cellRatio: cell.cellRatio,
        isContain
    });

    const { renderX, renderY } = calculateRenderPosition({
        cellWidth: cell.width,
        cellHeight: cell.height,
        renderW,
        renderH,
        anchor
    });

    return { renderW, renderH, renderX, renderY };
}

function hasAspectRatioVariation(images) {
    if (images.length < 2) {
        return false;
    }

    const comparableImages = images.filter((image) => (
        Number.isFinite(image.width) &&
        Number.isFinite(image.height) &&
        image.width > 0 &&
        image.height > 0
    ));

    if (comparableImages.length !== images.length) {
        return false;
    }

    const [baseImage, ...restImages] = comparableImages;
    const baseWidth = BigInt(baseImage.width);
    const baseHeight = BigInt(baseImage.height);

    return restImages.some((image) => (
        BigInt(image.width) * baseHeight !== baseWidth * BigInt(image.height)
    ));
}

function SortableItem({ id, cell, zoom }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const adjustedTransform = transform
        ? {
            ...transform,
            x: transform.x / zoom,
            y: transform.y / zoom,
        }
        : null;

    const combinedStyle = {
        transform: CSS.Transform.toString(adjustedTransform),
        transition,
        position: 'absolute',
        left: cell.x,
        top: cell.y,
        width: cell.width,
        height: cell.height,
        overflow: 'hidden',
        touchAction: 'none',
        zIndex: isDragging ? 200 : 'auto',
        opacity: isDragging ? 0.8 : 1,
    };

    const { renderW, renderH, renderX, renderY } = getCellImagePlacement(cell);

    return (
        <div ref={setNodeRef} style={combinedStyle} {...attributes} {...listeners} className="grid-cell">
            <img
                src={cell.image.url}
                alt={cell.image.name}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    display: 'block',
                    width: renderW,
                    height: renderH,
                    transform: `translate(${renderX}px, ${renderY}px)`,
                    maxWidth: 'none',
                    pointerEvents: 'none',
                }}
            />
        </div>
    );
}

export default function PreviewCanvas({
    images,
    settings,
    onReorder,
    onRemove,
    onAdd,
    onUpdateImages,
    onAspectRatioVariationChange,
    onToast,
    onError,
    onErrorClear,
    onSaveActionChange
}) {
    const scrollAreaRef = useRef(null);
    const addInputRef = useRef(null);
    const isMountedRef = useRef(true);
    const activeImageIdsRef = useRef(new Set());
    const hasShownAllImagesFailedRef = useRef(false);
    const notifiedFailedImageIdsRef = useRef(new Set());
    const imageAssetCacheRef = useRef(new Map());
    const imageLoadPromisesRef = useRef(new Map());
    const imageLoadControllersRef = useRef(new Map());

    const [manualZoom, setManualZoom] = useState(0.5);
    const [sortState, setSortState] = useState(0);
    const [autoFitEnabled, setAutoFitEnabled] = useState(true);
    const [imageAssets, dispatchImageAssets] = useReducer(imageAssetsReducer, {});
    const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

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

            if (!activeImageIdsRef.current.has(image.id)) {
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
            imageLoadPromisesRef.current.delete(image.id);
            imageLoadControllersRef.current.delete(image.id);
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

    useEffect(() => {
        const scrollArea = scrollAreaRef.current;
        if (!scrollArea) {
            return undefined;
        }

        const updateViewportSize = () => {
            const styles = window.getComputedStyle(scrollArea);
            const horizontalPadding = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
            const verticalPadding = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
            const nextViewportSize = {
                width: Math.max(0, scrollArea.clientWidth - horizontalPadding),
                height: Math.max(0, scrollArea.clientHeight - verticalPadding),
            };

            setViewportSize((currentSize) => {
                if (
                    currentSize.width === nextViewportSize.width &&
                    currentSize.height === nextViewportSize.height
                ) {
                    return currentSize;
                }

                return nextViewportSize;
            });
        };

        updateViewportSize();

        const observer = new ResizeObserver(updateViewportSize);
        observer.observe(scrollArea);
        window.addEventListener('resize', updateViewportSize);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', updateViewportSize);
        };
    }, []);

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

    useEffect(() => {
        onAspectRatioVariationChange?.(hasAspectRatioVariation(loadedImages));
    }, [loadedImages, onAspectRatioVariationChange]);

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

    const layout = useMemo(() => {
        if (images.length === 0 || hasPendingImageMetadata) {
            return { totalWidth: 0, totalHeight: 0, cells: [] };
        }

        return calculateLayout(loadedImages, settings);
    }, [hasPendingImageMetadata, images.length, loadedImages, settings]);

    const autoFitZoom = useMemo(() => {
        if (
            !autoFitEnabled ||
            hasPendingImageMetadata ||
            layout.totalWidth <= 0 ||
            layout.totalHeight <= 0 ||
            viewportSize.width <= 0 ||
            viewportSize.height <= 0
        ) {
            return null;
        }

        const fitRatio = Math.min(
            viewportSize.width / layout.totalWidth,
            viewportSize.height / layout.totalHeight
        );
        return clamp(Math.floor(fitRatio * 100) / 100, MIN_ZOOM, MAX_AUTO_FIT_ZOOM);
    }, [
        autoFitEnabled,
        hasPendingImageMetadata,
        layout.totalHeight,
        layout.totalWidth,
        viewportSize.height,
        viewportSize.width,
    ]);

    const zoom = autoFitZoom ?? manualZoom;

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const sortDetails = SORT_DETAILS[sortState];

    const filterImageFiles = useCallback((fileList) => {
        const allFiles = Array.from(fileList ?? []);
        const imageFiles = allFiles.filter((file) => file.type.startsWith('image/'));
        const skippedCount = allFiles.length - imageFiles.length;

        if (allFiles.length > 0 && imageFiles.length === 0) {
            onError?.('画像ファイルを選択してください');
        } else if (skippedCount > 0) {
            onToast?.(`${skippedCount}件の画像以外を除外しました`, 'info');
        }

        return imageFiles;
    }, [onError, onToast]);

    const handleFileChange = (event) => {
        const nextFiles = filterImageFiles(event.target.files);

        if (nextFiles.length > 0 && onAdd) {
            onAdd(nextFiles);
        }

        event.target.value = '';
    };

    const handleZoomOut = () => {
        const nextZoom = Math.max(MIN_ZOOM, Math.ceil((zoom * 10) - 1) / 10);
        setManualZoom(nextZoom);
        if (autoFitEnabled) {
            setAutoFitEnabled(false);
        }
    };

    const handleZoomIn = () => {
        const nextZoom = Math.min(MAX_MANUAL_ZOOM, Math.floor((zoom * 10) + 1) / 10);
        setManualZoom(nextZoom);
        if (autoFitEnabled) {
            setAutoFitEnabled(false);
        }
    };

    const handleSort = () => {
        if (!onUpdateImages || images.length < 2) {
            return;
        }

        const nextState = sortState === 4 ? 1 : sortState + 1;
        const nextImages = [...images];

        switch (nextState) {
            case 1:
                nextImages.sort((a, b) => FILE_NAME_COLLATOR.compare(a.name, b.name));
                break;
            case 2:
                nextImages.sort((a, b) => FILE_NAME_COLLATOR.compare(b.name, a.name));
                break;
            case 3:
                nextImages.sort((a, b) => a.file.lastModified - b.file.lastModified);
                break;
            case 4:
                nextImages.sort((a, b) => b.file.lastModified - a.file.lastModified);
                break;
            default:
                break;
        }

        setSortState(nextState);
        onUpdateImages(nextImages);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!over) {
            if (onRemove) {
                onRemove(active.id);
            }
            return;
        }

        if (active.id !== over.id) {
            const oldIndex = images.findIndex((image) => image.id === active.id);
            const newIndex = images.findIndex((image) => image.id === over.id);

            if (oldIndex === -1 || newIndex === -1) {
                return;
            }

            if (onReorder) {
                onReorder(oldIndex, newIndex);
            }

            if (sortState !== 0) {
                setSortState(0);
            }
        }
    };

    const handleDownload = useCallback(async () => {
        const exportImages = await Promise.all(
            images.map(async (image) => {
                const asset = await ensureImageAsset(image);
                return {
                    ...image,
                    width: asset?.width ?? null,
                    height: asset?.height ?? null,
                    hasDrawable: Boolean(asset?.drawable),
                    loadStatus: asset?.status ?? null,
                };
            })
        );

        if (exportImages.some((image) => image.width == null || image.height == null)) {
            onToast?.('画像の読み込み完了後に保存してください', 'info');
            return;
        }

        if (exportImages.some((image) => image.loadStatus === 'error' || !image.hasDrawable)) {
            onError?.('読み込めない画像があるため保存できません');
            return;
        }

        const exportLayout = calculateLayout(exportImages, settings);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(exportLayout.totalWidth));
        canvas.height = Math.max(1, Math.round(exportLayout.totalHeight));

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            onError?.('保存に失敗しました');
            return;
        }

        ctx.fillStyle = settings.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        exportLayout.cells.forEach((cell) => {
            const asset = imageAssetCacheRef.current.get(cell.image.id);
            if (!asset?.drawable) {
                return;
            }

            const { renderW, renderH, renderX, renderY } = getCellImagePlacement(cell, settings.anchor);

            ctx.save();
            ctx.beginPath();
            ctx.rect(cell.x, cell.y, cell.width, cell.height);
            ctx.clip();
            ctx.drawImage(asset.drawable, cell.x + renderX, cell.y + renderY, renderW, renderH);
            ctx.restore();
        });

        const blob = await new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/png');
        });

        if (!blob) {
            onError?.('保存に失敗しました');
            return;
        }

        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `grid_combine_${Date.now()}.png`;
        link.href = downloadUrl;
        link.click();
        onErrorClear?.();

        setTimeout(() => {
            URL.revokeObjectURL(downloadUrl);
        }, 0);
    }, [ensureImageAsset, images, onError, onErrorClear, onToast, settings]);

    useEffect(() => {
        onSaveActionChange?.(handleDownload);

        return () => {
            onSaveActionChange?.(null);
        };
    }, [handleDownload, onSaveActionChange]);

    const handleAutoFitToggle = () => {
        if (autoFitEnabled) {
            setManualZoom(zoom);
            setAutoFitEnabled(false);
            return;
        }

        setAutoFitEnabled(true);
    };

    return (
        <div className="preview-component">
            <div className="preview-toolbar">
                <div className="zoom-controls">
                    <button
                        onClick={handleZoomOut}
                        title="Zoom Out (10% steps)"
                    >
                        <ZoomOut size={16} />
                    </button>
                    <span className="zoom-label">{Math.round(zoom * 100)}%</span>
                    <button
                        onClick={handleZoomIn}
                        title="Zoom In (10% steps)"
                    >
                        <ZoomIn size={16} />
                    </button>
                    <input
                        ref={addInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                    <button
                        onClick={handleAutoFitToggle}
                        className={`text-btn btn-fit-screen ${autoFitEnabled ? 'active' : ''}`}
                        title={autoFitEnabled ? 'Auto Fit: ON' : 'Auto Fit: OFF'}
                        style={{ display: 'flex', gap: '4px', alignItems: 'center', marginLeft: '8px' }}
                    >
                        <Maximize size={16} />
                        <span className="mobile-hide">Fit Screen</span>
                    </button>
                    <button
                        onClick={handleSort}
                        className={`text-btn ${sortState !== 0 ? 'active' : ''}`}
                        title={`Sort Mode: ${sortDetails.label}`}
                        style={{ display: 'flex', gap: '4px', alignItems: 'center', marginLeft: '8px' }}
                    >
                        <sortDetails.Icon size={16} />
                        <span>{sortDetails.label}</span>
                    </button>
                </div>
                <div className="toolbar-actions">
                    <button
                        onClick={() => addInputRef.current?.click()}
                        className="btn-tertiary"
                        title="Add Images"
                    >
                        <Plus size={16} /> <span>Add Image</span>
                    </button>
                </div>
            </div>
            <div className="canvas-scroll-area" ref={scrollAreaRef}>
                {hasPendingImageMetadata ? (
                    <div className="preview-loading">
                        <span>Loading image dimensions...</span>
                    </div>
                ) : (
                    <div
                        className="scaling-container"
                        style={{
                            width: layout.totalWidth * zoom,
                            height: layout.totalHeight * zoom,
                            position: 'relative'
                        }}
                    >
                        <div
                            className="canvas-wrapper dom-grid"
                            style={{
                                width: layout.totalWidth,
                                height: layout.totalHeight,
                                transform: `scale(${zoom})`,
                                transformOrigin: '0 0',
                                backgroundColor: settings.backgroundColor,
                                position: 'absolute',
                                top: 0,
                                left: 0
                            }}
                        >
                            <DndContext
                                sensors={sensors}
                                collisionDetection={rectIntersection}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={images.map((image) => image.id)}
                                    strategy={rectSortingStrategy}
                                >
                                    {layout.cells.map((cell) => (
                                        <SortableItem key={cell.image.id} id={cell.image.id} cell={cell} zoom={zoom} />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
