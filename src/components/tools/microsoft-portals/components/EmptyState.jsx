import React from 'react';
import { AlertCircle } from 'lucide-react';

const EmptyState = ({ allPortals }) => {
  return (
    <div className="text-center py-12">
      <div className="mx-auto mb-3 h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
        <AlertCircle className="h-5 w-5 text-primary" />
      </div>
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