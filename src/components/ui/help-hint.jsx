import * as React from 'react';
import { Info } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * A field-level hint: the small `i` beside a label that explains one control.
 *
 * The counterpart to the tool help page, not a competitor to it — tool-level
 * help is the /:tool/help page, field-level help is this. Both exist once, so
 * a user learns the two affordances and they mean the same thing in all
 * fifteen tools. This was azure-naming's private `HelpTooltipShadcn`.
 *
 * @param {{ content: React.ReactNode, className?: string, label?: string }} props
 */
export function HelpHint({ content, className, label = 'Help' }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn('size-4 p-0 text-on-surface-faint hover:text-on-surface', className)}
            tabIndex={0}
            aria-label={label}
          >
            <Info className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default HelpHint;
