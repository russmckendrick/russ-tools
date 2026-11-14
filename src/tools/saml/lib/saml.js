import { SamlDecodeError, decodeSaml } from './decode.js';
import { algorithm } from './labels.js';
import { SamlParseError, parseSaml, toPlain } from './parse.js';
import { prettyLines, prettyText } from './pretty.js';

export const UNVERIFIED =
  'Signatures are reported, not verified. This tool reads which algorithms and certificate a signature names; it does not check the signature against a key, so it cannot tell you the message is genuine.';

function bindingFindings(binding) {
  if (!binding?.signed) return [];
  const sigAlg = algorithm(binding.sigAlg);
  const findings = [
    {
      code: 'redirect-signature',
      severity: 'info',
      title: 'Signed in the query string',
      detail: `The redirect binding signs the URL parameters, not the XML${sigAlg ? `, here with ${sigAlg.label ?? sigAlg.uri}` : ''}.`,
    },
  ];
  if (sigAlg?.weak) {
    findings.push({
      code: 'weak-algorithm',
      severity: 'warning',
      title: `The query-string signature uses ${sigAlg.label ?? sigAlg.uri}`,
      detail: 'SHA-1 is no longer collision-resistant. The sender needs its signing algorithm changed to SHA-256.',
    });
  }
  return findings;
}

export function readSaml(input, options = {}) {
  let decoded;
  try {
    decoded = decodeSaml(input);
  } catch (error) {
    if (error instanceof SamlDecodeError) return { error: error.message };
    throw error;
  }
  if (!decoded) return null;

  try {
    const result = parseSaml(decoded.xml, options);
    result.findings.push(...bindingFindings(decoded.binding));
    const lines = prettyLines(result.document);
    return { steps: decoded.steps, binding: decoded.binding, result, lines, xml: prettyText(lines) };
  } catch (error) {
    if (error instanceof SamlParseError) return { steps: decoded.steps, error: error.message };
    throw error;
  }
}

export function readSamlPlain(input, options) {
  const read = readSaml(input, options);
  if (!read) return { error: 'Nothing to decode' };
  if (read.error) return { error: read.error };
  return {
    encoding: read.steps,
    relayState: read.binding?.relayState ?? null,
    signatureNote: UNVERIFIED,
    ...toPlain(read.result),
    xml: read.xml,
  };
}
