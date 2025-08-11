import React from 'react';
import { Card, CardContent } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Download, Star, FileText, FileJson, Code } from 'lucide-react';

const ExportOptionsShadcn = ({ query, onSave, onAddToFavorites }) => {
  if (!query) {
    return null;
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onAddToFavorites}
          >
            <Star className="w-4 h-4 mr-2" />
            Add to Favorites
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSave('txt')}
          >
            <FileText className="w-4 h-4 mr-2" />
            Save as .txt
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSave('kql')}
          >
            <Code className="w-4 h-4 mr-2" />
            Save as .kql
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSave('json')}
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