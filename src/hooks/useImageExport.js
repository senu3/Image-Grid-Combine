import { useCallback, useEffect } from 'react';
import { calculateLayout } from '../utils/gridLayout';
import { getExportSize } from '../utils/exportSize';
import { getCellImagePlacement } from '../utils/imagePlacement';

export function useImageExport({ images, settings, backgroundFillColor, ensureImageAsset, getAsset, isActive, onError, onToast, onErrorClear, onSaveActionChange }) {
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

        if (!isActive()) return;

        if (exportImages.some((image) => image.width == null || image.height == null)) {
            onToast?.('画像の読み込み完了後に保存してください', 'info');
            return;
        }

        if (exportImages.some((image) => image.loadStatus === 'error' || !image.hasDrawable)) {
            onError?.('読み込めない画像があるため保存できません');
            return;
        }

        const exportLayout = calculateLayout(exportImages, settings);
        let exportSize;
        try {
            exportSize = getExportSize(exportLayout);
        } catch (error) {
            onError?.(error.message);
            return;
        }
        const canvas = document.createElement('canvas');
        try {
            canvas.width = exportSize.width;
            canvas.height = exportSize.height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                onError?.('保存に失敗しました');
                return;
            }

            ctx.fillStyle = backgroundFillColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            exportLayout.cells.forEach((cell) => {
                const asset = getAsset(cell.image.id);
                if (!asset?.drawable) {
                    throw new Error('画像が変更されました。もう一度保存してください');
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

            if (!isActive()) return;

            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `grid_combine_${Date.now()}.png`;
            link.href = downloadUrl;
            try {
                link.click();
                onErrorClear?.();
            } finally {
                setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
            }
        } finally {
            canvas.width = 0;
            canvas.height = 0;
        }
    }, [backgroundFillColor, ensureImageAsset, getAsset, isActive, images, onError, onErrorClear, onToast, settings]);

    useEffect(() => {
        onSaveActionChange?.(handleDownload);

        return () => {
            onSaveActionChange?.(null);
        };
    }, [handleDownload, onSaveActionChange]);

}
