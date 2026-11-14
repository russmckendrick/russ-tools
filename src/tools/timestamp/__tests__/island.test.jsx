// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import TimestampTool from '../island.jsx';

afterEach(cleanup);

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="timestamp" element={<TimestampTool />} />
        <Route path="timestamp/:value" element={<TimestampTool />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('timestamp island', () => {
  it('follows the clock while the field is empty', () => {
    renderAt('/timestamp');
    expect(screen.getByRole('heading', { name: 'Current time' })).toBeTruthy();
    expect(screen.getByText('Live')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Now' })).toBeTruthy();
  });

  it('converts a /timestamp/:value deep link and says seconds were assumed', () => {
    renderAt('/timestamp/1794651210');
    expect(screen.getByLabelText('Timestamp or date').value).toBe('1794651210');
    expect(screen.getByText('10 digits: read as seconds.')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Result' })).toBeTruthy();
    expect(screen.getByText('2026-11-14T10:13:30.000Z')).toBeTruthy();
    expect(screen.getByText('1794651210000')).toBeTruthy();
  });

  it('reads thirteen digits as milliseconds as they are typed', () => {
    renderAt('/timestamp');
    fireEvent.change(screen.getByLabelText('Timestamp or date'), { target: { value: '1794651210123' } });
    expect(screen.getByText('13 digits: read as milliseconds.')).toBeTruthy();
    expect(screen.getByText('2026-11-14T10:13:30.123Z')).toBeTruthy();
  });

  it('reads an ISO 8601 deep link', () => {
    renderAt('/timestamp/2026-11-14T10:13:30Z');
    expect(screen.getByText('ISO 8601 with its own offset.')).toBeTruthy();
    expect(screen.getByText('1794651210')).toBeTruthy();
  });

  it('explains a value it cannot read and goes back to the clock', () => {
    renderAt('/timestamp/tomorrow');
    expect(screen.getByText(/Not an epoch value or a date this can read/)).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Current time' })).toBeTruthy();
  });

  it('puts the current second into the field on Convert this moment', () => {
    renderAt('/timestamp');
    fireEvent.click(screen.getByRole('button', { name: 'Convert this moment' }));
    expect(screen.getByLabelText('Timestamp or date').value).toMatch(/^\d{10}$/);
    expect(screen.getByRole('heading', { name: 'Result' })).toBeTruthy();
  });
});
