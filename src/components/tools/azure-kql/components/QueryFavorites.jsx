import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Badge } from '../../../ui/badge';
import { Alert, AlertDescription } from '../../../ui/alert';
import { 
  Star, 
  Search, 
  Upload, 
  Trash2,
  Edit,
  Database,
  Info,
  Tag
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../ui/dialog';
import { Label } from '../../../ui/label';
import { Textarea } from '../../../ui/textarea';

const QueryFavorites = ({ favorites, onLoad, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFavorite, setEditingFavorite] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', tags: '' });

  const filteredFavorites = favorites.filter(fav => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      fav.name?.toLowerCase().includes(search) ||
      fav.description?.toLowerCase().includes(search) ||
      fav.service?.toLowerCase().includes(search) ||
      fav.template?.toLowerCase().includes(search) ||
      fav.tags?.some(tag => tag.toLowerCase().includes(search))
    );
  });

  const handleEditStart = (favorite) => {
    setEditingFavorite(favorite);
    setEditForm({
      name: favorite.name || '',
      description: favorite.description || '',
      tags: favorite.tags?.join(', ') || ''
    });
  };

  const handleEditSave = () => {
    if (!editingFavorite) return;
    
    const updatedFavorite = {
      ...editingFavorite,
      name: editForm.name,
      description: editForm.description,
      tags: editForm.tags.split(',').map(t => t.trim()).filter(Boolean)
    };
    
    onDelete(editingFavorite.id);
    setTimeout(() => {
      favorites.push(updatedFavorite);
    }, 100);
    
    setEditingFavorite(null);
  };

  if (favorites.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Favorites
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              No favorite queries yet. Click the star icon after generating a query to save it here.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Favorites
            </div>
            <Badge variant="secondary">{favorites.length} saved</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search favorites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid gap-3">
            {filteredFavorites.map((favorite) => (
              <div 
                key={favorite.id}
                className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{favorite.name}</span>
                    </div>
                    {favorite.description && (
                      <p className="text-sm text-muted-foreground">
                        {favorite.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Database className="w-3 h-3" />
                      <span>{favorite.service}</span>
                      <span>•</span>
                      <span>{favorite.template}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(favorite.timestamp), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditStart(favorite)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onLoad(favorite)}
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(favorite.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {favorite.tags && favorite.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {favorite.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="bg-muted/30 p-2 rounded text-xs font-mono overflow-x-auto">
                  <pre className="whitespace-pre-wrap">
                    {favorite.query.split('\n').slice(0, 2).join('\n')}
                    {favorite.query.split('\n').length > 2 && '\n...'}
                  </pre>
                </div>
              </div>
            ))}
          </div>

          {filteredFavorites.length === 0 && searchTerm && (
            <Alert>
              <AlertDescription>
                No favorites found matching "{searchTerm}"
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingFavorite} onOpenChange={() => setEditingFavorite(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Favorite</DialogTitle>
            <DialogDescription>
              Update the name, description, and tags for this favorite query.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="My favorite query"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="What this query does..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={editForm.tags}
                onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                placeholder="security, monitoring, performance"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingFavorite(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditSave}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QueryFavorites;