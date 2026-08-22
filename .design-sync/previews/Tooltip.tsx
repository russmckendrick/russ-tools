import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'russ-tools';

// Rendered `open` so the card shows the chip itself. A tooltip is an inset
// chip on the hairline — never a filled accent block.
export const Visible = () => (
  <TooltipProvider>
    <div style={{ paddingTop: 56, display: 'flex', justifyContent: 'center' }}>
      <Tooltip open>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm">
            Copy record
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Copy to clipboard</TooltipContent>
      </Tooltip>
    </div>
  </TooltipProvider>
);
