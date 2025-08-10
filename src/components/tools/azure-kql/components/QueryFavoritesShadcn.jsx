import React from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { Star, FileText, Trash2, Clock } from 'lucide-react';
// Simple time ago formatter
const formatTimeAgo = (date) => {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};
import { toast } from 'sonner';

const QueryFavoritesShadcn = ({ 
  onLoadQuery,
  currentQuery,
  currentService,
  currentTemplate,
  currentParameters 
}) => {
  const [favorites, setFavorites] = useLocalStorage({
    key: 'azure-kql-favorites',
    defaultValue: []
  });

  const removeFavorite = (id) => {
    setFavorites(prev => prev.filter(fav => fav.id !== id));
    toast.success('Removed from favorites');
  };

  if (!favorites || favorites.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Favorite Queries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No favorite queries yet. Click the star icon to save queries.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {favorites.map((favorite) => (
        <Card key={favorite.id}>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium">{favorite.name}</h4>
                  <p className="text-sm text-muted-foreground">{favorite.description}</p>
                  <div className="flex items-center gap-2">
                    {favorite.tags?.map(tag => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(new Date(favorite.timestamp))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onLoadQuery(favorite)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Load
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFavorite(favorite.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
                <code>{favorite.query.substring(0, 200)}...</code>
              </pre>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default QueryFavoritesShadcn;