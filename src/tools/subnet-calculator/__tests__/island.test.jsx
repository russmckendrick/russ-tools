// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { compressConfig, decompressConfig, generateShareableURL } from '@/core';
import SubnetCalculatorTool from '../island.jsx';
import { sharePayload } from '../lib/plan.js';
import { runPlan } from '../lib/planTool.js';

// The fixture `e2e/deeplinks.spec.js` pins, made before share links carried names.
const CAPTURED_SHARE =
  'eJyrVkpTsjLRUUrOTClSslIyNNADQ31DMyUdpeKCnMySYiWraDRxBM9cKbYWACVDD4o';

async function planFor(cidr, lines) {
  renderAt(`/subnet-calculator/${cidr}`);
  await waitFor(() => expect(screen.getAllByText(cidr).length).toBeGreaterThan(0));
  fireEvent.click(screen.getByRole('button', { name: 'Plan by size' }));
  fireEvent.change(screen.getByLabelText(/needed$/), { target: { value: lines } });
  fireEvent.click(screen.getByRole('button', { name: 'Allocate' }));
  return within(screen.getAllByRole('table').at(-1));
}

const subnetsIn = (table) =>
  table
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell').slice(0, 2).map((cell) => cell.textContent).join(' '));

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

    // Each block is drawn twice — in the tree and in the table — so the
    // assertions look in the table, which is the part that states the detail.
    fireEvent.click(screen.getByRole('button', { name: 'Split 10.0.0.0/24' }));
    const table = within(screen.getAllByRole('table').at(-1));
    expect(table.getByText('10.0.0.0/25')).toBeDefined();
    expect(table.getByText('10.0.0.128/25')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /join 10\.0\.0\.0\/25/i }));
    expect(screen.queryByText('10.0.0.0/25')).toBe(null);
  });

  it('builds the divide by pressing the tree', async () => {
    renderAt('/subnet-calculator/10.0.0.0/24');
    await waitFor(() => expect(screen.getAllByText('10.0.0.0/24').length).toBeGreaterThan(0));

    fireEvent.click(screen.getByRole('button', { name: 'Divide 10.0.0.0/24 in two' }));
    expect(within(screen.getAllByRole('table').at(-1)).getByText('10.0.0.128/25')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Merge the halves of 10.0.0.0/24' }));
    expect(screen.queryByText('10.0.0.128/25')).toBe(null);
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
        expect(within(screen.getAllByRole('table').at(-1)).getByText('10.0.0.0/25')).toBeDefined();
      });
      const table = within(screen.getAllByRole('table').at(-1));
      expect(table.getByText('10.0.0.128/26')).toBeDefined();
      expect(table.getByText('10.0.0.192/26')).toBeDefined();
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

  it('plans by size: allocates largest first and labels the named subnets', async () => {
    const table = await planFor('10.0.0.0/22', 'p2p 2\nweb 500\nmgmt 60\ndb 120');

    expect(table.getByRole('columnheader', { name: 'Label' })).toBeDefined();
    expect(subnetsIn(table)).toEqual([
      'web 10.0.0.0/23',
      'db 10.0.2.0/25',
      'mgmt 10.0.2.128/26',
      'p2p 10.0.2.192/31',
      '— 10.0.2.194/31',
      '— 10.0.2.196/30',
      '— 10.0.2.200/29',
      '— 10.0.2.208/28',
      '— 10.0.2.224/27',
      '— 10.0.3.0/24',
    ]);
    expect(screen.getByRole('status').textContent).toBe(
      '4 of 4 allocated. 318 addresses left in 6 free blocks, the largest a /24.'
    );
    expect(screen.getByText('10 subnets')).toBeDefined();
  });

  it('a plan stays a divide: the planned subnets still split and join by hand', async () => {
    const table = await planFor('10.0.0.0/24', 'a 100\nb 50');
    expect(subnetsIn(table)).toEqual(['a 10.0.0.0/25', 'b 10.0.0.128/26', '— 10.0.0.192/26']);

    fireEvent.click(screen.getByRole('button', { name: 'Split 10.0.0.192/26' }));
    expect(table.getByText('10.0.0.224/27')).toBeDefined();
    expect(screen.queryByRole('status')).toBe(null);

    fireEvent.click(screen.getByRole('button', { name: 'Split 10.0.0.0/25' }));
    expect(subnetsIn(table).slice(0, 2)).toEqual(['— 10.0.0.0/26', '— 10.0.0.64/26']);
    fireEvent.click(screen.getByRole('button', { name: /join 10\.0\.0\.0\/26/i }));
    expect(subnetsIn(table)[0]).toBe('a 10.0.0.0/25');
  });

  it('reports what did not fit, and the lines it could not read', async () => {
    const table = await planFor('10.0.0.0/24', 'huge 2000\na 100\nb 100\nc 100');
    expect(subnetsIn(table)).toEqual(['a 10.0.0.0/25', 'b 10.0.0.128/25']);
    expect(screen.getByRole('status').textContent).toBe('2 of 4 allocated. Nothing is left over.');
    expect(screen.getByText('2 requirements did not fit:')).toBeDefined();
    expect(screen.getByText('huge: 2,000 hosts')).toBeDefined();
    expect(screen.getByText(/needs a \/21, which is larger than 10\.0\.0\.0\/24/)).toBeDefined();
    expect(screen.getByText(/needs a \/25 and there is no room left/)).toBeDefined();

    fireEvent.change(screen.getByLabelText(/needed$/), { target: { value: 'web\ndb 20' } });
    fireEvent.click(screen.getByRole('button', { name: 'Allocate' }));
    expect(screen.getByText(/Line 1:/)).toBeDefined();
    expect(subnetsIn(table)).toEqual(['a 10.0.0.0/25', 'b 10.0.0.128/25']);
  });

  it('plans IPv6 by prefix length', async () => {
    const table = await planFor('2001:db8::/48', 'site /56\nlan 64');
    expect(subnetsIn(table).slice(0, 2)).toEqual(['site 2001:db8::/56', 'lan 2001:db8:0:100::/64']);
    expect(screen.getByRole('status').textContent).toBe(
      '2 of 2 allocated. 15 free blocks, the largest a /49.'
    );
  });

  it('says so when a plan leaves more blocks than the tree draws', async () => {
    const table = await planFor('2001:db8::/48', 'link /127');
    expect(table.getAllByRole('row')).toHaveLength(81);
    expect(
      screen.getByText('80 blocks is more than the tree can draw. The table lists them all.')
    ).toBeDefined();
  });

  it('restores names from a share payload, and none from a link made before they existed', async () => {
    const withNames = generateShareableURL(
      {
        f: 4,
        cidr: '10.0.0.0/24',
        splits: ['10.0.0.0/24'],
        names: { '10.0.0.0/25': 'web', '10.0.0.128/25': '<b>db</b>', '10.9.9.0/24': 'stray', bad: 7 },
      },
      'http://localhost/subnet-calculator'
    );
    window.history.replaceState(null, '', `/subnet-calculator${new URL(withNames).search}`);
    try {
      renderAt('/subnet-calculator');
      await waitFor(() => {
        expect(within(screen.getAllByRole('table').at(-1)).getByText('10.0.0.128/25')).toBeDefined();
      });
      expect(subnetsIn(within(screen.getAllByRole('table').at(-1)))).toEqual([
        'web 10.0.0.0/25',
        'b db /b 10.0.0.128/25',
      ]);
    } finally {
      cleanup();
      window.history.replaceState(null, '', '/');
    }

    window.history.replaceState(null, '', `/subnet-calculator?config=${CAPTURED_SHARE}`);
    try {
      renderAt('/subnet-calculator');
      await waitFor(() => expect(screen.getByText('3 subnets')).toBeDefined());
      const table = within(screen.getAllByRole('table').at(-1));
      expect(table.queryByRole('columnheader', { name: 'Label' })).toBe(null);
      expect(subnetsIn(table).map((row) => row.split(' ')[0])).toEqual([
        '10.0.0.0/18',
        '10.0.64.0/18',
        '10.0.128.0/17',
      ]);
    } finally {
      window.history.replaceState(null, '', '/');
    }
  });

  it('an unnamed divide encodes to the same bytes it always did', () => {
    const captured = decompressConfig(CAPTURED_SHARE);
    expect(captured).toEqual({ f: 4, cidr: '10.0.0.0/16', splits: ['10.0.0.0/16', '10.0.0.0/17'] });
    expect(compressConfig(sharePayload(captured.f, captured.cidr, captured.splits, {}))).toBe(
      CAPTURED_SHARE
    );
    expect(Object.keys(sharePayload(4, '10.0.0.0/24', [], { '10.0.0.0/24': 'lan' }))).toEqual([
      'f',
      'cidr',
      'splits',
      'names',
    ]);
  });

  it('plan_subnets answers in plain JSON, with a link that reopens the plan', () => {
    const out = runPlan({
      cidr: '10.0.0.0/22',
      requirements: [{ name: 'web', hosts: 500 }, { name: 'link', prefix: 30 }, { hosts: 5000 }],
    });
    const again = JSON.parse(JSON.stringify(out));
    expect(again.parent).toBe('10.0.0.0/22');
    expect(again.allocations).toEqual([
      {
        name: 'web',
        subnet: '10.0.0.0/23',
        prefix: 23,
        requestedHosts: 500,
        usableHosts: 510,
        netmask: '255.255.254.0',
        firstHost: '10.0.0.1',
        lastHost: '10.0.1.254',
        broadcastAddress: '10.0.1.255',
      },
      {
        name: 'link',
        subnet: '10.0.2.0/30',
        prefix: 30,
        requestedHosts: null,
        usableHosts: 2,
        netmask: '255.255.255.252',
        firstHost: '10.0.2.1',
        lastHost: '10.0.2.2',
        broadcastAddress: '10.0.2.3',
      },
    ]);
    expect(again.unallocated).toEqual([
      { name: '', requestedHosts: 5000, prefix: 19, reason: 'Needs a block larger than the parent.' },
    ]);
    expect(again.freeAddresses).toBe('508');
    expect(again.totalAddresses).toBe('1024');
    expect(decompressConfig(new URL(again.url).searchParams.get('config'))).toEqual({
      f: 4,
      cidr: '10.0.0.0/22',
      splits: ['10.0.0.0/22', '10.0.2.0/23', '10.0.2.0/24', '10.0.2.0/25', '10.0.2.0/26', '10.0.2.0/27', '10.0.2.0/28', '10.0.2.0/29'],
      names: { '10.0.0.0/23': 'web', '10.0.2.0/30': 'link' },
    });

    const v6 = JSON.parse(JSON.stringify(runPlan({ cidr: '2001:db8::/48', requirements: [{ prefix: 64 }] })));
    expect(v6.allocations[0]).toMatchObject({ subnet: '2001:db8::/64', firstAddress: '2001:db8::' });
    expect(v6.totalAddresses).toBe((1n << 80n).toString());

    expect(runPlan({ cidr: 'nope', requirements: [{ hosts: 1 }] }).error).toMatch(/valid/);
    expect(runPlan({ cidr: '10.0.0.0/24', requirements: [] }).error).toMatch(/at least one/);
    expect(runPlan().error).toMatch(/valid/);
  });
});
