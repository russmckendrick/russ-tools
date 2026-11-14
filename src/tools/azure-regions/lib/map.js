/**
 * The geometry behind the region map: one projection, and the arithmetic for
 * zooming and panning an SVG `viewBox`.
 *
 * The map is drawn without a mapping library or a tile server. A tile server
 * would see every visitor's address, and the site's promise is that nothing
 * leaves the browser; a library would be most of a megabyte to place fifty
 * dots. So the land outline is projected once, by the refresh script, with
 * the same `project()` the markers use here, and shipped as a path string.
 *
 * The projection is Equal Earth (Šavrič, Patterson and Jenny, 2018): equal
 * area, so no region is flattered by its latitude, and with the straight
 * parallels that make a world map read as one.
 */

const A1 = 1.340264;
const A2 = -0.081106;
const A3 = 0.000893;
const A4 = 0.003796;
const M = Math.sqrt(3) / 2;
const RADIANS = Math.PI / 180;

/** Equal Earth, in the projection's own units: x within ±2.7066, y within ±1.3174. */
export function equalEarth(longitude, latitude) {
  const theta = Math.asin(M * Math.sin(latitude * RADIANS));
  const t2 = theta * theta;
  const t6 = t2 * t2 * t2;
  return [
    (longitude * RADIANS * Math.cos(theta)) / (M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2))),
    theta * (A1 + A2 * t2 + t6 * (A3 + A4 * t2)),
  ];
}

/**
 * The drawing area. 1000 units wide for the whole 360 degrees, cropped to the
 * latitudes that have land anyone lives on: Antarctica would spend a fifth of
 * the height on a continent with no regions.
 */
export const MAP_WIDTH = 1000;
export const NORTH_LIMIT = 84;
export const SOUTH_LIMIT = -57;

const SCALE = MAP_WIDTH / (2 * equalEarth(180, 0)[0]);
const TOP = equalEarth(0, NORTH_LIMIT)[1] * SCALE;
export const MAP_HEIGHT = Math.round((TOP - equalEarth(0, SOUTH_LIMIT)[1] * SCALE) * 10) / 10;

/**
 * Longitude and latitude to map units, origin top left.
 *
 * @param {number} longitude
 * @param {number} latitude
 * @returns {[number, number]}
 */
export function project(longitude, latitude) {
  const [x, y] = equalEarth(longitude, latitude);
  return [MAP_WIDTH / 2 + x * SCALE, TOP - y * SCALE];
}

export const MAX_ZOOM = 12;
export const MAP_ASPECT = MAP_HEIGHT / MAP_WIDTH;

/** The whole map. `k` is the zoom factor; `cx`, `cy` the centre in map units. */
export const WORLD = Object.freeze({ cx: MAP_WIDTH / 2, cy: MAP_HEIGHT / 2, k: 1 });

const clamp = (value, low, high) => Math.min(Math.max(value, low), high);

/**
 * The least zoom at which a frame of the given shape shows only map.
 *
 * `aspect` is the frame's height over its width. A frame the map's own shape
 * shows the whole world at zoom 1. A phone gives the map a taller frame so
 * the markers are large enough to press, and a taller frame filled with map
 * cannot also show all 360 degrees: its floor is above 1 and the world is
 * reached by panning sideways.
 *
 * @param {number} [aspect]
 */
export function minZoom(aspect = MAP_ASPECT) {
  return Math.max(1, aspect / MAP_ASPECT);
}

/**
 * A view kept inside the map: zoom within its limits, and the centre pulled
 * back so the frame never shows past an edge.
 *
 * @param {{ cx: number, cy: number, k: number }} view
 * @param {number} [aspect]
 */
export function clampView({ cx, cy, k }, aspect = MAP_ASPECT) {
  const zoom = clamp(k, minZoom(aspect), MAX_ZOOM);
  const halfWidth = MAP_WIDTH / zoom / 2;
  const halfHeight = halfWidth * aspect;
  return {
    cx: clamp(cx, halfWidth, MAP_WIDTH - halfWidth),
    cy: clamp(cy, halfHeight, Math.max(halfHeight, MAP_HEIGHT - halfHeight)),
    k: zoom,
  };
}

/** @param {{ cx: number, cy: number, k: number }} view @param {number} [aspect] */
export function viewBox(view, aspect = MAP_ASPECT) {
  const { cx, cy, k } = clampView(view, aspect);
  const width = MAP_WIDTH / k;
  const height = width * aspect;
  const round = (value) => Math.round(value * 100) / 100;
  return `${round(cx - width / 2)} ${round(cy - height / 2)} ${round(width)} ${round(height)}`;
}

/**
 * The view that frames a set of points with room around them. One point, or
 * points close together, stop at a zoom that still shows the coastline they
 * sit on; no points is the widest view the frame allows.
 *
 * @param {Array<[number, number]>} points In map units.
 * @param {{ aspect?: number, padding?: number, maxZoom?: number }} [options]
 */
export function fitView(points, { aspect = MAP_ASPECT, padding = 40, maxZoom = 6 } = {}) {
  if (points.length === 0) return clampView(WORLD, aspect);
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const width = Math.max(...xs) - Math.min(...xs) + padding * 2;
  const height = Math.max(...ys) - Math.min(...ys) + padding * 2;
  return clampView(
    {
      cx: (Math.max(...xs) + Math.min(...xs)) / 2,
      cy: (Math.max(...ys) + Math.min(...ys)) / 2,
      k: Math.min(MAP_WIDTH / width, (MAP_WIDTH * aspect) / height, maxZoom),
    },
    aspect
  );
}

/** Zoom by a factor about the current centre. */
export function zoomBy(view, factor, aspect = MAP_ASPECT) {
  return clampView({ ...view, k: view.k * factor }, aspect);
}

/**
 * Pan by a drag measured in screen pixels, for an SVG `width` pixels wide.
 *
 * @param {{ cx: number, cy: number, k: number }} view
 * @param {number} dx
 * @param {number} dy
 * @param {number} width
 * @param {number} [aspect]
 */
export function panBy(view, dx, dy, width, aspect = MAP_ASPECT) {
  if (!(width > 0)) return view;
  const unitsPerPixel = MAP_WIDTH / view.k / width;
  return clampView({ ...view, cx: view.cx - dx * unitsPerPixel, cy: view.cy - dy * unitsPerPixel }, aspect);
}

/**
 * Is a point inside the frame, with a margin so a marker on the very edge
 * counts as outside?
 *
 * @param {{ cx: number, cy: number, k: number }} view
 * @param {number} x
 * @param {number} y
 * @param {number} [aspect]
 */
export function isInView(view, x, y, aspect = MAP_ASPECT) {
  const halfWidth = MAP_WIDTH / view.k / 2;
  return Math.abs(x - view.cx) < halfWidth * 0.9 && Math.abs(y - view.cy) < halfWidth * aspect * 0.9;
}

/**
 * Regions that can be drawn, each with its position in map units.
 *
 * @param {Array<{ name: string, latitude?: number | null, longitude?: number | null }>} regions
 */
export function placeRegions(regions) {
  return regions
    .filter((region) => Number.isFinite(region.latitude) && Number.isFinite(region.longitude))
    .map((region) => {
      const [x, y] = project(region.longitude, region.latitude);
      return { region, x, y };
    });
}

/** @type {Promise<{ source: string, licence: string, path: string }> | null} */
let pending = null;

export function loadWorldLand() {
  if (!pending) {
    pending = import('../../../data/azure/world-land.json').then((m) => m.default ?? m);
  }
  return pending;
}
