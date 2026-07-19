import * as React from 'react';
import { CircleQuestionMark } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * The one way a tool offers help: a panel that slides in from the right.
 *
 * A slide-in rather than a centred modal because help is read *alongside* the
 * tool — the query you were building stays on screen behind it, which a
 * centred dialog covers.
 *
 * Before this there were four affordances: tenant-lookup opened a bespoke
 * dialog at `max-w-4xl`, azure-kql a different one at `max-w-3xl`,
 * azure-naming used a tooltip, and `ToolHeader` carried a `helpButton` prop
 * no tool ever passed. Tools now supply content and nothing else — not the
 * width, the heading level, the glyph, or where the trigger sits.
 *
 * Two usages, both supported:
 *  - **Uncontrolled** — omit `open`, and the standard trigger button renders.
 *  - **Controlled** — pass `open`/`onOpenChange` and the tool owns the
 *    trigger, which is what both existing help systems do (they open from a
 *    `ToolHeader` action).
 *
 * @param {{
 *   title: string,
 *   description?: string,
 *   children: React.ReactNode,
 *   label?: string,
 *   open?: boolean,
 *   onOpenChange?: (open: boolean) => void,
 *   className?: string,
 * }} props
 */
export function HelpDialog({
  title,
  description,
  children,
  label = 'Help',
  open,
  onOpenChange,
  className,
}) {
  const controlled = open !== undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {!controlled && (
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" aria-label={label}>
            <CircleQuestionMark />
            {label}
          </Button>
        </SheetTrigger>
      )}
      <SheetContent side="right" className={cn('overflow-y-auto', className)}>
        <SheetHeader>
          <SheetTitle>
            <CircleQuestionMark className="size-5 text-[var(--cat,var(--color-primary))]" />
            {title}
          </SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="flex flex-col gap-4 text-body-sm text-on-surface-muted">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * A help section inside a HelpDialog — a `label-caps` heading over its body,
 * so every tool's help reads with the same rhythm instead of each inventing
 * its own heading levels.
 *
 * @param {{ title: string, children: React.ReactNode }} props
 */
export function HelpSection({ title, children }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-mono text-label-caps uppercase text-on-surface-faint">
        {title}
      </h3>
      {children}
    </section>
  );
}

export default HelpDialog;
