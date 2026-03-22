import assert from 'node:assert/strict';
import test from 'node:test';

import { toRgbaColor } from '../color.js';

test('toRgbaColor converts a hex color and opacity to rgba', () => {
    assert.strictEqual(toRgbaColor('#336699', 25), 'rgba(51, 102, 153, 0.25)');
});

test('toRgbaColor supports shorthand hex colors', () => {
    assert.strictEqual(toRgbaColor('#fff', 50), 'rgba(255, 255, 255, 0.5)');
});

test('toRgbaColor falls back to white for invalid values', () => {
    assert.strictEqual(toRgbaColor('invalid', 10), 'rgba(255, 255, 255, 0.1)');
});
