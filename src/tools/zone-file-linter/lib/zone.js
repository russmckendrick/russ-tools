import { parseIPv4 } from '../../subnet-calculator/lib/ipv4.js';
import { parseIPv6 } from '../../subnet-calculator/lib/ipv6.js';

const RECORD_TYPES = new Set([
  'A', 'AAAA', 'CAA', 'CNAME', 'DNSKEY', 'DS', 'HTTPS', 'LOC', 'MX', 'NAPTR',
  'NS', 'NSEC', 'NSEC3', 'NSEC3PARAM', 'PTR', 'RRSIG', 'SOA', 'SPF', 'SRV',
  'SSHFP', 'SVCB', 'TLSA', 'TXT', 'URI',
]);

function stripComment(line) {
  let quoted = false;
  let escaped = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (escaped) { escaped = false; continue; }
    if (character === '\\') { escaped = true; continue; }
    if (character === '"') quoted = !quoted;
    if (character === ';' && !quoted) return line.slice(0, index);
  }
  return line;
}

function parenthesisDelta(line) {
  let quoted = false;
  let escaped = false;
  let delta = 0;
  for (const character of line) {
    if (escaped) { escaped = false; continue; }
    if (character === '\\') { escaped = true; continue; }
    if (character === '"') quoted = !quoted;
    if (!quoted && character === '(') delta += 1;
    if (!quoted && character === ')') delta -= 1;
  }
  return delta;
}

function removeGroupingParentheses(line) {
  let quoted = false;
  let escaped = false;
  let output = '';
  for (const character of line) {
    if (escaped) {
      output += character;
      escaped = false;
      continue;
    }
    if (character === '\\') {
      output += character;
      escaped = true;
      continue;
    }
    if (character === '"') quoted = !quoted;
    output += !quoted && ['(', ')'].includes(character) ? ' ' : character;
  }
  return output;
}

function collapseUnquotedWhitespace(value) {
  let quoted = false;
  let escaped = false;
  let whitespace = false;
  let output = '';
  for (const character of value) {
    if (escaped) {
      output += character;
      escaped = false;
      continue;
    }
    if (character === '\\') {
      if (whitespace && output) output += ' ';
      whitespace = false;
      output += character;
      escaped = true;
      continue;
    }
    if (character === '"') {
      if (!quoted && whitespace && output) output += ' ';
      whitespace = false;
      quoted = !quoted;
      output += character;
      continue;
    }
    if (!quoted && /\s/.test(character)) {
      whitespace = true;
      continue;
    }
    if (whitespace && output) output += ' ';
    whitespace = false;
    output += character;
  }
  return output.trim();
}

function logicalLines(source) {
  const output = [];
  let buffer = '';
  let startLine = 1;
  let leadingWhitespace = false;
  let depth = 0;
  String(source ?? '').split(/\r?\n/).forEach((raw, index) => {
    const line = stripComment(raw);
    if (!buffer && !line.trim()) return;
    if (!buffer) {
      startLine = index + 1;
      leadingWhitespace = /^\s/.test(raw);
    }
    buffer += `${buffer ? ' ' : ''}${line.trim()}`;
    depth += parenthesisDelta(line);
    if (depth <= 0 && buffer.trim()) {
      output.push({ text: collapseUnquotedWhitespace(removeGroupingParentheses(buffer)), line: startLine, leadingWhitespace, unbalanced: depth < 0 });
      buffer = '';
      depth = 0;
    }
  });
  if (buffer.trim()) output.push({ text: buffer, line: startLine, leadingWhitespace, unbalanced: true });
  return output;
}

function tokenize(line) {
  return line.match(/"(?:\\.|[^"\\])*"|\S+/g) ?? [];
}

function parseTtl(value) {
  const match = String(value).match(/^(\d+)([smhdw]?)$/i);
  if (!match) return null;
  const multiplier = { '': 1, s: 1, m: 60, h: 3600, d: 86400, w: 604800 }[match[2].toLowerCase()];
  return Number(match[1]) * multiplier;
}

function absoluteName(name, origin) {
  if (name === '@') return origin || '@';
  if (name.endsWith('.')) return name.toLowerCase();
  if (!origin) return name.toLowerCase();
  return origin === '.' ? `${name}.`.toLowerCase() : `${name}.${origin}`.toLowerCase();
}

function resolveOrigin(name, currentOrigin) {
  if (name.endsWith('.')) return name.toLowerCase();
  return currentOrigin ? absoluteName(name, currentOrigin) : `${name}.`.toLowerCase();
}

function finding(severity, code, message, line) {
  return { severity, code, message, line };
}

export function parseZone(source) {
  const records = [];
  const findings = [];
  let origin = '';
  let currentOrigin = '';
  let defaultTtl = null;
  let previousName = '';
  let previousTtl = null;
  let previousClass = 'IN';

  for (const logical of logicalLines(source)) {
    const tokens = tokenize(logical.text);
    if (!tokens.length) continue;
    if (logical.unbalanced) findings.push(finding('error', 'unbalanced-parentheses', 'Parentheses are not balanced.', logical.line));
    const directive = tokens[0].toUpperCase();
    if (directive === '$ORIGIN') {
      if (!tokens[1]) findings.push(finding('error', 'invalid-origin', '$ORIGIN requires a domain name.', logical.line));
      else {
        currentOrigin = resolveOrigin(tokens[1], currentOrigin);
        if (!origin) origin = currentOrigin;
      }
      continue;
    }
    if (directive === '$TTL') {
      defaultTtl = parseTtl(tokens[1]);
      if (defaultTtl === null) findings.push(finding('error', 'invalid-default-ttl', '$TTL requires a valid integer or duration.', logical.line));
      continue;
    }
    if (directive.startsWith('$')) {
      findings.push(finding('warning', 'unsupported-directive', `${tokens[0]} is not expanded by this browser parser.`, logical.line));
      continue;
    }

    let cursor = 0;
    let name;
    if (logical.leadingWhitespace) name = previousName;
    else name = tokens[cursor++];
    if (!name) {
      findings.push(finding('error', 'missing-owner', 'The record has no owner name and no previous owner to inherit.', logical.line));
      continue;
    }

    let ttl = null;
    let dnsClass = null;
    let type = '';
    while (cursor < tokens.length) {
      const token = tokens[cursor].toUpperCase();
      const parsedTtl = parseTtl(tokens[cursor]);
      if (ttl === null && parsedTtl !== null) ttl = parsedTtl;
      else if (['IN', 'CH', 'HS'].includes(token)) dnsClass = token;
      else { type = token; cursor += 1; break; }
      cursor += 1;
    }

    if (!type || (!RECORD_TYPES.has(type) && !/^TYPE\d+$/.test(type))) {
      findings.push(finding('error', 'unknown-record-type', `Could not identify a supported record type in “${logical.text}”.`, logical.line));
      continue;
    }
    const data = tokens.slice(cursor).join(' ');
    if (!data) findings.push(finding('error', 'missing-rdata', `${type} record has no record data.`, logical.line));
    const resolvedName = logical.leadingWhitespace ? previousName : absoluteName(name, currentOrigin);
    const resolvedTtl = ttl ?? defaultTtl ?? previousTtl;
    const resolvedClass = dnsClass ?? previousClass;
    previousName = resolvedName;
    if (ttl !== null) previousTtl = ttl;
    if (dnsClass) previousClass = dnsClass;
    records.push({
      name: resolvedName,
      ttl: resolvedTtl,
      class: resolvedClass,
      type,
      data,
      origin: currentOrigin,
      line: logical.line,
    });
  }

  return { origin, defaultTtl, records, findings };
}

function targetName(record) {
  const values = tokenize(record.data);
  if (record.type === 'MX') return values[1];
  if (record.type === 'SRV') return values[3];
  if (['CNAME', 'NS', 'PTR'].includes(record.type)) return values[0];
  return null;
}

function isIpLiteral(value) {
  if (!value) return false;
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(value) || value.includes(':');
}

function isUnsignedInteger(value, maximum = Number.MAX_SAFE_INTEGER) {
  return /^\d+$/.test(String(value ?? '')) && Number(value) <= maximum;
}

function isDnsName(value) {
  if (value === '.') return true;
  const name = String(value ?? '').replace(/\.$/, '');
  if (!name || name.length > 253) return false;
  return name.split('.').every((label) => label.length <= 63 && /^[a-z0-9_*](?:[a-z0-9_*-]{0,61}[a-z0-9_*])?$/i.test(label));
}

function canonicalData(record, origin) {
  const values = tokenize(record.data);
  const domainIndexes = {
    CNAME: [0], MX: [1], NS: [0], PTR: [0], SOA: [0, 1], SRV: [3],
  }[record.type] ?? [];
  return values.map((value, index) => domainIndexes.includes(index) ? absoluteName(value, origin) : value).join(' ');
}

export function canonicalRecord(record, origin = '') {
  return collapseUnquotedWhitespace(`${record.name} ${record.ttl ?? ''} ${record.class} ${record.type} ${canonicalData(record, record.origin ?? origin)}`);
}

export function lintZone(source) {
  const parsed = parseZone(source);
  const findings = [...parsed.findings];
  const { records, origin } = parsed;
  const byName = new Map();
  const byRrset = new Map();
  const exact = new Map();

  for (const record of records) {
    const recordsAtName = byName.get(record.name) ?? [];
    recordsAtName.push(record);
    byName.set(record.name, recordsAtName);
    const rrsetKey = `${record.name}|${record.class}|${record.type}`;
    const rrset = byRrset.get(rrsetKey) ?? [];
    rrset.push(record);
    byRrset.set(rrsetKey, rrset);
    const key = canonicalRecord(record, origin);
    if (exact.has(key)) findings.push(finding('warning', 'duplicate-record', `Exact duplicate of the record on line ${exact.get(key)}.`, record.line));
    else exact.set(key, record.line);
  }

  const soaRecords = records.filter((record) => record.type === 'SOA');
  if (!soaRecords.length) findings.push(finding('error', 'missing-soa', 'The zone has no SOA record.'));
  if (soaRecords.length > 1) findings.push(finding('error', 'multiple-soa', `The zone has ${soaRecords.length} SOA records.`));
  if (!records.some((record) => record.type === 'NS' && (!origin || record.name === origin))) findings.push(finding('error', 'missing-apex-ns', 'The zone has no NS record at its apex.'));

  for (const [name, items] of byName) {
    if (items.some((record) => record.type === 'CNAME') && items.some((record) => !['CNAME', 'RRSIG', 'NSEC'].includes(record.type))) {
      findings.push(finding('error', 'cname-coexists', `${name} has a CNAME and other record data.`, items[0].line));
    }
    if (origin && name === origin && items.some((record) => record.type === 'CNAME')) findings.push(finding('error', 'apex-cname', 'A CNAME cannot be used at the zone apex.', items.find((record) => record.type === 'CNAME').line));
  }

  for (const rrset of byRrset.values()) {
    const ttls = new Set(rrset.map((record) => record.ttl).filter((ttl) => ttl !== null));
    if (ttls.size > 1) findings.push(finding('warning', 'inconsistent-ttl', `${rrset[0].name} ${rrset[0].type} records use different TTLs.`, rrset[0].line));
  }

  const cnameNames = new Set(records.filter((record) => record.type === 'CNAME').map((record) => record.name));
  for (const record of records) {
    const fields = tokenize(record.data);
    if (record.type === 'A' && (fields.length !== 1 || parseIPv4(fields[0]) === null)) {
      findings.push(finding('error', 'invalid-a', 'A record data must be one valid IPv4 address.', record.line));
    }
    if (record.type === 'AAAA' && (fields.length !== 1 || parseIPv6(fields[0]) === null)) {
      findings.push(finding('error', 'invalid-aaaa', 'AAAA record data must be one valid IPv6 address.', record.line));
    }
    if (['CNAME', 'NS', 'PTR'].includes(record.type) && (fields.length !== 1 || !isDnsName(fields[0]))) {
      findings.push(finding('error', 'invalid-domain-target', `${record.type} record data must be one valid domain name.`, record.line));
    }
    if (record.type === 'MX' && (fields.length !== 2 || !isUnsignedInteger(fields[0], 65535) || !isDnsName(fields[1]))) {
      findings.push(finding('error', 'invalid-mx', 'MX record data must contain a 0–65535 preference and a valid domain name.', record.line));
    }
    if (record.type === 'SRV' && (fields.length !== 4 || fields.slice(0, 3).some((value) => !isUnsignedInteger(value, 65535)) || !isDnsName(fields[3]))) {
      findings.push(finding('error', 'invalid-srv', 'SRV record data must contain priority, weight and port values from 0–65535 plus a valid target name.', record.line));
    }
    if (record.type === 'SOA') {
      if (fields.length < 7) findings.push(finding('error', 'invalid-soa', 'SOA record requires MNAME, RNAME, serial, refresh, retry, expire and minimum fields.', record.line));
      else if (!isDnsName(fields[0]) || !isDnsName(fields[1]) || !isUnsignedInteger(fields[2], 4294967295) || fields.slice(3, 7).some((value) => parseTtl(value) === null)) {
        findings.push(finding('error', 'invalid-soa', 'SOA names, serial and timer fields must use valid domain, integer and duration values.', record.line));
      }
    }
    if (record.type === 'CAA') {
      const tag = fields[1]?.replace(/^"|"$/g, '').toLowerCase();
      if (fields.length < 3 || !isUnsignedInteger(fields[0], 255) || !['issue', 'issuewild', 'iodef'].includes(tag)) findings.push(finding('warning', 'unusual-caa', 'CAA should contain 0–255 flags, issue/issuewild/iodef and a quoted value.', record.line));
    }
    if (['MX', 'SRV'].includes(record.type) && isIpLiteral(targetName(record))) findings.push(finding('error', 'ip-target', `${record.type} target must be a host name, not an IP address.`, record.line));
    if (['MX', 'NS'].includes(record.type)) {
      const target = targetName(record);
      if (target && cnameNames.has(absoluteName(target, record.origin ?? origin))) findings.push(finding('warning', 'alias-target', `${record.type} points to a CNAME within this zone.`, record.line));
    }
  }

  const rank = { error: 0, warning: 1, info: 2 };
  findings.sort((a, b) => rank[a.severity] - rank[b.severity] || (a.line ?? Number.MAX_SAFE_INTEGER) - (b.line ?? Number.MAX_SAFE_INTEGER));
  return {
    ...parsed,
    findings,
    normalized: records.map((record) => canonicalRecord(record, origin)).sort().join('\n'),
    counts: findings.reduce((counts, item) => ({ ...counts, [item.severity]: counts[item.severity] + 1 }), { error: 0, warning: 0, info: 0 }),
  };
}

export function diffZones(beforeSource, afterSource) {
  const before = lintZone(beforeSource);
  const after = lintZone(afterSource);
  const oldRecords = new Set(before.normalized.split('\n').filter(Boolean));
  const newRecords = new Set(after.normalized.split('\n').filter(Boolean));
  return {
    removed: [...oldRecords].filter((record) => !newRecords.has(record)).sort(),
    added: [...newRecords].filter((record) => !oldRecords.has(record)).sort(),
    before,
    after,
  };
}
