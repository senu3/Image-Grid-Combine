import { useCallback, useEffect, useRef, useState } from 'react'
import ImageUploader from './components/ImageUploader'
import ControlPanel from './components/ControlPanel'
import PreviewCanvas from './components/PreviewCanvas'
import './App.css'

const isMobileViewport = () => typeof window !== 'undefined' && window.innerWidth < 768

function App() {
  const [images, setImages] = useState([])
  const imagesRef = useRef(images)
  const [isSettingsOpen, setIsSettingsOpen] = useState(() => {
    return !isMobileViewport()
  })

  const [settings, setSettings] = useState({
    mode: 'width_col', // 'width_col' or 'height_row'
    width: 1200,
    rows: 2,
    height: 1600,
    cols: 3,
    gap: 10,
    backgroundColor: '#ffffff',
    fitMode: 'average', // 'average', 'portrait', 'landscape'
    anchor: 'center' // 'top-left', 'top-center', 'top-right', ... 'center' ...
  })

  useEffect(() => {
    imagesRef.current = images
  }, [images])

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.url))
    }
  }, [])

  const updateImages = useCallback((updater) => {
    setImages((currentImages) => {
      const nextImages = typeof updater === 'function' ? updater(currentImages) : updater
      const nextIds = new Set(nextImages.map((image) => image.id))

      currentImages.forEach((image) => {
        if (!nextIds.has(image.id)) {
          URL.revokeObjectURL(image.url)
        }
      })

      return nextImages
    })
  }, [])

  const handleUpload = useCallback((files) => {
    const newImages = files.map((file) => ({
      file,
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file), // For preview
      name: file.name
    }))

    updateImages((currentImages) => [...currentImages, ...newImages])

    if (isMobileViewport()) {
      setIsSettingsOpen(false)
    }
  }, [updateImages])

  const clearImages = useCallback(() => {
    updateImages([])

    if (isMobileViewport()) {
      setIsSettingsOpen(true)
    }
  }, [updateImages])

  const handleReorder = useCallback((oldIndex, newIndex) => {
    if (oldIndex === newIndex) {
      return
    }

    updateImages((currentImages) => {
      const nextImages = [...currentImages]
      const [movedImage] = nextImages.splice(oldIndex, 1)
      nextImages.splice(newIndex, 0, movedImage)
      return nextImages
    })
  }, [updateImages])

  const handleRemove = useCallback((id) => {
    updateImages((currentImages) => currentImages.filter((image) => image.id !== id))
  }, [updateImages])

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
          <ControlPanel
            settings={settings}
            onSettingsChange={setSettings}
            isOpen={isSettingsOpen}
            onToggle={() => setIsSettingsOpen((currentValue) => !currentValue)}
          />
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
                onUpdateImages={updateImages}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
