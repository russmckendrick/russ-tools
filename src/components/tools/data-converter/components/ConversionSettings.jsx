import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { commonSchemas } from '../validation';

const ConversionSettings = ({ 
  settings, 
  onSettingsChange, 
  isOpen, 
  onOpenChange 
}) => {
  const updateSetting = (key, value) => {
    onSettingsChange(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Conversion Settings</DialogTitle>
          <DialogDescription>
            Customize the data conversion behavior
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Validation Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Validation</CardTitle>
              <CardDescription className="text-sm">
                Configure validation behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-validation" className="text-sm font-medium">
                  Enable Validation
                </Label>
                <Switch
                  id="enable-validation"
                  checked={settings.enableValidation}
                  onCheckedChange={(checked) => updateSetting('enableValidation', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="schema-validation" className="text-sm font-medium">
                  Schema Validation
                </Label>
                <Switch
                  id="schema-validation"
                  checked={settings.enableSchemaValidation}
                  onCheckedChange={(checked) => updateSetting('enableSchemaValidation', checked)}
                  disabled={!settings.enableValidation}
                />
              </div>
              
              {settings.enableSchemaValidation && (
                <div className="space-y-2">
                  <Label htmlFor="schema-select" className="text-sm font-medium">
                    Schema Type
                  </Label>
                  <Select 
                    value={settings.selectedSchema} 
                    onValueChange={(value) => updateSetting('selectedSchema', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(commonSchemas).map(([key, schema]) => (
                        <SelectItem key={key} value={key}>
                          {schema.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Format Detection Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Format Detection</CardTitle>
              <CardDescription className="text-sm">
                Automatic format detection options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-detect" className="text-sm font-medium">
                  Auto Detect Format
                </Label>
                <Switch
                  id="auto-detect"
                  checked={settings.autoDetectFormat}
                  onCheckedChange={(checked) => updateSetting('autoDetectFormat', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="prettify-output" className="text-sm font-medium">
                  Prettify Output
                </Label>
                <Switch
                  id="prettify-output"
                  checked={settings.prettifyOutput}
                  onCheckedChange={(checked) => updateSetting('prettifyOutput', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* History Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">History</CardTitle>
              <CardDescription className="text-sm">
                Conversion history management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-history" className="text-sm font-medium">
                  Enable History
                </Label>
                <Switch
                  id="enable-history"
                  checked={settings.enableHistory}
                  onCheckedChange={(checked) => updateSetting('enableHistory', checked)}
                />
              </div>
              
              {settings.enableHistory && (
                <div className="space-y-2">
                  <Label htmlFor="max-history" className="text-sm font-medium">
                    Max History Items
                  </Label>
                  <Select 
                    value={settings.maxHistoryItems.toString()} 
                    onValueChange={(value) => updateSetting('maxHistoryItems', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 items</SelectItem>
                      <SelectItem value="25">25 items</SelectItem>
                      <SelectItem value="50">50 items</SelectItem>
                      <SelectItem value="100">100 items</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConversionSettings;