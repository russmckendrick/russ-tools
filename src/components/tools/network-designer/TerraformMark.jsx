/**
 * The Terraform mark — three parallelograms, drawn here rather than imported.
 *
 * This was the last `@tabler/icons-react` import in any tool file, and the
 * only one with no lucide equivalent, so it kept a whole icon package alive
 * for one glyph. It is a brand mark for a specific export format, not a tool
 * icon, so it does not belong in `src/shell/icons.mjs` — that set is one
 * drawing per tool and stays that way.
 *
 * `currentColor`, not the brand's `#7B42F6`, which is what the `@tabler`
 * version was given at the call site: a raw hex is the thing DESIGN.md's
 * token rule exists to stop, the word "Terraform" is already next to it, and
 * every other glyph in that header takes the surrounding text colour.
 *
 * Filled rather than stroked — the mark is solid shapes, and outlining them
 * at 18px produces mush.
 *
 * @param {{ size?: number, className?: string }} props
 */
export default function TerraformMark({ size = 18, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M9.1 3.3v6.1l5.3 3.05V6.35z" />
      <path d="M15.0 6.35v6.1l5.3-3.05V3.3z" />
      <path d="M3.2 0.25v6.1l5.3 3.05V3.3z" transform="translate(0 3.05)" />
      <path d="M9.1 13.55v6.1l5.3 3.05v-6.1z" />
    </svg>
  );
}
