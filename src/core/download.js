/**
 * Save a generated artefact to disk.
 *
 * Every tool that exports something (Terraform, JSON, CSV, a password list)
 * has its own copy of the anchor-and-object-URL dance, and several of them
 * leak the object URL — the blob stays alive for the life of the document.
 * This revokes on the next frame, which is late enough for the browser to
 * have started the download and early enough not to matter.
 */

/**
 * @param {BlobPart|Blob} content raw text, or a Blob if the caller has one
 * @param {string} filename the name offered in the save dialog
 * @param {string} [mime] ignored when `content` is already a Blob
 * @returns {boolean} whether the download was started
 */
export function downloadFile(content, filename, mime = 'text/plain;charset=utf-8') {
  if (typeof document === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return false;
  }

  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Revoking synchronously cancels the download in Firefox and Safari.
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return true;
}

/**
 * `downloadFile` for structured data, with the indentation tools already use.
 *
 * @param {unknown} data
 * @param {string} filename
 * @returns {boolean}
 */
export function downloadJSON(data, filename) {
  return downloadFile(JSON.stringify(data, null, 2), filename, 'application/json;charset=utf-8');
}

/**
 * Turn a label into something safe to hand a filesystem. Tools build names
 * out of user input — a domain, a network name, a tenant — and a `/` in a
 * download attribute silently truncates the name in some browsers.
 *
 * @param {string} name
 * @returns {string}
 */
export function safeFilename(name) {
  return (
    String(name)
      .replace(/[\s<>:"/\\|?*]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^[-.]+|[-.]+$/g, '')
      .slice(0, 120) || 'download'
  );
}
