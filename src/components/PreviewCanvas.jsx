import { useRef, useEffect, useState, useMemo } from 'react';
import { Download, ZoomIn, ZoomOut, Plus } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    rectIntersection,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { calculateLayout } from '../utils/gridLayout';
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

    // Image fitting logic (cover with anchor)
    const renderW = cell.imgRatio > cell.cellRatio ? cell.height * cell.imgRatio : cell.width;
    const renderH = cell.imgRatio > cell.cellRatio ? cell.height : cell.width / cell.imgRatio;

    // Anchor Logic
    // If img wider than cell (clipped horizontally):
    // spaceX = cell.width - renderW (negative value)
    // anchorX factor: left=0, center=0.5, right=1
    // OffsetX = spaceX * anchorX

    // If img taller than cell (clipped vertically):
    // spaceY = cell.height - renderH (negative value)
    // anchorY factor: top=0, center=0.5, bottom=1

    let anchorX = 0.5;
    let anchorY = 0.5;

    if (cell.settings && cell.settings.anchor) {
        const parts = cell.settings.anchor.split('-');
        // Extract Y
        if (parts[0] === 'top') anchorY = 0;
        else if (parts[0] === 'bottom') anchorY = 1;

        // Extract X
        if (parts.includes('left')) anchorX = 0;
        else if (parts.includes('right')) anchorX = 1;
        // else center
        if (cell.settings.anchor === 'center') { anchorX = 0.5; anchorY = 0.5; }
    }

    const renderX = cell.imgRatio > cell.cellRatio ? (cell.width - renderW) * anchorX : 0;
    const renderY = cell.imgRatio > cell.cellRatio ? 0 : (cell.height - renderH) * anchorY;

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
                    pointerEvents: 'none', // Prevent img drag, handle drag on container
                }}
            />
        </div>
    );
}

export default function PreviewCanvas({ images, settings, onReorder, onRemove, onAdd }) {
    const containerRef = useRef(null);
    const fileInputRef = useRef(null);
    const [zoom, setZoom] = useState(0.5);
    const [loadedImages, setLoadedImages] = useState([]);

    const handleAddClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0 && onAdd) {
            onAdd(Array.from(e.target.files));
            // Reset input so same file selection works if needed
            e.target.value = '';
        }
    };

    // Sensors for dnd-kit
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Avoid accidental drags
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Preload images to get dimensions
    useEffect(() => {
        let mounted = true;
        const loadAll = async () => {
            const loaded = await Promise.all(images.map(img => {
                return new Promise((resolve) => {
                    // If we already have dimensions (from App or previous load), utilize them?
                    // For now, robustly loading standard Image to be sure.
                    const i = new Image();
                    i.onload = () => resolve({ ...img, width: i.width, height: i.height });
                    i.onerror = () => resolve({ ...img, width: 100, height: 100 }); // Fallback
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

    const handleDragEnd = (event) => {
        const { active, over } = event;

        // If over is null, we dropped outside the droppable area (SortableContext items)
        // However, SortableContext items usually fill the container.
        // If we drag fully outside the container, over might be null.
        // rectIntersection is strictly checking overlap with droppable items.

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

    const handleDownload = () => {
        // Generate Canvas on the fly
        const canvas = document.createElement('canvas');
        canvas.width = layout.totalWidth;
        canvas.height = layout.totalHeight;
        const ctx = canvas.getContext('2d');

        // Fill Background
        ctx.fillStyle = settings.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        layout.cells.forEach(cell => {
            // Draw Logic (same as before)
            const { x, y, width, height, image, imgRatio, cellRatio } = cell;

            ctx.save();
            ctx.beginPath();
            ctx.rect(x, y, width, height);
            ctx.clip();

            let renderW, renderH, renderX, renderY;

            // We need the ACTUAL image element for drawImage.
            // We can grab it from DOM or re-create. DOM is easiest if loaded.
            // Or simple:
            const imgEl = new Image();
            imgEl.src = image.url;
            // Since it's loaded in loadedImages, it should be instant from cache.

            // Anchor Logic (duplicated from SortableItem, could be shared fn)
            let anchorX = 0.5;
            let anchorY = 0.5;
            if (cell.settings && cell.settings.anchor) { // Use cell.settings.anchor for consistency
                const parts = cell.settings.anchor.split('-');
                if (parts[0] === 'top') anchorY = 0;
                else if (parts[0] === 'bottom') anchorY = 1;

                if (parts.includes('left')) anchorX = 0;
                else if (parts.includes('right')) anchorX = 1;
                if (cell.settings.anchor === 'center') { anchorX = 0.5; anchorY = 0.5; } // Use cell.settings.anchor
            }

            if (imgRatio > cellRatio) {
                renderH = height;
                renderW = height * imgRatio;
                renderY = y;
                renderX = x + (width - renderW) * anchorX;
            } else {
                renderW = width;
                renderH = width / imgRatio;
                renderX = x;
                renderY = y + (height - renderH) * anchorY;
            }

            ctx.drawImage(imgEl, renderX, renderY, renderW, renderH);
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
                    <button onClick={() => setZoom(0.5)} className="text-btn">Fit</button>
                    {/* Add Image Button */}
                    <button onClick={() => document.getElementById('add-img-input').click()} className="text-btn" title="Add Images">
                        <Plus size={16} />
                    </button>
                    <input
                        id="add-img-input"
                        type="file"
                        multiple
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0 && onAdd) {
                                onAdd(Array.from(e.target.files));
                                e.target.value = '';
                            }
                        }}
                    />
                </div>
                <button className="btn-primary" onClick={handleDownload}>
                    <Download size={16} /> Save Image
                </button>
            </div>
            <div className="canvas-scroll-area" style={scrollStyle}>
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
                            position: 'absolute', // Absolute within the relative scaler
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
