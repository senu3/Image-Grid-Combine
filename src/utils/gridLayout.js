/**
 * Calculate Grid Layout
 * @param {Array} images - Array of image objects { width, height, ... }
 * @param {Object} settings - { width, height, rows, cols, gap, mode }
 * @returns {Object} { totalWidth, totalHeight, cells: [{ x, y, width, height, image }] }
 */
export function calculateLayout(images, settings) {
    const { width, height, rows, cols, gap, mode } = settings;
    const count = images.length;

    if (count === 0) return { totalWidth: 0, totalHeight: 0, cells: [] };

    let totalWidth, totalHeight, numRows, numCols, cellWidth, cellHeight;

    if (mode === 'width_col') {
        // Fixed Total Width, Fixed Cols
        numCols = Math.max(1, cols);
        numRows = Math.ceil(count / numCols);

        totalWidth = width;
        // cellWidth = (Width - (numCols - 1) * gap) / numCols
        cellWidth = (width - (Math.max(0, numCols - 1)) * gap) / numCols;

        // Determine Cell Height using Fit Mode
        let targetRatio;
        const ratios = images.map(img => img.width / img.height);

        if (settings.fitMode === 'portrait') {
            targetRatio = Math.min(...ratios);
        } else if (settings.fitMode === 'landscape') {
            targetRatio = Math.max(...ratios);
        } else {
            // Average
            targetRatio = ratios.reduce((sum, r) => sum + r, 0) / count;
        }

        cellHeight = cellWidth / targetRatio;

        totalHeight = numRows * cellHeight + (Math.max(0, numRows - 1)) * gap;

    } else {
        // Fixed Total Height, Fixed Rows
        numRows = Math.max(1, rows);
        numCols = Math.ceil(count / numRows);

        totalHeight = height;
        // cellHeight = (Height - (numRows - 1) * gap) / numRows
        cellHeight = (height - (Math.max(0, numRows - 1)) * gap) / numRows;

        // Determine Cell Width using Fit Mode
        let targetRatio;
        const ratios = images.map(img => img.width / img.height);

        if (settings.fitMode === 'portrait') {
            targetRatio = Math.min(...ratios);
        } else if (settings.fitMode === 'landscape') {
            targetRatio = Math.max(...ratios);
        } else {
            // Average
            targetRatio = ratios.reduce((sum, r) => sum + r, 0) / count;
        }

        cellWidth = cellHeight * targetRatio;

        totalWidth = numCols * cellWidth + (Math.max(0, numCols - 1)) * gap;
    }

    // Calculate positions for each cell
    const cells = images.map((img, i) => {
        const r = Math.floor(i / numCols);
        const c = i % numCols;

        const x = c * (cellWidth + gap);
        const y = r * (cellHeight + gap);

        return {
            image: img,
            x,
            y,
            width: cellWidth,
            height: cellHeight,
            // Pass rendering info for canvas/cover
            imgRatio: img.width / img.height,
            cellRatio: cellWidth / cellHeight,
            settings // Pass global settings for anchor access
        };
    });

    return {
        totalWidth,
        totalHeight,
        cells
    };
}
