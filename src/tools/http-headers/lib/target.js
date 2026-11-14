const SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;
const HOST_PORT = /^[^/?#]+:\d+(?:[/?#]|$)/;
const HOSTNAME = /^(?:[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/i;

const toUrl = (target) => new URL(SCHEME.test(target) ? target : `https://${target}`);

export function cleanTarget(input) {
  const raw = String(input ?? '').trim();
  if (!raw) return '';

  const explicit = SCHEME.test(raw);
  try {
    const url = toUrl(raw);
    url.hash = '';
    if (explicit || HOST_PORT.test(raw)) return url.href.replace(/^(https?:\/\/[^/]+)\/$/, '$1');
    return `${url.host}${url.pathname === '/' ? '' : url.pathname}${url.search}`;
  } catch {
    return raw;
  }
}

export function validateTarget(target) {
  if (!target) return 'Enter a URL or a hostname';

  let url;
  try {
    url = toUrl(target);
  } catch {
    return 'That is not a URL or a hostname';
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return 'Only http and https URLs are checked';
  if (url.username || url.password) return 'Remove the username and password from the URL';
  if (!HOSTNAME.test(url.hostname.replace(/\.$/, ''))) return 'Enter a public hostname, such as example.com';
  return '';
}

export function displayHost(target) {
  try {
    return toUrl(target).host;
  } catch {
    return String(target ?? '');
  }
}
