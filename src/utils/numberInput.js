export function commitNumber(text, previous, min = -Infinity, max = Infinity) {
    if (text.trim() === '') return previous;
    const number = Number(text);
    if (!Number.isFinite(number)) return previous;
    return Math.min(Number(max), Math.max(Number(min), Math.trunc(number)));
}
