// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import UrlTool from '../island.jsx';

afterEach(() => {
  cleanup();
  window.location.hash = '';
});

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="url" element={<UrlTool />} />
        <Route path="url/:input" element={<UrlTool />} />
      </Routes>
    </MemoryRouter>
  );
}

const field = () => screen.getByLabelText('URL');

describe('url island', () => {
  it('opens with a ghost of the parts and nothing to check', () => {
    renderAt('/url');
    expect(field().value).toBe('');
    expect(screen.getByText(/Paste a URL to split it into its parts/)).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Checks' })).toBeNull();
    expect(document.querySelector('.rt-ghosted')).toBeTruthy();
  });

  it('reads a /url/:input deep link into decoded parts', () => {
    renderAt(`/url/${encodeURIComponent('https://example.com:8443/a%20b?q=one+two&x=%2F#top')}`);
    expect(field().value).toBe('https://example.com:8443/a%20b?q=one+two&x=%2F#top');
    expect(screen.getByLabelText('Scheme').value).toBe('https');
    expect(screen.getByLabelText('Host').value).toBe('example.com');
    expect(screen.getByLabelText('Port').value).toBe('8443');
    expect(screen.getByLabelText('Path').value).toBe('/a b');
    expect(screen.getByLabelText('Value of parameter 1').value).toBe('one two');
    expect(screen.getByLabelText('Value of parameter 2').value).toBe('/');
    expect(screen.getByLabelText('Fragment').value).toBe('top');
    expect(screen.getByText('Valid https URL, 2 query parameters, a fragment.')).toBeTruthy();
  });

  it('reads a URL from the fragment, where the paste panel puts it', () => {
    window.location.hash = `#url=${encodeURIComponent('https://example.com/cb?code=abc')}`;
    renderAt('/url');
    expect(field().value).toBe('https://example.com/cb?code=abc');
    expect(screen.getByText('One parameter is named like a secret')).toBeTruthy();
  });

  it('rebuilds the URL as a part is edited, touching only that part', () => {
    renderAt('/url');
    fireEvent.change(field(), { target: { value: 'https://example.com/a%2Fb?keep=%2Fx&q=old' } });
    fireEvent.change(screen.getByLabelText('Value of parameter 2'), { target: { value: 'new value&more' } });
    expect(field().value).toBe('https://example.com/a%2Fb?keep=%2Fx&q=new%20value%26more');
    fireEvent.change(screen.getByLabelText('Host'), { target: { value: 'api.example.org' } });
    expect(field().value).toBe('https://api.example.org/a%2Fb?keep=%2Fx&q=new%20value%26more');
  });

  it('adds and removes query parameters', () => {
    renderAt('/url');
    fireEvent.change(field(), { target: { value: 'https://example.com/' } });
    expect(screen.getByText('This URL has no query string.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Add parameter' }));
    fireEvent.change(screen.getByLabelText('Name of parameter 1'), { target: { value: 'page' } });
    fireEvent.change(screen.getByLabelText('Value of parameter 1'), { target: { value: '2' } });
    expect(field().value).toBe('https://example.com/?page=2');
    fireEvent.click(screen.getByRole('button', { name: 'Remove parameter 1' }));
    expect(field().value).toBe('https://example.com/');
  });

  it('flags credentials, secret-looking names and double-encoding', () => {
    renderAt('/url');
    fireEvent.change(field(), {
      target: { value: 'http://admin:hunter2@example.com/login?api_key=abc&next=%252Fhome' },
    });
    const checks = screen.getByRole('heading', { name: 'Checks' }).closest('div').parentElement;
    expect(within(checks).getByText('A user name and password are in the URL')).toBeTruthy();
    expect(within(checks).getByText('One parameter is named like a secret')).toBeTruthy();
    expect(within(checks).getByText(/flagged by name only/)).toBeTruthy();
    expect(within(checks).getByText('Sent over plain http')).toBeTruthy();
    expect(within(checks).getByText('Looks double-encoded')).toBeTruthy();
    expect(screen.getByLabelText('User name').value).toBe('admin');
  });

  it('says a clean URL has nothing commonly wrong, without calling it safe', () => {
    renderAt('/url');
    fireEvent.change(field(), { target: { value: 'https://example.com/docs?page=2' } });
    expect(screen.getByText('Nothing commonly wrong was found.')).toBeTruthy();
    expect(screen.getByText(/do not say where it leads or whether it is safe to open/)).toBeTruthy();
  });

  it('explains a missing scheme and offers to add one', () => {
    renderAt('/url');
    fireEvent.change(field(), { target: { value: 'example.com/path?a=1' } });
    expect(screen.getByText(/No scheme/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Read it with https://' }));
    expect(field().value).toBe('https://example.com/path?a=1');
    expect(screen.getByLabelText('Path').value).toBe('/path');
  });

  it('shows the punycode form of an internationalised host', () => {
    renderAt('/url');
    fireEvent.change(field(), { target: { value: 'https://münchen.de/straße' } });
    expect(screen.getAllByText('xn--mnchen-3ya.de').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('https://xn--mnchen-3ya.de/stra%C3%9Fe')).toBeTruthy();
  });

  it('opens text that is not a URL in the encode tab', () => {
    renderAt(`/url/${encodeURIComponent('a b&c')}`);
    expect(screen.getByRole('tab', { name: 'Encode and decode' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByLabelText('Text').value).toBe('a b&c');
    expect(screen.getByText('a%20b%26c')).toBeTruthy();
    expect(screen.getByText('a+b%26c')).toBeTruthy();
    expect(screen.getByText('a%20b&c')).toBeTruthy();
  });

  it('decodes as it encodes, and converts a hostname typed as text', () => {
    renderAt(`/url/${encodeURIComponent('caf%C3%A9+au+lait')}`);
    expect(screen.getAllByText('café+au+lait').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('café au lait')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Text'), { target: { value: 'bücher.example' } });
    expect(screen.getByRole('heading', { name: 'Hostname' })).toBeTruthy();
    expect(screen.getByText('xn--bcher-kva.example')).toBeTruthy();
  });
});
