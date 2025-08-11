import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../ui/dialog';
import { Trash2, History } from 'lucide-react';
import { useAzureNamingContextShadcn } from './context/AzureNamingContextShadcn';
import { toast } from 'sonner';

const NamingHistoryShadcn = () => {
  const { namingHistory, setFormState, setPendingLoad, resourceTypes, setNamingHistory } = useAzureNamingContextShadcn();
  const [deleteId, setDeleteId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLoadConfiguration = (configuration) => {
    setFormState(configuration);
    setPendingLoad(true);
    toast.success('Configuration Loaded', {
      description: `Loaded naming configuration for "${configuration.workload || 'Unnamed Workload'}"`,
      icon: <History size={16} />
    });
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    if (deleteId) {
      setNamingHistory(prev => prev.filter(item => item.id !== deleteId));
      toast.success('Name Deleted', {
        description: 'Saved name configuration removed from history',
        icon: <Trash2 size={16} />
      });
    }
    setShowConfirm(false);
    setDeleteId(null);
  };

  const getResourceTypeLabel = (value) => {
    const found = resourceTypes.find(rt => rt.value === value);
    return found ? found.label.replace(/ \([^)]+\)$/, '') : value;
  };

  if (namingHistory.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-3">
        {namingHistory.map((item) => (
          <div 
            key={item.id} 
            className="flex items-center justify-between p-4 border rounded-lg bg-card"
          >
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-blue-600 truncate">
                {item.configuration?.workload || 'Unnamed Workload'}
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                {item.group && Array.isArray(item.group)
                  ? item.group.map((g, idx) => getResourceTypeLabel(g.resourceType)).join(', ')
                  : ''}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(item.timestamp).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleLoadConfiguration(item.configuration)}
              >
                Load
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(item.id)}
                className="text-destructive hover:text-destructive"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Name?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this name? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NamingHistoryShadcn;