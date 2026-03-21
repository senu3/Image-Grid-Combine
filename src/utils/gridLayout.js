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

    let totalWidth, totalHeight, numRows, numCols, cellWidth, cellHeight;

    const targetRatio = settings.fitMode === 'original' ? 1 : calculateTargetRatio(images, settings.fitMode);

    if (settings.fitMode === 'original') {
        if (mode === 'width_col') {
            // Variable Row Height
            numCols = Math.max(1, cols);
            numRows = Math.ceil(count / numCols);
            totalWidth = width;
            cellWidth = (width - (Math.max(0, numCols - 1)) * gap) / numCols;

            // 1. Calculate dimensions for all cells first
            const cellDims = images.map(img => {
                const h = cellWidth / (img.width / img.height);
                return { w: cellWidth, h };
            });

            // 2. Determine Row Heights
            const rowHeights = [];
            for (let r = 0; r < numRows; r++) {
                let maxH = 0;
                for (let c = 0; c < numCols; c++) {
                    const idx = r * numCols + c;
                    if (idx < count) {
                        maxH = Math.max(maxH, cellDims[idx].h);
                    }
                }
                rowHeights.push(maxH);
            }

            const rowOffsets = [];
            let currentOffset = 0;
            for (let r = 0; r < numRows; r++) {
                rowOffsets.push(currentOffset);
                currentOffset += rowHeights[r] + gap;
            }

            // 3. Calculate Total Height
            totalHeight = rowHeights.reduce((sum, h) => sum + h, 0) + (Math.max(0, numRows - 1) * gap);

            // 4. Position Cells
            const cells = images.map((img, i) => {
                const r = Math.floor(i / numCols);
                const c = i % numCols;
                const x = c * (cellWidth + gap);

                // Content matches cell exactly
                return {
                    image: img,
                    x,
                    y: rowOffsets[r] + (rowHeights[r] - cellDims[i].h) / 2,
                    width: cellWidth,
                    height: cellDims[i].h,
                    imgRatio: img.width / img.height,
                    cellRatio: img.width / img.height, // Matches image
                    settings
                };
            });

            return { totalWidth, totalHeight, cells };

        } else {
            // Variable Column Width
            numRows = Math.max(1, rows);
            numCols = Math.ceil(count / numRows);

            totalHeight = height;
            cellHeight = (height - (Math.max(0, numRows - 1)) * gap) / numRows;

            const cellDims = images.map(img => {
                const w = cellHeight * (img.width / img.height);
                return { w, h: cellHeight };
            });

            const columnWidths = [];
            for (let c = 0; c < numCols; c++) {
                let maxW = 0;
                for (let r = 0; r < numRows; r++) {
                    const idx = c * numRows + r;
                    if (idx < count) {
                        maxW = Math.max(maxW, cellDims[idx].w);
                    }
                }
                columnWidths.push(maxW);
            }

            const columnOffsets = [];
            let currentOffset = 0;
            for (let c = 0; c < numCols; c++) {
                columnOffsets.push(currentOffset);
                currentOffset += columnWidths[c] + gap;
            }

            totalWidth = columnWidths.reduce((sum, w) => sum + w, 0) + (Math.max(0, numCols - 1) * gap);

            const cells = images.map((img, i) => {
                const { r, c } = getGridPosition(i, mode, numRows, numCols);

                return {
                    image: img,
                    x: columnOffsets[c] + (columnWidths[c] - cellDims[i].w) / 2,
                    y: r * (cellHeight + gap),
                    width: cellDims[i].w,
                    height: cellHeight,
                    imgRatio: img.width / img.height,
                    cellRatio: img.width / img.height,
                    settings
                };
            });

            return { totalWidth, totalHeight, cells };
        }
    }

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
