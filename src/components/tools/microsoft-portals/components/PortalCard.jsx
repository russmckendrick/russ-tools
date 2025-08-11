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
    } catch (err) {
      toast.error('Failed to copy URL');
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{portal.name}</CardTitle>
            <CardDescription className="text-sm line-clamp-2">
              {portal.description}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="flex-shrink-0 ml-2"
            onClick={() => onToggleFavorite(portal.key, portal.name)}
          >
            {portal.isFavorite ? (
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            ) : (
              <Star className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs">
              {portal.category}
            </Badge>
            {portal.tags && portal.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => window.open(portal.url, '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-2" />
              Open
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyPortalUrl(portal.url, portal.name)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortalCard;