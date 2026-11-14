// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import UuidTool from '../island.jsx';

afterEach(cleanup);

const CANONICAL = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="uuid" element={<UuidTool />} />
        <Route path="uuid/:value" element={<UuidTool />} />
      </Routes>
    </MemoryRouter>
  );
}

const listed = () =>
  within(screen.getByRole('list', { name: 'Generated UUIDs' }))
    .getAllByRole('listitem')
    .map((item) => item.querySelector('span').textContent);

describe('uuid island', () => {
  it('opens with one version 4 UUID already generated', () => {
    renderAt('/uuid');
    const values = listed();
    expect(values).toHaveLength(1);
    expect(values[0]).toMatch(CANONICAL);
    expect(values[0][14]).toBe('4');
  });

  it('generates the count typed, without a submit, and clamps it on blur', () => {
    renderAt('/uuid');
    const count = screen.getByLabelText('How many');
    fireEvent.change(count, { target: { value: '25' } });
    expect(listed()).toHaveLength(25);

    fireEvent.change(count, { target: { value: '999' } });
    expect(listed()).toHaveLength(500);
    fireEvent.blur(count);
    expect(count.value).toBe('500');
  });

  it('restyles the same values when a format option is switched', () => {
    renderAt('/uuid');
    const [before] = listed();
    fireEvent.click(screen.getByRole('switch', { name: 'Uppercase' }));
    fireEvent.click(screen.getByRole('switch', { name: 'Braces' }));
    fireEvent.click(screen.getByRole('switch', { name: 'No hyphens' }));
    expect(listed()[0]).toBe(`{${before.replace(/-/g, '').toUpperCase()}}`);
  });

  it('replaces the batch on Regenerate', () => {
    renderAt('/uuid');
    const [before] = listed();
    fireEvent.click(screen.getByRole('button', { name: 'Regenerate' }));
    expect(listed()[0]).not.toBe(before);
  });

  it('opens the decoder on a /uuid/:value deep link', () => {
    renderAt('/uuid/017F22E2-79B0-7CC3-98C4-DC0C0C07398F');
    expect(screen.getByRole('tab', { name: 'Decode' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByLabelText('UUID or GUID').value).toBe('017F22E2-79B0-7CC3-98C4-DC0C0C07398F');
    expect(screen.getByRole('heading', { name: 'Version 7' })).toBeTruthy();
    expect(screen.getAllByText('2022-02-22T19:22:22.000Z').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'Convert' }).getAttribute('href')).toBe(
      '/timestamp/2022-02-22T19:22:22.000Z'
    );
  });

  it('says so when the pasted value is not a UUID', () => {
    renderAt('/uuid/not-a-uuid');
    expect(screen.getByText(/Not a UUID/)).toBeTruthy();
    expect(screen.queryByRole('heading', { name: /^Version/ })).toBeNull();
  });
});
