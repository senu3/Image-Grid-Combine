import test from 'node:test';
import assert from 'node:assert/strict';
import { selectImageFiles } from '../imageFiles.js';

test('mixed selection preserves image order and reports skipped files once', () => {
    const a = { type: 'image/png' }, b = { type: 'image/jpeg' };
    const notices = [];
    assert.deepEqual(selectImageFiles([a, { type: 'text/plain' }, b], { onToast: (...args) => notices.push(args) }), [a, b]);
    assert.deepEqual(notices, [['1件の画像以外を除外しました', 'info']]);
});

test('empty selection stays silent; non-image selection reports an error', () => {
    const errors = [], notices = [];
    const handlers = { onError: text => errors.push(text), onToast: text => notices.push(text) };
    assert.deepEqual(selectImageFiles(null, handlers), []);
    assert.equal(errors.length, 0);
    assert.deepEqual(selectImageFiles([{ type: '' }], handlers), []);
    assert.deepEqual(errors, ['画像ファイルを選択してください']);
    assert.deepEqual(notices, []);
});
