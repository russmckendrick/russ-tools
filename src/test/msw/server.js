import { setupServer } from 'msw/node';
import { workerHandlers } from './handlers.js';

/**
 * One shared MSW server for Vitest. A test file opts in:
 *
 *   import { server } from '@/test/msw/server';
 *   beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
 *   afterEach(() => server.resetHandlers());
 *   afterAll(() => server.close());
 *
 * `onUnhandledRequest: 'error'` is deliberate — a lookup-tool test that
 * touches a URL no handler covers is a test about to depend on the network.
 */
export const server = setupServer(...workerHandlers);
