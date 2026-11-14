import { COMPUTE } from './catalog/compute.js';
import { IDENTITY } from './catalog/identity.js';
import { NETWORK } from './catalog/network.js';
import { PLATFORM } from './catalog/platform.js';

export const SERVICES = [...NETWORK, ...IDENTITY, ...PLATFORM, ...COMPUTE];
export const GROUPS = ['Network', 'Identity', 'Platform', 'Compute'];

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
