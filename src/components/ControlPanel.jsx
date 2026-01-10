import { useState } from 'react';
import { Grid3x3, Maximize, Crosshair, Monitor, ChevronUp, ChevronDown } from 'lucide-react';
import NumberStepper from './NumberStepper';
import './ControlPanel.css';

/**
 * ControlPanel Component
 * Settings for grid layout (Width x Rows or Height x Cols).
 */
export default function ControlPanel({ settings, onSettingsChange, isOpen = true, onToggle }) {
    const [activeTab, setActiveTab] = useState('layout');

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        // Handle range input (which is type='range' but value is string) as number
        const isNumber = type === 'number' || type === 'range';
        onSettingsChange({
            ...settings,
            [name]: isNumber ? parseInt(value, 10) || 0 : value
        });
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    return (
        <div className={`control-panel ${isOpen ? 'open' : 'closed'}`}>
            <div className="panel-handle" onClick={onToggle}>
                <div className="handle-content">
                    {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    <span className="handle-label">Settings</span>
                </div>
            </div>
            {/* ... tabs ... */}
            {/* ... rest of component ... */}
            {/* I need to make sure I am replacing the right block or just targeting handleChange */}
            {/* Wait, replace_file_content works on chunks. I should target just handleChange and then Gap slider separately or together if close. */}
            {/* They are far apart. I will do handleChange first. */}

            <div className="mobile-tabs">
                <button
                    className={`tab-btn ${activeTab === 'layout' ? 'active' : ''}`}
                    onClick={() => handleTabChange('layout')}
                >
                    Layout
                </button>
                <button
                    className={`tab-btn ${activeTab === 'spacing' ? 'active' : ''}`}
                    onClick={() => handleTabChange('spacing')}
                >
                    Spacing
                </button>
                <button
                    className={`tab-btn ${activeTab === 'advanced' ? 'active' : ''}`}
                    onClick={() => handleTabChange('advanced')}
                >
                    Advanced
                </button>
            </div>

            <div className={`section ${activeTab === 'layout' ? 'active' : ''}`}>
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

            <div className={`section ${activeTab === 'spacing' ? 'active' : ''}`}>
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

            <div className={`section ${activeTab === 'advanced' ? 'active' : ''}`}>
                <h3><Maximize size={18} /> Ratio Strategy</h3>
                <select name="fitMode" value={settings.fitMode} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                    <option value="average">Average</option>
                    <option value="portrait">Match Portrait (Highest)</option>
                    <option value="landscape">Match Landscape (Widest)</option>
                    <option value="max_dimensions">Max Dimensions (Largest W & H)</option>
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
    );
}

