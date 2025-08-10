import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Copy, ExternalLink, Star } from 'lucide-react';
import { toast } from 'sonner';

const PortalTable = ({ portals, onToggleFavorite }) => {
  const copyPortalUrl = async (url, name) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(`${name} URL copied to clipboard`);
    } catch (err) {
      toast.error('Failed to copy URL');
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead></TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {portals.map((portal) => (
          <TableRow key={portal.key}>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleFavorite(portal.key, portal.name)}
              >
                {portal.isFavorite ? (
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ) : (
                  <Star className="h-4 w-4" />
                )}
              </Button>
            </TableCell>
            <TableCell className="font-medium">{portal.name}</TableCell>
            <TableCell className="text-sm text-muted-foreground max-w-md">
              {portal.description}
            </TableCell>
            <TableCell>
              <Badge variant="outline">{portal.category}</Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => window.open(portal.url, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default PortalTable;