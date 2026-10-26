import { usePersistedSettings } from './hooks/usePersistedSettings'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, SlidersHorizontal, Trash2, X } from 'lucide-react'
import ImageUploader from './components/ImageUploader'
import ControlPanel from './components/ControlPanel'
import PreviewCanvas from './components/PreviewCanvas'
import NumberStepper from './components/NumberStepper'
import './App.css'

const isMobileViewport = () => typeof window !== 'undefined' && window.innerWidth <= 768
function App() {
  const [images, setImages] = useState([])
  const imagesRef = useRef(images)
  const previewSaveActionRef = useRef(null)
  const [isSaving, setIsSaving] = useState(false)
  const savingRef = useRef(false)
  const [toast, setToast] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const toastTimeoutRef = useRef(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(() => {
    return !isMobileViewport()
  })
  const { settings, handleSettingsChange, handleSettingInputChange } = usePersistedSettings()

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

  const handleClearAll = useCallback(() => {
    if (images.length === 0) {
      return
    }

    if (!window.confirm('すべての画像を削除しますか？')) {
      return
    }

    clearImages()
  }, [clearImages, images.length])

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

  const handleSaveImage = useCallback(async () => {
    if (savingRef.current || !previewSaveActionRef.current) return
    savingRef.current = true
    setIsSaving(true)
    try {
      await previewSaveActionRef.current()
    } catch {
      showError('保存に失敗しました。出力サイズを小さくして再試行してください')
    } finally {
      savingRef.current = false
      setIsSaving(false)
    }
  }, [showError])

  const handlePreviewSaveActionChange = useCallback((saveAction) => {
    previewSaveActionRef.current = saveAction
  }, [])

  return (
    <div className={`app-container ${isSettingsOpen ? 'settings-open' : 'settings-closed'}`}>
      <header className="app-header">
        <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1>Image Grid Combine</h1>
        </div>
        <div className="header-actions">
          <button
            className="btn-secondary header-clear-btn desktop-only"
            onClick={handleClearAll}
            disabled={images.length === 0}
            aria-label="Clear All"
          >
            <Trash2 size={16} />
            <span className="header-action-label">Clear All</span>
          </button>
          <button
            className="btn-primary header-save-btn"
            onClick={handleSaveImage}
            disabled={images.length === 0 || isSaving}
            aria-busy={isSaving}
            aria-label={isSaving ? 'Saving Image' : 'Save Image'}
          >
            <Download size={16} />
            <span className="header-action-label">{isSaving ? 'Saving…' : 'Save Image'}</span>
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
            onClearAll={handleClearAll}
            hasImages={images.length > 0}
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
                onToast={showToast}
                onError={showError}
                onErrorClear={clearError}
                onSaveActionChange={handlePreviewSaveActionChange}
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
