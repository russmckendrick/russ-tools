import React from 'react';
import { Globe, Info, Network, Server } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

/**
 * How a WHOIS record is presented — the icon, the badge and the date format
 * for a record type.
 *
 * Their own file because three callers want the same answer: the result
 * panel, the lookup history in the island, and the empty-state ghost that
 * renders the panel before anything is looked up. They started as closures
 * inside the tool's function body, which meant the history and the result
 * could in principle have drifted apart; now they cannot.
 */

export const getTypeIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'domain':
      return <Globe className="h-4 w-4" />;
    case 'ip':
      return <Server className="h-4 w-4" />;
    case 'network':
      return <Network className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
};

export const getTypeBadge = (type) => {
  const colors = {
    domain: 'bg-info-subtle text-info',
    ip: 'bg-success-subtle text-success',
    network: 'bg-[color-mix(in_oklab,var(--cat)_13%,transparent)] text-[var(--cat)]'
  };

  return (
    <Badge className={colors[type?.toLowerCase()] || 'bg-surface-inset text-on-surface'}>
      {type || 'Unknown'}
    </Badge>
  );
};

/** The timestamp format the history and the result panel share. */
export const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown';
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
