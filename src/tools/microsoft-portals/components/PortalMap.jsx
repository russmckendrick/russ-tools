import React from 'react';
import { TreeDiagram } from '@/components/ui/tree-diagram';

/** "powerPlatform" and "power-platform" both read as "Power platform". */
const title = (key) => {
  const words = key.replace(/[-_]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/**
 * The catalogue at a glance: the tenant, and under it each family of portals
 * with how many links it holds. The list below is the catalogue itself.
 *
 * @param {object} props
 * @param {Record<string, Record<string, object>>} props.portalLinks
 * @param {string} [props.tenant] what to call the tenant
 */
export default function PortalMap({ portalLinks, tenant }) {
  const sections = Object.entries(portalLinks ?? {}).filter(([, section]) => Object.keys(section).length > 0);
  if (sections.length === 0) return null;
  const total = sections.reduce((sum, [, section]) => sum + Object.keys(section).length, 0);

  return (
    <TreeDiagram
      label="Portal families available for this tenant"
      root={{
        id: 'tenant',
        label: tenant || 'Tenant',
        sub: `${total} portals`,
        tone: 'accent',
        children: sections.map(([key, section]) => {
          const count = Object.keys(section).length;
          return { id: key, label: title(key), sub: `${count} portal${count === 1 ? '' : 's'}` };
        }),
      }}
    />
  );
}
