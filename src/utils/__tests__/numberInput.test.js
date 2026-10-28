import test from 'node:test';
import assert from 'node:assert/strict';
import { commitNumber } from '../numberInput.js';

test('empty and incomplete numeric drafts revert to the committed value', () => {
    for (const text of ['', ' ', '-', '1e', 'Infinity', 'NaN']) assert.equal(commitNumber(text, 1200, 1, 10000), 1200);
});

test('numeric commits allow negatives and clamp integer boundaries', () => {
    assert.equal(commitNumber('-25', 0, -100, 100), -25);
    assert.equal(commitNumber('999', 3, 1, 100), 100);
    assert.equal(commitNumber('0', 3, 1, 100), 1);
    assert.equal(commitNumber('3.8', 3, 1, 100), 3);
    assert.equal(commitNumber('2500', 1200, 1, 10000), 2500);
});
