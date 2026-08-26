/**
 * Email-provider fingerprinting from MX hostnames, with SPF corroboration.
 *
 * MX exchanges are strongly identifying (`*.mail.protection.outlook.com` is
 * Microsoft 365, `aspmx.l.google.com` is Google Workspace), so a small
 * signature table names the provider without any extra lookups. Matching is
 * exact-host or dot-anchored suffix only — a pattern starting with `.` must
 * match at a label boundary, so `evilpphosted.com` can never hit
 * `.pphosted.com`. Substring matching is deliberately absent; the previous
 * tenant-lookup matcher used it and could not tell `outlook.com.attacker.example`
 * from Outlook.
 *
 * The `spf` patterns are a secondary signal only: when the MX points at a
 * security gateway (Mimecast, Proofpoint, …), the SPF include graph usually
 * still names the mailbox host behind it (`spf.protection.outlook.com`), and
 * `detectEmailProviders` reports that as a `via: 'spf'` match.
 *
 * Which provider a domain uses is identity, not health — render matches with
 * neutral styling, never status colours.
 */

/**
 * @typedef {Object} EmailProvider
 * @property {string} id stable id, e.g. `microsoft-365`
 * @property {string} name display name
 * @property {'mailbox'|'gateway'|'routing'} type
 * @property {string} url the service's own page for the product
 * @property {string[]} mx MX host patterns: leading `.` = suffix, else exact
 * @property {string[]} [spf] SPF include-graph domain patterns, same rule
 */

/** @type {EmailProvider[]} */
export const EMAIL_PROVIDERS = [
  { id: 'microsoft-365', name: 'Microsoft 365', type: 'mailbox', url: 'https://www.microsoft.com/microsoft-365', mx: ['.mail.protection.outlook.com'], spf: ['spf.protection.outlook.com'] },
  { id: 'google-workspace', name: 'Google Workspace', type: 'mailbox', url: 'https://workspace.google.com', mx: ['smtp.google.com', 'aspmx.l.google.com', '.aspmx.l.google.com', '.googlemail.com', 'gmail-smtp-in.l.google.com', '.gmail-smtp-in.l.google.com'], spf: ['_spf.google.com'] },
  { id: 'proofpoint', name: 'Proofpoint', type: 'gateway', url: 'https://www.proofpoint.com', mx: ['.pphosted.com', '.ppe-hosted.com'], spf: ['.pphosted.com'] },
  { id: 'mimecast', name: 'Mimecast', type: 'gateway', url: 'https://www.mimecast.com', mx: ['.mimecast.com', '.mimecast.co.za', '.mimecast-offshore.com'], spf: ['.mimecast.com'] },
  { id: 'barracuda', name: 'Barracuda', type: 'gateway', url: 'https://www.barracuda.com', mx: ['.barracudanetworks.com'], spf: ['.barracudanetworks.com'] },
  { id: 'messagelabs', name: 'Symantec MessageLabs', type: 'gateway', url: 'https://www.broadcom.com', mx: ['.messagelabs.com'], spf: ['.messagelabs.com'] },
  { id: 'hornetsecurity', name: 'Hornetsecurity', type: 'gateway', url: 'https://www.hornetsecurity.com', mx: ['.hornetsecurity.com'], spf: ['.hornetsecurity.com'] },
  { id: 'trendmicro', name: 'Trend Micro Email Security', type: 'gateway', url: 'https://www.trendmicro.com', mx: ['.trendmicro.com'] },
  { id: 'sophos', name: 'Sophos Email', type: 'gateway', url: 'https://www.sophos.com', mx: ['.sophos.com'] },
  { id: 'zoho', name: 'Zoho Mail', type: 'mailbox', url: 'https://www.zoho.com/mail/', mx: ['.zoho.com', '.zoho.eu', '.zoho.in', '.zohomail.com'], spf: ['zoho.com', 'zohomail.com'] },
  { id: 'fastmail', name: 'Fastmail', type: 'mailbox', url: 'https://www.fastmail.com', mx: ['.messagingengine.com', '.fastmail.com'], spf: ['spf.messagingengine.com'] },
  { id: 'amazon', name: 'Amazon SES / WorkMail', type: 'mailbox', url: 'https://aws.amazon.com/ses/', mx: ['.amazonaws.com', '.mail.awsapps.com'], spf: ['amazonses.com'] },
  { id: 'cloudflare', name: 'Cloudflare Email Routing', type: 'routing', url: 'https://developers.cloudflare.com/email-routing/', mx: ['.mx.cloudflare.net'], spf: ['_spf.mx.cloudflare.net'] },
  { id: 'icloud', name: 'Apple iCloud Mail', type: 'mailbox', url: 'https://www.icloud.com/mail', mx: ['.mail.icloud.com', '.icloud.com'], spf: ['icloud.com'] },
  { id: 'yahoo', name: 'Yahoo Mail', type: 'mailbox', url: 'https://mail.yahoo.com', mx: ['.yahoodns.net'] },
  { id: 'yandex', name: 'Yandex Mail', type: 'mailbox', url: 'https://360.yandex.com/mail/', mx: ['mx.yandex.net', '.yandex.net'], spf: ['_spf.yandex.net'] },
  { id: 'improvmx', name: 'ImprovMX', type: 'routing', url: 'https://improvmx.com', mx: ['.improvmx.com'], spf: ['spf.improvmx.com'] },
  { id: 'rackspace', name: 'Rackspace Email', type: 'mailbox', url: 'https://www.rackspace.com/email-hosting', mx: ['.emailsrvr.com'], spf: ['emailsrvr.com'] },
  { id: 'godaddy', name: 'GoDaddy / secureserver', type: 'mailbox', url: 'https://www.godaddy.com/email', mx: ['.secureserver.net'], spf: ['secureserver.net'] },
  { id: 'proton', name: 'Proton Mail', type: 'mailbox', url: 'https://proton.me/mail', mx: ['.protonmail.ch'], spf: ['_spf.protonmail.ch'] },
  { id: 'mailgun', name: 'Mailgun', type: 'routing', url: 'https://www.mailgun.com', mx: ['.mailgun.org'], spf: ['mailgun.org'] },
];

function normalizeHost(value) {
  return String(value ?? '').trim().toLowerCase().replace(/\.+$/, '');
}

function matchesPattern(host, pattern) {
  return pattern.startsWith('.') ? host.endsWith(pattern) : host === pattern;
}

/**
 * @param {string} hostname
 * @returns {EmailProvider|null}
 */
export function matchEmailProvider(hostname) {
  const host = normalizeHost(hostname);
  if (!host) return null;
  return EMAIL_PROVIDERS.find((provider) => provider.mx.some((pattern) => matchesPattern(host, pattern))) ?? null;
}

/**
 * @param {string[]} mxHosts MX exchange hostnames
 * @param {string[]} [spfDomains] domains seen in the SPF include graph
 * @returns {{ providers: Array<{id: string, name: string, type: string, url: string, via: 'mx'|'spf', hosts: string[]}>, unmatched: string[] }}
 */
export function detectEmailProviders(mxHosts, spfDomains = []) {
  const providers = [];
  const unmatched = [];
  for (const host of mxHosts.map(normalizeHost)) {
    const provider = matchEmailProvider(host);
    if (!provider) {
      unmatched.push(host);
      continue;
    }
    const entry = providers.find((item) => item.id === provider.id);
    if (entry) entry.hosts.push(host);
    else providers.push({ id: provider.id, name: provider.name, type: provider.type, url: provider.url, via: 'mx', hosts: [host] });
  }

  if (!providers.some((entry) => entry.type === 'mailbox')) {
    for (const domain of spfDomains.map(normalizeHost)) {
      if (!domain) continue;
      const provider = EMAIL_PROVIDERS.find(
        (entry) => entry.type === 'mailbox' && entry.spf?.some((pattern) => matchesPattern(domain, pattern))
      );
      if (!provider) continue;
      const entry = providers.find((item) => item.id === provider.id);
      if (entry) entry.hosts.push(domain);
      else providers.push({ id: provider.id, name: provider.name, type: provider.type, url: provider.url, via: 'spf', hosts: [domain] });
    }
  }

  return { providers, unmatched };
}
