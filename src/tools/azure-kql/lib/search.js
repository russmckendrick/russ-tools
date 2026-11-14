import { allScenarios } from './catalog.js';

const INDEX = allScenarios().map(({ service, scenario }, order) => ({
  service,
  scenario,
  order,
  name: `${service.name} ${scenario.name}`.toLowerCase(),
  text: `${service.name} ${service.group} ${scenario.name} ${scenario.table} ${scenario.description}`.toLowerCase(),
}));

export const SCENARIO_COUNT = INDEX.length;

function score(entry, words) {
  let total = 0;
  for (const word of words) {
    if (entry.scenario.name.toLowerCase().startsWith(word)) total += 4;
    if (entry.name.includes(word)) total += 3;
    if (entry.scenario.table.toLowerCase().includes(word)) total += 1;
  }
  return total;
}

export function searchScenarios(query) {
  const words = String(query ?? '').toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return INDEX;
  return INDEX.filter((entry) => words.every((word) => entry.text.includes(word)))
    .map((entry) => ({ entry, score: score(entry, words) }))
    .sort((a, b) => b.score - a.score || a.entry.order - b.entry.order)
    .map(({ entry }) => entry);
}
