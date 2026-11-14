// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { buildQuery } from './build.js';
import CAPTURED from './fixtures/captured-2026-11-14.json';
import { MAX_RECENT, createLibrary, entryFor, openEntry, renamed, withRecent, withSaved, withoutRecent, withoutSaved } from './library.js';
import { EMPTY_STATE, scenarioState } from './state.js';

const OLD_STORE = 'rt:azure-kql:store';
const OLD_TEMPLATES = 'rt:azure-kql:custom-templates';
const LEGACY_TEMPLATES = 'azure-kql-custom-templates';
const NEW = 'rt:azure-kql:library';

const template = { id: 'custom-9', name: 'Denied by collection', service: 'azure-firewall', table: 'AZFWNetworkRule', aggregation: '| summarize count() by RuleCollection', projection: [], defaultLimit: 50, fields: [] };

beforeEach(() => localStorage.clear());

describe('first load after the rebuild', () => {
  it('reads the old store and templates into the new slot and leaves the old keys alone', () => {
    localStorage.setItem(OLD_STORE, CAPTURED.store);
    localStorage.setItem(LEGACY_TEMPLATES, JSON.stringify([template]));

    const library = createLibrary().load();

    expect(library.saved.map((entry) => entry.name)).toEqual(['Azure Firewall: Network rule log', 'Denied by collection']);
    expect(library.recent).toHaveLength(1);
    expect(localStorage.getItem(OLD_STORE)).toBe(CAPTURED.store);
    expect(JSON.parse(localStorage.getItem(LEGACY_TEMPLATES))).toEqual([template]);
    expect(JSON.parse(localStorage.getItem(NEW)).saved).toHaveLength(2);
  });

  it('reads templates the old port had already copied forward', () => {
    localStorage.setItem(OLD_TEMPLATES, JSON.stringify([template]));
    expect(createLibrary().load().saved[0]).toMatchObject({ id: 'custom-9', kind: 'kql' });
  });

  it('opens the migrated favourite back into the builder', () => {
    localStorage.setItem(OLD_STORE, CAPTURED.store);
    const state = openEntry(createLibrary().load().saved[0]);
    expect(state).toMatchObject({ mode: 'build', service: 'azure-firewall', scenario: 'basic', limit: '1000' });
    expect(buildQuery(state).kql).toContain('| where ipv4_is_in_range(SourceIp, "10.0.0.0/8")');
  });

  it('migrates once: later changes to the old keys do not come back', () => {
    localStorage.setItem(OLD_STORE, CAPTURED.store);
    const library = createLibrary();
    library.persist(withoutSaved(library.load(), '1794654379169'));
    expect(library.load().saved).toEqual([]);
  });

  it('writes nothing when there is nothing to migrate', () => {
    expect(createLibrary().load()).toEqual({ version: 1, saved: [], recent: [] });
    expect(localStorage.getItem(NEW)).toBe(null);
  });

  it('survives a store that is not what it should be', () => {
    localStorage.setItem(OLD_STORE, '{"state":{"favorites":"x","queryHistory":[1,{"query":5}]}}');
    localStorage.setItem(LEGACY_TEMPLATES, '"nope"');
    expect(createLibrary().load()).toEqual({ version: 1, saved: [], recent: [] });
  });
});

describe('the library', () => {
  const state = scenarioState('azure-firewall', 'denied', EMPTY_STATE);
  const entry = () => entryFor(state, buildQuery(state).kql, 'Denied flows');

  it('round-trips a built query through storage', () => {
    const library = createLibrary();
    library.persist(withSaved(library.load(), entry()));
    const [saved] = createLibrary().load().saved;
    expect(saved).toMatchObject({ name: 'Denied flows', kind: 'build' });
    expect(buildQuery(openEntry(saved)).kql).toBe(buildQuery(state).kql);
  });

  it('round-trips a hand-written query', () => {
    const raw = { ...EMPTY_STATE, mode: 'kql', kql: 'Heartbeat\n| take 5' };
    const library = createLibrary();
    library.persist(withSaved(library.load(), entryFor(raw, raw.kql, 'Five heartbeats')));
    expect(openEntry(createLibrary().load().saved[0])).toMatchObject({ mode: 'kql', kql: 'Heartbeat\n| take 5' });
  });

  it('renames without losing the entry, and refuses a blank name', () => {
    const first = entry();
    const library = withSaved({ version: 1, saved: [], recent: [] }, first);
    expect(renamed(library, first.id, '  Prod denies  ').saved).toEqual([{ ...first, name: 'Prod denies' }]);
    expect(renamed(library, first.id, '   ')).toBe(library);
  });

  it('keeps one recent entry per query, newest first, and caps the list', () => {
    let library = { version: 1, saved: [], recent: [] };
    for (let i = 0; i < MAX_RECENT + 5; i++) library = withRecent(library, { ...entry(), kql: `T | take ${i}` });
    library = withRecent(library, { ...entry(), kql: 'T | take 10' });
    expect(library.recent).toHaveLength(MAX_RECENT);
    expect(library.recent[0].kql).toBe('T | take 10');
    expect(library.recent.filter((item) => item.kql === 'T | take 10')).toHaveLength(1);
    expect(withoutRecent(library).recent).toEqual([]);
  });

  it('opens a built entry whose scenario has gone as its saved KQL', () => {
    expect(openEntry({ kind: 'build', state: { service: 'retired', scenario: 'x' }, kql: 'Old | take 1' })).toMatchObject({ mode: 'kql', kql: 'Old | take 1' });
  });
});

describe('where you left off', () => {
  it('remembers the last state and gives nothing back when there is none', () => {
    const library = createLibrary();
    expect(library.loadLast()).toBe(null);
    const state = { ...scenarioState('key-vault', 'denied', EMPTY_STATE), group: { by: ['CallerIpAddress'], overTime: false } };
    library.saveLast(state);
    expect(buildQuery(createLibrary().loadLast()).kql).toBe(buildQuery(state).kql);
  });
});
