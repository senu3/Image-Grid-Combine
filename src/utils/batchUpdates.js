// One React update per window instead of copying all assets for every completion.
export function createBatchUpdates(publish, delay = 32) {
    const pending = new Map();
    let timer = null;
    return {
        add(id, value) {
            pending.set(id, value);
            if (timer !== null) return;
            timer = setTimeout(() => {
                timer = null;
                const entries = Array.from(pending);
                pending.clear();
                if (entries.length > 0) publish(entries);
            }, delay);
        },
        remove(id) { pending.delete(id); },
        clear() {
            if (timer !== null) clearTimeout(timer);
            timer = null;
            pending.clear();
        },
    };
}
