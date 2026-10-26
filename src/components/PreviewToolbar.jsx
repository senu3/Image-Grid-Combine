import { useRef } from 'react';
import { ZoomIn, ZoomOut, Plus, Maximize, ArrowUpDown, ArrowUpAZ, ArrowDownAZ, CalendarArrowUp, CalendarArrowDown } from 'lucide-react';
import { selectImageFiles } from '../utils/imageFiles';

const SORT_DETAILS = {
    0: { label: 'Sort', Icon: ArrowUpDown },
    1: { label: 'Name (A-Z)', Icon: ArrowDownAZ },
    2: { label: 'Name (Z-A)', Icon: ArrowUpAZ },
    3: { label: 'Date (Old-New)', Icon: CalendarArrowUp },
    4: { label: 'Date (New-Old)', Icon: CalendarArrowDown },
};

export default function PreviewToolbar({ zoom, autoFitEnabled, handleZoomOut, handleZoomIn, handleAutoFitToggle, sortState, handleSort, onAdd, onError, onToast }) {
    const addInputRef = useRef(null);
    const sortDetails = SORT_DETAILS[sortState];
    const handleFileChange = (event) => {
        const files = selectImageFiles(event.target.files, { onError, onToast });
        if (files.length > 0) onAdd?.(files);
        event.target.value = '';
    };
    return (
            <div className="preview-toolbar">
                <div className="zoom-controls">
                    <button
                        onClick={handleZoomOut}
                        title="Zoom Out (10% steps)"
                    >
                        <ZoomOut size={16} />
                    </button>
                    <span className="zoom-label">{Math.round(zoom * 100)}%</span>
                    <button
                        onClick={handleZoomIn}
                        title="Zoom In (10% steps)"
                    >
                        <ZoomIn size={16} />
                    </button>
                    <input
                        ref={addInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                    <button
                        onClick={handleAutoFitToggle}
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
                        title={`Sort Mode: ${sortDetails.label}`}
                        style={{ display: 'flex', gap: '4px', alignItems: 'center', marginLeft: '8px' }}
                    >
                        <sortDetails.Icon size={16} />
                        <span>{sortDetails.label}</span>
                    </button>
                </div>
                <div className="toolbar-actions">
                    <button
                        onClick={() => addInputRef.current?.click()}
                        className="btn-tertiary"
                        title="Add Images"
                    >
                        <Plus size={16} /> <span>Add Image</span>
                    </button>
                </div>
            </div>
    );
}
