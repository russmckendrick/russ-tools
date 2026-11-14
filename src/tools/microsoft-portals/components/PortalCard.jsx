import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, Star } from 'lucide-react';
import { toast } from 'sonner';

const PortalCard = ({ portal, onToggleFavorite }) => {
  const copyPortalUrl = async (url, name) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(`${name} URL copied to clipboard`);
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  const tags = (portal.tags ?? []).filter((tag) => tag !== portal.category).slice(0, 2);

  return (
    <Card className="flex flex-col hover:border-outline-strong">
      <CardHeader className="flex-1 border-b-0 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate">{portal.name}</CardTitle>
            <CardDescription className="line-clamp-2">{portal.description}</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="-mr-2 -mt-1 shrink-0"
            aria-pressed={portal.isFavorite}
            aria-label={`${portal.isFavorite ? 'Remove' : 'Add'} ${portal.name} ${portal.isFavorite ? 'from' : 'to'} favourites`}
            onClick={() => onToggleFavorite(portal.key, portal.name)}
          >
            <Star className={portal.isFavorite ? 'fill-[var(--cat)] text-[var(--cat)]' : undefined} aria-hidden="true" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline">{portal.category}</Badge>
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex gap-2">
          <Button asChild size="sm" className="flex-1">
            <a href={portal.url} target="_blank" rel="noopener noreferrer">
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
      </CardContent>
    </Card>
  );
};

export default PortalCard;
