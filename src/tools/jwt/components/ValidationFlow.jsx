import React from 'react';
import { FlowDiagram } from '@/components/ui/tree-diagram';

const esc = (text) => String(text).replace(/"/g, '#quot;');

/**
 * What has and has not been established about the token, in the order a
 * verifier would establish it: it parses, it names an algorithm, its time
 * claims hold now, and its signature checks out.
 *
 * The last step matters most and is the one usually skipped, so "not
 * checked" is drawn as plainly as "failed" — a decoded token is not a
 * verified one. The signature node reads straight from the result of
 * `lib/signature.js`: verified, failed, or not checked. Anything short of a
 * completed check (validation off, no key yet, an HMAC or unsigned token, a
 * key that could not be found) is "not checked", never "failed".
 *
 * @param {object} props
 * @param {object} props.analysis the tool's token analysis
 * @param {{ status: 'verified'|'failed'|'not-checked' }|null} props.signature the signature result, if any
 */
export default function ValidationFlow({ analysis, signature }) {
  if (!analysis) return null;

  const time = analysis.isExpired
    ? ['expired', 'bad']
    : analysis.isNotYetValid
      ? ['not valid yet', 'warn']
      : analysis.expiresAt
        ? ['within lifetime', 'ok']
        : ['no expiry set', 'warn'];
  const signatureNode =
    signature?.status === 'verified'
      ? ['verified', 'ok']
      : signature?.status === 'failed'
        ? ['failed', 'bad']
        : ['not checked', 'muted'];
  const unsigned = String(analysis.algorithm ?? '').toLowerCase() === 'none';

  const source = [
    'flowchart LR',
    '  token(["token"])',
    '  format["Format<br/>three parts"]:::ok',
    `  alg["Algorithm<br/>${esc(analysis.algorithm ?? 'not stated')}"]:::${unsigned || !analysis.algorithm ? 'bad' : 'ok'}`,
    `  time["Time claims<br/>${time[0]}"]:::${time[1]}`,
    `  sig["Signature<br/>${signatureNode[0]}"]:::${signatureNode[1]}`,
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
