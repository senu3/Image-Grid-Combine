import { SlidersHorizontal, Grid3x3, Monitor } from 'lucide-react';
import './ControlPanel.css';

/**
 * ControlPanel Component
 * Settings for grid layout (Width x Rows or Height x Cols).
 * @param {Object} props
 * @param {Object} props.settings - Current settings
 * @param {Function} props.onSettingsChange - Callback to update settings
 */
export default function ControlPanel({ settings, onSettingsChange }) {

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        onSettingsChange({
            ...settings,
            [name]: type === 'number' ? parseInt(value, 10) || 0 : value
        });
    };

    const handleModeChange = (mode) => {
        onSettingsChange({
            ...settings,
            mode
        });
    };

    return (
        <div className="control-panel">
            <div className="section">
                <h3><SlidersHorizontal size={18} /> Layout Mode</h3>
                <div className="mode-selector">
                    <button
                        className={`mode-btn ${settings.mode === 'width_col' ? 'active' : ''}`}
                        onClick={() => handleModeChange('width_col')}
                    >
                        Width × Col
                    </button>
                    <button
                        className={`mode-btn ${settings.mode === 'height_row' ? 'active' : ''}`}
                        onClick={() => handleModeChange('height_row')}
                    >
                        Height × Row
                    </button>
                </div>
            </div>

            <div className="section">
                <h3><Monitor size={18} /> Dimensions</h3>
                {settings.mode === 'width_col' ? (
                    <>
                        <div className="input-group">
                            <label>Total Width (px)</label>
                            <input
                                type="number"
                                name="width"
                                value={settings.width}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="input-group">
                            <label>Columns</label>
                            <input
                                type="number"
                                name="cols"
                                value={settings.cols}
                                onChange={handleChange}
                                min="1"
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
                            />
                        </div>
                        <div className="input-group">
                            <label>Rows</label>
                            <input
                                type="number"
                                name="rows"
                                value={settings.rows}
                                onChange={handleChange}
                                min="1"
                            />
                        </div>
                    </>
                )}
            </div>

            <div className="section">
                <h3><Grid3x3 size={18} /> Appearance</h3>
                <div className="input-group">
                    <label>Gap (px)</label>
                    <input
                        type="number"
                        name="gap"
                        value={settings.gap}
                        onChange={handleChange}
                    />
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
                <h3>Ratio Strategy</h3>
                <select name="fitMode" value={settings.fitMode} onChange={handleChange} style={{ width: '100%' }}>
                    <option value="average">Average (Default)</option>
                    <option value="portrait">Match Portrait (Tallest)</option>
                    <option value="landscape">Match Landscape (Widest)</option>
                </select>
            </div>

            <div className="section">
                <h3>Anchor Point</h3>
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
    );
}
