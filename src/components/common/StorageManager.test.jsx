// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import StorageManager from './StorageManager.jsx';

beforeEach(() => localStorage.clear());
afterEach(cleanup);

/**
 * `russ-tools-palette` is a retired key — the six alternate palettes went with
 * the Signal redesign and nothing reads it any more. It stays in these tests
 * on purpose: an orphaned site-preference key is exactly the thing "Clear all
 * tool data" must leave alone, and it is now the only one besides the theme.
 */

describe('StorageManager', () => {
  it('shows only data owned by a tool', async () => {
    localStorage.setItem('russ-tools-palette', 'nord');
    localStorage.setItem('vite-ui-theme', 'dark');

    render(<StorageManager />);

    expect(await screen.findByText('Nothing stored')).toBeTruthy();
    expect(screen.queryByText('Not owned by a tool')).toBeNull();
    expect(screen.queryByText('russ-tools-palette')).toBeNull();
    expect(screen.queryByText('vite-ui-theme')).toBeNull();
  });

  it('clears all tool data without deleting site preferences', async () => {
    localStorage.setItem('rt:dns-lookup:history', '[{"domain":"example.com"}]');
    localStorage.setItem('russ-tools-palette', 'nord');
    localStorage.setItem('vite-ui-theme', 'dark');

    render(<StorageManager />);

    expect(await screen.findByText('DNS Lookup Tool')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Clear all tool data' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(localStorage.getItem('rt:dns-lookup:history')).toBeNull());
    expect(localStorage.getItem('russ-tools-palette')).toBe('nord');
    expect(localStorage.getItem('vite-ui-theme')).toBe('dark');
    expect(await screen.findByText('Nothing stored')).toBeTruthy();
  });

  it('lists the index memory by name and clears it on its own', async () => {
    localStorage.setItem('rt:shell:pinned', '["jwt"]');
    localStorage.setItem('rt:shell:recent', '["base64","jwt"]');
    localStorage.setItem('rt:dns-lookup:history', '[{"domain":"example.com"}]');

    render(<StorageManager />);

    expect(await screen.findByText('Pinned and recent tools')).toBeTruthy();
    expect(screen.getByText('rt:shell:pinned · rt:shell:recent')).toBeTruthy();
    expect(screen.getByText(/across 1 tool and the index/)).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', { name: 'Clear saved data for Pinned and recent tools' })
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(localStorage.getItem('rt:shell:pinned')).toBeNull());
    expect(localStorage.getItem('rt:shell:recent')).toBeNull();
    expect(localStorage.getItem('rt:dns-lookup:history')).not.toBeNull();
  });

  it('clears the index memory with everything else', async () => {
    localStorage.setItem('rt:shell:recent', '["base64"]');
    localStorage.setItem('vite-ui-theme', 'dark');

    render(<StorageManager />);

    expect(await screen.findByText(/across the index/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Clear all tool data' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(localStorage.getItem('rt:shell:recent')).toBeNull());
    expect(localStorage.getItem('vite-ui-theme')).toBe('dark');
    expect(await screen.findByText('Nothing stored')).toBeTruthy();
  });
});
