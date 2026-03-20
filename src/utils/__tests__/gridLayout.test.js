import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateLayout } from '../gridLayout.js';

function assertApproxEqual(actual, expected, epsilon = 1e-9) {
    assert.ok(
        Math.abs(actual - expected) <= epsilon,
        `Expected ${actual} to be within ${epsilon} of ${expected}`
    );
}

const squareImages = [
    { id: 'a', width: 100, height: 100 },
    { id: 'b', width: 100, height: 100 },
    { id: 'c', width: 100, height: 100 },
];

test('calculateLayout returns an empty layout for no images', () => {
    assert.deepStrictEqual(
        calculateLayout([], {
            mode: 'width_col',
            width: 300,
            height: 300,
            rows: 1,
            cols: 2,
            gap: 10,
            fitMode: 'average',
            anchor: 'center',
        }),
        { totalWidth: 0, totalHeight: 0, cells: [] }
    );
});

test('calculateLayout builds a fixed width grid in width_col mode', () => {
    const layout = calculateLayout(squareImages, {
        mode: 'width_col',
        width: 300,
        height: 300,
        rows: 1,
        cols: 2,
        gap: 10,
        fitMode: 'average',
        anchor: 'center',
    });

    assertApproxEqual(layout.totalWidth, 300);
    assertApproxEqual(layout.totalHeight, 300);
    assert.strictEqual(layout.cells.length, 3);

    assertApproxEqual(layout.cells[0].width, 145);
    assertApproxEqual(layout.cells[0].height, 145);
    assertApproxEqual(layout.cells[1].x, 155);
    assertApproxEqual(layout.cells[2].y, 155);
});

test('calculateLayout preserves original aspect ratios in width_col original mode', () => {
    const layout = calculateLayout([
        { id: 'a', width: 100, height: 100 },
        { id: 'b', width: 200, height: 100 },
        { id: 'c', width: 100, height: 200 },
    ], {
        mode: 'width_col',
        width: 300,
        height: 300,
        rows: 1,
        cols: 2,
        gap: 10,
        fitMode: 'original',
        anchor: 'center',
    });

    assertApproxEqual(layout.totalWidth, 300);
    assertApproxEqual(layout.totalHeight, 445);

    assertApproxEqual(layout.cells[0].height, 145);
    assertApproxEqual(layout.cells[1].height, 72.5);
    assertApproxEqual(layout.cells[1].y, 36.25);
    assertApproxEqual(layout.cells[2].y, 155);
});

test('calculateLayout uses max_dimensions ratio in height_row mode', () => {
    const layout = calculateLayout([
        { id: 'a', width: 100, height: 200 },
        { id: 'b', width: 300, height: 100 },
    ], {
        mode: 'height_row',
        width: 300,
        height: 100,
        rows: 1,
        cols: 2,
        gap: 10,
        fitMode: 'max_dimensions',
        anchor: 'center',
    });

    assertApproxEqual(layout.totalHeight, 100);
    assertApproxEqual(layout.totalWidth, 310);
    assertApproxEqual(layout.cells[0].width, 150);
    assertApproxEqual(layout.cells[1].x, 160);
});

test('calculateLayout allows overlapping cells when original mode uses a negative gap', () => {
    const layout = calculateLayout([
        { id: 'a', width: 100, height: 100 },
        { id: 'b', width: 200, height: 100 },
    ], {
        mode: 'height_row',
        width: 300,
        height: 100,
        rows: 1,
        cols: 2,
        gap: -10,
        fitMode: 'original',
        anchor: 'center',
    });

    assertApproxEqual(layout.totalHeight, 100);
    assertApproxEqual(layout.totalWidth, 290);
    assertApproxEqual(layout.cells[0].x, 0);
    assertApproxEqual(layout.cells[1].x, 90);
});
