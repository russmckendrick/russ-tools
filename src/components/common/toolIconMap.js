import { createToolIcon } from '@/components/ui/tool-icon';
import { TOOLS } from '@/tools/registry.mjs';
import toolsConfig from '@/utils/toolsConfig.json';

/**
 * toolsConfig.json names icons by wrapper ("Base64Icon"); the manifests name
 * the drawing itself ('braces'). This map joins the two so the SPA chrome —
 * ToolHeader, Sidebar, NewHomeView — resolves every tool icon from the shared
 * bespoke set without importing fifteen per-tool wrapper files. Those wrappers
 * are deleted tool-by-tool as each tool ports; this map, like the rest of the
 * SPA chrome, dies at cutover.
 *
 * Non-tool glyphs (category markers, the GitHub link) are not tool icons and
 * stay with their layouts.
 */
export const toolIconByKey = Object.fromEntries(
  toolsConfig.flatMap((entry) => {
    const manifest = TOOLS.find((t) => t.id === entry.id);
    return manifest ? [[entry.icon, createToolIcon(manifest.icon)]] : [];
  })
);
