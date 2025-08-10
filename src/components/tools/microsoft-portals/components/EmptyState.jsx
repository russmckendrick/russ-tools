import React from 'react';
import { AlertCircle } from 'lucide-react';

const EmptyState = ({ allPortals }) => {
  return (
    <div className="text-center py-12">
      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">No portals found</h3>
      <p className="text-muted-foreground">
        {allPortals.length === 0 
          ? 'Search for a tenant to see available portals'
          : 'Try adjusting your filters or search terms'
        }
      </p>
    </div>
  );
};

export default EmptyState;