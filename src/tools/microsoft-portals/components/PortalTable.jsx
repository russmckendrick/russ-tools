import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, Star } from 'lucide-react';
import { toast } from 'sonner';

const PortalTable = ({ portals, onToggleFavorite }) => {
  const copyPortalUrl = async (url, name) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(`${name} URL copied to clipboard`);
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  return (
    <ul className="border-t border-outline">
      {portals.map((portal) => (
        <li
          key={portal.key}
          className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 border-b border-outline py-2 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:gap-x-3"
        >
          <Button
            variant="ghost"
            size="icon"
            aria-pressed={portal.isFavorite}
            aria-label={`${portal.isFavorite ? 'Remove' : 'Add'} ${portal.name} ${portal.isFavorite ? 'from' : 'to'} favourites`}
            onClick={() => onToggleFavorite(portal.key, portal.name)}
          >
            <Star className={portal.isFavorite ? 'fill-[var(--cat)] text-[var(--cat)]' : undefined} aria-hidden="true" />
          </Button>
          <div className="min-w-0">
            <p className="truncate text-body-md font-medium text-on-surface">{portal.name}</p>
            <p className="truncate text-body-sm text-on-surface-muted">{portal.description}</p>
          </div>
          <Badge variant="outline" className="max-sm:hidden">{portal.category}</Badge>
          <div className="flex items-center gap-1.5">
            <Button asChild size="sm">
              <a href={portal.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${portal.name}`}>
                <ExternalLink aria-hidden="true" />
                Open
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              aria-label={`Copy the ${portal.name} URL`}
              onClick={() => copyPortalUrl(portal.url, portal.name)}
            >
              <Copy aria-hidden="true" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default PortalTable;
