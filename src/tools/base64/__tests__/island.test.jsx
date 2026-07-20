// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';

// vitest runs with `globals: false`, so testing-library cannot register its
// own afterEach — without this, every render stays mounted and the queries
// see the previous test's DOM.
afterEach(cleanup);
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Base64Tool from '../island.jsx';

/**
 * Frozen contract #1: /base64/:input is a served deep link, and the §B suite
 * requires it to *decode* on mount when the payload is base64.
 *
 * The old component processed the param with the initial mode (encode) while
 * a separate effect flipped the visible switch to decode — so the page showed
 * a decode toggle over a re-encoded output. Fixed in the port and logged in
 * BEHAVIOR_CHANGES.md; these tests hold the fixed behaviour.
 */

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="base64" element={<Base64Tool />} />
        <Route path="base64/:input" element={<Base64Tool />} />
      </Routes>
    </MemoryRouter>
  );
}

async function textboxes() {
  await waitFor(() => {
    expect(screen.getAllByRole('textbox').length).toBeGreaterThanOrEqual(2);
  });
  return screen.getAllByRole('textbox');
}

describe('deep link /base64/:input', () => {
  it('decodes a base64 param on mount, with the switch agreeing', async () => {
    renderAt('/base64/SGVsbG8gd29ybGQ=');

    const [input, output] = await textboxes();
    await waitFor(() => expect(output.value).toBe('Hello world'));

    expect(input.value).toBe('SGVsbG8gd29ybGQ=');
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true');
  });

  it('encodes a plain-text param on mount, with the switch agreeing', async () => {
    renderAt('/base64/hello%20world!');

    const [input, output] = await textboxes();
    await waitFor(() => expect(output.value).toBe('aGVsbG8gd29ybGQh'));

    expect(input.value).toBe('hello world!');
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false');
  });

  it('mounts empty without a param', async () => {
    renderAt('/base64');

    const [input, output] = await textboxes();
    expect(input.value).toBe('');
    expect(output.value).toBe('');
  });
});
