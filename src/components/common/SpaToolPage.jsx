import React from 'react';
import SEOHead from './SEOHead';
import ToolHeader from './ToolHeader';
import { generateToolSEO } from '@/utils/seoUtils';
import toolsConfig from '@/utils/toolsConfig.json';
import { TOOLS_BY_ID } from '@/tools/registry.mjs';

/**
 * The SPA's page furniture for a *ported* tool.
 *
 * A ported tool renders no SEOHead and no ToolHeader of its own — under the
 * Astro shell, ToolLayout owns all of that, prerendered from the manifest.
 * But the SPA is still what production serves, so until cutover this wrapper
 * supplies the same furniture from the same manifest, once, instead of every
 * ported tool keeping a private copy of the ritual it just deleted.
 *
 * Dies with the rest of the SPA chrome at cutover.
 */

// React.lazy identity must be stable across renders or the island remounts
// (and loses its state) on every parent render.
const islandByTool = new Map();

function islandFor(tool) {
  let Island = islandByTool.get(tool.id);
  if (!Island) {
    Island = React.lazy(tool.island);
    islandByTool.set(tool.id, Island);
  }
  return Island;
}

/** @param {{ toolId: string }} props */
export default function SpaToolPage({ toolId }) {
  const tool = TOOLS_BY_ID[toolId];
  if (!tool) throw new Error(`SpaToolPage: no manifest for "${toolId}"`);

  const Island = islandFor(tool);
  const seoData = generateToolSEO(toolsConfig.find((t) => t.id === toolId));

  return (
    <>
      <SEOHead {...seoData} />
      <div className="space-y-6">
        <ToolHeader
          toolId={toolId}
          title={tool.title}
          description={tool.shortDescription}
          showTitle={false}
          standalone={true}
        />
        <Island />
      </div>
    </>
  );
}
