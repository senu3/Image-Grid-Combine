import test from 'node:test';
import assert from 'node:assert/strict';
import { getCellImagePlacement } from '../imagePlacement.js';

const cell = { width: 100, height: 100, imgRatio: 2, cellRatio: 1, settings: { fitMode: 'average', anchor: 'bottom-right' } };

test('shared placement preserves cover, contain and original anchors', () => {
    assert.deepEqual(getCellImagePlacement(cell), { renderW: 200, renderH: 100, renderX: -100, renderY: 0 });
    assert.deepEqual(getCellImagePlacement({ ...cell, settings: { ...cell.settings, fitMode: 'max_dimensions' } }), { renderW: 100, renderH: 50, renderX: 0, renderY: 50 });
    assert.deepEqual(getCellImagePlacement({ ...cell, renderWidth: 40, renderHeight: 20 }), { renderW: 40, renderH: 20, renderX: 60, renderY: 80 });
});
