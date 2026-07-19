// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { generateShareableURL } from '@/core';
import SubnetCalculatorTool from '../island.jsx';

afterEach(cleanup);

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="subnet-calculator" element={<SubnetCalculatorTool />} />
        <Route path="subnet-calculator/:ip" element={<SubnetCalculatorTool />} />
        <Route path="subnet-calculator/:ip/:prefix" element={<SubnetCalculatorTool />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('subnet-calculator island', () => {
  it('deep link /subnet-calculator/:ip/:prefix calculates on mount', async () => {
    renderAt('/subnet-calculator/192.168.1.130/25');

    await waitFor(() => {
      // Headline and divide-table row both carry the CIDR.
      expect(screen.getAllByText('192.168.1.128/25').length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText('255.255.255.128').length).toBeGreaterThan(0);
    expect(screen.getByText('Private (RFC 1918)')).toBeDefined();
  });

  it('an IPv6 deep link works too — the address segment carries colons', async () => {
    renderAt('/subnet-calculator/2001:db8::/48');

    await waitFor(() => {
      expect(screen.getAllByText('2001:db8::/48').length).toBeGreaterThan(0);
    });
    expect(screen.getByText('Documentation')).toBeDefined();
  });

  it('split and join drive the divide table', async () => {
    renderAt('/subnet-calculator/10.0.0.0/24');

    await waitFor(() => expect(screen.getAllByText('10.0.0.0/24').length).toBeGreaterThan(0));

    fireEvent.click(screen.getByRole('button', { name: 'Split 10.0.0.0/24' }));
    expect(screen.getByText('10.0.0.0/25')).toBeDefined();
    expect(screen.getByText('10.0.0.128/25')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /join 10\.0\.0\.0\/25/i }));
    expect(screen.queryByText('10.0.0.0/25')).toBe(null);
  });

  it('restores a shared divide tree from the ?config payload', async () => {
    const url = generateShareableURL(
      { f: 4, cidr: '10.0.0.0/24', splits: ['10.0.0.0/24', '10.0.0.128/25'] },
      'http://localhost/subnet-calculator'
    );
    const search = new URL(url).search;
    window.history.replaceState(null, '', `/subnet-calculator${search}`);

    try {
      renderAt('/subnet-calculator');

      await waitFor(() => {
        expect(screen.getByText('10.0.0.0/25')).toBeDefined();
      });
      expect(screen.getByText('10.0.0.128/26')).toBeDefined();
      expect(screen.getByText('10.0.0.192/26')).toBeDefined();
    } finally {
      window.history.replaceState(null, '', '/');
    }
  });

  it('rejects junk with an error message instead of a result', async () => {
    renderAt('/subnet-calculator');

    fireEvent.change(screen.getByLabelText(/ipv4 or ipv6 address/i), {
      target: { value: 'not-an-address' },
    });
    fireEvent.click(screen.getByRole('button', { name: /calculate/i }));

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText(/valid IPv4 or IPv6 address/i)).toBeDefined();
  });
});
