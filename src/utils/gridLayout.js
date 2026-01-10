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

            // 3. Calculate Total Height
            totalHeight = rowHeights.reduce((sum, h) => sum + h, 0) + (Math.max(0, numRows - 1) * gap);

            // 4. Position Cells
            const cells = images.map((img, i) => {
                const r = Math.floor(i / numCols);
                const c = i % numCols;

                // Y position is sum of previous row heights + gaps
                let y = 0;
                for (let k = 0; k < r; k++) y += rowHeights[k] + gap;

                const x = c * (cellWidth + gap);

                // Content matches cell exactly
                return {
                    image: img,
                    x,
                    y: y + (rowHeights[r] - cellDims[i].h) / 2, // Center vertically in the row? Or top align? Let's Center.
                    width: cellWidth,
                    height: cellDims[i].h,
                    imgRatio: img.width / img.height,
                    cellRatio: img.width / img.height, // Matches image
                    settings
                };
            });

            return { totalWidth, totalHeight, cells };

        } else {
            // Variable Cell Width (Ragged Rows)
            numRows = Math.max(1, rows);
            // Count per row might vary? No, "Height x Row" usually implies fixed rows, images flow into them?
            // Standard behavior: evenly distribute images across rows?
            // "cols" is calculated as ceil(count / rows).
            numCols = Math.ceil(count / numRows);

            totalHeight = height;
            cellHeight = (height - (Math.max(0, numRows - 1)) * gap) / numRows;

            // 1. Calculate dimensions
            const cellDims = images.map(img => {
                const w = cellHeight * (img.width / img.height);
                return { w, h: cellHeight };
            });

            // 2. Position Cells
            const cells = [];
            const rowWidths = Array(numRows).fill(0);

            // We need to distribute images. Standard grid logic: filled column by column or row by row?
            // Previous logic: `const r = Math.floor(i / numCols);` -> Row by row.
            // But usually Height x Row means we fill rows?
            // Let's stick to standard index filling: Row 0 gets 0..numCols-1.

            images.forEach((img, i) => {
                const r = Math.floor(i / numCols);
                const c = i % numCols;

                // Calculate X based on previous items in this row
                let x = 0;
                const rowStartIndex = r * numCols;
                // Sum widths of previous items in this row
                for (let k = rowStartIndex; k < i; k++) {
                    x += cellDims[k].w + gap;
                }

                const y = r * (cellHeight + gap);

                const w = cellDims[i].w;

                cells.push({
                    image: img,
                    x,
                    y,
                    width: w,
                    height: cellHeight,
                    imgRatio: img.width / img.height,
                    cellRatio: img.width / img.height,
                    settings
                });

                // Track max width
                rowWidths[r] = Math.max(rowWidths[r], x + w);
            });

            totalWidth = Math.max(...rowWidths);

            // Center rows horizontally? Or left align? Left align is standard.

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
