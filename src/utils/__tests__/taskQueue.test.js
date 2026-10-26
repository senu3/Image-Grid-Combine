import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers/promises';
import { createTaskQueue } from '../taskQueue.js';

test('100 load jobs run at most four at a time and all return their results', async () => {
    const enqueue = createTaskQueue(4);
    let active = 0, peak = 0;
    const result = await Promise.all(Array.from({ length: 100 }, (_, id) => enqueue(async () => {
        active += 1;
        peak = Math.max(peak, active);
        await setImmediate();
        active -= 1;
        return id;
    })));
    assert.equal(peak, 4);
    assert.equal(active, 0);
    assert.deepEqual(result, Array.from({ length: 100 }, (_, id) => id));
});

test('aborting a waiting job settles it immediately without decoding it', async () => {
    const enqueue = createTaskQueue(1);
    let release;
    const first = enqueue(() => new Promise(resolve => { release = resolve; }));
    await setImmediate();
    const controller = new AbortController();
    let started = false;
    const cancelled = enqueue(() => { started = true; }, controller.signal);
    controller.abort();
    assert.equal(await cancelled, null);
    assert.equal(started, false);
    release('done');
    assert.equal(await first, 'done');
    assert.equal(await enqueue(() => 'next'), 'next');
});

test('failed and already-aborted jobs do not stall the queue', async () => {
    const enqueue = createTaskQueue(1);
    const controller = new AbortController();
    controller.abort();
    assert.equal(await enqueue(() => assert.fail('must not start'), controller.signal), null);
    const failed = enqueue(() => { throw new Error('decode failed'); });
    const next = enqueue(() => 42);
    await assert.rejects(failed, /decode failed/);
    assert.equal(await next, 42);
});
