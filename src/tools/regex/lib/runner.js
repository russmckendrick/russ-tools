import { TIMEOUT_MS, runRegex } from './regex.js';

const spawnWorker = () =>
  typeof Worker === 'undefined'
    ? null
    : new Worker(new URL('./regex.worker.js', import.meta.url), { type: 'module' });

export function createRunner({ createWorker = spawnWorker, timeoutMs = TIMEOUT_MS, bootMs = 10000 } = {}) {
  let worker = null;
  let ready = false;
  let job = null;
  let sequence = 0;

  const stop = () => {
    worker?.terminate();
    worker = null;
    ready = false;
  };

  const settle = (result) => {
    const current = job;
    job = null;
    clearTimeout(current.timer);
    clearTimeout(current.boot);
    current.resolve(result);
  };

  const arm = () => {
    if (!job || job.timer !== null) return;
    clearTimeout(job.boot);
    job.timer = setTimeout(() => {
      stop();
      settle({ ok: false, timedOut: true, timeoutMs });
    }, timeoutMs);
  };

  const start = () => {
    worker = createWorker();
    if (!worker) return null;
    worker.onmessage = (event) => {
      if (event.data?.ready) {
        ready = true;
        arm();
      } else if (job && event.data?.id === job.id) {
        settle(event.data.result);
      }
    };
    worker.onerror = () => {
      stop();
      if (job) settle({ ok: false, error: 'The matching worker could not run. Reload the page and try again.' });
    };
    return worker;
  };

  return {
    run(request) {
      if (job) {
        stop();
        settle({ ok: false, superseded: true });
      }
      return new Promise((resolve) => {
        let target = worker;
        if (!target) {
          try {
            target = start();
          } catch {
            resolve({ ok: false, error: 'The matching worker could not start. Reload the page and try again.' });
            return;
          }
        }
        if (!target) {
          resolve({ ...runRegex(request), unprotected: true });
          return;
        }
        job = { id: ++sequence, resolve, timer: null, boot: null };
        target.postMessage({ id: job.id, request });
        if (ready) arm();
        else {
          job.boot = setTimeout(() => {
            stop();
            settle({ ok: false, error: 'The matching worker did not start. Reload the page and try again.' });
          }, bootMs);
        }
      });
    },
    dispose() {
      if (job) {
        clearTimeout(job.timer);
        clearTimeout(job.boot);
        job = null;
      }
      stop();
    },
  };
}
