import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SETTINGS, normalizeStoredSettings } from '../settings.js';
import { calculateLayout } from '../gridLayout.js';
import { getExportSize } from '../exportSize.js';

const images = [{ width: 100, height: 100 }, { width: 200, height: 200 }];

test('restored settings reject invalid numbers and bound integer counts', () => {
    const settings = normalizeStoredSettings({ width: Infinity, height: -1, cols: 1.5, rows: 1000, gap: -10 });
    assert.equal(settings.width, DEFAULT_SETTINGS.width);
    assert.equal(settings.height, 1);
    assert.equal(settings.cols, 1);
    assert.equal(settings.rows, 100);
    assert.equal(settings.gap, -10);
    assert.deepEqual(normalizeStoredSettings(null), DEFAULT_SETTINGS);
});

for (const mode of ['width_col', 'height_row']) {
    for (const fitMode of ['average', 'original']) {
        test(`${mode}/${fitMode} rejects exhausted and excessive gap budgets`, () => {
            for (const gap of [50, 100]) {
                const layout = calculateLayout(images, { ...DEFAULT_SETTINGS, width: 100, height: 100, cols: 3, rows: 3, gap, mode, fitMode });
                assert.ok(layout.error);
                assert.equal(layout.cells.length, 0);
                assert.throws(() => getExportSize(layout));
            }
        });
    }
}

test('fractional restored counts cannot crash original layout', () => {
    const layout = calculateLayout(images, { ...DEFAULT_SETTINGS, cols: 1.5, fitMode: 'original' });
    assert.ok(layout.cells.every(cell => cell.width > 0 && cell.height > 0));
});

test('export limits validate both rounded dimensions and total pixels', () => {
    assert.deepEqual(getExportSize({ totalWidth: 4000, totalHeight: 4000 }), { width: 4000, height: 4000 });
    for (const [totalWidth, totalHeight] of [[0, 100], [-10, 100], [NaN, 100], [Infinity, 100], [16385, 1], [4001, 4000]]) {
        assert.throws(() => getExportSize({ totalWidth, totalHeight }));
    }
});
