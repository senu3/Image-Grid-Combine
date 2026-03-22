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

test('calculateLayout keeps original mode on a shared source-based scale in width_col mode', () => {
    const layout = calculateLayout([
        { id: 'a', width: 100, height: 100 },
        { id: 'b', width: 100, height: 200 },
        { id: 'c', width: 200, height: 100 },
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
    assertApproxEqual(layout.totalHeight, 300);
    assertApproxEqual(layout.cells[0].width, 193.33333333333334);
    assertApproxEqual(layout.cells[0].height, 193.33333333333334);
    assertApproxEqual(layout.cells[0].renderWidth, 96.66666666666667);
    assertApproxEqual(layout.cells[0].renderHeight, 96.66666666666667);
    assertApproxEqual(layout.cells[1].x, 203.33333333333334);
    assertApproxEqual(layout.cells[2].y, 203.33333333333334);
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

test('calculateLayout uses the configured rows in height_row mode', () => {
    const layout = calculateLayout([
        { id: 'a', width: 100, height: 100 },
        { id: 'b', width: 100, height: 100 },
        { id: 'c', width: 100, height: 100 },
        { id: 'd', width: 100, height: 100 },
        { id: 'e', width: 100, height: 100 },
        { id: 'f', width: 100, height: 100 },
        { id: 'g', width: 100, height: 100 },
    ], {
        mode: 'height_row',
        width: 300,
        height: 500,
        rows: 5,
        cols: 2,
        gap: 10,
        fitMode: 'average',
        anchor: 'center',
    });

    assertApproxEqual(layout.totalHeight, 500);
    assertApproxEqual(layout.cells[4].y, 408);
    assertApproxEqual(layout.cells[5].x, 102);
});

test('calculateLayout keeps original mode on a shared source-based scale in height_row mode', () => {
    const layout = calculateLayout([
        { id: 'a', width: 100, height: 100 },
        { id: 'b', width: 200, height: 50 },
        { id: 'c', width: 50, height: 200 },
    ], {
        mode: 'height_row',
        width: 300,
        height: 210,
        rows: 2,
        cols: 2,
        gap: 10,
        fitMode: 'original',
        anchor: 'center',
    });

    assertApproxEqual(layout.totalHeight, 210);
    assertApproxEqual(layout.totalWidth, 210);
    assertApproxEqual(layout.cells[0].x, 0);
    assertApproxEqual(layout.cells[0].width, 160);
    assertApproxEqual(layout.cells[0].height, 160);
    assertApproxEqual(layout.cells[0].renderWidth, 80);
    assertApproxEqual(layout.cells[0].renderHeight, 80);
    assertApproxEqual(layout.cells[1].y, 170);
    assertApproxEqual(layout.cells[2].x, 170);
});

test('calculateLayout allows overlapping track offsets when original mode uses a negative gap', () => {
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
