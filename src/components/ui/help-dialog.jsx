import * as React from 'react';
import { CircleQuestionMark } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * The one way a tool offers help.
 *
 * Before this there were three: tenant-lookup opened a bespoke dialog,
 * azure-kql opened a different bespoke dialog, azure-naming used a tooltip,
 * and `ToolHeader` carried a `helpButton` prop no tool ever passed. Four
 * answers to one question is how an interface stops feeling like one product.
 *
 * The trigger is always a secondary icon button in the same place with the
 * same glyph, and the panel is always a Dialog — so a user who has found help
 * in one tool knows where it is in all fifteen. Tools supply only the content.
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label={label}>
          <CircleQuestionMark />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className={cn('max-h-[85vh] max-w-2xl overflow-y-auto', className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="flex flex-col gap-4 text-body-sm text-on-surface-muted">{children}</div>
      </DialogContent>
    </Dialog>
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
      <h3 className="font-mono text-label-caps font-label-caps tracking-label-caps uppercase text-on-surface-faint">
        {title}
      </h3>
      {children}
    </section>
  );
}

export default HelpDialog;
