import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export const MAX_ROWS = 200;

const PAD = 'px-2 sm:px-[13px]';
const range = (start, end) => (start === null ? '' : `${start}-${end}`);

function Value({ value }) {
  if (value === null) return <span className="font-sans text-body-sm text-on-surface-faint">did not take part</span>;
  if (value === '') return <span className="font-sans text-body-sm text-on-surface-faint">empty</span>;
  return <span className="whitespace-pre-wrap [overflow-wrap:anywhere]">{value}</span>;
}

export function MatchTable({ result }) {
  const shown = result.matches.slice(0, MAX_ROWS);
  const hasGroups = result.groups.length > 0;

  return (
    <div className="space-y-2">
      <Table aria-label="Matches">
        <TableHeader>
          <TableRow>
            <TableHead className={cn(PAD, 'w-8 sm:w-12')}>#</TableHead>
            {hasGroups ? <TableHead className={PAD}>Group</TableHead> : null}
            <TableHead className={PAD}>Range</TableHead>
            <TableHead className={PAD}>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shown.map((match, index) => (
            <React.Fragment key={`${match.index}-${index}`}>
              <TableRow className={hasGroups ? 'bg-surface-inset odd:bg-surface-inset' : undefined}>
                <TableCell className={cn(PAD, 'whitespace-nowrap text-on-surface')}>{index + 1}</TableCell>
                {hasGroups ? (
                  <TableCell className={cn(PAD, 'whitespace-nowrap font-sans text-body-sm text-on-surface-muted')}>
                    match
                  </TableCell>
                ) : null}
                <TableCell className={cn(PAD, 'whitespace-nowrap')}>{range(match.index, match.end)}</TableCell>
                <TableCell className={cn(PAD, 'min-w-36 text-on-surface')}>
                  <Value value={match.value} />
                </TableCell>
              </TableRow>
              {match.groups.map((group) => (
                <TableRow key={group.number} className="odd:bg-transparent">
                  <TableCell className={PAD} />
                  <TableCell className={cn(PAD, 'whitespace-nowrap text-on-surface-muted')}>
                    {group.name ? `${group.number} ${group.name}` : group.number}
                  </TableCell>
                  <TableCell className={cn(PAD, 'whitespace-nowrap text-on-surface-muted')}>
                    {range(group.start, group.end)}
                  </TableCell>
                  <TableCell className={cn(PAD, 'min-w-36')}>
                    <Value value={group.value} />
                  </TableCell>
                </TableRow>
              ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
      <p className="px-4 pb-3 text-body-sm text-on-surface-muted">
        {result.total > shown.length
          ? `Showing the first ${shown.length} of ${result.total.toLocaleString('en-GB')} matches. `
          : ''}
        A range is where the text starts and where it stops, counted in UTF-16 code units from 0, as JavaScript
        counts. The end is not included.
      </p>
    </div>
  );
}
