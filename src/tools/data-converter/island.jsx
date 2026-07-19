import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { loadPrismLanguages } from '@/utils/prismLoader';
import yaml from 'js-yaml';
import * as TOML from '@ltd/j-toml';
import { createToolStorage } from '@/core';

// Import validation utilities
import {
  validateJSON,
  validateYAML,
  validateTOML,
  validateWithDetection,
  validateWithSchema,
  commonSchemas
} from './lib/validation';

// Import components
import ControlPanel from './components/ControlPanel';
import ConversionForm from './components/ConversionForm';
import ValidationDisplay from './components/ValidationDisplay';

const DEFAULT_SETTINGS = {
  enableValidation: true,
  enableSchemaValidation: false,
  selectedSchema: 'user',
  autoDetectFormat: true,
  prettifyOutput: true,
  enableHistory: true,
  maxHistoryItems: 50
};

/** Typing pauses this long before the input is re-parsed. */
const VALIDATE_DEBOUNCE_MS = 300;

const DataConverterTool = () => {
  const storage = useMemo(() => createToolStorage('data-converter'), []);

  // Core state
  const [inputData, setInputData] = useState('');
  const [outputData, setOutputData] = useState('');
  const [inputFormat, setInputFormat] = useState('auto');
  const [outputFormat, setOutputFormat] = useState('json');
  const [validationResult, setValidationResult] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [detectedFormat, setDetectedFormat] = useState(null);

  // Settings
  const [settings, setSettings] = useState(() => ({
    ...DEFAULT_SETTINGS,
    ...(storage.get('settings', { fallback: {}, legacy: 'dataConverter_settings' }) || {}),
  }));

  // UI state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSamplesOpen, setIsSamplesOpen] = useState(false);

  // History
  const [conversionHistory, setConversionHistory] = useState(() => {
    const saved = storage.get('history', { fallback: [], legacy: 'dataConverter_history' });
    return Array.isArray(saved) ? saved : [];
  });

  // Preload PrismJS languages for better performance
  useEffect(() => {
    loadPrismLanguages(['json', 'yaml', 'toml']);
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    storage.set('settings', settings);
  }, [storage, settings]);

  // Save history to localStorage
  useEffect(() => {
    if (settings.enableHistory) {
      storage.set('history', conversionHistory);
    }
  }, [storage, conversionHistory, settings.enableHistory]);

  // Format detection and validation — debounced, so typing re-parses the
  // input once per pause instead of on every keystroke, and the auto-convert
  // path records no history (only the Convert button does — the old
  // behaviour wrote the full history array to localStorage per keystroke).
  useEffect(() => {
    if (!inputData.trim()) {
      setValidationResult(null);
      setDetectedFormat(null);
      setOutputData('');
      return;
    }

    if (!settings.enableValidation) return;

    const timer = setTimeout(() => {
      const result = validateWithDetection(inputData);
      setValidationResult(result);
      setDetectedFormat(result.detectedFormat || null);

      if (result.success && result.detectedFormat && settings.autoDetectFormat) {
        convertData(result.data, result.detectedFormat, outputFormat, { recordHistory: false });
      }
    }, VALIDATE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [inputData, settings.enableValidation, settings.autoDetectFormat, outputFormat]); // eslint-disable-line react-hooks/exhaustive-deps

  // Convert data function
  const convertData = (data, fromFormat, toFormat, { recordHistory = true } = {}) => {
    if (!data) return;

    try {
      let converted = '';

      switch (toFormat) {
        case 'json':
          converted = settings.prettifyOutput
            ? JSON.stringify(data, null, 2)
            : JSON.stringify(data);
          break;

        case 'yaml':
          converted = yaml.dump(data, {
            indent: settings.prettifyOutput ? 2 : 0,
            lineWidth: -1,
            noRefs: true,
            sortKeys: false
          });
          break;

        case 'toml':
          converted = TOML.stringify(data, {
            indent: settings.prettifyOutput ? 2 : 0,
            newline: '\n'
          });
          break;

        default:
          throw new Error(`Unsupported output format: ${toFormat}`);
      }

      setOutputData(converted);

      if (recordHistory && settings.enableHistory) {
        addToHistory({
          inputData: inputData,
          outputData: converted,
          inputFormat: fromFormat || detectedFormat,
          outputFormat: toFormat,
          timestamp: Date.now(),
          success: true
        });
      }

    } catch (error) {
      toast.error(`Conversion failed: ${error.message}`);
      setOutputData('');

      if (recordHistory && settings.enableHistory) {
        addToHistory({
          inputData: inputData,
          error: error.message,
          inputFormat: fromFormat || detectedFormat,
          outputFormat: toFormat,
          timestamp: Date.now(),
          success: false
        });
      }
    }
  };

  // Manual conversion trigger
  const handleConvert = () => {
    if (!inputData.trim()) {
      toast.error('Please enter some data to convert');
      return;
    }

    setIsConverting(true);

    try {
      let parseResult;
      const actualInputFormat = inputFormat === 'auto' ? detectedFormat : inputFormat;

      // Parse input based on format
      switch (actualInputFormat) {
        case 'json':
          parseResult = validateJSON(inputData);
          break;
        case 'yaml':
          parseResult = validateYAML(inputData);
          break;
        case 'toml':
          parseResult = validateTOML(inputData);
          break;
        default:
          parseResult = validateWithDetection(inputData);
      }

      if (!parseResult.success) {
        throw new Error(parseResult.errors[0]?.message || 'Failed to parse input data');
      }

      // Schema validation if enabled
      if (settings.enableSchemaValidation && settings.selectedSchema) {
        const schema = commonSchemas[settings.selectedSchema];
        if (schema) {
          const schemaResult = validateWithSchema(parseResult.data, schema);
          if (!schemaResult.success) {
            toast.warning(`Schema validation failed: ${schemaResult.errors[0]?.message || 'Unknown error'}`);
          }
        }
      }

      convertData(parseResult.data, actualInputFormat, outputFormat);
      toast.success(`Successfully converted ${actualInputFormat || 'detected format'} to ${outputFormat.toUpperCase()}`);

    } catch (error) {
      toast.error(`Conversion failed: ${error.message}`);
    } finally {
      setIsConverting(false);
    }
  };

  // History management
  const addToHistory = (entry) => {
    setConversionHistory(prev => {
      const newHistory = [entry, ...prev].slice(0, settings.maxHistoryItems);
      return newHistory;
    });
  };

  const clearHistory = () => {
    setConversionHistory([]);
    storage.set('history', []);
    toast.success('History cleared');
  };

  const loadFromHistory = (entry) => {
    if (entry.success) {
      setInputData(entry.inputData);
      setOutputData(entry.outputData);
      setInputFormat(entry.inputFormat);
      setOutputFormat(entry.outputFormat);
      toast.success('Loaded from history');
    }
  };

  // Sample data loading
  const loadSample = (data, format) => {
    setInputData(data);
    setInputFormat(format);
    toast.success(`Loaded sample data`);
  };

  // File upload handler
  const handleFileUpload = (file) => {
    // Auto-detect format from file extension
    const extension = file.name.toLowerCase().split('.').pop();
    const formatMap = {
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
      'toml': 'toml'
    };

    if (formatMap[extension]) {
      setInputFormat(formatMap[extension]);
    }
  };

  // Clear input data
  const handleClear = () => {
    setInputData('');
    setOutputData('');
    setValidationResult(null);
    setDetectedFormat(null);
    toast.success('Data cleared');
  };

  return (
    <div className="space-y-6">
      <ControlPanel
        settings={settings}
        onSettingsChange={setSettings}
        isSettingsOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        conversionHistory={conversionHistory}
        isHistoryOpen={isHistoryOpen}
        setIsHistoryOpen={setIsHistoryOpen}
        onLoadFromHistory={loadFromHistory}
        onClearHistory={clearHistory}
        isSamplesOpen={isSamplesOpen}
        setIsSamplesOpen={setIsSamplesOpen}
        onLoadSample={loadSample}
      />

      <ConversionForm
        inputData={inputData}
        setInputData={setInputData}
        outputData={outputData}
        inputFormat={inputFormat}
        setInputFormat={setInputFormat}
        outputFormat={outputFormat}
        setOutputFormat={setOutputFormat}
        detectedFormat={detectedFormat}
        isConverting={isConverting}
        onConvert={handleConvert}
        onClear={handleClear}
        onFileUpload={handleFileUpload}
        validationResult={validationResult}
      />

      {(validationResult || detectedFormat) && (
        <ValidationDisplay
          validationResult={validationResult}
          detectedFormat={detectedFormat}
        />
      )}
    </div>
  );
};

export default DataConverterTool;
