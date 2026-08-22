import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * A result that has not been produced yet, drawn as the real result.
 *
 * Several tools rest as one small control panel over a screenful of nothing —
 * the subnet calculator is ~101px of form and then empty page to the footer.
 * The panels that fill it only exist after you press the button, so until then
 * the page gives no sign of what is coming or what shape it takes.
 *
 * ### It renders the actual result component
 *
 * Not a lookalike, and not a box of N grey rows:
 *
 *     <Ghost>
 *       <DNSResultsDisplay results={GHOST_DNS} domain="example.com" recordType="A" />
 *     </Ghost>
 *
 * The tab bar, the three-column query card, the records card — all of it comes
 * from the component that will replace it, so the ghost cannot drift from the
 * real thing. Two earlier attempts described the shape a second time (a
 * prerendered skeleton, then a `rows={11}` counter) and both were wrong the
 * moment a tool changed. The shape is already written down once, in the
 * component; this reads it rather than restating it.
 *
 * `.rt-ghosted` in `shell.css` does the redaction — every word turns into a
 * block, the structure stays. See that block for why it lives in plain CSS.
 *
 * ### What the sample data is for
 *
 * The data decides the size. Rendering a real component with real-shaped data
 * reproduces the real height, which is right for most tools and wrong for the
 * two whose results run to 1268px and 5922px — a ghost that tall makes the
 * *empty* page longer than the gap it replaces. So those pass less data. The
 * rule is: the ghost fills the empty region, it does not reserve the whole
 * result, and the lever is the data rather than a row count.
 *
 * ### Hidden, inert, and still
 *
 * `aria-hidden` and `inert`: this is a picture of content that does not exist.
 * Announcing rows that are not there is worse than saying nothing, and nothing
 * inside may take focus or a click. The controls above it already say what the
 * tool does.
 *
 * Nothing animates. Unlike a loading skeleton this is not temporary — it sits
 * on screen for as long as someone reads the form above it, and a rectangle
 * that throbs indefinitely is an irritation rather than a signal. There is
 * therefore nothing here for `prefers-reduced-motion` to switch off.
 */
export function Ghost({ className, children, ...props }) {
  return (
    <div className={cn('rt-ghosted', className)} aria-hidden="true" inert={true} {...props}>
      {children}
    </div>
  );
}
