import { useCallback, useEffect, useRef, useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import ImageUploader from './components/ImageUploader'
import ControlPanel from './components/ControlPanel'
import PreviewCanvas from './components/PreviewCanvas'
import NumberStepper from './components/NumberStepper'
import './App.css'

const isMobileViewport = () => typeof window !== 'undefined' && window.innerWidth < 768

function App() {
  const [images, setImages] = useState([])
  const imagesRef = useRef(images)
  const [hasMixedAspectRatios, setHasMixedAspectRatios] = useState(false)
  const [toast, setToast] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const toastTimeoutRef = useRef(null)
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
      if (toastTimeoutRef.current !== null) {
        window.clearTimeout(toastTimeoutRef.current)
      }
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.url))
    }
  }, [])

  const showToast = useCallback((message, tone = 'info') => {
    setToast({ message, tone })

    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current)
    }

    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(null)
      toastTimeoutRef.current = null
    }, 2200)
  }, [])

  const clearError = useCallback(() => {
    setErrorMessage(null)
  }, [])

  const showError = useCallback((message) => {
    setErrorMessage(message)

    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current)
      toastTimeoutRef.current = null
    }

    setToast(null)
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
    clearError()

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
  }, [clearError, updateImages])

  const clearImages = useCallback(() => {
    clearError()
    updateImages([])
  }, [clearError, updateImages])

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

  const handleSettingsChange = useCallback((nextSettings) => {
    setSettings(nextSettings)
  }, [])

  const handleSettingInputChange = useCallback((e) => {
    const { name, value, type } = e.target
    const isNumber = type === 'number' || type === 'range'

    setSettings((currentSettings) => ({
      ...currentSettings,
      [name]: isNumber ? parseInt(value, 10) || 0 : value
    }))
  }, [])

  const handleAspectRatioVariationChange = useCallback((nextHasMixedAspectRatios) => {
    setHasMixedAspectRatios(nextHasMixedAspectRatios)
  }, [])

  return (
    <div className={`app-container ${isSettingsOpen ? 'settings-open' : 'settings-closed'}`}>
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
      <div className="mobile-quick-layout-bar">
        <div className="mobile-layout-controls">
          <div className="mobile-mode-selector">
            <button
              className={`mode-btn ${settings.mode === 'width_col' ? 'active' : ''}`}
              onClick={() => handleSettingsChange({ ...settings, mode: 'width_col' })}
            >
              Width × Col
            </button>
            <button
              className={`mode-btn ${settings.mode === 'height_row' ? 'active' : ''}`}
              onClick={() => handleSettingsChange({ ...settings, mode: 'height_row' })}
            >
              Height × Row
            </button>
          </div>
          <div className="mobile-count-control">
            <span className="mobile-count-label">
              {settings.mode === 'width_col' ? 'Columns' : 'Rows'}
            </span>
            <NumberStepper
              name={settings.mode === 'width_col' ? 'cols' : 'rows'}
              value={settings.mode === 'width_col' ? settings.cols : settings.rows}
              onChange={handleSettingInputChange}
              min={1}
              max={100}
            />
          </div>
        </div>
        <button className="mobile-settings-trigger" onClick={() => setIsSettingsOpen(true)}>
          <SlidersHorizontal size={16} />
          <span>More</span>
        </button>
      </div>
      {errorMessage ? (
        <div className="app-error-banner" role="alert" aria-live="assertive">
          <span>{errorMessage}</span>
          <button
            type="button"
            className="app-error-close"
            onClick={clearError}
            aria-label="エラーを閉じる"
          >
            <X size={16} />
          </button>
        </div>
      ) : null}
      <main className="app-main">
        <div className="sidebar">
          <ControlPanel
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onInputChange={handleSettingInputChange}
            showImageFitSection={images.length > 0 && hasMixedAspectRatios}
            showImageFitHint={!hasMixedAspectRatios}
            isOpen={isSettingsOpen}
            onToggle={() => setIsSettingsOpen((currentValue) => !currentValue)}
          />
        </div>
        <div className="content-area">
          {images.length === 0 ? (
            <div className="empty-state">
              <ImageUploader onUpload={handleUpload} onToast={showToast} onError={showError} />
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
                onAspectRatioVariationChange={handleAspectRatioVariationChange}
                onToast={showToast}
                onError={showError}
                onErrorClear={clearError}
              />
            </div>
          )}
        </div>
      </main>
      {toast ? (
        <div className={`app-toast ${toast.tone}`} role="status" aria-live="polite">
          {toast.message}
        </div>
      ) : null}
    </div>
  )
}

export default App
