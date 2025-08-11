import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';

const PortalFilters = ({
  selectedCategory,
  setSelectedCategory,
  selectedTag,
  setSelectedTag,
  categoryCounts,
  allTags,
  allPortals,
  favorites
}) => {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="category-filter">Category</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger id="category-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories ({allPortals.length})</SelectItem>
              <SelectItem value="favorites">Favorites ({favorites.length})</SelectItem>
              <Separator />
              {Object.entries(categoryCounts).map(([category, count]) => (
                <SelectItem key={category} value={category.toLowerCase()}>
                  {category} ({count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {allTags.length > 0 && (
          <div className="flex-1">
            <Label htmlFor="tag-filter">Filter by Tag</Label>
            <Select value={selectedTag || 'all-tags'} onValueChange={(value) => setSelectedTag(value === 'all-tags' ? null : value)}>
              <SelectTrigger id="tag-filter">
                <SelectValue placeholder="All Tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-tags">All Tags</SelectItem>
                {allTags.map(tag => (
                  <SelectItem key={tag} value={tag.toLowerCase()}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {(selectedCategory !== 'all' || selectedTag) && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {selectedCategory !== 'all' && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setSelectedCategory('all')}>
              {selectedCategory} <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
          {selectedTag && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setSelectedTag(null)}>
              {selectedTag} <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default PortalFilters;