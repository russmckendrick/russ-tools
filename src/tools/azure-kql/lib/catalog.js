import { APPS } from './catalog/apps.js';
import { COMPUTE } from './catalog/compute.js';
import { DATA } from './catalog/data.js';
import { EDGE } from './catalog/edge.js';
import { IDENTITY } from './catalog/identity.js';
import { M365 } from './catalog/m365.js';
import { MACHINES } from './catalog/machines.js';
import { NETWORK } from './catalog/network.js';
import { PLATFORM } from './catalog/platform.js';
import { SECURITY } from './catalog/security.js';

export const GROUPS = ['Network', 'Identity', 'Security', 'Microsoft 365', 'Platform', 'Data', 'Compute', 'Applications'];

const ALL = [...NETWORK, ...EDGE, ...IDENTITY, ...SECURITY, ...M365, ...PLATFORM, ...DATA, ...COMPUTE, ...MACHINES, ...APPS];

export const SERVICES = GROUPS.flatMap((group) => ALL.filter((service) => service.group === group));

export const DEFAULT_LIMIT = { rows: '100', top: '20', series: '' };

export function findService(id) {
  return SERVICES.find((service) => service.id === id) ?? null;
}

export function findScenario(serviceId, scenarioId) {
  return findService(serviceId)?.scenarios.find((scenario) => scenario.id === scenarioId) ?? null;
}

export function servicesByGroup() {
  return GROUPS.map((group) => ({ group, services: SERVICES.filter((service) => service.group === group) }));
}

export function allScenarios() {
  return SERVICES.flatMap((service) => service.scenarios.map((scenario) => ({ service, scenario })));
}
