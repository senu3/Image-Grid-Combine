export function selectImageFiles(fileList, { onError, onToast } = {}) {
    const files = Array.from(fileList ?? []);
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    const skippedCount = files.length - imageFiles.length;
    if (files.length > 0 && imageFiles.length === 0) {
        onError?.('画像ファイルを選択してください');
    } else if (skippedCount > 0) {
        onToast?.(`${skippedCount}件の画像以外を除外しました`, 'info');
    }
    return imageFiles;
}
