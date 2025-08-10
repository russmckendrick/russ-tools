import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Alert, AlertDescription } from '../../../ui/alert';
import { Info, Construction } from 'lucide-react';

const TemplateEditorShadcn = ({ onTemplateCreate, onTemplateUpdate }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Construction className="w-5 h-5" />
          Template Editor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Template editor functionality is available in the full version.
            This simplified version focuses on using existing templates.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default TemplateEditorShadcn;