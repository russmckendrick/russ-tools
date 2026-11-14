// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { TOOLS } from '../tools/registry.mjs';
import { clearTool, toolStorageKeys } from '../core/storage.js';
import {
  PINNED_KEY,
  RECENT_KEY,
  RECENT_SHOWN,
  RECENT_STORED,
  SHELL_STORAGE,
  clearRecent,
  flipPin,
  noteVisit,
  parseIds,
  planStrip,
  recordVisit,
  renderStrip,
  stripBootSource,
  togglePin,
} from './yourTools.js';

function fakeStorage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    _dump: () => Object.fromEntries(map),
  };
}

const KNOWN = ['dns-lookup', 'jwt', 'base64', 'subnet-calculator'];

function stripFixture() {
  document.body.innerHTML = `
    <nav id="rt-mine" hidden>
      <div data-group="pinned" hidden><ul></ul></div>
      <div data-group="recent" hidden><ul></ul></div>
      <template>${KNOWN.map((id) => `<li data-tool="${id}"><a href="/${id}">${id}</a></li>`).join('')}</template>
    </nav>`;
  return document.getElementById('rt-mine');
}

const shown = (strip, group) =>
  [...strip.querySelectorAll(`[data-group="${group}"] li`)].map((li) => li.dataset.tool);

describe('the keys', () => {
  it('sit in the rt: namespace under a slot no tool can own', () => {
    expect(PINNED_KEY).toBe('rt:shell:pinned');
    expect(RECENT_KEY).toBe('rt:shell:recent');
    expect(toolStorageKeys(SHELL_STORAGE).sort()).toEqual([PINNED_KEY, RECENT_KEY]);

    expect(TOOLS.length).toBeGreaterThan(0);
    expect(TOOLS.map((tool) => tool.id)).not.toContain(SHELL_STORAGE.id);
  });

  it('are what the saved-data page clears', () => {
    const backend = fakeStorage({
      [PINNED_KEY]: '["jwt"]',
      [RECENT_KEY]: '["base64"]',
      'vite-ui-theme': 'dark',
    });
    clearTool(SHELL_STORAGE, { backend });
    expect(backend._dump()).toEqual({ 'vite-ui-theme': 'dark' });
  });
});

describe('parseIds', () => {
  it('reads a stored list', () => {
    expect(parseIds('["jwt","base64"]')).toEqual(['jwt', 'base64']);
  });

  it.each([
    ['nothing stored', null],
    ['an empty string', ''],
    ['broken JSON', '["jwt"'],
    ['an object', '{"jwt":true}'],
    ['a string', '"jwt"'],
    ['a number', '4'],
  ])('reads %s as an empty list', (_, raw) => {
    expect(parseIds(raw)).toEqual([]);
  });

  it('drops anything that is not a non-empty string, and repeats', () => {
    expect(parseIds('["jwt",4,null,"",{"id":"x"},"base64","jwt",["jwt"]]')).toEqual([
      'jwt',
      'base64',
    ]);
  });
});

describe('recordVisit', () => {
  it('puts the visit first', () => {
    expect(recordVisit(['jwt', 'base64'], 'dns-lookup')).toEqual(['dns-lookup', 'jwt', 'base64']);
  });

  it('moves a repeat visit to the front without duplicating it', () => {
    expect(recordVisit(['jwt', 'base64', 'dns-lookup'], 'base64')).toEqual([
      'base64',
      'jwt',
      'dns-lookup',
    ]);
  });

  it('caps the list, dropping the oldest', () => {
    const full = Array.from({ length: RECENT_STORED }, (_, i) => `tool-${i}`);
    const next = recordVisit(full, 'jwt');
    expect(next).toHaveLength(RECENT_STORED);
    expect(next[0]).toBe('jwt');
    expect(next).not.toContain(`tool-${RECENT_STORED - 1}`);
  });

  it('does not mutate the list it was given', () => {
    const recent = ['jwt'];
    recordVisit(recent, 'base64');
    expect(recent).toEqual(['jwt']);
  });
});

describe('togglePin', () => {
  it('pins at the end', () => {
    expect(togglePin(['jwt'], 'base64')).toEqual(['jwt', 'base64']);
  });

  it('unpins', () => {
    expect(togglePin(['jwt', 'base64'], 'jwt')).toEqual(['base64']);
  });

  it('reorders by unpinning and pinning again', () => {
    const pinned = ['jwt', 'base64', 'dns-lookup'];
    expect(togglePin(togglePin(pinned, 'jwt'), 'jwt')).toEqual(['base64', 'dns-lookup', 'jwt']);
  });
});

describe('planStrip', () => {
  it('lists pinned first and leaves a pinned tool out of recent', () => {
    expect(planStrip(['jwt'], ['base64', 'jwt', 'dns-lookup'], KNOWN, RECENT_SHOWN)).toEqual({
      pinned: ['jwt'],
      recent: ['base64', 'dns-lookup'],
    });
  });

  it('ignores an id the registry no longer has', () => {
    expect(
      planStrip(['network-designer', 'jwt'], ['retired-tool', 'base64'], KNOWN, RECENT_SHOWN)
    ).toEqual({ pinned: ['jwt'], recent: ['base64'] });
  });

  it('shows no more recents than the limit, counted after pins are removed', () => {
    const known = Array.from({ length: 12 }, (_, i) => `tool-${i}`);
    const plan = planStrip(['tool-0', 'tool-1'], known, known, 6);
    expect(plan.recent).toEqual(['tool-2', 'tool-3', 'tool-4', 'tool-5', 'tool-6', 'tool-7']);
  });
});

describe('the stored lists', () => {
  it('records visits most recent first', () => {
    const backend = fakeStorage();
    noteVisit('jwt', { backend });
    noteVisit('base64', { backend });
    noteVisit('jwt', { backend });
    expect(backend._dump()).toEqual({ [RECENT_KEY]: '["jwt","base64"]' });
  });

  it('records nothing without an id', () => {
    const backend = fakeStorage();
    noteVisit(undefined, { backend });
    noteVisit('', { backend });
    expect(backend._dump()).toEqual({});
  });

  it('replaces a corrupt list rather than throwing', () => {
    const backend = fakeStorage({ [RECENT_KEY]: '{not json' });
    noteVisit('jwt', { backend });
    expect(backend._dump()).toEqual({ [RECENT_KEY]: '["jwt"]' });
  });

  it('pins, reports the new state, and removes the key with the last pin', () => {
    const backend = fakeStorage();
    expect(flipPin('jwt', { backend })).toBe(true);
    expect(flipPin('base64', { backend })).toBe(true);
    expect(backend._dump()).toEqual({ [PINNED_KEY]: '["jwt","base64"]' });
    expect(flipPin('jwt', { backend })).toBe(false);
    expect(flipPin('base64', { backend })).toBe(false);
    expect(backend._dump()).toEqual({});
  });

  it('clears recents and leaves pins', () => {
    const backend = fakeStorage({ [PINNED_KEY]: '["jwt"]', [RECENT_KEY]: '["base64"]' });
    clearRecent({ backend });
    expect(backend._dump()).toEqual({ [PINNED_KEY]: '["jwt"]' });
  });

  it('survives a backend that throws', () => {
    const backend = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
      removeItem: () => {
        throw new Error('denied');
      },
    };
    expect(() => noteVisit('jwt', { backend })).not.toThrow();
    expect(flipPin('jwt', { backend })).toBe(true);
    expect(() => clearRecent({ backend })).not.toThrow();
  });
});

describe('renderStrip', () => {
  let strip;
  beforeEach(() => {
    strip = stripFixture();
  });

  it('leaves the strip hidden and empty with nothing stored', () => {
    const lists = renderStrip(strip, { backend: fakeStorage() });
    expect(lists).toEqual({ pinned: [], recent: [] });
    expect(strip.hidden).toBe(true);
    expect(strip.querySelectorAll('li')).toHaveLength(0);
  });

  it('shows pinned then recent, each as a link to the tool', () => {
    const backend = fakeStorage({
      [PINNED_KEY]: '["subnet-calculator"]',
      [RECENT_KEY]: '["jwt","subnet-calculator","base64"]',
    });
    renderStrip(strip, { backend });
    expect(strip.hidden).toBe(false);
    expect(shown(strip, 'pinned')).toEqual(['subnet-calculator']);
    expect(shown(strip, 'recent')).toEqual(['jwt', 'base64']);
    expect(strip.querySelector('[data-group="recent"] a').getAttribute('href')).toBe('/jwt');
  });

  it('hides a group that has nothing in it', () => {
    renderStrip(strip, { backend: fakeStorage({ [RECENT_KEY]: '["jwt"]' }) });
    expect(strip.querySelector('[data-group="pinned"]').hidden).toBe(true);
    expect(strip.querySelector('[data-group="recent"]').hidden).toBe(false);
  });

  it('stays hidden when every stored id has been retired', () => {
    const backend = fakeStorage({
      [PINNED_KEY]: '["network-designer"]',
      [RECENT_KEY]: '["network-designer"]',
    });
    renderStrip(strip, { backend });
    expect(strip.hidden).toBe(true);
    expect(strip.querySelectorAll('li')).toHaveLength(0);
  });

  it('repaints from scratch rather than appending', () => {
    const backend = fakeStorage({ [RECENT_KEY]: '["jwt","base64"]' });
    renderStrip(strip, { backend });
    clearRecent({ backend });
    flipPin('base64', { backend });
    renderStrip(strip, { backend });
    expect(shown(strip, 'pinned')).toEqual(['base64']);
    expect(shown(strip, 'recent')).toEqual([]);
  });
});

describe('the pre-paint script', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('is self-contained: it paints the same strip from its own source', () => {
    const strip = stripFixture();
    localStorage.setItem(PINNED_KEY, '["jwt","network-designer"]');
    localStorage.setItem(RECENT_KEY, '["base64","jwt","dns-lookup"]');

    new Function(stripBootSource('rt-mine'))();

    expect(strip.hidden).toBe(false);
    expect(shown(strip, 'pinned')).toEqual(['jwt']);
    expect(shown(strip, 'recent')).toEqual(['base64', 'dns-lookup']);
  });

  it('leaves the page alone with nothing stored', () => {
    const strip = stripFixture();
    new Function(stripBootSource('rt-mine'))();
    expect(strip.hidden).toBe(true);
  });

  it('does not throw when the strip is missing', () => {
    document.body.innerHTML = '';
    expect(() => new Function(stripBootSource('rt-mine'))()).not.toThrow();
  });

  it('cannot close the script element it is inlined into', () => {
    expect(stripBootSource('rt-mine')).not.toMatch(/<\/script/i);
  });
});
