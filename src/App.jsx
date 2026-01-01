import { useState, useEffect } from 'react'
import ImageUploader from './components/ImageUploader'
import ControlPanel from './components/ControlPanel'
import PreviewCanvas from './components/PreviewCanvas'
import './App.css'

function App() {
  const [images, setImages] = useState([]);
  const [settings, setSettings] = useState({
    mode: 'width_col', // 'width_col' or 'height_row'
    width: 1920,
    rows: 2,
    height: 1080,
    cols: 3,
    gap: 10,
    backgroundColor: '#ffffff'
  });

  const handleUpload = (files) => {
    // Create preview URLs
    const newImages = files.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      url: URL.createObjectURL(file), // For preview
      name: file.name
    }));

    setImages(prev => [...prev, ...newImages]);
  };

  const clearImages = () => {
    images.forEach(img => URL.revokeObjectURL(img.url));
    setImages([]);
  };

  const handleReorder = (oldIndex, newIndex) => {
    setImages((items) => {
      const newItems = [...items];
      const [removed] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, removed);
      return newItems;
    });
  };

  const handleRemove = (id) => {
    setImages((items) => {
      const itemObj = items.find(i => i.id === id);
      if (itemObj) URL.revokeObjectURL(itemObj.url);
      return items.filter(i => i.id !== id);
    });
  };

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.url));
    };
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Image Grid Combine</h1>
        <div className="header-actions">
          {/* PreviewCanvas will expose save, but maybe we hoist it? 
               For now let PreviewCanvas handle save button internal logic or ref?
               Better to have save button in Header that triggers canvas save.
               We can pass a ref to PreviewCanvas.
           */}
          <button className="btn-secondary" onClick={clearImages} disabled={images.length === 0}>
            Clear All
          </button>
        </div>
      </header>
      <main className="app-main">
        <div className="sidebar">
          <div className="p-4 border-b border-gray-700">
            <h3>Settings</h3>
          </div>
          <ControlPanel settings={settings} onSettingsChange={setSettings} />
        </div>
        <div className="content-area">
          {images.length === 0 ? (
            <div className="empty-state">
              <ImageUploader onUpload={handleUpload} />
            </div>
          ) : (
            <div className="preview-wrap">
              <PreviewCanvas images={images} settings={settings} onReorder={handleReorder} onRemove={handleRemove} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
