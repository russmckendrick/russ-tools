import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye } from 'lucide-react';
import { JSON_SAMPLES, YAML_SAMPLES, TOML_SAMPLES } from '../samples';

const SamplesDialog = ({ 
  isOpen, 
  onOpenChange, 
  onLoadSample 
}) => {
  const loadSample = (format, key) => {
    let samples;
    switch (format) {
      case 'json':
        samples = JSON_SAMPLES;
        break;
      case 'yaml':
        samples = YAML_SAMPLES;
        break;
      case 'toml':
        samples = TOML_SAMPLES;
        break;
      default:
        return;
    }
    
    const sample = samples[key];
    if (sample) {
      onLoadSample(sample.data, format);
      onOpenChange(false);
    }
  };

  const renderSampleButtons = (samples, format) => {
    return Object.entries(samples).map(([key, sample]) => (
      <Button
        key={key}
        variant="outline"
        className="w-full justify-start h-auto p-4"
        onClick={() => loadSample(format, key)}
      >
        <div className="text-left w-full">
          <div className="font-medium mb-1">{sample.name}</div>
          <div className="text-xs text-muted-foreground">{sample.description}</div>
        </div>
      </Button>
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Samples
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Load Sample Data</DialogTitle>
          <DialogDescription>
            Choose from predefined sample data for testing
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="json" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="json">JSON</TabsTrigger>
            <TabsTrigger value="yaml">YAML</TabsTrigger>
            <TabsTrigger value="toml">TOML</TabsTrigger>
          </TabsList>
          
          <TabsContent value="json" className="space-y-2 mt-4">
            {renderSampleButtons(JSON_SAMPLES, 'json')}
          </TabsContent>
          
          <TabsContent value="yaml" className="space-y-2 mt-4">
            {renderSampleButtons(YAML_SAMPLES, 'yaml')}
          </TabsContent>
          
          <TabsContent value="toml" className="space-y-2 mt-4">
            {renderSampleButtons(TOML_SAMPLES, 'toml')}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SamplesDialog;