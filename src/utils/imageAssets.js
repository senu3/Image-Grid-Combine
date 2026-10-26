const IMAGE_BITMAP_TIMEOUT_MS = 1500;
const IMAGE_LOAD_TIMEOUT_MS = 5000;

export function disposeImageAsset(asset) {
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

export async function loadImageAsset(image, signal) {
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

