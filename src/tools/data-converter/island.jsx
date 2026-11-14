import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { loadPrismLanguages } from '@/utils/prismLoader';
import { createToolStorage } from '@/core';

// Import validation utilities
import {
  validateAs,
  validateWithPreference,
  validateWithSchema,
  commonSchemas
} from './lib/validation';
import { FILE_EXTENSIONS, serialise } from './lib/convert';

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
  maxHistoryItems: 50,
  csvDelimiter: 'auto',
  inferTypes: true
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
  const [conversionError, setConversionError] = useState(null);

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
    loadPrismLanguages(['json', 'yaml', 'toml', 'csv', 'xml']);
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
      setConversionError(null);
      return;
    }

    if (!settings.enableValidation) return;

    const timer = setTimeout(() => {
      const result = validateWithPreference(inputFormat, inputData, parseOptions);
      setValidationResult(result);
      setDetectedFormat(result.detectedFormat || null);

      if (result.success && result.detectedFormat && settings.autoDetectFormat) {
        convertData(result.data, result.detectedFormat, outputFormat, { recordHistory: false });
      } else if (!result.success) {
        setConversionError(null);
      }
    }, VALIDATE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [inputData, inputFormat, settings.enableValidation, settings.autoDetectFormat, settings.prettifyOutput, settings.csvDelimiter, settings.inferTypes, outputFormat]); // eslint-disable-line react-hooks/exhaustive-deps

  const parseOptions = { csvDelimiter: settings.csvDelimiter, inferTypes: settings.inferTypes };

  // Convert data function. Returns whether the conversion worked. A refusal
  // (nested data as CSV, no single root for XML) is shown beside the output
  // and only toasted when the user pressed Convert, so typing does not
  // raise a toast per pause.
  const convertData = (data, fromFormat, toFormat, { recordHistory = true } = {}) => {
    if (data === null || data === undefined) return false;

    try {
      const converted = serialise(data, toFormat, {
        prettifyOutput: settings.prettifyOutput,
        csvDelimiter: settings.csvDelimiter
      });

      setOutputData(converted);
      setConversionError(null);

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

      return true;
    } catch (error) {
      if (recordHistory) toast.error(`Conversion failed: ${error.message}`);
      setOutputData('');
      setConversionError({ format: toFormat, message: error.message });

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

      return false;
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
      const chosenFormat = inputFormat === 'auto' ? detectedFormat : inputFormat;
      const parseResult = validateAs(chosenFormat, inputData, parseOptions);
      const actualInputFormat = parseResult.detectedFormat || chosenFormat;

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

      if (convertData(parseResult.data, actualInputFormat, outputFormat)) {
        toast.success(`Successfully converted ${actualInputFormat || 'detected format'} to ${outputFormat.toUpperCase()}`);
      }

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
    if (FILE_EXTENSIONS[extension]) {
      setInputFormat(FILE_EXTENSIONS[extension]);
    }
  };

  // Clear input data
  const handleClear = () => {
    setInputData('');
    setOutputData('');
    setValidationResult(null);
    setDetectedFormat(null);
    setConversionError(null);
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
        conversionError={conversionError}
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
