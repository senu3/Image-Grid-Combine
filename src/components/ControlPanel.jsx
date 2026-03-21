import { Grid3x3, Maximize, Crosshair, Monitor, X } from 'lucide-react';
import NumberStepper from './NumberStepper';
import './ControlPanel.css';

/**
 * ControlPanel Component
 * Settings for grid layout (Width x Rows or Height x Cols).
 */
export default function ControlPanel({
    settings,
    onSettingsChange,
    onInputChange,
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
                <div className="section">
                    <h3><Monitor size={18} /> Layout</h3>
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
                        <>
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
                        </>
                    ) : (
                        <>
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
                        </>
                    )}
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

                <div className="section">
                    <h3><Maximize size={18} /> fitMode</h3>
                    <select name="fitMode" value={settings.fitMode} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                        <option value="average">Average (Default)</option>
                        <option value="portrait">Match Portrait (Tallest)</option>
                        <option value="landscape">Match Landscape (Widest)</option>
                        <option value="max_dimensions">Max Dimensions (Largest W & H)</option>
                        <option value="original">Original (No Crop)</option>
                    </select>

                    <div style={{ marginTop: '1.5rem' }}>
                        <h3><Crosshair size={18} /> Anchor Point</h3>
                        <div className="anchor-grid">
                            {['top-left', 'top-center', 'top-right',
                                'center-left', 'center', 'center-right',
                                'bottom-left', 'bottom-center', 'bottom-right'].map(pos => (
                                    <button
                                        key={pos}
                                        className={`anchor-btn ${settings.anchor === pos ? 'active' : ''}`}
                                        onClick={() => onSettingsChange({ ...settings, anchor: pos })}
                                        title={pos}
                                    >
                                        <div className={`dot ${pos.split('-').map(p => p[0]).join('')}`} />
                                    </button>
                                ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

