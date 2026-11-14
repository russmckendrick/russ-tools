// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { createLibrary } from './library.js';
import { initialState, nameFor } from './session.js';
import { shareUrl } from './share.js';
import { EMPTY_STATE, scenarioState } from './state.js';

const EMPTY_LIBRARY = { version: 1, saved: [], recent: [] };
const start = (params, search = '', library = EMPTY_LIBRARY) => initialState(params, search, createLibrary(), library);

beforeEach(() => localStorage.clear());

describe('where the page starts', () => {
  it('opens on a useful query the first time', () => {
    expect(start({})).toMatchObject({ mode: 'build', service: 'entra-sign-ins', scenario: 'failed' });
  });

  it('opens where you left off after that', () => {
    createLibrary().saveLast(scenarioState('key-vault', 'denied', EMPTY_STATE));
    expect(start({})).toMatchObject({ service: 'key-vault', scenario: 'denied' });
  });

  it('lets a deep link win over where you left off, and a share link win over both', () => {
    createLibrary().saveLast(scenarioState('key-vault', 'denied', EMPTY_STATE));
    expect(start({ service: 'azure-firewall' })).toMatchObject({ service: 'azure-firewall', scenario: 'basic' });
    expect(start({ service: 'azure-firewall', template: 'application' })).toMatchObject({ scenario: 'application' });
    const search = new URL(shareUrl(scenarioState('storage', 'anonymous', EMPTY_STATE), 'https://russ.tools')).search;
    expect(start({ service: 'azure-firewall' }, search)).toMatchObject({ service: 'storage', scenario: 'anonymous' });
  });

  it('falls back for a scenario or service it does not know', () => {
    expect(start({ service: 'azure-firewall', template: 'no-such' })).toMatchObject({ service: 'azure-firewall', scenario: 'basic' });
    expect(start({ service: 'no-such' })).toMatchObject({ service: 'entra-sign-ins' });
  });

  it('opens the saved query a legacy custom template id became', () => {
    const library = { ...EMPTY_LIBRARY, saved: [{ id: 'custom-9', kind: 'kql', kql: 'T | take 1', name: 'Mine' }] };
    expect(start({ service: 'azure-firewall', template: 'custom-9' }, '', library)).toMatchObject({ mode: 'kql', kql: 'T | take 1' });
  });
});

describe('nameFor', () => {
  it('names a built query after its scenario and a written one after its first line', () => {
    expect(nameFor(scenarioState('storage', 'anonymous', EMPTY_STATE), '')).toBe('Storage: Anonymous access');
    expect(nameFor({ ...EMPTY_STATE, mode: 'kql' }, '\n  Heartbeat\n| take 1')).toBe('Heartbeat');
    expect(nameFor({ ...EMPTY_STATE, mode: 'kql' }, '')).toBe('KQL query');
  });
});
