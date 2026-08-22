// Re-exports sonner's `toast` onto the design-system global.
//
// `src/components/ui/toaster.jsx` exports the configured <Toaster /> host, but
// the function that actually raises a toast lives in sonner and is imported
// directly by the tools (155 call sites). Without this the bundle would ship a
// toast host with no way to put anything in it, and a design built against the
// system could render <Toaster /> and never show a notification.
//
// A preview or design cannot import sonner itself: that would bundle a second
// copy with its own observer, which the shipped <Toaster /> never listens to.
export { toast } from 'sonner';
