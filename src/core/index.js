/**
 * `core/` — the framework-agnostic plumbing every tool shares.
 *
 * Plain JS with no React and no DOM assumptions beyond a guarded `document`,
 * so the same modules run in an island, in a build script and under Vitest's
 * `node` environment. Two of them carry frozen contracts: `sharelink` is the
 * share-URL wire format (#2) and `storage` is the never-delete localStorage
 * migration (#3).
 *
 * Tools import from here, never from `src/utils/`.
 */
export { storageKey, createToolStorage, toolStorageKeys, clearTool } from './storage.js';
export { createCache } from './cache.js';
export { copyText, readText } from './clipboard.js';
export { downloadFile, downloadJSON, safeFilename } from './download.js';
export { ApiError, apiFetch, apiJson, buildUrl } from './api.js';
export {
  DNS_PROVIDERS,
  DNS_TYPES,
  DNS_TYPE_NAMES,
  canonicalDnsAnswers,
  compareDnsResponses,
  decodeDnsText,
  dnsRcodeName,
  dnsRecords,
  dnsTypeName,
  formatDnsRecord,
  normalizeDnsName,
  parseDnsRecord,
  queryDns,
  queryDnsMany,
} from './dns.js';
export { EMAIL_PROVIDERS, matchEmailProvider, detectEmailProviders } from './email-provider.js';
export {
  safeStringify,
  compressConfig,
  decompressConfig,
  generateShareableURL,
  parseConfigFromURL,
  updateURLWithConfig,
} from './sharelink.js';
