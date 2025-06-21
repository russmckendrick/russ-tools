// Utility logging functions that only log in development

export function devLog(...args) {
  if (import.meta.env?.DEV) {
    console.log(...args);
  }
}

export function devWarn(...args) {
  if (import.meta.env?.DEV) {
    console.warn(...args);
  }
}

export function devError(...args) {
  if (import.meta.env?.DEV) {
    console.error(...args);
  }
}
