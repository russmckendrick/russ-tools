// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { createHash, createHmac } from 'node:crypto';
import React from 'react';
import { render, screen, waitFor, cleanup, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import HashTool from '../island.jsx';

afterEach(cleanup);

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="hash" element={<HashTool />} />
        <Route path="hash/:input" element={<HashTool />} />
      </Routes>
    </MemoryRouter>
  );
}

const sha256 = (text) => createHash('sha256').update(text).digest('hex');

describe('hash island', () => {
  it('opens on the digests of the empty string, so the page is never blank', async () => {
    renderAt('/hash');
    await waitFor(() => expect(screen.getByText(sha256(''))).toBeTruthy());
    expect(screen.getByText('d41d8cd98f00b204e9800998ecf8427e')).toBeTruthy();
  });

  it('labels MD5, and only MD5, as not for security', async () => {
    renderAt('/hash');
    await waitFor(() => expect(screen.getByRole('region', { name: 'MD5' })).toBeTruthy());
    expect(screen.getAllByText('Not for security')).toHaveLength(1);
    expect(within(screen.getByRole('region', { name: 'MD5' })).getByText('Not for security')).toBeTruthy();
  });

  it('hashes the text of a /hash/:input deep link exactly, spaces and percent signs included', async () => {
    renderAt('/hash/hello%20world%20100%25');
    await waitFor(() => expect(screen.getByText(sha256('hello world 100%'))).toBeTruthy());
    expect(screen.getByLabelText('Text').value).toBe('hello world 100%');
  });

  it('updates as the text changes, with no button to press', async () => {
    renderAt('/hash');
    fireEvent.change(screen.getByLabelText('Text'), { target: { value: 'abc' } });
    await waitFor(() => expect(screen.getByText(sha256('abc'))).toBeTruthy());
    expect(screen.queryByRole('button', { name: /^hash$/i })).toBeNull();
  });

  it('switches every digest to HMAC when a key is entered', async () => {
    renderAt('/hash/abc');
    fireEvent.change(screen.getByLabelText('HMAC key (optional)'), { target: { value: 'secret' } });
    const expected = createHmac('sha256', 'secret').update('abc').digest('hex');
    await waitFor(() => expect(screen.getByText(expected)).toBeTruthy());
    expect(screen.getByRole('heading', { name: 'HMAC digests' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'HMAC-SHA-256' })).toBeTruthy();
  });

  it('says which digest a pasted value matches, and says when none does', async () => {
    renderAt('/hash/abc');
    await waitFor(() => expect(screen.getByText(sha256('abc'))).toBeTruthy());

    const compare = screen.getByLabelText('Compare against');
    fireEvent.change(compare, { target: { value: sha256('abc').toUpperCase() } });
    await waitFor(() => expect(screen.getByText(/Match: it is the SHA-256 digest, in hex\./)).toBeTruthy());
    expect(screen.getByRole('region', { name: 'SHA-256' }).hasAttribute('data-matched')).toBe(true);

    fireEvent.change(compare, { target: { value: sha256('abd') } });
    await waitFor(() => expect(screen.getByText(/No match\./)).toBeTruthy());
    expect(screen.getByRole('region', { name: 'SHA-256' }).hasAttribute('data-matched')).toBe(false);
  });
});
