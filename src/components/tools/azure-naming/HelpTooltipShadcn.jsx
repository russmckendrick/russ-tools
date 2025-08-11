import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../../ui/tooltip';
import { Button } from '../../ui/button';
import { Info } from 'lucide-react';

const HelpTooltipShadcn = ({ content, className = '' }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`h-4 w-4 p-0 text-muted-foreground hover:text-foreground ${className}`}
            tabIndex={0}
            aria-label="Help"
          >
            <Info size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default HelpTooltipShadcn;