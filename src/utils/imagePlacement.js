import { calculateRenderDimensions, calculateRenderPosition } from './anchor.js';

export function getCellImagePlacement(cell, anchor = cell.settings.anchor) {
    if (
        Number.isFinite(cell.renderWidth) &&
        Number.isFinite(cell.renderHeight)
    ) {
        const { renderX, renderY } = calculateRenderPosition({
            cellWidth: cell.width,
            cellHeight: cell.height,
            renderW: cell.renderWidth,
            renderH: cell.renderHeight,
            anchor
        });

        return {
            renderW: cell.renderWidth,
            renderH: cell.renderHeight,
            renderX,
            renderY
        };
    }

    const isContain = cell.settings.fitMode === 'max_dimensions';
    const { renderW, renderH } = calculateRenderDimensions({
        cellWidth: cell.width,
        cellHeight: cell.height,
        imgRatio: cell.imgRatio,
        cellRatio: cell.cellRatio,
        isContain
    });

    const { renderX, renderY } = calculateRenderPosition({
        cellWidth: cell.width,
        cellHeight: cell.height,
        renderW,
        renderH,
        anchor
    });

    return { renderW, renderH, renderX, renderY };
}

