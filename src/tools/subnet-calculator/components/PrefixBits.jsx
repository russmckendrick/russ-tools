import React from 'react';

/**
 * The prefix, drawn. For IPv4 every one of the 32 bits is a cell holding its
 * value, in four octets: network bits are filled, host bits are left open, so
 * the boundary a /22 puts in the middle of the third octet is something you
 * can see. IPv6 has 128 bits and no room for cells, so it is one bar split in
 * proportion.
 *
 * Decoration over the table beneath it, which states the same facts in text,
 * so the cells are hidden from assistive tech and the caption is not.
 *
 * @param {object} props
 * @param {number} props.family 4 or 6
 * @param {number} props.prefix
 * @param {string} [props.binaryAddress] dotted binary, IPv4 only
 */
export default function PrefixBits({ family, prefix, binaryAddress }) {
  const bits = family === 4 ? 32 : 128;
  const caption = (
    <p className="flex flex-wrap gap-x-5 gap-y-1 text-body-sm text-on-surface-faint">
      <span className="inline-flex items-center gap-2">
        <span data-viz-fill className="h-2.5 w-2.5 rounded-sm bg-primary" aria-hidden="true" />
        {prefix} network bit{prefix === 1 ? '' : 's'}
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-sm border border-outline-strong" aria-hidden="true" />
        {bits - prefix} host bit{bits - prefix === 1 ? '' : 's'}
      </span>
    </p>
  );

  if (family !== 4 || !binaryAddress) {
    return (
      <div className="flex flex-col gap-2" data-viz>
        <div className="flex h-7 overflow-hidden rounded-md border border-outline-strong" aria-hidden="true">
          <div data-viz-fill className="rt-grow h-full bg-primary" style={{ width: `${(prefix / bits) * 100}%` }} />
        </div>
        {caption}
      </div>
    );
  }

  const octets = binaryAddress.split('.');
  let index = 0;

  return (
    <div className="flex flex-col gap-2" data-viz>
      <div className="flex flex-wrap gap-x-3 gap-y-2" aria-hidden="true">
        {octets.map((octet, o) => (
          <div key={o} className="flex gap-0.5">
            {octet.split('').map((bit) => {
              const network = index < prefix;
              index += 1;
              return (
                <span
                  key={index}
                  data-viz-fill={network ? '' : undefined}
                  className={
                    network
                      ? 'grid h-7 w-5 place-items-center rounded-sm bg-primary font-mono text-data-sm text-on-primary'
                      : 'grid h-7 w-5 place-items-center rounded-sm border border-outline-strong font-mono text-data-sm text-on-surface-faint'
                  }
                >
                  {bit}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      {caption}
    </div>
  );
}
