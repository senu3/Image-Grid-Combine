import test from 'node:test';
import assert from 'node:assert/strict';
import { createBatchUpdates } from '../batchUpdates.js';

test('100 completions in a window publish once, with the latest value per image', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const calls = [];
    const updates = createBatchUpdates(entries => calls.push(entries));
    for (let id = 0; id < 100; id++) updates.add(id, id);
    updates.add(0, 'latest');
    t.mock.timers.tick(31);
    assert.equal(calls.length, 0);
    t.mock.timers.tick(1);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].length, 100);
    assert.deepEqual(calls[0][0], [0, 'latest']);
});

test('deleted assets and unmounted batches cannot publish stale values; batching can restart', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const calls = [];
    const updates = createBatchUpdates(entries => calls.push(entries));
    updates.add('deleted', 1);
    updates.remove('deleted');
    t.mock.timers.tick(32);
    assert.deepEqual(calls, []);
    updates.add('unmounted', 2);
    updates.clear();
    t.mock.timers.tick(32);
    assert.deepEqual(calls, []);
    updates.add('new', 3);
    t.mock.timers.tick(32);
    assert.deepEqual(calls, [[['new', 3]]]);
});
