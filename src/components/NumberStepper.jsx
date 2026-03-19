import { Minus, Plus } from 'lucide-react';
import { useEffect, useRef } from 'react';
import './ControlPanel.css';

export default function NumberStepper({ value, onChange, min = 0, max = 100, step = 1, name }) {
    const intervalRef = useRef(null);

    const updateValue = (delta) => {
        let newValue = value + delta;
        if (min !== undefined) newValue = Math.max(min, newValue);
        if (max !== undefined) newValue = Math.min(max, newValue);
        onChange({ target: { name, value: newValue, type: 'number' } });
    };

    const handleMouseDown = (delta) => {
        updateValue(delta);
        intervalRef.current = setInterval(() => {
            updateValue(delta);
        }, 150);
    };

    const handleMouseUp = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    useEffect(() => {
        return () => handleMouseUp();
    }, []);

    const handleInputChange = (e) => {
        const newValue = parseInt(e.target.value, 10);
        if (!isNaN(newValue)) {
            onChange({ target: { name, value: newValue, type: 'number' } });
        } else if (e.target.value === '') {
            onChange({ target: { name, value: 0, type: 'number' } });
        }
    };

    return (
        <div className="number-stepper">
            <button
                className="stepper-btn"
                onPointerDown={() => handleMouseDown(-step)}
                onPointerUp={handleMouseUp}
                onPointerLeave={handleMouseUp}
                aria-label="Decrease"
            >
                <Minus size={14} />
            </button>
            <input
                className="stepper-input"
                type="number"
                value={value}
                onChange={handleInputChange}
                name={name}
                min={min}
                max={max}
                step={step}
            />
            <button
                className="stepper-btn"
                onPointerDown={() => handleMouseDown(step)}
                onPointerUp={handleMouseUp}
                onPointerLeave={handleMouseUp}
                aria-label="Increase"
            >
                <Plus size={14} />
            </button>
        </div>
    );
}
