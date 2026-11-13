import React from 'react';
import { FlowDiagram } from '@/components/ui/tree-diagram';

const esc = (text) => String(text).replace(/"/g, '#quot;');

/**
 * What has and has not been established about the token, in the order a
 * verifier would establish it: it parses, it names an algorithm, its time
 * claims hold now, and its signature checks out.
 *
 * The last step matters most and is the one usually skipped, so "not
 * checked" is drawn as plainly as "invalid" — a decoded token is not a
 * verified one.
 *
 * @param {object} props
 * @param {object} props.analysis the tool's token analysis
 * @param {boolean} props.checking whether signature validation is switched on
 * @param {{ valid: boolean }|null} props.validation the signature result, if any
 */
export default function ValidationFlow({ analysis, checking, validation }) {
  if (!analysis) return null;

  const time = analysis.isExpired
    ? ['expired', 'bad']
    : analysis.isNotYetValid
      ? ['not valid yet', 'warn']
      : analysis.expiresAt
        ? ['within lifetime', 'ok']
        : ['no expiry set', 'warn'];
  const signature = !checking
    ? ['not checked', 'muted']
    : !validation
      ? ['waiting for a key', 'muted']
      : validation.valid
        ? ['verified', 'ok']
        : ['invalid', 'bad'];
  const unsigned = String(analysis.algorithm ?? '').toLowerCase() === 'none';

  const source = [
    'flowchart LR',
    '  token(["token"])',
    '  format["Format<br/>three parts"]:::ok',
    `  alg["Algorithm<br/>${esc(analysis.algorithm ?? 'not stated')}"]:::${unsigned || !analysis.algorithm ? 'bad' : 'ok'}`,
    `  time["Time claims<br/>${time[0]}"]:::${time[1]}`,
    `  sig["Signature<br/>${signature[0]}"]:::${signature[1]}`,
    '  token --> format --> alg --> time --> sig',
  ].join('\n');

  return (
    <FlowDiagram
      auto
      className="mb-5"
      source={source}
      label="What has been established about this token"
    />
  );
}
