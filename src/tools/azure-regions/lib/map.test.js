import { describe, expect, it } from 'vitest';
import regions from '../../../data/azure/regions.json';
import land from '../../../data/azure/world-land.json';
import {
  MAP_ASPECT,
  MAP_HEIGHT,
  MAP_WIDTH,
  MAX_ZOOM,
  NORTH_LIMIT,
  SOUTH_LIMIT,
  WORLD,
  clampView,
  equalEarth,
  fitView,
  isInView,
  minZoom,
  panBy,
  placeRegions,
  project,
  viewBox,
  zoomBy,
} from './map.js';

describe('equalEarth', () => {
  it('matches the published extents of the projection', () => {
    // The outline of the Equal Earth projection is 2.7066 by 1.3174 either
    // side of the origin; a wrong coefficient moves these in the third place.
    expect(equalEarth(0, 0)).toEqual([0, 0]);
    expect(equalEarth(180, 0)[0]).toBeCloseTo(2.7066, 4);
    expect(equalEarth(0, 90)[1]).toBeCloseTo(1.3174, 4);
  });

  it('is symmetric about the equator and the prime meridian', () => {
    const [x, y] = equalEarth(30, 50);
    expect(equalEarth(-30, 50)).toEqual([-x, y]);
    expect(equalEarth(30, -50)[0]).toBeCloseTo(x, 12);
    expect(equalEarth(30, -50)[1]).toBeCloseTo(-y, 12);
  });

  it('keeps parallels straight and narrows them toward the poles', () => {
    expect(equalEarth(-120, 40)[1]).toBeCloseTo(equalEarth(75, 40)[1], 12);
    expect(equalEarth(90, 60)[0]).toBeLessThan(equalEarth(90, 0)[0]);
  });
});

describe('project', () => {
  it('puts the origin on the centre line and the limits on the edges', () => {
    expect(project(0, 0)[0]).toBe(MAP_WIDTH / 2);
    expect(project(-180, 0)[0]).toBeCloseTo(0, 6);
    expect(project(180, 0)[0]).toBeCloseTo(MAP_WIDTH, 6);
    expect(project(0, NORTH_LIMIT)[1]).toBeCloseTo(0, 6);
    expect(project(0, SOUTH_LIMIT)[1]).toBeCloseTo(MAP_HEIGHT, 0);
  });

  it('draws north above south and east right of west', () => {
    const london = project(-0.13, 51.5);
    const sydney = project(151.2, -33.9);
    const virginia = project(-78.4, 37.4);
    expect(london[1]).toBeLessThan(sydney[1]);
    expect(virginia[0]).toBeLessThan(london[0]);
    expect(london[0]).toBeLessThan(sydney[0]);
  });
});

describe('clampView and viewBox', () => {
  it('describes the whole map at zoom 1', () => {
    expect(viewBox(WORLD)).toBe(`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`);
  });

  it('never frames past an edge', () => {
    expect(clampView({ cx: 0, cy: 0, k: 2 })).toEqual({ cx: MAP_WIDTH / 4, cy: MAP_HEIGHT / 4, k: 2 });
    expect(clampView({ cx: 5000, cy: 5000, k: 4 })).toEqual({
      cx: MAP_WIDTH - MAP_WIDTH / 8,
      cy: MAP_HEIGHT - MAP_HEIGHT / 8,
      k: 4,
    });
  });

  it('holds zoom between the whole map and the limit', () => {
    expect(clampView({ ...WORLD, k: 0.2 }).k).toBe(1);
    expect(clampView({ ...WORLD, k: 99 }).k).toBe(MAX_ZOOM);
    expect(zoomBy(WORLD, 2).k).toBe(2);
    expect(zoomBy(zoomBy(WORLD, 2), 0.25)).toEqual(WORLD);
  });
});

describe('fitView', () => {
  it('is the world when there is nothing to frame', () => {
    expect(fitView([])).toEqual(WORLD);
  });

  it('frames a cluster with room around it and centres on it', () => {
    const view = fitView([
      [480, 100],
      [520, 140],
    ]);
    expect(view.cx).toBe(500);
    expect(view.cy).toBe(120);
    expect(view.k).toBeGreaterThan(2);
    expect(MAP_WIDTH / view.k).toBeGreaterThanOrEqual(40 + 80);
  });

  it('frames a single point by its padding, not at the zoom limit', () => {
    const view = fitView([[500, 200]]);
    expect(view.k).toBeCloseTo(Math.min(6, MAP_HEIGHT / 80), 9);
    expect(view.k).toBeLessThan(MAX_ZOOM);
    expect(fitView([[500, 200]], { padding: 10 }).k).toBe(6);
  });

  it('stays at the world for points that span it', () => {
    expect(fitView([[20, 50], [980, 380]]).k).toBe(1);
  });
});

describe('a frame taller than the map', () => {
  // A phone's frame: about four units high for every five wide.
  const TALL = 0.8;

  it('cannot show the whole world, so its floor is above zoom 1', () => {
    expect(minZoom()).toBe(1);
    expect(minZoom(MAP_ASPECT / 2)).toBe(1);
    expect(minZoom(TALL)).toBeCloseTo(TALL / MAP_ASPECT, 12);
    expect(clampView(WORLD, TALL).k).toBe(minZoom(TALL));
  });

  it('fills the frame with map from top to bottom at its floor', () => {
    const [, y, width, height] = viewBox(WORLD, TALL).split(' ').map(Number);
    expect(y).toBeCloseTo(0, 1);
    expect(height).toBeCloseTo(MAP_HEIGHT, 1);
    expect(height / width).toBeCloseTo(TALL, 3);
    expect(width).toBeLessThan(MAP_WIDTH);
  });

  it('pans sideways at its floor but not up or down', () => {
    const start = clampView(WORLD, TALL);
    const moved = panBy(start, -80, -80, 320, TALL);
    expect(moved.cx).toBeGreaterThan(start.cx);
    expect(moved.cy).toBeCloseTo(start.cy, 9);
  });

  it('fits points to the frame it is given', () => {
    const points = [
      [480, 100],
      [520, 300],
    ];
    expect(fitView(points, { aspect: TALL }).k).toBeGreaterThan(fitView(points).k);
  });
});

describe('isInView', () => {
  it('counts a point near the edge as outside', () => {
    const view = { cx: 500, cy: MAP_HEIGHT / 2, k: 2 };
    expect(isInView(view, 500, MAP_HEIGHT / 2)).toBe(true);
    expect(isInView(view, 740, MAP_HEIGHT / 2)).toBe(false);
    expect(isInView(view, 100, MAP_HEIGHT / 2)).toBe(false);
    expect(isInView(WORLD, 20, 20)).toBe(false);
    expect(isInView(WORLD, 120, 80)).toBe(true);
  });
});

describe('panBy', () => {
  it('moves the frame against the drag, scaled by zoom and width', () => {
    const start = { cx: 500, cy: MAP_HEIGHT / 2, k: 4 };
    // 100px across a 500px-wide drawing showing 250 units is 50 units.
    expect(panBy(start, 100, 0, 500).cx).toBe(450);
    expect(panBy(start, -100, 0, 500).cx).toBe(550);
  });

  it('cannot pan the whole map, and ignores an unmeasured width', () => {
    expect(panBy(WORLD, 300, 300, 800)).toEqual(WORLD);
    const start = { cx: 500, cy: 200, k: 4 };
    expect(panBy(start, 50, 50, 0)).toBe(start);
  });
});

describe('placeRegions', () => {
  it('places regions with coordinates and leaves the rest out', () => {
    const placed = placeRegions([
      { name: 'uksouth', latitude: 51.5073, longitude: -0.1276 },
      { name: 'nowhere', latitude: null, longitude: null },
      { name: 'legacy' },
    ]);
    expect(placed.map((place) => place.region.name)).toEqual(['uksouth']);
    expect(placed[0].x).toBeCloseTo(project(-0.1276, 51.5073)[0], 9);
  });
});

describe('the checked-in map data', () => {
  const placed = placeRegions(regions.regions);

  it('places most regions, all inside the drawing', () => {
    expect(placed.length).toBeGreaterThan(regions.regions.length * 0.7);
    for (const { region, x, y } of placed) {
      expect(x, region.name).toBeGreaterThan(0);
      expect(x, region.name).toBeLessThan(MAP_WIDTH);
      expect(y, region.name).toBeGreaterThan(0);
      expect(y, region.name).toBeLessThan(MAP_HEIGHT);
    }
  });

  it('puts regions in the hemisphere their name says', () => {
    // A swapped latitude and longitude, or a dropped minus sign upstream,
    // would still be "valid coordinates". These would catch it.
    const at = (name) => regions.regions.find((region) => region.name === name);
    expect(at('uksouth').latitude).toBeGreaterThan(49);
    expect(Math.abs(at('uksouth').longitude)).toBeLessThan(3);
    expect(at('australiaeast').latitude).toBeLessThan(0);
    expect(at('australiaeast').longitude).toBeGreaterThan(110);
    expect(at('eastus').longitude).toBeLessThan(-60);
    expect(at('brazilsouth').latitude).toBeLessThan(0);
    expect(at('japaneast').longitude).toBeGreaterThan(125);
  });

  it('has a land outline drawn in the same units, by the same projection', () => {
    expect(land.width).toBe(MAP_WIDTH);
    expect(land.height).toBe(MAP_HEIGHT);
    expect(land.path.startsWith('M')).toBe(true);
    const numbers = land.path.match(/-?\d+(?:\.\d+)?/g).map(Number);
    const xs = numbers.filter((_, index) => index % 2 === 0);
    const ys = numbers.filter((_, index) => index % 2 === 1);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...xs)).toBeLessThanOrEqual(MAP_WIDTH);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(-1);
  });
});
