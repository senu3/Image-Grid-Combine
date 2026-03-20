import assert from 'node:assert/strict';
import test from 'node:test';

import {
    calculateRenderDimensions,
    calculateRenderPosition,
    parseAnchor,
} from '../anchor.js';

function assertApproxEqual(actual, expected, epsilon = 1e-9) {
    assert.ok(
        Math.abs(actual - expected) <= epsilon,
        `Expected ${actual} to be within ${epsilon} of ${expected}`
    );
}

test('parseAnchor returns centered coordinates by default', () => {
    assert.deepStrictEqual(parseAnchor(), { anchorX: 0.5, anchorY: 0.5 });
    assert.deepStrictEqual(parseAnchor('center'), { anchorX: 0.5, anchorY: 0.5 });
});

test('parseAnchor resolves edge anchors correctly', () => {
    assert.deepStrictEqual(parseAnchor('top-right'), { anchorX: 1, anchorY: 0 });
    assert.deepStrictEqual(parseAnchor('center-left'), { anchorX: 0, anchorY: 0.5 });
    assert.deepStrictEqual(parseAnchor('bottom-center'), { anchorX: 0.5, anchorY: 1 });
});

test('calculateRenderDimensions uses contain sizing for max_dimensions-like layout', () => {
    const result = calculateRenderDimensions({
        cellWidth: 100,
        cellHeight: 100,
        imgRatio: 2,
        cellRatio: 1,
        isContain: true,
    });

    assertApproxEqual(result.renderW, 100);
    assertApproxEqual(result.renderH, 50);
});

test('calculateRenderDimensions uses cover sizing for cropped layout', () => {
    const result = calculateRenderDimensions({
        cellWidth: 100,
        cellHeight: 100,
        imgRatio: 2,
        cellRatio: 1,
        isContain: false,
    });

    assertApproxEqual(result.renderW, 200);
    assertApproxEqual(result.renderH, 100);
});

test('calculateRenderPosition respects anchor offsets', () => {
    const bottomRight = calculateRenderPosition({
        cellWidth: 100,
        cellHeight: 100,
        renderW: 80,
        renderH: 60,
        anchor: 'bottom-right',
    });

    assertApproxEqual(bottomRight.renderX, 20);
    assertApproxEqual(bottomRight.renderY, 40);

    const centered = calculateRenderPosition({
        cellWidth: 100,
        cellHeight: 100,
        renderW: 80,
        renderH: 60,
        anchor: 'center',
    });

    assertApproxEqual(centered.renderX, 10);
    assertApproxEqual(centered.renderY, 20);
});
