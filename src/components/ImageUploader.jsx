import { useRef, useState } from 'react';
import { Upload, FolderUp, Image as ImageIcon } from 'lucide-react';
import './ImageUploader.css';

/**
 * ImageUploader Component
 * Handles drag & drop and file selection (files and directories).
 * @param {Object} props
 * @param {Function} props.onUpload - Callback with array of file objects
 */
export default function ImageUploader({ onUpload }) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const folderInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        // Process dropped files
        const files = Array.from(e.dataTransfer.files).filter(file =>
            file.type.startsWith('image/')
        );

        if (files.length > 0) {
            onUpload(files);
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files).filter(file =>
            file.type.startsWith('image/')
        );
        if (files.length > 0) {
            onUpload(files);
        }
        // Reset value to allow re-uploading same files
        e.target.value = '';
    };

    return (
        <div
            className={`uploader-container ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="uploader-content">
                <Upload className="uploader-icon" size={48} />
                <h3 className="uploader-title">Drag & Drop Images Here</h3>
                <p className="uploader-subtitle">or</p>

                <div className="uploader-actions">
                    <button
                        className="btn-secondary"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <ImageIcon size={18} style={{ marginRight: '8px' }} />
                        Select Files
                    </button>

                    <button
                        className="btn-secondary"
                        onClick={() => folderInputRef.current?.click()}
                    >
                        <FolderUp size={18} style={{ marginRight: '8px' }} />
                        Select Folder
                    </button>
                </div>

                <input
                    type="file"
                    multiple
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden-input"
                    onChange={handleFileChange}
                />

                {/* Directory upload input */}
                <input
                    type="file"
                    directory=""
                    webkitdirectory=""
                    ref={folderInputRef}
                    className="hidden-input"
                    onChange={handleFileChange}
                />
            </div>
        </div>
    );
}
