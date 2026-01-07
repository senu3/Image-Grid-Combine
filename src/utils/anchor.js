/**
 * Parse anchor string and return normalized anchor coordinates
 * @param {string} anchor - Anchor position string (e.g., 'top-left', 'center', 'bottom-right')
 * @returns {{ anchorX: number, anchorY: number }} - Normalized coordinates (0-1)
 */
export function parseAnchor(anchor) {
    let anchorX = 0.5;
    let anchorY = 0.5;

    if (!anchor || anchor === 'center') {
        return { anchorX, anchorY };
    }

    const parts = anchor.split('-');

    // Extract Y (vertical position)
    if (parts[0] === 'top') {
        anchorY = 0;
    } else if (parts[0] === 'bottom') {
        anchorY = 1;
    }

    // Extract X (horizontal position)
    if (parts.includes('left')) {
        anchorX = 0;
    } else if (parts.includes('right')) {
        anchorX = 1;
    }

    return { anchorX, anchorY };
}

/**
 * Calculate render dimensions for an image within a cell
 * @param {Object} params
 * @param {number} params.cellWidth - Cell width
 * @param {number} params.cellHeight - Cell height
 * @param {number} params.imgRatio - Image aspect ratio (width / height)
 * @param {number} params.cellRatio - Cell aspect ratio (width / height)
 * @param {boolean} params.isContain - Whether to use contain mode (fit within) or cover mode (fill)
 * @returns {{ renderW: number, renderH: number }}
 */
export function calculateRenderDimensions({ cellWidth, cellHeight, imgRatio, cellRatio, isContain }) {
    let renderW, renderH;

    if (isContain) {
        // Contain Logic: Fit within the cell
        if (imgRatio > cellRatio) {
            renderW = cellWidth;
            renderH = cellWidth / imgRatio;
        } else {
            renderH = cellHeight;
            renderW = cellHeight * imgRatio;
        }
    } else {
        // Cover Logic: Fill the cell
        if (imgRatio > cellRatio) {
            renderW = cellHeight * imgRatio;
            renderH = cellHeight;
        } else {
            renderW = cellWidth;
            renderH = cellWidth / imgRatio;
        }
    }

    return { renderW, renderH };
}

/**
 * Calculate image position within a cell based on anchor
 * @param {Object} params
 * @param {number} params.cellWidth - Cell width
 * @param {number} params.cellHeight - Cell height
 * @param {number} params.renderW - Rendered image width
 * @param {number} params.renderH - Rendered image height
 * @param {string} params.anchor - Anchor position string
 * @returns {{ renderX: number, renderY: number }}
 */
export function calculateRenderPosition({ cellWidth, cellHeight, renderW, renderH, anchor }) {
    const { anchorX, anchorY } = parseAnchor(anchor);

    const renderX = (cellWidth - renderW) * anchorX;
    const renderY = (cellHeight - renderH) * anchorY;

    return { renderX, renderY };
}
