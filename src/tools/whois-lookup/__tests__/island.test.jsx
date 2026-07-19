// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { server } from '@/test/msw/server';
import WhoisLookupTool from '../island.jsx';

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
        <Route path="whois-lookup" element={<WhoisLookupTool />} />
        <Route path="whois-lookup/:query" element={<WhoisLookupTool />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('whois island', () => {
  it('deep link /whois-lookup/:query looks up on mount and renders the fixture', async () => {
    renderAt('/whois-lookup/example.com');

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /information/i })).toBeDefined();
    });

    // From the captured live fixture: type badge and history entry.
    expect(screen.getAllByText('domain').length).toBeGreaterThan(0);
    expect(screen.getByText(/recent lookups/i)).toBeDefined();

    // History persisted under the namespaced slot.
    const history = JSON.parse(localStorage.getItem('rt:whois-lookup:history'));
    expect(history[0]).toMatchObject({ query: 'example.com', type: 'domain' });
  });

  it('mounts idle without a param', () => {
    renderAt('/whois-lookup');
    expect(screen.getByPlaceholderText(/example\.com or 8\.8\.8\.8/)).toBeDefined();
    expect(screen.queryByRole('tab')).toBe(null);
  });
});
