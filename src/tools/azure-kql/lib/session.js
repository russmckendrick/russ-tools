import { findScenario, findService } from './catalog.js';
import { openEntry } from './library.js';
import { readShare } from './share.js';
import { DEFAULT_STATE, EMPTY_STATE, scenarioState } from './state.js';

export function initialState(params, search, store, library) {
  const shared = readShare(search);
  if (shared) return shared;
  if (findService(params.service)) {
    const saved = params.template && !findScenario(params.service, params.template) && library.saved.find((entry) => entry.id === params.template);
    return saved ? openEntry(saved) : scenarioState(params.service, params.template, EMPTY_STATE);
  }
  return store.loadLast() ?? DEFAULT_STATE;
}

export function nameFor(state, kql) {
  const scenario = findScenario(state.service, state.scenario);
  if (state.mode === 'build' && scenario) return `${findService(state.service).name}: ${scenario.name}`;
  return kql.split('\n').find((line) => line.trim())?.trim().slice(0, 60) || 'KQL query';
}
