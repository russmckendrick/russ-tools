import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Download, Star, FileText, FileJson, Code, Save } from 'lucide-react';

const ExportOptionsShadcn = ({ query, onSave, onAddToFavorites }) => {
  if (!query) {
    return null;
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Save className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          Export & Save Options
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onAddToFavorites}
            className="h-10 justify-start"
          >
            <Star className="w-4 h-4 mr-2" />
            Add to Favorites
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSave('txt')}
            className="h-10 justify-start"
          >
            <FileText className="w-4 h-4 mr-2" />
            Save as .txt
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSave('kql')}
            className="h-10 justify-start"
          >
            <Code className="w-4 h-4 mr-2" />
            Save as .kql
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSave('json')}
            className="h-10 justify-start"
          >
            <FileJson className="w-4 h-4 mr-2" />
            Save as .json
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExportOptionsShadcn;