import React from 'react';
import { TreeDiagram } from '@/components/ui/tree-diagram';

/**
 * The tenant and what hangs off it: the domain that was looked up, the
 * tenant's default domain, how it signs people in and what kind of tenant it
 * is. Fields the lookup did not return are left out rather than drawn empty.
 *
 * Every node restates a field of the table beneath it.
 *
 * @param {{ data: object }} props the tenant lookup result
 */
export default function TenantMap({ data }) {
  if (!data?.tenantId) return null;

  const children = [];
  if (data.domain) children.push({ id: 'domain', label: data.domain, sub: 'looked up', edge: 'owns' });
  if (data.defaultDomainName && data.defaultDomainName !== data.domain) {
    children.push({ id: 'default', label: data.defaultDomainName, sub: 'default domain', edge: 'owns' });
  }
  if (data.federationBrandName) {
    children.push({ id: 'identity', label: data.federationBrandName, sub: 'federated sign-in', edge: 'signs in with' });
  } else if (data.isCloudOnly !== undefined) {
    children.push({
      id: 'identity',
      label: data.isCloudOnly ? 'Microsoft Entra ID' : 'Hybrid identity',
      sub: data.isCloudOnly ? 'cloud only' : 'synchronised',
      edge: 'signs in with',
    });
  }
  if (data.tenantType) {
    children.push({ id: 'type', label: data.tenantType, sub: data.tenantCategory || 'tenant type', tone: 'muted', edge: 'is' });
  }

  return (
    <TreeDiagram
      className="mb-4"
      label={`The Microsoft tenant behind ${data.domain ?? 'this domain'}`}
      root={{
        id: 'tenant',
        label: data.displayName || 'Tenant',
        sub: data.tenantId,
        tone: 'accent',
        children,
      }}
    />
  );
}
