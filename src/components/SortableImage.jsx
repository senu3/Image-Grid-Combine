import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getCellImagePlacement } from '../utils/imagePlacement';

export default function SortableImage({ id, cell, zoom }) {
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

