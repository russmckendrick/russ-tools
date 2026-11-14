import { formatIPv4, ipv4Details } from './ipv4.js';
import { compressIPv6, ipv6Details } from './ipv6.js';

const HEADERS = {
  4: ['Name', 'Subnet', 'Netmask', 'First usable', 'Last usable', 'Broadcast', 'Usable hosts'],
  6: ['Name', 'Subnet', 'First address', 'Last address', 'Addresses'],
};

export function planTable(family, rows, names = {}) {
  const records = rows.map((row) => {
    const name = names[row.key] ?? '';
    if (family === 4) {
      const d = ipv4Details(formatIPv4(Number(row.addr)), row.prefix);
      return [
        name,
        row.key,
        d.netmask,
        d.firstHost,
        d.lastHost,
        d.broadcastAddress ?? '',
        String(d.usableHosts),
      ];
    }
    const d = ipv6Details(compressIPv6(row.addr), row.prefix);
    return [name, row.key, d.firstAddress, d.lastAddress, d.totalAddresses.toString()];
  });
  return { headers: HEADERS[family], records };
}

const FORMULA = /^[=+\-@\t\r]/;

function csvCell(value) {
  const text = FORMULA.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function planToCsv(family, rows, names) {
  const { headers, records } = planTable(family, rows, names);
  return [headers, ...records].map((record) => record.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

const mdCell = (value) => value.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\s+/g, ' ');

export function planToMarkdown(family, rows, names) {
  const { headers, records } = planTable(family, rows, names);
  const line = (cells) => `| ${cells.map(mdCell).join(' | ')} |`;
  return [line(headers), line(headers.map(() => '---')), ...records.map(line)].join('\n') + '\n';
}
