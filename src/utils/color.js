function normalizeHexColor(hexColor) {
    if (typeof hexColor !== 'string') {
        return 'ffffff';
    }

    const normalized = hexColor.trim().replace(/^#/, '');

    if (/^[0-9a-fA-F]{6}$/.test(normalized)) {
        return normalized;
    }

    if (/^[0-9a-fA-F]{3}$/.test(normalized)) {
        return normalized.split('').map((char) => `${char}${char}`).join('');
    }

    return 'ffffff';
}

export function toRgbaColor(hexColor, alphaPercent = 100) {
    const normalizedHex = normalizeHexColor(hexColor);
    const alpha = Math.min(100, Math.max(0, Number.isFinite(alphaPercent) ? alphaPercent : 100)) / 100;

    const red = parseInt(normalizedHex.slice(0, 2), 16);
    const green = parseInt(normalizedHex.slice(2, 4), 16);
    const blue = parseInt(normalizedHex.slice(4, 6), 16);

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
