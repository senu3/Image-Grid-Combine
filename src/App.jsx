import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
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
    backgroundColor: '#ffffff',
    fitMode: 'average', // 'average', 'portrait', 'landscape'
    anchor: 'center' // 'top-left', 'top-center', 'top-right', ... 'center' ...
  });

  const handleUpdateImages = (newImages) => {
    setImages(newImages);
  };

  const handleUpload = (files) => {
    // Create preview URLs
    const newImages = files.map(file => ({
      file,
      id: crypto.randomUUID(),
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
        <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1>Image Grid Combine</h1>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={clearImages} disabled={images.length === 0}>
            Clear All
          </button>
        </div>
      </header>
      <main className="app-main">
        <div className="sidebar">
          <ControlPanel settings={settings} onSettingsChange={setSettings} />
        </div>
        <div className="content-area">
          {images.length === 0 ? (
            <div className="empty-state">
              <ImageUploader onUpload={handleUpload} />
            </div>
          ) : (
            <div className="preview-wrap">
              <PreviewCanvas
                images={images}
                settings={settings}
                onReorder={handleReorder}
                onRemove={handleRemove}
                onAdd={handleUpload}
                onUpdateImages={handleUpdateImages}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
