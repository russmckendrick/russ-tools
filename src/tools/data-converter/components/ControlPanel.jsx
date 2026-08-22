import React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
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
  // The card used to open with "Data Converter" and "Convert between JSON,
  // YAML, and TOML formats with validation" — the tool's own name and
  // description, restated directly beneath the page's h1 and its
  // shortDescription, in both apps. What is left is what the card is
  // actually for: the three dialogs.
  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-end">
          <div className="flex flex-wrap items-center gap-2">
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