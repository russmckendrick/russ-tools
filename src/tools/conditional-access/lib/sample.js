/**
 * A sample export, so the page is not a blank box.
 *
 * Shaped exactly like a Microsoft Graph response, with realistic GUIDs: the
 * Global Administrator role template, Office 365 Exchange Online, Microsoft
 * Graph. Group and user ids are obviously fake — the point is to show how a
 * policy reads, and a fabricated tenant id that looked real would be worse
 * than one that plainly does not.
 *
 * Deliberately imperfect. Two of the three policies are fine; the third is
 * report-only and there is no legacy-authentication block, so the gap
 * checklist has something true to say. A sample that passed every check would
 * teach the reader nothing about what the checks are for.
 */
export const SAMPLE = {
  '@odata.context':
    'https://graph.microsoft.com/v1.0/$metadata#identity/conditionalAccess/policies',
  value: [
    {
      id: '8f7b1a2c-0000-4000-8000-11111111aaaa',
      displayName: 'Require MFA for administrators',
      createdDateTime: '2026-02-11T09:14:02Z',
      state: 'enabled',
      conditions: {
        clientAppTypes: ['all'],
        users: {
          includeRoles: [
            '62e90394-69f5-4237-9190-012177145e10',
            '194ae4cb-b126-40b2-bd5b-6091b380977d',
          ],
          excludeUsers: ['00000000-dead-beef-0000-emergencyacct'],
        },
        applications: { includeApplications: ['All'] },
      },
      grantControls: {
        operator: 'OR',
        builtInControls: [],
        authenticationStrength: { displayName: 'Phishing-resistant MFA' },
      },
    },
    {
      id: '8f7b1a2c-0000-4000-8000-22222222bbbb',
      displayName: 'Require compliant device for Exchange and Graph',
      createdDateTime: '2026-03-02T16:40:55Z',
      state: 'enabled',
      conditions: {
        clientAppTypes: ['browser', 'mobileAppsAndDesktopClients'],
        users: {
          includeUsers: ['All'],
          excludeUsers: ['00000000-dead-beef-0000-emergencyacct'],
          excludeGroups: ['11111111-2222-3333-4444-contractorsgrp'],
        },
        applications: {
          includeApplications: [
            '00000002-0000-0ff1-ce00-000000000000',
            '00000003-0000-0000-c000-000000000000',
          ],
        },
        platforms: { includePlatforms: ['all'], excludePlatforms: ['linux'] },
      },
      grantControls: { operator: 'AND', builtInControls: ['mfa', 'compliantDevice'] },
      sessionControls: {
        signInFrequency: { isEnabled: true, type: 'hours', value: 12 },
        persistentBrowser: { isEnabled: true, mode: 'never' },
      },
    },
    {
      id: '8f7b1a2c-0000-4000-8000-33333333cccc',
      displayName: 'Block access from unapproved countries',
      createdDateTime: '2026-05-19T11:02:31Z',
      state: 'enabledForReportingButNotEnforced',
      conditions: {
        clientAppTypes: ['all'],
        users: { includeUsers: ['All'] },
        applications: { includeApplications: ['All'] },
        locations: {
          includeLocations: ['All'],
          excludeLocations: ['AllTrusted', 'c0ffee00-1111-2222-3333-approvedregion'],
        },
      },
      grantControls: { operator: 'OR', builtInControls: ['block'] },
    },
  ],
};
