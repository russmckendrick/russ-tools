import { HelpDialog, HelpSection } from 'russ-tools';

// The one help affordance: a right-hand Sheet, so the tool stays visible
// behind it. Rendered controlled-open for the card.
export const Open = () => (
  <HelpDialog
    open
    title="Subnet Calculator"
    description="How addresses are split, and what the numbers mean."
  >
    <HelpSection title="Prefix length">
      <p>
        The prefix is the number of leading bits fixed by the network. A /24 fixes 24 bits and leaves 8
        for hosts — 256 addresses, 254 of them usable.
      </p>
    </HelpSection>
    <HelpSection title="Reserved addresses">
      <p>
        The first address in a block is the network address and the last is the broadcast address.
        Neither can be assigned to a host.
      </p>
    </HelpSection>
  </HelpDialog>
);

// Uncontrolled: the standard outline trigger renders and the tool supplies
// nothing but content.
export const Trigger = () => (
  <HelpDialog title="DNS Lookup" description="What each record type means.">
    <HelpSection title="A and AAAA">
      <p>Address records map a name to an IPv4 or IPv6 address.</p>
    </HelpSection>
  </HelpDialog>
);
