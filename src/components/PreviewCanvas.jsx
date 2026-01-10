import { useRef, useEffect, useState, useMemo } from 'react';
import { Download, ZoomIn, ZoomOut, Plus, Maximize, ArrowUpDown, ArrowUpAZ, ArrowDownAZ, CalendarArrowUp, CalendarArrowDown } from 'lucide-react';
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

export default function PreviewCanvas({ images, settings, onReorder, onRemove, onAdd, onUpdateImages }) {
    const containerRef = useRef(null);
    const scrollAreaRef = useRef(null);
    const [zoom, setZoom] = useState(0.5);
    const [loadedImages, setLoadedImages] = useState([]);

    const [sortState, setSortState] = useState(0); // 0: None/Custom, 1: Name Asc, 2: Name Desc, 3: Date Asc, 4: Date Desc
    // Auto fit screen toggle
    // Default to true on mobile, can be toggled on desktop.
    const [autoFitEnabled, setAutoFitEnabled] = useState(() => {
        return typeof window !== 'undefined' && window.innerWidth < 768 ? true : true; // Default true for all? Or logic?
        // User request: "Mobile時は「Fit Screen」オン状態をデフォルトにして"
        // Let's check window.innerWidth in effect or init.
    });

    useEffect(() => {
        const checkMobile = () => {
            if (window.innerWidth < 768) {
                setAutoFitEnabled(true);
            }
        };
        checkMobile();
        // Optional: Listen to resize?
        // window.addEventListener('resize', checkMobile);
        // return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0 && onAdd) {
            onAdd(Array.from(e.target.files));
            e.target.value = '';
        }
    };

    const handleSort = () => {
        if (!onUpdateImages) return;

        // Cycle: 0(Custom) -> 1(Name Asc) -> 2(Name Desc) -> 3(Date Asc) -> 4(Date Desc) -> 1(Name Asc)...
        // If currently 0, go to 1. If 4, go to 1.
        let nextState = sortState + 1;
        if (nextState > 4) nextState = 1;

        const newImages = [...images];
        switch (nextState) {
            case 1: // Name Asc
                newImages.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
                break;
            case 2: // Name Desc
                newImages.sort((a, b) => b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' }));
                break;
            case 3: // Date Asc (Oldest first)
                newImages.sort((a, b) => a.file.lastModified - b.file.lastModified);
                break;
            case 4: // Date Desc (Newest first)
                newImages.sort((a, b) => b.file.lastModified - a.file.lastModified);
                break;
        }

        setSortState(nextState);
        onUpdateImages(newImages);
    };

    const getSortIcon = () => {
        switch (sortState) {
            case 1: return <ArrowDownAZ size={16} />;
            case 2: return <ArrowUpAZ size={16} />;
            case 3: return <CalendarArrowUp size={16} />;
            case 4: return <CalendarArrowDown size={16} />;
            default: return <ArrowUpDown size={16} />;
        }
    };

    const getSortLabel = () => {
        switch (sortState) {
            case 1: return 'Name (A-Z)';
            case 2: return 'Name (Z-A)';
            case 3: return 'Date (Old-New)';
            case 4: return 'Date (New-Old)';
            default: return 'Sort';
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

    // Track previous values to detect changes for auto-zoom
    const prevImagesLengthRef = useRef(0);
    const prevColsRef = useRef(settings.cols);
    const prevRowsRef = useRef(settings.rows);
    const prevFitModeRef = useRef(settings.fitMode);
    const prevModeRef = useRef(settings.mode); // Track layout mode
    const prevAutoFitEnabledRef = useRef(autoFitEnabled);

    // Calculate layout and zoom together to avoid flicker
    const { layout, calculatedZoom } = useMemo(() => {
        const layoutResult = calculateLayout(loadedImages, settings);

        // Check if auto-zoom should be triggered
        const imagesChanged = loadedImages.length !== prevImagesLengthRef.current;
        const colsChanged = settings.cols !== prevColsRef.current;
        const rowsChanged = settings.rows !== prevRowsRef.current;
        const fitModeChanged = settings.fitMode !== prevFitModeRef.current;
        const modeChanged = settings.mode !== prevModeRef.current; // Check mode change
        const autoFitJustEnabled = autoFitEnabled && !prevAutoFitEnabledRef.current;

        const shouldAutoZoom = autoFitEnabled &&
            loadedImages.length > 0 &&
            layoutResult.totalWidth > 0 &&
            (imagesChanged || colsChanged || rowsChanged || fitModeChanged || modeChanged || autoFitJustEnabled);

        let newZoom = null;
        if (shouldAutoZoom) {
            const contentArea = document.querySelector('.content-area');
            if (contentArea) {
                const paddingBuffer = 64;
                const toolbarHeight = 50;

                const availableWidth = contentArea.clientWidth - paddingBuffer;
                const availableHeight = contentArea.clientHeight - toolbarHeight - paddingBuffer;

                const widthRatio = availableWidth / layoutResult.totalWidth;
                const heightRatio = availableHeight / layoutResult.totalHeight;

                const fitRatio = Math.min(widthRatio, heightRatio);
                // User requested precision like 11%, 13% for auto-fit. 
                // Using 1% precision (floor to 2 decimals)
                newZoom = Math.floor(fitRatio * 100) / 100;
                newZoom = Math.max(0.1, newZoom);
                newZoom = Math.min(newZoom, 1.0); // limit to 100%
            }
        }

        return { layout: layoutResult, calculatedZoom: newZoom };
    }, [loadedImages, settings, autoFitEnabled]);

    // Update refs and apply zoom after layout calculation
    useEffect(() => {
        prevImagesLengthRef.current = loadedImages.length;
        prevColsRef.current = settings.cols;
        prevRowsRef.current = settings.rows;
        prevFitModeRef.current = settings.fitMode;
        prevModeRef.current = settings.mode;
        prevAutoFitEnabledRef.current = autoFitEnabled;

        if (calculatedZoom !== null) {
            setZoom(calculatedZoom);
        }
    }, [loadedImages.length, settings.cols, settings.rows, settings.fitMode, settings.mode, autoFitEnabled, calculatedZoom]);

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
            // Reset sort state to custom when manually reordering
            if (sortState !== 0) setSortState(0);
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
                    <button onClick={() => setZoom(z => Math.max(0.1, Math.ceil((z * 10) - 1) / 10))} title="Zoom Out (10% steps)"><ZoomOut size={16} /></button>
                    <span className="zoom-label">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(2, Math.floor((z * 10) + 1) / 10))} title="Zoom In (10% steps)"><ZoomIn size={16} /></button>
                    <input
                        id="add-img-input"
                        type="file"
                        multiple
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                    <button
                        onClick={() => setAutoFitEnabled(!autoFitEnabled)}
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
                        title={`Sort Mode: ${getSortLabel()}`}
                        style={{ display: 'flex', gap: '4px', alignItems: 'center', marginLeft: '8px' }}
                    >
                        {getSortIcon()}
                        <span className="mobile-hide">{getSortLabel()}</span>
                    </button>
                </div>
                <div className="toolbar-actions">
                    <button
                        onClick={() => document.getElementById('add-img-input').click()}
                        className="btn-tertiary"
                        title="Add Images"
                    >
                        <Plus size={16} /> <span>Add Image</span>
                    </button>
                    <button className="btn-primary" onClick={handleDownload}>
                        <Download size={16} /> Save Image
                    </button>
                </div>
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
