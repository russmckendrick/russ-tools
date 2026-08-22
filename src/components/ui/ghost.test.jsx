// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { Ghost } from './ghost.jsx';

afterEach(cleanup);

const ghost = (children = <p>hello</p>) => {
  const { container } = render(<Ghost>{children}</Ghost>);
  return container.firstChild;
};

describe('Ghost', () => {
  it('renders whatever result component it is given', () => {
    expect(ghost(<p>Answer Records</p>).textContent).toBe('Answer Records');
  });

  /**
   * A picture of content that does not exist. Announcing rows that are not
   * there is worse than saying nothing, and nothing inside may be reached —
   * `aria-hidden` without `inert` is the axe `aria-hidden-focus` violation and
   * a tab stop into invisible controls.
   *
   * `inert` is a React 19 boolean attribute: passing the empty string removes
   * it, which is exactly the bug this pins.
   */
  it('is hidden from assistive tech and inert', () => {
    const el = ghost();
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.hasAttribute('inert')).toBe(true);
  });

  it('carries the class the redaction layer keys on', () => {
    expect(ghost().className).toContain('rt-ghosted');
  });

  /**
   * Unlike a loading skeleton this is not temporary — it sits on screen for as
   * long as someone reads the form above it, and a rectangle that throbs
   * indefinitely is an irritation rather than a signal.
   */
  it('never animates', () => {
    expect(ghost().outerHTML).not.toMatch(/animate-|pulse|shimmer/);
  });
});
