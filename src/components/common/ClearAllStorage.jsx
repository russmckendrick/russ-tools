import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Shield, TriangleAlert, Trash2 } from 'lucide-react';

export default function ClearAllStorage() {
  const [cleared, setCleared] = useState(false);
  const [open, setOpen] = useState(false);

  const handleClear = () => {
    localStorage.clear();
    setCleared(true);
    close();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            Storage Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Manage locally stored data across all tools. All data is stored locally in your browser and never sent to external servers.
          </p>
          <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
            <li>Azure naming tool configurations</li>
            <li>Data converter history</li>
            <li>DNS/WHOIS lookup history and cache</li>
            <li>Network designer saved networks</li>
            <li>Tool preferences and settings</li>
          </ul>
          <Separator />
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-red-600 font-medium mb-2">
                <TriangleAlert className="h-4 w-4" />
                Danger Zone
              </div>
              <p className="text-sm text-muted-foreground">
                Clear all locally stored data permanently. This action cannot be undone.
              </p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" disabled={cleared}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {cleared ? 'Storage Cleared' : 'Clear All Data'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-red-600">
                    <TriangleAlert className="h-4 w-4" />
                    Confirm Data Deletion
                  </DialogTitle>
                </DialogHeader>
                <Alert variant="destructive">
                  <AlertDescription className="text-sm">
                    You are about to permanently delete all locally stored data for all RussTools. This includes all history, cache, configurations, and preferences.
                  </AlertDescription>
                </Alert>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={() => { handleClear(); setOpen(false); }}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Yes, Clear All Data
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {cleared && (
            <Alert className="mt-4">
              <AlertDescription className="text-sm">
                All locally stored data has been permanently removed. You can refresh the page or continue using the tools with a clean slate.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
