import { useCallback, useMemo, useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, rectIntersection } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { calculateLayout } from '../utils/gridLayout';
import { toRgbaColor } from '../utils/color';
import { useImageAssets } from '../hooks/useImageAssets';
import { useImageExport } from '../hooks/useImageExport';
import { usePreviewZoom } from '../hooks/usePreviewZoom';
import PreviewToolbar from './PreviewToolbar';
import SortableImage from './SortableImage';
import './PreviewCanvas.css';

const FILE_NAME_COLLATOR = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base',
});

const DRAG_DELETE_HINT_STORAGE_KEY = 'image-grid-combine:drag-delete-hint-dismissed:v1';

function loadDismissedDragDeleteHint() {
    if (typeof window === 'undefined') {
        return false;
    }

    try {
        return window.localStorage.getItem(DRAG_DELETE_HINT_STORAGE_KEY) === '1';
    } catch {
        return false;
    }
}

export default function PreviewCanvas({
    images,
    settings,
    onReorder,
    onRemove,
    onAdd,
    onUpdateImages,
    onToast,
    onError,
    onErrorClear,
    onSaveActionChange
}) {
    const [sortState, setSortState] = useState(0);
    const [isDragDeleteHintDismissed, setIsDragDeleteHintDismissed] = useState(loadDismissedDragDeleteHint);
    const { loadedImages, hasPendingImageMetadata, ensureImageAsset, getAsset, isActive } = useImageAssets(images, { onError, onToast });
    const layout = useMemo(() => {
        if (images.length === 0 || hasPendingImageMetadata) {
            return { totalWidth: 0, totalHeight: 0, cells: [] };
        }

        return calculateLayout(loadedImages, settings);
    }, [hasPendingImageMetadata, images.length, loadedImages, settings]);
    const backgroundFillColor = toRgbaColor(settings.backgroundColor, settings.backgroundAlpha);

    const zoomControls = usePreviewZoom(layout, hasPendingImageMetadata);
    const { scrollAreaRef, zoom } = zoomControls;
    useImageExport({ images, settings, backgroundFillColor, ensureImageAsset, getAsset, isActive, onError, onToast, onErrorClear, onSaveActionChange });

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

    const dismissDragDeleteHint = useCallback(() => {
        setIsDragDeleteHintDismissed(true);

        try {
            window.localStorage.setItem(DRAG_DELETE_HINT_STORAGE_KEY, '1');
        } catch {
            // Ignore storage failures so the hint can still be dismissed for this session.
        }
    }, []);

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

    return (
        <div className="preview-component">
            <PreviewToolbar {...zoomControls} sortState={sortState} handleSort={handleSort} onAdd={onAdd} onError={onError} onToast={onToast} />
            {!isDragDeleteHintDismissed ? (
                <div className="drag-delete-hint" role="note">
                    <div className="drag-delete-hint-copy">
                        <Trash2 size={15} />
                        <span>Tip: 画像を範囲外にドラッグして離すと削除されます</span>
                    </div>
                    <button
                        type="button"
                        className="drag-delete-hint-close"
                        onClick={dismissDragDeleteHint}
                        aria-label="削除ヒントを閉じる"
                    >
                        <X size={14} />
                    </button>
                </div>
            ) : null}
            <div className="canvas-scroll-area" ref={scrollAreaRef}>
                {layout.error ? (
                    <div className="preview-loading" role="alert">{layout.error}</div>
                ) : hasPendingImageMetadata ? (
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
                                backgroundColor: backgroundFillColor,
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
                                        <SortableImage key={cell.image.id} id={cell.image.id} cell={cell} zoom={zoom} />
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
