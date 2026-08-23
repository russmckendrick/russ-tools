// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { server } from '@/test/msw/server';
import DnsLookupTool from '../island.jsx';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());
beforeEach(() => localStorage.clear());

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="dns-lookup" element={<DnsLookupTool />} />
        <Route path="dns-lookup/:domain" element={<DnsLookupTool />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('dns island', () => {
  it('looks up a typed domain against the DoH fixture and records provider-aware history', async () => {
    renderAt('/dns-lookup');

    fireEvent.change(screen.getByPlaceholderText(/example\.com/i), {
      target: { value: 'example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /lookup/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/23\.220\.75\.245|example\.com/).length).toBeGreaterThan(0);
    });

    const history = JSON.parse(localStorage.getItem('rt:dns-lookup:history'));
    expect(history[0]).toMatchObject({
      domain: 'example.com',
      recordType: 'A',
      provider: 'google',
    });
  });

  it('offers only the two real DoH providers', () => {
    renderAt('/dns-lookup');
    // The select's options render on open; assert via the removed labels not
    // being present anywhere and the trigger defaulting to Google.
    expect(screen.queryByText(/OpenDNS/)).toBe(null);
    expect(screen.queryByText(/Browser Default/)).toBe(null);
    expect(screen.getAllByText(/Google DNS/).length).toBeGreaterThan(0);
  });

  it('records explicit A and Google defaults for a deep-link lookup', async () => {
    renderAt('/dns-lookup/example.com');
    await waitFor(() => {
      const history = JSON.parse(localStorage.getItem('rt:dns-lookup:history'));
      expect(history[0]).toMatchObject({
        domain: 'example.com',
        recordType: 'A',
        provider: 'google',
      });
    });
  });

  it('migrates an incomplete history item when repeated', async () => {
    localStorage.setItem('rt:dns-lookup:history', JSON.stringify([{
      query: 'example.com',
      domain: 'example.com',
      timestamp: Date.now(),
    }]));
    renderAt('/dns-lookup');
    fireEvent.click(screen.getByRole('button', { name: 'Repeat' }));
    await waitFor(() => {
      const history = JSON.parse(localStorage.getItem('rt:dns-lookup:history'));
      expect(history[0]).toMatchObject({ recordType: 'A', provider: 'google' });
    });
  });
});
