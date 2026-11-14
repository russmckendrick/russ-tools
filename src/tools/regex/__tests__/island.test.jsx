// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, fireEvent, waitFor, within } from '@testing-library/react';
import RegexTool from '../island.jsx';
import { encodeState } from '../lib/share.js';

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/regex');
});

const highlights = () => [...document.querySelectorAll('[data-highlight] [data-match]')].map((node) => node.textContent);

describe('regex island', () => {
  it('opens on a sample with its matches highlighted and its groups named', async () => {
    render(<RegexTool />);
    expect(await screen.findByText('3 matches.')).toBeTruthy();
    expect(highlights()).toHaveLength(3);
    expect(highlights()[1]).toMatch(/^198\.51\.100\.24 - - \[.*\] "POST \/login HTTP\/1\.1" 401$/);
    const table = screen.getByRole('table', { name: 'Matches' });
    expect(within(table).getAllByText('1 ip')).toHaveLength(3);
    expect(within(table).getByText('203.0.113.7')).toBeTruthy();
    expect(within(table).getByText('0-11')).toBeTruthy();
    expect(window.location.hash).toBe('');
  });

  it('says which flavour it is', () => {
    render(<RegexTool />);
    expect(screen.getByText(/the flavour is ECMAScript \(JavaScript\)/)).toBeTruthy();
  });

  it('re-matches as the pattern, flags and text change', async () => {
    render(<RegexTool />);
    fireEvent.change(screen.getByLabelText('Pattern'), { target: { value: 'a' } });
    fireEvent.change(screen.getByLabelText('Test text'), { target: { value: 'a A a' } });
    expect(await screen.findByText('2 matches.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /ignore case/ }));
    expect(await screen.findByText('3 matches.')).toBeTruthy();
    expect(screen.getByRole('button', { name: /ignore case/ }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: /global/ }));
    expect(await screen.findByText('1 match: without the g flag the search stops at the first.')).toBeTruthy();
    expect(highlights()).toEqual(['a']);
  });

  it('reports a pattern that does not compile and keeps the page standing', async () => {
    render(<RegexTool />);
    fireEvent.change(screen.getByLabelText('Pattern'), { target: { value: '(' } });
    expect(await screen.findByText('The pattern does not compile')).toBeTruthy();
    expect(screen.getByLabelText('Pattern').getAttribute('aria-invalid')).toBe('true');
    expect(screen.queryByRole('table', { name: 'Matches' })).toBeNull();
    expect(highlights()).toEqual([]);
  });

  it('shows the replaced text in replace mode', async () => {
    render(<RegexTool />);
    fireEvent.change(screen.getByLabelText('Pattern'), { target: { value: '(?<word>\\w+)@(\\w+)' } });
    fireEvent.change(screen.getByLabelText('Test text'), { target: { value: 'a@b c@d' } });
    await screen.findByText('2 matches.');
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Replace' }));
    fireEvent.change(await screen.findByLabelText('Replace each match with'), { target: { value: '$2 at $<word>' } });
    await waitFor(() => expect(screen.getByLabelText('Replaced text').textContent).toBe('b at a d at c'));
  });

  it('writes its state into the hash once something changes, and reads it back', async () => {
    const first = render(<RegexTool />);
    fireEvent.change(screen.getByLabelText('Pattern'), { target: { value: '\\d+' } });
    fireEvent.change(screen.getByLabelText('Test text'), { target: { value: 'a1 b22' } });
    await waitFor(() => expect(window.location.hash).toMatch(/^#config=/), { timeout: 2000 });
    const hash = window.location.hash;
    expect(hash).toBe(
      encodeState({ pattern: '\\d+', flags: 'gm', text: 'a1 b22', replacement: '$<status> $<method> $<path> from $<ip>' })
    );
    first.unmount();

    render(<RegexTool />);
    expect(screen.getByLabelText('Pattern').value).toBe('\\d+');
    expect(screen.getByLabelText('Test text').value).toBe('a1 b22');
    expect(await screen.findByText('2 matches.')).toBeTruthy();
  });

  it('refuses text over the limit instead of matching it', async () => {
    render(<RegexTool />);
    fireEvent.change(screen.getByLabelText('Test text'), { target: { value: 'a'.repeat(100001) } });
    expect(await screen.findByText(/The limit is 100,000, so nothing is matched/)).toBeTruthy();
    expect(screen.queryByRole('table', { name: 'Matches' })).toBeNull();
  });
});
