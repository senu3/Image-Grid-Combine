/**
 * Calculate target aspect ratio based on fit mode
 * @param {Array} images - Array of image objects { width, height, ... }
 * @param {string} fitMode - 'average', 'portrait', 'landscape', or 'max_dimensions'
 * @returns {number} - Target aspect ratio
 */
function calculateTargetRatio(images, fitMode) {
    const ratios = images.map(img => img.width / img.height);

    switch (fitMode) {
        case 'portrait':
            return Math.min(...ratios);
        case 'landscape':
            return Math.max(...ratios);
        case 'max_dimensions': {
            const maxW = Math.max(...images.map(img => img.width));
            const maxH = Math.max(...images.map(img => img.height));
            return maxW / maxH;
        }
        default: // 'average'
            return ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
    }
}

function getGridPosition(index, mode, numRows, numCols) {
    if (mode === 'height_row') {
        return {
            r: index % numRows,
            c: Math.floor(index / numRows),
        };
    }

    return {
        r: Math.floor(index / numCols),
        c: index % numCols,
    };
}

function calculateOriginalLayout(images, settings) {
    const { width, height, rows, cols, gap, mode } = settings;
    const count = images.length;

    const numRows = mode === 'height_row'
        ? Math.max(1, rows)
        : Math.ceil(count / Math.max(1, cols));
    const numCols = mode === 'width_col'
        ? Math.max(1, cols)
        : Math.ceil(count / Math.max(1, rows));

    const rowHeights = Array(numRows).fill(0);
    const columnWidths = Array(numCols).fill(0);

    images.forEach((image, index) => {
        const { r, c } = getGridPosition(index, mode, numRows, numCols);
        rowHeights[r] = Math.max(rowHeights[r], image.height);
        columnWidths[c] = Math.max(columnWidths[c], image.width);
    });

    const totalSourceWidth = columnWidths.reduce((sum, columnWidth) => sum + columnWidth, 0);
    const totalSourceHeight = rowHeights.reduce((sum, rowHeight) => sum + rowHeight, 0);

    const scale = mode === 'width_col'
        ? (width - (Math.max(0, numCols - 1)) * gap) / totalSourceWidth
        : (height - (Math.max(0, numRows - 1)) * gap) / totalSourceHeight;

    const scaledRowHeights = rowHeights.map((rowHeight) => rowHeight * scale);
    const scaledColumnWidths = columnWidths.map((columnWidth) => columnWidth * scale);

    const rowOffsets = [];
    let nextRowOffset = 0;
    for (const rowHeight of scaledRowHeights) {
        rowOffsets.push(nextRowOffset);
        nextRowOffset += rowHeight + gap;
    }

    const columnOffsets = [];
    let nextColumnOffset = 0;
    for (const columnWidth of scaledColumnWidths) {
        columnOffsets.push(nextColumnOffset);
        nextColumnOffset += columnWidth + gap;
    }

    const totalWidth = scaledColumnWidths.reduce((sum, columnWidth) => sum + columnWidth, 0)
        + (Math.max(0, numCols - 1) * gap);
    const totalHeight = scaledRowHeights.reduce((sum, rowHeight) => sum + rowHeight, 0)
        + (Math.max(0, numRows - 1) * gap);

    const cells = images.map((image, index) => {
        const { r, c } = getGridPosition(index, mode, numRows, numCols);
        const cellWidth = scaledColumnWidths[c];
        const cellHeight = scaledRowHeights[r];

        return {
            image,
            x: columnOffsets[c],
            y: rowOffsets[r],
            width: cellWidth,
            height: cellHeight,
            renderWidth: image.width * scale,
            renderHeight: image.height * scale,
            imgRatio: image.width / image.height,
            cellRatio: cellWidth / cellHeight,
            settings,
        };
    });

    return {
        totalWidth,
        totalHeight,
        cells,
    };
}

/**
 * Calculate Grid Layout
 * @param {Array} images - Array of image objects { width, height, ... }
 * @param {Object} settings - { width, height, rows, cols, gap, mode, fitMode }
 * @returns {Object} { totalWidth, totalHeight, cells: [{ x, y, width, height, image }] }
 */
export function calculateLayout(images, settings) {
    const { width, height, rows, cols, gap, mode } = settings;
    const count = images.length;

    if (count === 0) return { totalWidth: 0, totalHeight: 0, cells: [] };

    if (settings.fitMode === 'original') {
        return calculateOriginalLayout(images, settings);
    }

    let totalWidth, totalHeight, numRows, numCols, cellWidth, cellHeight;
    const targetRatio = calculateTargetRatio(images, settings.fitMode);

    if (mode === 'width_col') {
        // Fixed Total Width, Fixed Cols
        numCols = Math.max(1, cols);
        numRows = Math.ceil(count / numCols);

        totalWidth = width;
        // cellWidth = (Width - (numCols - 1) * gap) / numCols
        cellWidth = (width - (Math.max(0, numCols - 1)) * gap) / numCols;
        cellHeight = cellWidth / targetRatio;

        totalHeight = numRows * cellHeight + (Math.max(0, numRows - 1)) * gap;
    } else {
        // Fixed Total Height, Fixed Rows
        numRows = Math.max(1, rows);
        numCols = Math.ceil(count / numRows);

        totalHeight = height;
        // cellHeight = (Height - (numRows - 1) * gap) / numRows
        cellHeight = (height - (Math.max(0, numRows - 1)) * gap) / numRows;
        cellWidth = cellHeight * targetRatio;

        totalWidth = numCols * cellWidth + (Math.max(0, numCols - 1)) * gap;
    }

    // Calculate positions for each cell
    const cells = images.map((img, i) => {
        const { r, c } = getGridPosition(i, mode, numRows, numCols);

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
