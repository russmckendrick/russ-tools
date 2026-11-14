import { describe, expect, it } from 'vitest';
import data from '../../../data/microsoft/entra-ids.json';
import {
  KINDS,
  buildEntries,
  classifyQuery,
  countByKind,
  describeMatch,
  searchEntries,
  toPlain,
} from './entraIds.js';

const GRAPH = '00000003-0000-0000-c000-000000000000';
const USER_READ = 'e1fe6dd8-ba31-4d61-89e7-88639da4683d';
const DIRECTORY_READ_APP = '7ab1d382-f21e-4acd-a863-ba3e13f7da61';
const DIRECTORY_READ_DELEGATED = '06da0dbc-49e2-44d2-8312-53f166ab848a';
const GLOBAL_ADMIN = '62e90394-69f5-4237-9190-012177145e10';

const FIXTURE = {
  sources: { docs: { title: 'Docs', url: 'https://example.test/docs' } },
  applications: [
    { id: GRAPH, name: 'Microsoft Graph', aliases: [], sources: ['docs'] },
    { id: 'c44b4083-3bb0-49c1-b47d-974e53cbdf3c', name: 'Azure Portal', aliases: ['Microsoft Entra admin center'], sources: ['docs'] },
  ],
  permissions: [
    {
      name: 'User.Read',
      application: null,
      delegated: {
        id: USER_READ,
        displayText: 'Sign in and read user profile',
        description: 'Allows users to sign-in to the app.',
        adminConsentRequired: false,
      },
    },
    {
      name: 'Directory.Read.All',
      application: {
        id: DIRECTORY_READ_APP,
        displayText: 'Read directory data',
        description: 'Allows the app to read data in the directory, without a signed-in user.',
        adminConsentRequired: true,
      },
      delegated: {
        id: DIRECTORY_READ_DELEGATED,
        displayText: 'Read directory data',
        description: 'Allows the app to read data in the directory.',
        adminConsentRequired: true,
      },
    },
    {
      name: 'Member.Read.Group',
      resourceSpecific: {
        id: '0a8ce3c7-89dd-46cf-b2c3-5ef0064437a8',
        displayText: "Read this group's members",
        description: "Allows the app to read the members of this group, without a signed-in user.",
      },
    },
  ],
  roles: [
    { id: GLOBAL_ADMIN, name: 'Global Administrator', description: 'Can manage all aspects of Microsoft Entra ID.', privileged: true },
    { id: '88d8e3e3-8f55-4a1e-953a-9b9898b8876b', name: 'Directory Readers', description: 'Can read basic directory information.', privileged: false },
  ],
  errors: [
    { code: 'AADSTS50076', name: 'UserStrongAuthClientAuthNRequired', description: 'The user must use multifactor authentication.' },
    { code: 'AADSTS500761', name: null, description: 'A made-up neighbour for the prefix test.' },
    { code: 'AADSTS700016', name: 'UnauthorizedClient_DoesNotMatchRequest', description: 'The application was not found in the directory.' },
  ],
};

const entries = buildEntries(FIXTURE);
const titles = (matches) => matches.map((match) => match.entry.title);

describe('classifyQuery', () => {
  it('tells the query shapes apart', () => {
    expect(classifyQuery('')).toEqual({ type: 'empty' });
    expect(classifyQuery(`{${GRAPH.toUpperCase()}}`)).toEqual({ type: 'guid', guid: GRAPH });
    expect(classifyQuery('00000003-0000')).toEqual({ type: 'guidPrefix', prefix: '00000003-0000' });
    expect(classifyQuery('AADSTS50076')).toEqual({ type: 'errorCode', digits: '50076' });
    expect(classifyQuery('aadsts 50076')).toEqual({ type: 'errorCode', digits: '50076' });
    expect(classifyQuery('50076')).toEqual({ type: 'errorCode', digits: '50076' });
    expect(classifyQuery('User.Read')).toEqual({ type: 'text', words: ['user.read'] });
  });

  it('does not mistake a short number or a hex-looking word for an id', () => {
    expect(classifyQuery('365').type).toBe('text');
    expect(classifyQuery('2016').type).toBe('text');
    expect(classifyQuery('facade').type).toBe('text');
    expect(classifyQuery('deadbeef').type).toBe('guidPrefix');
  });
});

describe('searchEntries by GUID', () => {
  it('identifies an application id', () => {
    const [match, ...rest] = searchEntries(entries, GRAPH);
    expect(rest).toEqual([]);
    expect(match.entry.kind).toBe('application');
    expect(describeMatch(match)).toBe('Application (client) ID of Microsoft Graph');
  });

  it('says which side of a permission an id belongs to', () => {
    const [delegated] = searchEntries(entries, DIRECTORY_READ_DELEGATED);
    expect(delegated.side).toBe('delegated');
    expect(describeMatch(delegated)).toBe('Delegated scope ID of the Microsoft Graph permission Directory.Read.All');

    const [application] = searchEntries(entries, DIRECTORY_READ_APP);
    expect(application.side).toBe('application');
    expect(describeMatch(application)).toBe('Application role ID of the Microsoft Graph permission Directory.Read.All');
  });

  it('identifies a role template id and a resource-specific permission', () => {
    expect(describeMatch(searchEntries(entries, GLOBAL_ADMIN)[0])).toBe(
      'Role template ID of the Global Administrator directory role'
    );
    expect(describeMatch(searchEntries(entries, '0a8ce3c7-89dd-46cf-b2c3-5ef0064437a8')[0])).toBe(
      'Resource-specific consent ID of the Microsoft Graph permission Member.Read.Group'
    );
  });

  it('returns nothing for a GUID it does not hold, rather than a near miss', () => {
    expect(searchEntries(entries, 'b24988ac-6180-42a0-ab88-20f7382dd24c')).toEqual([]);
  });

  it('matches the start of a GUID', () => {
    expect(titles(searchEntries(entries, '62e90394'))).toEqual(['Global Administrator']);
  });

  it('honours the kind filter', () => {
    expect(searchEntries(entries, GRAPH, { kind: 'role' })).toEqual([]);
  });
});

describe('searchEntries by name, code and text', () => {
  it('puts an exact name first, then names that start with it, then the rest', () => {
    // Two names start with it; the error only mentions it in its description.
    expect(titles(searchEntries(entries, 'directory'))).toEqual([
      'Directory.Read.All',
      'Directory Readers',
      'AADSTS700016',
    ]);
    expect(titles(searchEntries(entries, 'user.read'))[0]).toBe('User.Read');
    expect(titles(searchEntries(entries, 'global administrator'))).toEqual(['Global Administrator']);
  });

  it('puts the shorter of two equally good names first', () => {
    const real = buildEntries(data);
    expect(titles(searchEntries(real, 'mail read', { kind: 'permission' }))[0]).toBe('Mail.Read');
    expect(titles(searchEntries(real, 'user.read'))[0]).toBe('User.Read');
  });

  it('finds an application by an alias', () => {
    expect(titles(searchEntries(entries, 'entra admin center'))).toEqual(['Azure Portal']);
  });

  it('finds an error by code with or without the prefix, exact before longer codes', () => {
    expect(titles(searchEntries(entries, 'AADSTS50076'))).toEqual(['AADSTS50076', 'AADSTS500761']);
    expect(titles(searchEntries(entries, '50076'))).toEqual(['AADSTS50076', 'AADSTS500761']);
    expect(titles(searchEntries(entries, '700016'))).toEqual(['AADSTS700016']);
  });

  it('finds an error by its name and by its description', () => {
    expect(titles(searchEntries(entries, 'UserStrongAuthClientAuthNRequired'))).toEqual(['AADSTS50076']);
    expect(titles(searchEntries(entries, 'multifactor'))).toEqual(['AADSTS50076']);
  });

  it('requires every word', () => {
    expect(searchEntries(entries, 'directory nonsense')).toEqual([]);
  });

  it('returns every entry, in kind order, when nothing is typed', () => {
    const all = searchEntries(entries, '');
    expect(all).toHaveLength(entries.length);
    expect(all[0].matched).toBe('browse');
    expect([...new Set(all.map((match) => match.entry.kind))]).toEqual([...KINDS]);
    expect(searchEntries(entries, '', { kind: 'role' })).toHaveLength(2);
  });
});

describe('countByKind and toPlain', () => {
  it('counts each kind', () => {
    expect(countByKind(entries)).toEqual({ application: 2, permission: 3, role: 2, error: 3 });
  });

  it('flattens a match for an agent, with the matched side and source links', () => {
    expect(toPlain(searchEntries(entries, GRAPH)[0], FIXTURE.sources)).toEqual({
      kind: 'application',
      is: 'Application (client) ID of Microsoft Graph',
      name: 'Microsoft Graph',
      appId: GRAPH,
      alsoListedAs: [],
      listedIn: ['https://example.test/docs'],
    });
    const permission = toPlain(searchEntries(entries, USER_READ)[0]);
    expect(permission.matchedSide).toBe('delegated');
    expect(permission.delegated.adminConsentRequired).toBe(false);
    expect(permission).not.toHaveProperty('application');
    expect(toPlain(searchEntries(entries, GLOBAL_ADMIN)[0])).toMatchObject({ roleTemplateId: GLOBAL_ADMIN, privileged: true });
    expect(toPlain(searchEntries(entries, 'AADSTS50076')[0])).toMatchObject({
      code: 'AADSTS50076',
      errorName: 'UserStrongAuthClientAuthNRequired',
    });
  });
});

describe('the checked-in snapshot', () => {
  const real = buildEntries(data);

  it('has all four kinds in useful numbers', () => {
    const counts = countByKind(real);
    expect(data.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(counts.application).toBeGreaterThan(100);
    expect(counts.permission).toBeGreaterThan(500);
    expect(counts.role).toBeGreaterThan(50);
    expect(counts.error).toBeGreaterThan(200);
  });

  it('names a source page for every application', () => {
    for (const app of data.applications) {
      expect(app.sources.length, app.name).toBeGreaterThan(0);
      for (const key of app.sources) expect(data.sources[key]?.url, key).toMatch(/^https:\/\/learn\.microsoft\.com\//);
    }
  });

  it('identifies the identifiers people paste most', () => {
    expect(describeMatch(searchEntries(real, GRAPH)[0])).toBe('Application (client) ID of Microsoft Graph');
    expect(describeMatch(searchEntries(real, USER_READ)[0])).toBe(
      'Delegated scope ID of the Microsoft Graph permission User.Read'
    );
    expect(describeMatch(searchEntries(real, GLOBAL_ADMIN)[0])).toBe(
      'Role template ID of the Global Administrator directory role'
    );
    expect(searchEntries(real, 'AADSTS50076')[0].entry.record.name).toBe('UserStrongAuthClientAuthNRequired');
  });

  it('gives every Graph permission at least one id and a description', () => {
    for (const permission of data.permissions) {
      const sides = [permission.application, permission.delegated, permission.resourceSpecific].filter(Boolean);
      expect(sides.length, permission.name).toBeGreaterThan(0);
      for (const side of sides) expect(side.id, permission.name).toMatch(/^[0-9a-f-]{36}$/);
    }
  });
});
