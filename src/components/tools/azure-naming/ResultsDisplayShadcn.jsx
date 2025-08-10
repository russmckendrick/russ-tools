import React, { useState } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Copy, Check, Download, Save } from 'lucide-react';
import { useAzureNamingContextShadcn } from './context/AzureNamingContextShadcn';
import { devError } from '../../../utils/devLog';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

const ResultsDisplayShadcn = ({ formState, validationState }) => {
  // Use a snapshot of the form state at the time of generation (if available)
  // Fallback to current formState if not present
  const generatedFormState = validationState.generatedFormState || formState;
  const { addToHistory, resourceTypes, environmentOptions, regionDropdownOptions } = useAzureNamingContextShadcn();
  const [copySuccess, setCopySuccess] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);

  const handleCopy = async () => {
    try {
      let textToCopy = '';
      if (Array.isArray(validationState.generatedName)) {
        textToCopy = validationState.generatedName.join('\n');
      } else {
        textToCopy = validationState.generatedName;
      }
      await navigator.clipboard.writeText(textToCopy);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      
      toast.success('Copied to Clipboard', {
        description: Array.isArray(validationState.generatedName) 
          ? `Copied ${validationState.generatedName.length} generated names`
          : 'Generated name copied successfully',
        icon: <Copy size={16} />
      });
    } catch (err) {
      devError('Failed to copy text: ', err);
      toast.error('Copy Failed', {
        description: 'Failed to copy to clipboard. Please try again.'
      });
    }
  };

  // Helper to get label for a resource type value
  const getResourceTypeLabel = (value) => {
    const found = resourceTypes.find(rt => rt.value === value);
    return found ? found.label.replace(/ \([^)]+\)$/, '') : value;
  };
  // Helper to get environment display name
  const getEnvironmentLabel = (value) => {
    const found = environmentOptions.find(opt => opt.value === value);
    return found ? found.label : value;
  };
  // Helper to get region display name
  const getRegionLabel = (value) => {
    const found = regionDropdownOptions.find(opt => opt.value === value);
    return found ? found.label : value;
  };

  // Export handlers (CSV/Excel) - keep as is for now
  const handleExportCSV = () => {
    const names = Array.isArray(validationState.generatedName)
      ? validationState.generatedName
      : [validationState.generatedName];
    const types = Array.isArray(formState.resourceType)
      ? formState.resourceType
      : [formState.resourceType];

    // Determine which optional columns to include
    const columns = [
      'Generated Name',
      'Resource Type',
      'Workload/Application Name',
      'Environment',
      'Region',
    ];
    if (showInstance) columns.push('Instance');
    if (showCustomPrefix) columns.push('Custom Prefix');
    if (showCustomSuffix) columns.push('Custom Suffix');
    if (showRandom) columns.push('Random Characters');

    const rows = names.map((name, idx) => {
      const row = {
        'Generated Name': name,
        'Resource Type': getResourceTypeLabel(types[idx]),
        'Workload/Application Name': formState.workload,
        'Environment': getEnvironmentLabel(formState.environment),
        'Region': getRegionLabel(formState.region),
      };
      if (showInstance) row['Instance'] = formState.instance;
      if (showCustomPrefix) row['Custom Prefix'] = formState.customPrefix;
      if (showCustomSuffix) row['Custom Suffix'] = formState.customSuffix;
      if (showRandom) row['Random Characters'] = formState.randomLength;
      return row;
    });

    const csv = [columns.join(','), ...rows.map(row => columns.map(col => `"${row[col] ?? ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'azure-resource-names.csv';
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('CSV Export Complete', {
      description: 'Azure resource names exported successfully',
      icon: <Download size={16} />
    });
  };

  const handleExportExcel = async () => {
    setExcelLoading(true);
    try {
      // Show loading toast
      toast.loading('Loading Excel Library', {
        id: 'excel-loading',
        description: 'Preparing Excel export...'
      });
      
      // Dynamically import ExcelJS only when needed
      const ExcelJS = (await import('exceljs')).default;
      
      const names = Array.isArray(validationState.generatedName)
        ? validationState.generatedName
        : [validationState.generatedName];
      const types = Array.isArray(formState.resourceType)
        ? formState.resourceType
        : [formState.resourceType];

      // Determine which optional columns to include
      const columns = [
        'Generated Name',
        'Resource Type',
        'Workload/Application Name',
        'Environment',
        'Region',
      ];
      if (showInstance) columns.push('Instance');
      if (showCustomPrefix) columns.push('Custom Prefix');
      if (showCustomSuffix) columns.push('Custom Suffix');
      if (showRandom) columns.push('Random Characters');

      const rows = names.map((name, idx) => {
        const row = {
          'Generated Name': name,
          'Resource Type': getResourceTypeLabel(types[idx]),
          'Workload/Application Name': formState.workload,
          'Environment': getEnvironmentLabel(formState.environment),
          'Region': getRegionLabel(formState.region),
        };
        if (showInstance) row['Instance'] = formState.instance;
        if (showCustomPrefix) row['Custom Prefix'] = formState.customPrefix;
        if (showCustomSuffix) row['Custom Suffix'] = formState.customSuffix;
        if (showRandom) row['Random Characters'] = formState.randomLength;
        return row;
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Names');
      
      // Add headers
      worksheet.columns = columns.map(key => ({
        header: key,
        key: key,
        width: 20
      }));

      // Add rows
      worksheet.addRows(rows);

      // Generate and download the file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'azure-resource-names.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      
      // Dismiss loading and show success
      toast.dismiss('excel-loading');
      toast.success('Excel Export Complete', {
        description: 'Azure resource names exported successfully',
        icon: <Download size={16} />
      });
    } catch (error) {
      console.error('Error exporting Excel file:', error);
      toast.dismiss('excel-loading');
      toast.error('Export Error', {
        description: 'Failed to export Excel file. Please try again.',
        icon: <Download size={16} />
      });
    } finally {
      setExcelLoading(false);
    }
  };

  const handleSave = () => {
    const names = Array.isArray(validationState.generatedName)
      ? validationState.generatedName
      : [validationState.generatedName];
    const types = Array.isArray(formState.resourceType)
      ? formState.resourceType
      : [formState.resourceType];
    const group = names.map((name, idx) => ({
      resourceType: types[idx],
      generatedName: name
    }));
    addToHistory({
      id: uuidv4(),
      group,
      configuration: { ...formState },
      timestamp: Date.now()
    });
    
    toast.success('Names Saved', {
      description: `Saved ${names.length} generated name${names.length > 1 ? 's' : ''} to history`,
      icon: <Save size={16} />
    });
  };

  if (!validationState.generatedName || (Array.isArray(validationState.generatedName) && validationState.generatedName.length === 0)) {
    return null;
  }

  // Prepare data for table
  const names = Array.isArray(validationState.generatedName)
    ? validationState.generatedName
    : [validationState.generatedName];
  const types = Array.isArray(generatedFormState.resourceType)
    ? generatedFormState.resourceType
    : [generatedFormState.resourceType];

  // Determine which optional columns to show
  const showInstance = names.some(() => generatedFormState.instance && generatedFormState.instance !== '');
  const showCustomPrefix = names.some(() => generatedFormState.customPrefix && generatedFormState.customPrefix !== '');
  const showCustomSuffix = names.some(() => generatedFormState.customSuffix && generatedFormState.customSuffix !== '');
  const showRandom = names.some(() => generatedFormState.randomLength && Number(generatedFormState.randomLength) > 0);

  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Generated Name</TableHead>
                <TableHead>Resource Type</TableHead>
                <TableHead>Workload/Application Name</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Region</TableHead>
                {showInstance && <TableHead>Instance</TableHead>}
                {showCustomPrefix && <TableHead>Custom Prefix</TableHead>}
                {showCustomSuffix && <TableHead>Custom Suffix</TableHead>}
                {showRandom && <TableHead>Random Characters</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {names.map((name, idx) => (
                <TableRow key={name + idx}>
                  <TableCell>
                    <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                      {name}
                    </code>
                  </TableCell>
                  <TableCell className="text-sm">{getResourceTypeLabel(types[idx])}</TableCell>
                  <TableCell className="text-sm">{generatedFormState.workload}</TableCell>
                  <TableCell className="text-sm">{getEnvironmentLabel(generatedFormState.environment)}</TableCell>
                  <TableCell className="text-sm">{getRegionLabel(generatedFormState.region)}</TableCell>
                  {showInstance && <TableCell className="text-sm">{generatedFormState.instance}</TableCell>}
                  {showCustomPrefix && <TableCell className="text-sm">{generatedFormState.customPrefix}</TableCell>}
                  {showCustomSuffix && <TableCell className="text-sm">{generatedFormState.customSuffix}</TableCell>}
                  {showRandom && <TableCell className="text-sm">{generatedFormState.randomLength}</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportCSV}
            className="gap-2"
          >
            <Download size={16} />
            Export CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportExcel}
            disabled={excelLoading}
            className="gap-2"
          >
            <Download size={16} />
            {excelLoading ? 'Loading...' : 'Export Excel'}
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave}
            className="gap-2"
          >
            <Save size={16} />
            Save
          </Button>
          <Button
            variant={copySuccess ? 'secondary' : 'default'}
            size="sm"
            onClick={handleCopy}
            className="gap-2"
          >
            {copySuccess ? <Check size={16} /> : <Copy size={16} />}
            {copySuccess ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultsDisplayShadcn;