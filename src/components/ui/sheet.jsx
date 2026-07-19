import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * A panel that slides in from the edge of the viewport.
 *
 * Built on the same Radix Dialog primitive as `Dialog`, so focus trapping,
 * scroll locking and Escape behave identically — the difference is where it
 * comes from and that it is full height. Used for content you read alongside
 * the tool rather than instead of it, which is what help is.
 *
 * Styling is DESIGN.md's panel: `surface-raised`, the `outline` hairline as
 * the edge against the page, and no radius on the joined side.
 */
const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-surface/80 backdrop-blur-[2px]',
      'data-[state=open]:animate-in data-[state=open]:fade-in-0',
      'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
      className
    )}
    {...props}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const SheetContent = React.forwardRef(({ side = 'right', className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(
        'fixed z-50 flex flex-col gap-4 bg-surface-raised p-4',
        'shadow-[0_0_60px_-20px_rgba(0,0,0,.7)] transition ease-out',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=open]:duration-250',
        side === 'right' &&
          'inset-y-0 right-0 h-full w-full max-w-[min(28rem,100vw)] border-l border-outline data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
        side === 'left' &&
          'inset-y-0 left-0 h-full w-full max-w-[min(28rem,100vw)] border-r border-outline data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
        className
      )}
      {...props}
    >
      {children}
      <SheetPrimitive.Close
        className={cn(
          'absolute right-3 top-3 rounded-sm text-on-surface-faint transition-colors',
          'hover:text-on-surface focus:outline-none focus:ring-2 focus:ring-[var(--cat,var(--color-primary))]',
          'focus:ring-offset-2 focus:ring-offset-surface-raised'
        )}
      >
        <X className="size-4" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({ className, ...props }) => (
  <div
    className={cn('-mx-4 -mt-4 border-b border-outline bg-surface-inset px-4 py-3', className)}
    {...props}
  />
);
SheetHeader.displayName = 'SheetHeader';

const SheetTitle = React.forwardRef(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn(
      'flex items-center gap-2 text-headline-md text-on-surface',
      className
    )}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn('text-body-sm text-on-surface-muted', className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
};
