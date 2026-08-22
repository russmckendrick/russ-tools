import { useEffect } from 'react';
import { Toaster, toast } from 'russ-tools';

// The host is rendered once by the shell; tools call `toast.*`. These stories
// raise real toasts so the card shows the panel styling rather than an empty
// region.
//
// Three details matter and are easy to get wrong:
//
//  - <Toaster /> must be mounted (and subscribed) BEFORE toast() is called, or
//    the notification is published to nobody — hence the timeout and the Raise
//    element sitting after the host.
//  - sonner auto-dismisses after ~4s, so a static capture needs
//    duration: Infinity or it screenshots an empty card.
//  - the shipped Toaster defaults to theme="system", which follows the OS
//    preference rather than the theme class on <html>. These stories pass
//    theme="dark" to match the dark ground previews are pinned to; without it
//    sonner picks its own light palette and the toasts render as white cards
//    on a near-black page — exactly what toaster.jsx's styling exists to stop.
function Raise({ fire }: { fire: () => void }) {
  useEffect(() => {
    const t = setTimeout(fire, 0);
    return () => clearTimeout(t);
  }, [fire]);
  return null;
}

const host = { position: 'relative', minHeight: 260 } as const;
const keep = { duration: Infinity } as const;

export const Statuses = () => (
  <div style={host}>
    <Toaster position="top-left" theme="dark" />
    <Raise
      fire={() => {
        toast.success('Copied to clipboard', keep);
        toast.error('Lookup failed', { ...keep, description: 'NXDOMAIN for example.invalid' });
        toast.warning('Certificate expires in 12 days', keep);
      }}
    />
  </div>
);

export const WithDescription = () => (
  <div style={host}>
    <Toaster position="top-left" theme="dark" />
    <Raise
      fire={() => {
        toast('Saved network', { ...keep, description: '10.0.0.0/16 — 65534 usable hosts' });
      }}
    />
  </div>
);
