import React from 'react';

const PARTS = [
  { name: 'Header', swatch: 'bg-primary', ink: 'text-primary-text' },
  { name: 'Payload', swatch: 'bg-on-surface', ink: 'text-on-surface' },
  { name: 'Signature', swatch: 'bg-on-surface-dim', ink: 'text-on-surface-faint' },
];

/**
 * The token taken apart: its three dot-separated parts shown in three inks,
 * over a bar giving each part's share of the length. It answers "which bit
 * is which" before any tab is opened.
 *
 * Told apart by lightness as well as hue — accent, full ink, faint ink — so
 * the split survives without colour. The decoded tabs below state the same
 * content as text, so this is hidden from assistive tech.
 *
 * @param {{ token: string }} props
 */
export default function TokenAnatomy({ token }) {
  const parts = String(token ?? '').trim().split('.');
  if (parts.length !== 3 || parts.some((part) => part.length === 0)) return null;
  const total = parts.reduce((sum, part) => sum + part.length, 0);

  return (
    <div className="mb-5 flex flex-col gap-3" data-viz aria-hidden="true">
      <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
        {parts.map((part, i) => (
          <div
            key={PARTS[i].name}
            data-viz-fill
            className={`rt-grow h-full min-w-1 ${PARTS[i].swatch}`}
            style={{ flex: `${part.length} 1 0px` }}
          />
        ))}
      </div>
      <p className="max-h-28 overflow-y-auto break-all rounded-md bg-surface-inset p-3 font-mono text-data-sm">
        {parts.map((part, i) => (
          <React.Fragment key={PARTS[i].name}>
            {i > 0 && <span className="text-on-surface-dim">.</span>}
            <span className={PARTS[i].ink}>{part}</span>
          </React.Fragment>
        ))}
      </p>
      <p className="flex flex-wrap gap-x-5 gap-y-1 text-body-sm text-on-surface-faint">
        {parts.map((part, i) => (
          <span key={PARTS[i].name} className="inline-flex items-center gap-2">
            <span data-viz-fill className={`h-2.5 w-2.5 rounded-sm ${PARTS[i].swatch}`} />
            {PARTS[i].name}
            <span className="font-mono text-data-sm">{Math.round((part.length / total) * 100)}%</span>
          </span>
        ))}
      </p>
    </div>
  );
}
