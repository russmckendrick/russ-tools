import { dnsRcodeName, dnsRecords, normalizeDnsName, queryDns } from '@/core';

const finding = (severity, title, detail, evidence = '') => ({ severity, title, detail, evidence });

function base64Bytes(value) {
  const compact = String(value ?? '').replace(/\s+/g, '');
  const decoded = atob(compact.padEnd(Math.ceil(compact.length / 4) * 4, '='));
  return Uint8Array.from(decoded, (char) => char.charCodeAt(0));
}

function dnskeyRdata(key) {
  const publicKey = base64Bytes(key.publicKey);
  const rdata = new Uint8Array(4 + publicKey.length);
  rdata[0] = key.flags >> 8;
  rdata[1] = key.flags & 0xff;
  rdata[2] = key.protocol;
  rdata[3] = key.algorithm;
  rdata.set(publicKey, 4);
  return rdata;
}

function ownerWire(owner) {
  const labels = owner.replace(/\.$/, '').toLowerCase().split('.');
  const bytes = [];
  for (const label of labels) {
    const encoded = new TextEncoder().encode(label);
    bytes.push(encoded.length, ...encoded);
  }
  bytes.push(0);
  return Uint8Array.from(bytes);
}

export function dnskeyTag(key) {
  const rdata = dnskeyRdata(key);
  let sum = 0;
  for (let index = 0; index < rdata.length; index++) {
    sum += index & 1 ? rdata[index] : rdata[index] << 8;
  }
  sum += (sum >> 16) & 0xffff;
  return sum & 0xffff;
}

export async function dnskeyDigest(owner, key, digestType) {
  const algorithms = { 1: 'SHA-1', 2: 'SHA-256', 4: 'SHA-384' };
  const algorithm = algorithms[digestType];
  if (!algorithm) return null;
  const name = ownerWire(owner);
  const rdata = dnskeyRdata(key);
  const input = new Uint8Array(name.length + rdata.length);
  input.set(name);
  input.set(rdata, name.length);
  const digest = await crypto.subtle.digest(algorithm, input);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export async function matchDnskeysToDs(domain, keys, dsRecords) {
  const matches = [];
  for (const ds of dsRecords) {
    for (const key of keys) {
      const keyTag = dnskeyTag(key);
      if (keyTag !== ds.keyTag || key.algorithm !== ds.algorithm) continue;
      const digest = await dnskeyDigest(domain, key, ds.digestType);
      if (digest && digest === ds.digest) matches.push({ ds, key, keyTag, digest });
    }
  }
  return matches;
}

export async function inspectDnssec(input, options = {}) {
  const domain = normalizeDnsName(input);
  if (!domain) throw new Error('Enter a valid delegated domain.');
  const query = options.query ?? ((name, type) => queryDns(name, type, { provider: 'google', dnssec: true }));

  const [addressResponse, dnskeyResponse, dsResponse, nsResponse, soaResponse] = await Promise.all([
    query(domain, 'A'), query(domain, 'DNSKEY'), query(domain, 'DS'), query(domain, 'NS'), query(domain, 'SOA'),
  ]);
  const keys = dnsRecords(dnskeyResponse, 'DNSKEY');
  const dsRecords = dnsRecords(dsResponse, 'DS');
  const nameServers = dnsRecords(nsResponse, 'NS').map((record) => record.data.replace(/\.$/, ''));
  const matches = await matchDnskeysToDs(domain, keys, dsRecords);
  const findings = [];
  const responses = [
    ['A', addressResponse],
    ['DNSKEY', dnskeyResponse],
    ['DS', dsResponse],
    ['NS', nsResponse],
    ['SOA', soaResponse],
  ];
  for (const [type, response] of responses) {
    if (Number(response?.Status ?? 0) !== 0) {
      const rcode = dnsRcodeName(response.Status);
      findings.push(finding('error', `${type} query returned ${rcode}`, rcode === 'SERVFAIL'
        ? 'The validating resolver could not produce an answer. This can indicate a bogus DNSSEC chain or a temporary DNS failure.'
        : `The validating resolver returned ${rcode}, so absence of this record set cannot be treated as evidence.`));
    }
  }

  const chainQueriesSucceeded = Number(dsResponse?.Status ?? 0) === 0 && Number(dnskeyResponse?.Status ?? 0) === 0;
  if (!chainQueriesSucceeded) {
    findings.push(finding('info', 'Chain state not inferred', 'DS and DNSKEY evidence was incomplete, so the delegation is not labelled signed or unsigned.'));
  } else if (dsRecords.length === 0 && keys.length === 0) {
    findings.push(finding('info', 'Unsigned delegation', 'No DS or DNSKEY records were found.'));
  } else if (dsRecords.length === 0) {
    findings.push(finding('warning', 'DNSKEY without parent DS', 'The zone publishes keys, but the delegation does not establish a chain of trust.'));
  } else if (keys.length === 0) {
    findings.push(finding('error', 'DS without DNSKEY', 'The parent publishes DS records, but no matching zone keys were returned.'));
  } else if (matches.length === 0) {
    findings.push(finding('error', 'DS and DNSKEY do not match', 'No published key reproduces a parent DS digest.'));
  } else {
    findings.push(finding('success', 'Chain link matches', `${matches.length} DS/DNSKEY pair${matches.length === 1 ? '' : 's'} matched cryptographically.`));
  }

  if (Number(addressResponse?.Status ?? 0) === 0 && addressResponse.AD) findings.push(finding('success', 'Resolver validated the answer', 'Google Public DNS set the Authenticated Data flag.'));
  else if (Number(addressResponse?.Status ?? 0) === 0 && dsRecords.length > 0) findings.push(finding('warning', 'Resolver did not validate the answer', 'The A response did not carry the Authenticated Data flag.'));

  if (Number(nsResponse?.Status ?? 0) === 0) {
    if (nameServers.length < 2) findings.push(finding('warning', 'Fewer than two name servers', `${nameServers.length} NS record${nameServers.length === 1 ? '' : 's'} returned.`));
    else findings.push(finding('success', 'Delegation has multiple name servers', `${nameServers.length} NS records returned.`));
  }
  if (Number(soaResponse?.Status ?? 0) === 0 && dnsRecords(soaResponse, 'SOA').length === 0) findings.push(finding('error', 'SOA record missing', 'No Start of Authority record was returned.'));

  const addressChecks = await Promise.all(nameServers.map(async (name) => {
    const [v4, v6] = await Promise.allSettled([query(name, 'A'), query(name, 'AAAA')]);
    const addresses = [
      ...(v4.status === 'fulfilled' ? dnsRecords(v4.value, 'A').map((record) => record.data) : []),
      ...(v6.status === 'fulfilled' ? dnsRecords(v6.value, 'AAAA').map((record) => record.data) : []),
    ];
    return { name, addresses };
  }));

  for (const server of addressChecks) {
    if (server.addresses.length === 0) findings.push(finding('error', 'Name server has no address', `${server.name} returned no A or AAAA record.`));
  }

  return {
    domain,
    status: findings.some((item) => item.severity === 'error')
      ? 'error'
      : findings.some((item) => item.severity === 'warning')
        ? 'warning'
        : chainQueriesSucceeded && dsRecords.length === 0
          ? 'info'
          : 'success',
    findings,
    keys: keys.map((key) => ({ ...key, keyTag: dnskeyTag(key) })),
    dsRecords,
    matches: matches.map(({ keyTag, digest, ds }) => ({ keyTag, digest, digestType: ds.digestType, algorithm: ds.algorithm })),
    delegation: { nameServers: addressChecks, soa: dnsRecords(soaResponse, 'SOA') },
    raw: { addressResponse, dnskeyResponse, dsResponse, nsResponse, soaResponse },
  };
}
