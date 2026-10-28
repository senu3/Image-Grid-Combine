import { useRef, useState } from 'react';
import { commitNumber } from '../utils/numberInput';

// Keep incomplete text local; layout and persistence only receive committed values.
export default function NumberInput({ value, name, onChange, min, max, ...props }) {
    const [draft, setDraft] = useState(null);
    const cancelled = useRef(false);
    const text = draft?.name === name && draft?.base === value ? draft.text : String(value);
    const commit = () => {
        if (!cancelled.current) {
            const next = commitNumber(text, value, min, max);
            if (next !== value) onChange({ target: { name, value: next, type: 'number' } });
        }
        cancelled.current = false;
        setDraft(null);
    };
    return <input {...props} type="number" name={name} value={text} min={min} max={max}
        onChange={(event) => setDraft({ name, base: value, text: event.target.value })}
        onBlur={commit}
        onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === 'Enter' || event.key === 'Escape') {
                event.preventDefault();
                cancelled.current = event.key === 'Escape';
                event.currentTarget.blur();
            }
        }} />;
}
