import { useRef, useEffect, useState, useMemo } from 'react';
import { Download, ZoomIn, ZoomOut, Plus, Maximize } from 'lucide-react';
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

function SortableItem({ id, cell, style }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const combinedStyle = {
        ...style,
        transform: CSS.Transform.toString(transform),
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

    const isContain = cell.settings && cell.settings.fitMode === 'max_dimensions';

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
        anchor: cell.settings?.anchor
    });

    return (
        <div ref={setNodeRef} style={combinedStyle} {...attributes} {...listeners} className="grid-cell">
            <img
                src={cell.image.url}
                alt="grid item"
                style={{
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

export default function PreviewCanvas({ images, settings, onReorder, onRemove, onAdd }) {
    const containerRef = useRef(null);
    const scrollAreaRef = useRef(null);
    const [zoom, setZoom] = useState(0.5);
    const [loadedImages, setLoadedImages] = useState([]);
    const [hasInitialZoomed, setHasInitialZoomed] = useState(false);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0 && onAdd) {
            onAdd(Array.from(e.target.files));
            e.target.value = '';
        }
    };

    // Preload images to get dimensions
    useEffect(() => {
        let mounted = true;
        const loadAll = async () => {
            const loaded = await Promise.all(images.map(img => {
                return new Promise((resolve) => {
                    const i = new Image();
                    i.onload = () => resolve({ ...img, width: i.width, height: i.height });
                    i.onerror = () => resolve({ ...img, width: 100, height: 100 });
                    i.src = img.url;
                });
            }));
            if (mounted) setLoadedImages(loaded);
        };
        loadAll();
        return () => { mounted = false; };
    }, [images]);

    const layout = useMemo(() => {
        return calculateLayout(loadedImages, settings);
    }, [loadedImages, settings]);

    // Smart Zoom Logic
    const calculateFitZoom = (limit100 = false) => {
        const contentArea = document.querySelector('.content-area');
        if (!contentArea || layout.totalWidth === 0 || layout.totalHeight === 0) return;

        const paddingBuffer = 64;
        const toolbarHeight = 50;

        const availableWidth = contentArea.clientWidth - paddingBuffer;
        const availableHeight = contentArea.clientHeight - toolbarHeight - paddingBuffer;

        const widthRatio = availableWidth / layout.totalWidth;
        const heightRatio = availableHeight / layout.totalHeight;

        const fitRatio = Math.min(widthRatio, heightRatio);

        let newZoom = Math.floor(fitRatio * 10) / 10;
        newZoom = Math.max(0.1, newZoom);

        if (limit100) {
            newZoom = Math.min(newZoom, 1.0);
        }

        setZoom(newZoom);
    };

    // Auto-zoom on initial load
    useEffect(() => {
        if (loadedImages.length > 0 && layout.totalWidth > 0 && !hasInitialZoomed) {
            setTimeout(() => {
                calculateFitZoom(true);
                setHasInitialZoomed(true);
            }, 50);
        } else if (loadedImages.length === 0) {
            setHasInitialZoomed(false);
        }
    }, [loadedImages, layout, hasInitialZoomed]);

    // Sensors for dnd-kit
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

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over) {
            if (onRemove) onRemove(active.id);
            return;
        }
        if (active.id !== over.id) {
            const oldIndex = loadedImages.findIndex(img => img.id === active.id);
            const newIndex = loadedImages.findIndex(img => img.id === over.id);
            if (onReorder) onReorder(oldIndex, newIndex);
        }
    };

    const handleDownload = async () => {
        // Preload all images before drawing
        const loadedImgs = await Promise.all(
            layout.cells.map(cell => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => resolve({ cell, img });
                    img.onerror = () => resolve({ cell, img: null });
                    img.src = cell.image.url;
                });
            })
        );

        const canvas = document.createElement('canvas');
        canvas.width = layout.totalWidth;
        canvas.height = layout.totalHeight;
        const ctx = canvas.getContext('2d');

        // Fill Background
        ctx.fillStyle = settings.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        loadedImgs.forEach(({ cell, img }) => {
            if (!img) return;

            const { x, y, width, height, imgRatio, cellRatio } = cell;

            ctx.save();
            ctx.beginPath();
            ctx.rect(x, y, width, height);
            ctx.clip();

            const isContain = settings.fitMode === 'max_dimensions';

            const { renderW, renderH } = calculateRenderDimensions({
                cellWidth: width,
                cellHeight: height,
                imgRatio,
                cellRatio,
                isContain
            });

            const { renderX, renderY } = calculateRenderPosition({
                cellWidth: width,
                cellHeight: height,
                renderW,
                renderH,
                anchor: settings.anchor
            });

            ctx.drawImage(img, x + renderX, y + renderY, renderW, renderH);
            ctx.restore();
        });

        const link = document.createElement('a');
        link.download = `grid_combine_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const scrollStyle = {
        overflow: 'hidden'
    };

    return (
        <div className="preview-component" ref={containerRef}>
            <div className="preview-toolbar">
                <div className="zoom-controls">
                    <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))}><ZoomOut size={16} /></button>
                    <span className="zoom-label">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(2, z + 0.1))}><ZoomIn size={16} /></button>
                    <button onClick={() => calculateFitZoom(false)} className="text-btn" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <Maximize size={14} /> Fit Screen
                    </button>
                    {/* Add Image Button */}
                    <button
                        onClick={() => document.getElementById('add-img-input').click()}
                        className="text-btn"
                        title="Add Images"
                        style={{ display: 'flex', gap: '4px', alignItems: 'center', marginLeft: '8px' }}
                    >
                        <Plus size={16} /> Add Image
                    </button>
                    <input
                        id="add-img-input"
                        type="file"
                        multiple
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                </div>
                <button className="btn-primary" onClick={handleDownload}>
                    <Download size={16} /> Save Image
                </button>
            </div>
            <div className="canvas-scroll-area" ref={scrollAreaRef} style={scrollStyle}>
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
                                items={loadedImages.map(img => img.id)}
                                strategy={rectSortingStrategy}
                            >
                                {layout.cells.map((cell) => (
                                    <SortableItem key={cell.image.id} id={cell.image.id} cell={cell} />
                                ))}
                            </SortableContext>
                        </DndContext>
                    </div>
                </div>
            </div>
        </div>
    );
}
