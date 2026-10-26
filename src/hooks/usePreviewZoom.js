import { useEffect, useMemo, useRef, useState } from 'react';

const MIN_ZOOM = 0.1;
const MAX_MANUAL_ZOOM = 2;
const MAX_AUTO_FIT_ZOOM = 1;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function usePreviewZoom(layout, hasPendingImageMetadata) {
    const scrollAreaRef = useRef(null);
    const [manualZoom, setManualZoom] = useState(0.5);
    const [autoFitEnabled, setAutoFitEnabled] = useState(true);
    const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
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

    const handleAutoFitToggle = () => {
        if (autoFitEnabled) {
            setManualZoom(zoom);
            setAutoFitEnabled(false);
            return;
        }

        setAutoFitEnabled(true);
    };

    return { scrollAreaRef, zoom, autoFitEnabled, handleZoomOut, handleZoomIn, handleAutoFitToggle };
}
