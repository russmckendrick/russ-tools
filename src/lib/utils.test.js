import { describe, it, expect } from 'vitest';

import { cn } from './utils.js';

/**
 * `cn` is tailwind-merge, and tailwind-merge only knows the class groups it
 * has been told about. DESIGN.md's type steps are not Tailwind's stock sizes,
 * so without configuration it filed `text-body-sm` under *colour*, saw a real
 * colour later in the same string, and dropped the size.
 *
 * That failed silently: the class was present in every component's source and
 * absent from the rendered DOM, so the type scale looked applied and was not.
 * These tests exist so it cannot happen again — including for `data-lg`, the
 * step added last, which is the one most likely to be forgotten if the scale
 * grows again.
 */
describe('cn', () => {
  const STEPS = [
    'display',
    'headline-lg',
    'headline-md',
    'title-sm',
    'body-lg',
    'body-md',
    'body-sm',
    'label-caps',
    'label-caps-sm',
    'data-xl',
    'data-lg',
    'data-md',
    'data-sm',
    'verdict',
  ];

  it.each(STEPS)('keeps text-%s when a text colour follows it', (step) => {
    expect(cn(`text-${step} text-on-surface-muted`)).toBe(
      `text-${step} text-on-surface-muted`
    );
  });

  it('still lets a later step override an earlier one', () => {
    expect(cn('text-body-sm', 'text-headline-md')).toBe('text-headline-md');
  });

  it('still lets a later colour override an earlier one', () => {
    expect(cn('text-on-surface', 'text-danger')).toBe('text-danger');
  });

  it('keeps a step alongside the mono family and a colour', () => {
    expect(cn('font-mono text-data-md text-on-surface')).toBe(
      'font-mono text-data-md text-on-surface'
    );
  });

  it('does not confuse a step with a Tailwind stock size', () => {
    // Both are font sizes, so the later one wins — the point is that they are
    // recognised as the same group rather than as size-plus-colour.
    expect(cn('text-sm', 'text-body-sm')).toBe('text-body-sm');
  });
});
