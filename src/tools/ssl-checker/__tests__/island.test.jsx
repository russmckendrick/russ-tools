// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import SslCheckerTool from '../island.jsx';

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
        <Route path="ssl-checker" element={<SslCheckerTool />} />
        <Route path="ssl-checker/:domain" element={<SslCheckerTool />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ssl island', () => {
  it('deep link renders a completed assessment from the live fixture', async () => {
    renderAt('/ssl-checker/russ.tools');

    await waitFor(
      () => {
        expect(JSON.parse(localStorage.getItem('rt:ssl-checker:history'))?.[0]).toBeDefined();
      },
      { timeout: 4000 }
    );

    const entry = JSON.parse(localStorage.getItem('rt:ssl-checker:history'))[0];
    expect(entry).toMatchObject({ domain: 'russ.tools', grade: 'A' });
  });

  it('an unreachable analysis service yields the honest connectivity state, fabricating nothing', async () => {
    // Worker down; the browser probe (fetch no-cors) is intercepted to succeed.
    server.use(
      http.get('https://ssl.russ.tools/', () => HttpResponse.error()),
      http.head('https://unreachable.example', () => new HttpResponse(null, { status: 200 }))
    );

    renderAt('/ssl-checker/unreachable.example');

    await waitFor(
      () => {
        expect(screen.getByText(/analysis unavailable — https connectivity verified/i)).toBeDefined();
      },
      { timeout: 4000 }
    );

    // The old fallback invented these; none may appear.
    expect(screen.queryByText(/Browser Verified Certificate Authority/i)).toBe(null);
    expect(screen.queryByText(/^B$/)).toBe(null);

    // And an unverifiable check is never cached as an assessment.
    const cache = JSON.parse(localStorage.getItem('rt:ssl-checker:cache') || '{}');
    expect(Object.keys(cache)).toEqual([]);
  });
});
