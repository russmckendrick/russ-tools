import { createToolIcon } from '@/components/ui/tool-icon';

/**
 * Drawn once, in src/shell/icons.mjs, and shared with the prerendered shell —
 * so the icon in the page header and the icon inside the tool are the same
 * picture. This wrapper existed to rename a @tabler glyph; it now exists only
 * so the tool's existing import sites keep working, and goes away at its port.
 */
const CronIcon = createToolIcon('clock');

export default CronIcon;
