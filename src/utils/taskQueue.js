// Limits application load jobs. Native decoders may finish after cancellation.
export function createTaskQueue(concurrency = 4) {
    if (!Number.isInteger(concurrency) || concurrency < 1) throw new RangeError('Invalid concurrency');
    let running = 0;
    const waiting = new Set();

    function drain() {
        while (running < concurrency && waiting.size > 0) {
            const job = waiting.values().next().value;
            waiting.delete(job);
            job.signal?.removeEventListener('abort', job.cancel);
            if (job.signal?.aborted) {
                job.resolve(null);
                continue;
            }
            running += 1;
            Promise.resolve().then(job.task).then(job.resolve, job.reject).finally(() => {
                running -= 1;
                drain();
            });
        }
    }

    return (task, signal) => new Promise((resolve, reject) => {
        if (signal?.aborted) {
            resolve(null);
            return;
        }
        const job = { task, signal, resolve, reject };
        job.cancel = () => {
            waiting.delete(job);
            resolve(null);
        };
        signal?.addEventListener('abort', job.cancel, { once: true });
        waiting.add(job);
        drain();
    });
}
