// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import DiffTool from '../island.jsx';

afterEach(cleanup);

const rows = (kind) => [...document.querySelectorAll(`[data-row="${kind}"]`)];
const set = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('diff island', () => {
  it('opens on a sample with its additions and deletions counted', () => {
    render(<DiffTool />);
    expect(screen.getByText('5 lines added')).toBeTruthy();
    expect(screen.getByText('5 lines removed')).toBeTruthy();
    expect(document.querySelector('[data-view="unified"]')).toBeTruthy();
    expect(rows('added')).toHaveLength(5);
    expect(rows('removed')).toHaveLength(5);
  });

  it('marks the changed words inside a changed line', () => {
    render(<DiffTool />);
    const marked = [...document.querySelectorAll('[data-row="added"] [data-changed]')].map((node) => node.textContent);
    expect(marked).toContain('8443');
    expect(marked).toContain('true');
  });

  it('updates as either side is typed into', () => {
    render(<DiffTool />);
    set('Original', 'one\ntwo\nthree\n');
    set('Changed', 'one\n2\nthree\nfour\n');
    expect(screen.getByText('2 lines added')).toBeTruthy();
    expect(screen.getByText('1 line removed')).toBeTruthy();
    set('Changed', 'one\ntwo\nthree\n');
    expect(screen.getByText('Identical')).toBeTruthy();
    expect(screen.getByText('No differences in 3 lines with these options.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Copy as unified diff' }).disabled).toBe(true);
  });

  it('ignores whitespace and case when switched on', () => {
    render(<DiffTool />);
    set('Original', 'Key:   Value\n');
    set('Changed', '  key: value\n');
    expect(screen.queryByText('Identical')).toBeNull();
    fireEvent.click(screen.getByRole('switch', { name: 'Ignore whitespace' }));
    expect(screen.queryByText('Identical')).toBeNull();
    fireEvent.click(screen.getByRole('switch', { name: 'Ignore case' }));
    expect(screen.getByText('Identical')).toBeTruthy();
  });

  it('offers to normalise JSON only when both sides are JSON, and applies it', () => {
    render(<DiffTool />);
    expect(screen.queryByRole('switch', { name: 'Normalise JSON before diffing' })).toBeNull();
    set('Original', '{"b":1,"a":2}');
    set('Changed', '{\n  "a": 2,\n  "b": 1\n}');
    const option = screen.getByRole('switch', { name: 'Normalise JSON before diffing' });
    expect(option.getAttribute('aria-checked')).toBe('true');
    expect(screen.getByText('Identical')).toBeTruthy();
    expect(screen.getByText(/their keys sorted and the result re-indented/)).toBeTruthy();
    fireEvent.click(option);
    expect(screen.queryByText('Identical')).toBeNull();
  });

  it('switches to side by side on a wide screen', () => {
    render(<DiffTool />);
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Side by side' }));
    expect(document.querySelector('[data-view="split"]')).toBeTruthy();
    expect(rows('change')).toHaveLength(6);
    const texts = rows('change').map((row) => [...row.children].map((half) => half.textContent));
    expect(texts[3][0]).toBe('');
    expect(texts[3][1]).toContain('tls_certificate = /etc/tls/app.pem');
    expect(texts[4][0]).toContain('allowed_origins = https://app.example.com');
    expect(texts[4][1]).toContain('https://admin.example.com');
  });

  it('expands collapsed context on request', () => {
    render(<DiffTool />);
    const lines = Array.from({ length: 30 }, (_, i) => `line ${i + 1}`);
    set('Original', lines.join('\n'));
    set('Changed', lines.map((line, i) => (i === 15 ? 'changed' : line)).join('\n'));
    expect(screen.getByText('12 unchanged lines')).toBeTruthy();
    expect(rows('equal')).toHaveLength(6);
    fireEvent.click(screen.getByRole('switch', { name: 'Collapse unchanged lines' }));
    expect(rows('equal')).toHaveLength(29);
  });

  it('refuses oversized input with a message instead of comparing it', () => {
    render(<DiffTool />);
    set('Changed', 'x\n'.repeat(20001));
    expect(screen.getByText('Too large to compare here')).toBeTruthy();
    expect(screen.getByText(/changed text has 20,001 lines/)).toBeTruthy();
    expect(document.querySelector('[data-view]')).toBeNull();
  });

  it('swaps the sides and clears to a ghost', () => {
    render(<DiffTool />);
    set('Original', 'a');
    set('Changed', 'b');
    fireEvent.click(screen.getByRole('button', { name: 'Swap sides' }));
    expect(screen.getByLabelText('Original').value).toBe('b');
    expect(screen.getByLabelText('Changed').value).toBe('a');
    fireEvent.click(screen.getByRole('button', { name: 'Clear both' }));
    expect(document.querySelector('.rt-ghosted')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Clear both' }).disabled).toBe(true);
  });
});
