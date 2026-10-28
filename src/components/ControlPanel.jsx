import NumberInput from './NumberInput';
import { FIT_MODE_OPTIONS, ANCHORS } from '../utils/settings';
import { LayoutGrid, Grid3x3, Maximize, Image, Monitor, Trash2, X } from 'lucide-react';
import NumberStepper from './NumberStepper';
import './ControlPanel.css';

/**
 * ControlPanel Component
 * Settings for grid layout (Width x Columns or Height x Rows).
 */
export default function ControlPanel({
    settings,
    onSettingsChange,
    onInputChange,
    onClearAll,
    hasImages = false,
    isOpen = true,
    onToggle
}) {
    const handleChange = onInputChange;
    const sizeName = settings.mode === 'width_col' ? 'width' : 'height';

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
                    <div className="input-group">
                        <label htmlFor="output-size">{sizeName === 'width' ? 'Total Width (px)' : 'Total Height (px)'}</label>
                        <NumberInput key={sizeName} id="output-size" type="number" name={sizeName} value={settings[sizeName]} onChange={handleChange} min="1" max="10000" />
                    </div>
                </div>

                <div className="section">
                    <h3><Grid3x3 size={18} /> Spacing</h3>
                    <div className="input-group">
                        <label>Gap (px)</label>
                        <div className="range-input-row">
                            <input
                                type="range"
                                name="gap"
                                value={settings.gap}
                                onChange={handleChange}
                                min="0"
                                max="30"
                                className="range-input"
                            />
                            <input
                                type="number"
                                name="gap"
                                value={settings.gap}
                                onChange={handleChange}
                                min="0"
                                max="100"
                                className="range-value-input"
                            />
                        </div>
                    </div>
                    <div className="spacing-background-row">
                        <div className="input-group spacing-background-color">
                            <label>Background</label>
                            <input
                                type="color"
                                name="backgroundColor"
                                value={settings.backgroundColor}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="input-group spacing-background-opacity">
                            <label>Opacity (%)</label>
                            <NumberInput
                                type="number"
                                name="backgroundAlpha"
                                value={settings.backgroundAlpha}
                                onChange={handleChange}
                                min="0"
                                max="100"
                                className="opacity-value-input"
                            />
                        </div>
                    </div>
                </div>

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
                                {ANCHORS.map(pos => (
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
