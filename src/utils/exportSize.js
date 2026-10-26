// Application memory budget, not a guarantee of every browser's Canvas limit.
export const MAX_EXPORT_SIDE = 16384;
export const MAX_EXPORT_PIXELS = 16000000;

export function getExportSize(layout) {
    if (layout.error) throw new Error(layout.error);
    const width = Math.round(layout.totalWidth);
    const height = Math.round(layout.totalHeight);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
        throw new Error('出力サイズが無効です。サイズとGapを確認してください');
    }
    if (width > MAX_EXPORT_SIDE || height > MAX_EXPORT_SIDE || width * height > MAX_EXPORT_PIXELS) {
        throw new Error('出力が大きすぎます。各辺16,384px以内、合計1,600万画素以内にしてください');
    }
    return { width, height };
}
