import { runRegex } from './regex.js';

self.onmessage = (event) => {
  const { id, request } = event.data;
  self.postMessage({ id, result: runRegex(request) });
};

self.postMessage({ ready: true });
