import React from 'react';
import { FlowDiagram } from '@/components/ui/tree-diagram';

const esc = (text) => String(text).replace(/"/g, '#quot;');
const clip = (text) => (text.length > 26 ? `${text.slice(0, 25)}…` : text);

/** The first two of a list, and a count of the rest. */
function brief(items, empty) {
  if (items.length === 0) return empty;
  const shown = items.slice(0, 2).map(clip).join(', ');
  return items.length > 2 ? `${shown} +${items.length - 2} more` : shown;
}

const STATE_EDGE = { enabled: 'enforced', enabledForReportingButNotEnforced: 'report-only', disabled: 'off' };

/**
 * A policy as the path a sign-in takes through it: who it catches, what they
 * are reaching, the conditions that narrow it, and what it then does. The
 * last link carries the policy's state, because a report-only policy walks
 * the same path and then does nothing.
 *
 * It restates the four rows beneath it, which carry the full lists this
 * abbreviates.
 *
 * @param {{ policy: object }} props the output of `explain`
 */
export default function PolicyFlow({ policy }) {
  const { who, what, when, then, stateRaw } = policy;
  const off = stateRaw === 'disabled';

  const target = [...what.include, ...what.userActions, ...what.authContexts];
  const controls = [...then.grant.controls, then.grant.authStrength].filter(Boolean);
  const outcome = then.grant.blocks
    ? ['Block access', 'bad']
    : controls.length > 0
      ? [`Require ${brief(controls, '')}`, 'ok']
      : ['No grant control', 'muted'];

  const lines = [
    'flowchart LR',
    `  who["Who<br/>${esc(brief(who.include, 'no users'))}"]`,
    `  what["What<br/>${esc(brief(target, 'no applications'))}"]`,
    `  when{{"When<br/>${esc(when.length === 0 ? 'always' : brief(when.map((c) => c.label), ''))}"}}`,
    `  then(["${esc(outcome[0])}"]):::${off ? 'muted' : outcome[1]}`,
    '  who --> what --> when',
    `  when -->|"${STATE_EDGE[stateRaw] ?? 'then'}"| then`,
  ];
  if (who.exclude.length > 0) {
    lines.push(`  whoX["Except<br/>${esc(brief(who.exclude, ''))}"]:::muted`, '  whoX -.- who');
  }
  if (what.exclude.length > 0) {
    lines.push(`  whatX["Except<br/>${esc(brief(what.exclude, ''))}"]:::muted`, '  whatX -.- what');
  }

  return (
    <FlowDiagram
      auto
      className="mb-4"
      source={lines.join('\n')}
      label={`How the policy ${policy.name} evaluates a sign-in`}
    />
  );
}
