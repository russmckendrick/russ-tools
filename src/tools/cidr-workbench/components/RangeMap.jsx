import React from 'react';
import { register } from 'pele/core';
import gantt from 'pele/diagrams/gantt';
import { FlowDiagram } from '@/components/ui/tree-diagram';
import { formatAddress, rangeToCidrs } from '../lib/cidr.js';

register(gantt);

/** Past this many bars in a lane the chart is a staircase nobody reads. */
const MAX_BARS = 24;
/** IPv6 spans do not fit a number, so every family is drawn on this scale. */
const SCALE = 100000n;

/**
 * A label Mermaid's Gantt can carry. `:` ends a task name, which an IPv6
 * address is full of, so each becomes the ratio sign — the same mark to the
 * eye, and not syntax.
 */
const text = (value) => String(value).replace(/:/g, '\u2236').replace(/[#;]/g, ' ').trim();

/**
 * The sets, drawn against one address line: what went in, what it was
 * compared with, and what came out — one labelled bar per block, so an
 * overlap, a gap or the bite a subtraction takes is geometry rather than a
 * list to diff by eye.
 *
 * It is a Pele Gantt chart with addresses where the dates would be: each
 * range is placed by its offset from the lowest address on the line, scaled
 * so that IPv6 fits. The axis numbers would be those offsets and mean
 * nothing, so they are hidden and the two ends are stated as addresses
 * beneath instead.
 *
 * One chart per address family, because IPv4 and IPv6 do not share a line.
 * The result panel below states the same answer as text.
 *
 * @param {object} props
 * @param {{label: string, ranges: {family: number, start: bigint, end: bigint, source?: string}[], result?: boolean}[]} props.lanes
 */
export default function RangeMap({ lanes }) {
  const families = [4, 6].filter((family) =>
    lanes.some((lane) => lane.ranges.some((range) => range.family === family))
  );
  if (families.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {families.map((family) => {
        const all = lanes.flatMap((lane) => lane.ranges.filter((range) => range.family === family));
        const min = all.reduce((low, range) => (range.start < low ? range.start : low), all[0].start);
        const max = all.reduce((high, range) => (range.end > high ? range.end : high), all[0].end);
        const whole = max - min + 1n;
        const at = (value) => Number(((value - min) * SCALE) / whole);

        const lines = ['gantt', '  dateFormat x', '  axisFormat %Q'];
        let id = 0;
        for (const lane of lanes) {
          const ranges = lane.ranges.filter((range) => range.family === family);
          if (ranges.length === 0) continue;
          lines.push(`  section ${text(lane.label)}`);
          for (const range of ranges.slice(0, MAX_BARS)) {
            // A result range may be a slice of an input and still carry the
            // input's `source`, so results are named from their own bounds.
            const cidrs = lane.result ? rangeToCidrs(range) : [];
            const name = lane.result
              ? cidrs.length === 1
                ? cidrs[0]
                : `${formatAddress(range.start, family)} – ${formatAddress(range.end, family)}`
              : (range.source ?? formatAddress(range.start, family));
            const from = at(range.start);
            const to = Math.max(at(range.end + 1n), from + 1);
            lines.push(`  ${text(name)} :${lane.result ? 'crit, ' : ''}r${id}, ${from}, ${to}`);
            id += 1;
          }
        }

        return (
          <FlowDiagram
            key={family}
            source={lines.join('\n')}
            label={`IPv${family} ranges on one address line`}
            caption={`${formatAddress(min, family)} to ${formatAddress(max, family)}`}
          />
        );
      })}
    </div>
  );
}
