import { LayoutGrid, Grid3x3, Maximize, Crosshair, Image, Monitor, Trash2, X } from 'lucide-react';
import NumberStepper from './NumberStepper';
import './ControlPanel.css';

const FIT_MODE_OPTIONS = [
    {
        value: 'average',
        title: 'Standard',
        description: '縦横比が混在していても、全体を均しやすい標準設定です。',
    },
    {
        value: 'portrait',
        title: 'Portrait Priority',
        description: '縦長の画像を優先して、セル内の見え方を合わせます。',
    },
    {
        value: 'landscape',
        title: 'Landscape Priority',
        description: '横長の画像を優先して、セル内の見え方を合わせます。',
    },
    {
        value: 'max_dimensions',
        title: 'Contain',
        description: '各セルの中に画像全体が収まるように表示します。',
    },
    {
        value: 'original',
        title: 'No Crop',
        description: '画像ごとの縦横比をそのまま保って並べます。',
    },
];

/**
 * ControlPanel Component
 * Settings for grid layout (Width x Rows or Height x Cols).
 */
export default function ControlPanel({
    settings,
    onSettingsChange,
    onInputChange,
    onClearAll,
    hasImages = false,
    showImageFitSection = true,
    showImageFitHint = false,
    isOpen = true,
    onToggle
}) {
    const handleChange = onInputChange ?? ((e) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number' || type === 'range';
        onSettingsChange({
            ...settings,
            [name]: isNumber ? parseInt(value, 10) || 0 : value
        });
    });

    return (
        <div className={`control-panel-shell ${isOpen ? 'open' : 'closed'}`}>
            <button
                className={`panel-overlay ${isOpen ? 'visible' : ''}`}
                onClick={onToggle}
                aria-label="Close settings"
            />
            <div className={`control-panel ${isOpen ? 'open' : 'closed'}`}>
                <div className="panel-handle">
                    <div className="handle-content">
                        <span className="handle-label">Detailed Settings</span>
                    </div>
                    <button className="panel-close-btn" onClick={onToggle} aria-label="Close settings">
                        <X size={18} />
                    </button>
                </div>
                <div className="section desktop-layout-fields">
                    <h3><LayoutGrid size={18} /> Layout</h3>
                    <div>
                        <div className="mode-selector" style={{ marginBottom: '1rem' }}>
                            <button
                                className={`mode-btn ${settings.mode === 'width_col' ? 'active' : ''}`}
                                onClick={() => onSettingsChange({ ...settings, mode: 'width_col' })}
                            >
                                Width × Col
                            </button>
                            <button
                                className={`mode-btn ${settings.mode === 'height_row' ? 'active' : ''}`}
                                onClick={() => onSettingsChange({ ...settings, mode: 'height_row' })}
                            >
                                Height × Row
                            </button>
                        </div>

                        {settings.mode === 'width_col' ? (
                            <div className="input-group">
                                <label>Columns</label>
                                <NumberStepper
                                    name="cols"
                                    value={settings.cols}
                                    onChange={handleChange}
                                    min={1}
                                    max={100}
                                />
                            </div>
                        ) : (
                            <div className="input-group">
                                <label>Rows</label>
                                <NumberStepper
                                    name="rows"
                                    value={settings.rows}
                                    onChange={handleChange}
                                    min={1}
                                    max={100}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="section">
                    <h3><Monitor size={18} /> Output Size</h3>
                    <div className="desktop-output-size-field">
                        {settings.mode === 'width_col' ? (
                            <div className="input-group">
                                <label>Total Width (px)</label>
                                <input
                                    type="number"
                                    name="width"
                                    value={settings.width}
                                    onChange={handleChange}
                                    min="1"
                                    max="10000"
                                />
                            </div>
                        ) : (
                            <div className="input-group">
                                <label>Total Height (px)</label>
                                <input
                                    type="number"
                                    name="height"
                                    value={settings.height}
                                    onChange={handleChange}
                                    min="1"
                                    max="10000"
                                />
                            </div>
                        )}
                    </div>
                    <div className="mobile-output-size-field">
                        {settings.mode === 'width_col' ? (
                            <div className="input-group">
                                <label>Total Width (px)</label>
                                <input
                                    type="number"
                                    name="width"
                                    value={settings.width}
                                    onChange={handleChange}
                                    min="1"
                                    max="10000"
                                />
                            </div>
                        ) : (
                            <div className="input-group">
                                <label>Total Height (px)</label>
                                <input
                                    type="number"
                                    name="height"
                                    value={settings.height}
                                    onChange={handleChange}
                                    min="1"
                                    max="10000"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="section">
                    <h3><Grid3x3 size={18} /> Spacing</h3>
                    <div className="input-group">
                        <label>Gap (px)</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                                type="range"
                                name="gap"
                                value={settings.gap}
                                onChange={handleChange}
                                min="0"
                                max="30"
                                style={{ flex: 1 }}
                            />
                            <input
                                type="number"
                                name="gap"
                                value={settings.gap}
                                onChange={handleChange}
                                min="0"
                                max="100"
                                style={{ width: '60px' }}
                            />
                        </div>
                    </div>
                    <div className="input-group">
                        <label>Background</label>
                        <input
                            type="color"
                            name="backgroundColor"
                            value={settings.backgroundColor}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {showImageFitHint ? (
                    <div className="section image-fit-hint-section">
                        <div className="image-fit-hint-row">
                            <Maximize size={16} />
                            <span>縦横比が異なる画像を追加すると、画像フィット設定が表示されます。</span>
                        </div>
                    </div>
                ) : null}

                {showImageFitSection ? (
                    <div className="section">
                        <h3><Maximize size={18} /> Image Fit</h3>
                        <div className="input-group">
                            <label className="control-label">Fit Style</label>
                            <div className="fit-mode-options" role="radiogroup" aria-label="Fit Style">
                                {FIT_MODE_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        role="radio"
                                        className={`fit-mode-option ${settings.fitMode === option.value ? 'active' : ''}`}
                                        onClick={() => onSettingsChange({ ...settings, fitMode: option.value })}
                                        aria-checked={settings.fitMode === option.value}
                                    >
                                        <span className="fit-mode-title">{option.title}</span>
                                        <span className="fit-mode-description">{option.description}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="control-label">Anchor Point</label>
                            <div className="anchor-visualizer">
                                <Image className="anchor-bg-icon" aria-hidden="true" />
                                <div className="anchor-grid">
                                    {['top-left', 'top-center', 'top-right',
                                        'center-left', 'center', 'center-right',
                                        'bottom-left', 'bottom-center', 'bottom-right'].map(pos => (
                                            <button
                                                key={pos}
                                                type="button"
                                                className={`anchor-btn ${settings.anchor === pos ? 'active' : ''}`}
                                                onClick={() => onSettingsChange({ ...settings, anchor: pos })}
                                                title={pos}
                                            >
                                                <div className="dot" />
                                            </button>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}

                {hasImages ? (
                    <div className="section mobile-clear-all-section">
                        <button
                            type="button"
                            className="mobile-clear-all-btn"
                            onClick={onClearAll}
                        >
                            <Trash2 size={16} />
                            <span>Clear All</span>
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
