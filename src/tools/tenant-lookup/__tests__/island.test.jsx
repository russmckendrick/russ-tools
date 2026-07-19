// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { server } from '@/test/msw/server';
import TenantLookupTool from '../island.jsx';

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
        <Route path="tenant-lookup" element={<TenantLookupTool />} />
        <Route path="tenant-lookup/:domain" element={<TenantLookupTool />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('tenant island', () => {
  it('deep link resolves a managed tenant from the live fixture', async () => {
    renderAt('/tenant-lookup/microsoft.com');

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /tenant info/i })).toBeDefined();
    });
    // tenantId from the captured microsoft.com fixture.
    expect(screen.getAllByText(/72f988bf-86f1-41af-91ab-2d7cd011db47/).length).toBeGreaterThan(0);
  });

  it('an email address is looked up by its domain', async () => {
    renderAt('/tenant-lookup');

    fireEvent.change(screen.getByPlaceholderText(/contoso\.com or/i), {
      target: { value: 'someone@microsoft.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /lookup tenant/i }));

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /tenant info/i })).toBeDefined();
    });
  });

  it('reads legacy saved lookups forward without deleting the old key', () => {
    const saved = [
      {
        id: '1',
        domain: 'contoso.com',
        displayName: 'Contoso',
        savedAt: 1700000000000,
        fullResult: { tenantType: 'AAD' },
      },
    ];
    localStorage.setItem('tenant-lookup-saved', JSON.stringify(saved));

    renderAt('/tenant-lookup');

    expect(screen.getByText('contoso.com')).toBeDefined();
    expect(screen.getByText('Contoso')).toBeDefined();
    expect(localStorage.getItem('tenant-lookup-saved')).not.toBe(null);
    expect(JSON.parse(localStorage.getItem('rt:tenant-lookup:saved'))[0].domain).toBe('contoso.com');
  });
});
