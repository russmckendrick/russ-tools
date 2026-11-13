import React from 'react';
import { FlowDiagram } from '@/components/ui/tree-diagram';

const RANK = { error: 3, warning: 2, success: 1, info: 0 };
const TONE = { error: 'bad', warning: 'warn', success: 'ok', info: 'muted' };

const esc = (text) => String(text).replace(/"/g, '#quot;');
const short = (text) => (text.length > 30 ? `${text.slice(0, 29)}…` : text);

/**
 * The six checks as one picture: the domain, what routes its mail, what
 * authenticates it and what secures it in transit — each box taking the
 * worst severity among its findings and quoting the finding that set it.
 *
 * It is a graph rather than a tree because DMARC is: it passes on the
 * strength of SPF or DKIM, so both point at it.
 *
 * Every box restates a section below; nothing here is a new check.
 *
 * @param {{ result: object }} props the output of `analyseEmailDns`
 */
export default function MailFlow({ result }) {
  const node = (id) => {
    const section = result.sections.find((item) => item.id === id);
    const worst = section.findings.reduce(
      (top, item) => (RANK[item.severity] > RANK[top.severity] ? item : top),
      section.findings[0] ?? { severity: 'info', title: 'Not checked' }
    );
    const key = id.replace(/-/g, '');
    return `${key}["${esc(section.title)}<br/>${esc(short(worst.title))}"]:::${TONE[worst.severity]}`;
  };

  const source = [
    'flowchart TD',
    `  domain["${esc(result.domain)}"]:::accent`,
    '  subgraph routing["Routing"]',
    `    ${node('mx')}`,
    '  end',
    '  subgraph auth["Authentication"]',
    `    ${node('spf')}`,
    `    ${node('dkim')}`,
    `    ${node('dmarc')}`,
    '  end',
    '  subgraph transport["Transport security"]',
    `    ${node('mta-sts')}`,
    `    ${node('tls-rpt')}`,
    '  end',
    '  domain --- mx',
    '  domain --- spf',
    '  domain --- dkim',
    '  domain --- mtasts',
    '  domain --- tlsrpt',
    '  spf -.->|"aligns for"| dmarc',
    '  dkim -.->|"aligns for"| dmarc',
  ].join('\n');

  return (
    <FlowDiagram
      source={source}
      label={`Mail DNS checks for ${result.domain}`}
      caption="DMARC passes when SPF or DKIM passes and aligns with the From domain."
    />
  );
}
