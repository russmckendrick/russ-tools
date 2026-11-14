import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Maximize2, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  MAP_ASPECT,
  MAP_WIDTH,
  MAX_ZOOM,
  WORLD,
  clampView,
  fitView,
  isInView,
  loadWorldLand,
  minZoom,
  panBy,
  placeRegions,
  viewBox,
  zoomBy,
} from '../lib/map.js';
import { zoneLabel } from '../lib/regions.js';

const DRAG_THRESHOLD = 4;

function Marker({ place, unit, state, onSelect, onHover }) {
  const { region, x, y } = place;
  if (state === 'dimmed') {
    return <circle cx={x} cy={y} r={2.5 * unit} className="fill-on-surface-faint opacity-50" aria-hidden="true" />;
  }
  return (
    <g
      role="button"
      tabIndex={-1}
      aria-label={`${region.displayName} (${region.name}), ${zoneLabel(region).toLowerCase()}`}
      aria-pressed={state === 'selected'}
      className="cursor-pointer outline-none"
      onClick={() => onSelect(region.name)}
      onPointerEnter={() => onHover(region.name)}
      onPointerLeave={() => onHover(null)}
    >
      <circle cx={x} cy={y} r={11 * unit} fill="transparent" />
      {state !== 'plain' && (
        <circle
          cx={x}
          cy={y}
          r={9 * unit}
          fill="none"
          vectorEffect="non-scaling-stroke"
          strokeWidth={state === 'selected' ? 2 : 1.5}
          className="stroke-on-surface"
          strokeDasharray={state === 'pair' ? '3 2' : undefined}
        />
      )}
      <circle
        cx={x}
        cy={y}
        r={4.5 * unit}
        vectorEffect="non-scaling-stroke"
        strokeWidth={1.5}
        className={cn('stroke-primary', region.zones ? 'fill-primary' : 'fill-surface-raised')}
      />
    </g>
  );
}

function MapLabel({ place, unit, view, text, side }) {
  const flip = side ? side === 'left' : place.x > view.cx + MAP_WIDTH / view.k / 4;
  return (
    <text
      x={place.x + (flip ? -13 : 13) * unit}
      y={place.y + 4 * unit}
      textAnchor={flip ? 'end' : 'start'}
      fontSize={12 * unit}
      strokeWidth={3.5 * unit}
      className="pointer-events-none fill-on-surface stroke-surface-raised font-sans font-medium [paint-order:stroke]"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {text}
    </text>
  );
}

export function RegionMap({ regions, matches, selectedName, onSelect }) {
  const [land, setLand] = useState(null);
  const [rawView, setView] = useState(WORLD);
  const [frame, setFrame] = useState({ width: MAP_WIDTH, aspect: MAP_ASPECT });
  const [hovered, setHovered] = useState(null);
  const svgRef = useRef(null);
  const drag = useRef(null);
  const dragged = useRef(false);

  const places = useMemo(() => placeRegions(regions), [regions]);
  const unplaced = useMemo(() => regions.filter((region) => !places.some((place) => place.region === region)), [regions, places]);
  const matchNames = useMemo(() => new Set(matches.map((region) => region.name)), [matches]);
  const byName = useMemo(() => new Map(places.map((place) => [place.region.name, place])), [places]);

  useEffect(() => {
    let live = true;
    loadWorldLand().then(
      (loaded) => live && setLand(loaded),
      () => {}
    );
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (!(width > 0 && height > 0)) return;
      // Rounded, so a scrollbar appearing does not read as a new shape and
      // throw away the zoom someone has just chosen.
      const nextAspect = Math.round((height / width) * 100) / 100;
      setFrame((current) =>
        current.width === width && current.aspect === nextAspect ? current : { width, aspect: nextAspect }
      );
    });
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  const { width, aspect } = frame;
  const floor = minZoom(aspect);
  const view = clampView(rawView, aspect);
  const zoomed = view.k > floor + 0.001;

  // Narrowing the list frames what is left; clearing it returns to the world.
  const matchKey = matches.length === regions.length ? '' : matches.map((region) => region.name).join(',');
  useEffect(() => {
    const shown = matchKey ? places.filter((place) => matchKey.split(',').includes(place.region.name)) : [];
    setView(shown.length ? fitView(shown.map((place) => [place.x, place.y]), { aspect }) : WORLD);
  }, [matchKey, places, aspect]);

  // A region chosen from the table is brought into the frame if it is outside it.
  useEffect(() => {
    const place = selectedName ? byName.get(selectedName) : null;
    if (!place) return;
    setView((current) => {
      const framed = clampView(current, aspect);
      return isInView(framed, place.x, place.y, aspect) ? current : { ...framed, cx: place.x, cy: place.y };
    });
  }, [selectedName, byName, aspect]);

  const unit = MAP_WIDTH / view.k / width;
  const selected = selectedName ? byName.get(selectedName) ?? null : null;
  const pair = selected?.region.paired ? byName.get(selected.region.paired) ?? null : null;
  const hover = hovered ? byName.get(hovered) ?? null : null;

  const stateOf = (place) => {
    if (place === selected) return 'selected';
    if (place === pair) return 'pair';
    return matchNames.has(place.region.name) ? 'plain' : 'dimmed';
  };

  const onPointerDown = (event) => {
    drag.current = { x: event.clientX, y: event.clientY, view, id: event.pointerId, captured: false };
    dragged.current = false;
  };
  const onPointerMove = (event) => {
    const start = drag.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!start.captured && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    if (!start.captured) {
      start.captured = true;
      dragged.current = true;
      svgRef.current?.setPointerCapture(event.pointerId);
    }
    setView(panBy(start.view, dx, dy, width, aspect));
  };
  const onPointerEnd = () => {
    drag.current = null;
  };
  const select = (name) => {
    if (dragged.current) return;
    onSelect(name);
  };

  const status = hover ?? selected;

  return (
    <Card>
      <CardContent className="space-y-3 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className="min-h-5 min-w-0 flex-1 basis-56 text-body-sm text-on-surface-muted">
            {status
              ? `${status.region.displayName} · ${status.region.name} · ${status.region.location ?? status.region.geography} · ${zoneLabel(status.region).toLowerCase()}`
              : 'Select a marker for a region’s pair and codes. Drag to move the map; filtering the list zooms it.'}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              aria-label="Zoom out"
              disabled={!zoomed}
              onClick={() => setView((current) => zoomBy(clampView(current, aspect), 1 / 1.6, aspect))}
            >
              <Minus aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Zoom in"
              disabled={view.k >= MAX_ZOOM}
              onClick={() => setView((current) => zoomBy(clampView(current, aspect), 1.6, aspect))}
            >
              <Plus aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Reset the map"
              disabled={!zoomed && Math.abs(view.cx - WORLD.cx) < 1}
              onClick={() => setView(WORLD)}
            >
              <Maximize2 aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="h-64 overflow-hidden rounded-md border border-outline bg-surface-inset sm:aspect-[1000/435] sm:h-auto">
          <svg
            ref={svgRef}
            viewBox={viewBox(view, aspect)}
            role="group"
            aria-label="Map of Azure regions"
            className="block h-full w-full cursor-grab select-none active:cursor-grabbing"
            style={{ touchAction: zoomed ? 'none' : 'pan-y' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
          >
            {land && (
              <path
                d={land.path}
                vectorEffect="non-scaling-stroke"
                strokeWidth={1}
                strokeLinejoin="round"
                className="fill-surface-raised stroke-outline-strong"
              />
            )}
            {selected && pair && (
              <line
                x1={selected.x}
                y1={selected.y}
                x2={pair.x}
                y2={pair.y}
                vectorEffect="non-scaling-stroke"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                className="stroke-on-surface-muted"
              />
            )}
            {places
              .slice()
              .sort((a, b) => Number(stateOf(a) !== 'dimmed') - Number(stateOf(b) !== 'dimmed'))
              .map((place) => (
                <Marker
                  key={place.region.name}
                  place={place}
                  unit={unit}
                  state={stateOf(place)}
                  onSelect={select}
                  onHover={setHovered}
                />
              ))}
            {pair && (
              <MapLabel
                place={pair}
                unit={unit}
                view={view}
                text={pair.region.displayName}
                side={pair.x < selected.x ? 'left' : 'right'}
              />
            )}
            {selected && (
              <MapLabel
                place={selected}
                unit={unit}
                view={view}
                text={selected.region.displayName}
                side={pair ? (pair.x < selected.x ? 'right' : 'left') : undefined}
              />
            )}
            {hover && hover !== selected && hover !== pair && (
              <MapLabel place={hover} unit={unit} view={view} text={hover.region.displayName} />
            )}
          </svg>
        </div>

        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-body-sm text-on-surface-muted" aria-label="Map key">
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full border border-primary bg-primary" aria-hidden="true" />
            Availability zones
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full border border-primary bg-surface-raised" aria-hidden="true" />
            No zones
          </li>
          {selected && pair && (
            <li className="flex items-center gap-1.5">
              <span className="w-4 border-t border-dashed border-on-surface-muted" aria-hidden="true" />
              Paired with
            </li>
          )}
        </ul>

        {unplaced.length > 0 && (
          <p className="text-body-sm text-on-surface-muted">
            Not drawn, because Microsoft’s globe data gives no position for them:{' '}
            {unplaced.map((region, index) => (
              <React.Fragment key={region.name}>
                {index > 0 && ', '}
                <button
                  type="button"
                  className="text-primary-text underline-offset-2 hover:underline"
                  onClick={() => onSelect(region.name)}
                >
                  {region.displayName}
                </button>
              </React.Fragment>
            ))}
            .
          </p>
        )}
      </CardContent>
    </Card>
  );
}
