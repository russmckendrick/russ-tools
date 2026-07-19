import { Toaster as Sonner } from 'sonner';

/**
 * The one toaster. 155 `toast.*` calls across the tools all surface through
 * this, so its configuration is the difference between fifteen tools that
 * notify consistently and fifteen that each look slightly different.
 *
 * Sonner defaults to a light theme and its own neutral palette, which reads
 * as a floating white card on a near-black page. Here it is a DESIGN.md
 * panel: `surface-raised`, the `outline` hairline, 10px radius, and status
 * colour only on the icon — DESIGN.md's rule that status colours express
 * state and nothing else.
 *
 * `theme="system"` rather than a hardcoded value, and the shell's pre-paint
 * script has already set the matching class on <html>, so both agree on the
 * first frame.
 */
export function Toaster(props) {
  return (
    <Sonner
      theme="system"
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'rounded-lg border border-outline bg-surface-raised text-on-surface shadow-[0_16px_48px_-24px_rgba(0,0,0,.6)]',
          title: 'text-body-sm font-medium',
          description: 'text-body-sm text-on-surface-muted',
          actionButton: 'rounded-sm bg-primary text-on-primary',
          cancelButton: 'rounded-sm border border-outline-strong bg-surface-raised text-on-surface',
          closeButton: 'border-outline bg-surface-inset text-on-surface-muted',
          success: '[&_[data-icon]]:text-success',
          error: '[&_[data-icon]]:text-danger',
          warning: '[&_[data-icon]]:text-warning',
          info: '[&_[data-icon]]:text-info',
        },
      }}
      {...props}
    />
  );
}

export default Toaster;
