import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ConversionSettings from './ConversionSettings';
import ConversionHistory from './ConversionHistory';
import SamplesDialog from './SamplesDialog';

const ControlPanel = ({
  settings,
  onSettingsChange,
  isSettingsOpen,
  setIsSettingsOpen,
  conversionHistory,
  isHistoryOpen,
  setIsHistoryOpen,
  onLoadFromHistory,
  onClearHistory,
  isSamplesOpen,
  setIsSamplesOpen,
  onLoadSample
}) => {
  return (
    <Card className="mb-6 relative rounded-xl shadow-sm ring-1 ring-border/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Data Converter</CardTitle>
            <CardDescription>
              Convert between JSON, YAML, and TOML formats with validation
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <SamplesDialog
              isOpen={isSamplesOpen}
              onOpenChange={setIsSamplesOpen}
              onLoadSample={onLoadSample}
            />
            
            <ConversionHistory
              conversionHistory={conversionHistory}
              isOpen={isHistoryOpen}
              onOpenChange={setIsHistoryOpen}
              onLoadFromHistory={onLoadFromHistory}
              onClearHistory={onClearHistory}
            />
            
            <ConversionSettings
              settings={settings}
              onSettingsChange={onSettingsChange}
              isOpen={isSettingsOpen}
              onOpenChange={setIsSettingsOpen}
            />
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};

export default ControlPanel;