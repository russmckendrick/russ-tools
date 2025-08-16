import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';
import { Switch } from '../../../ui/switch';
import { Alert, AlertDescription } from '../../../ui/alert';
import { 
  Download, 
  FileText, 
  Share2, 
  Link, 
  Copy,
  FileSpreadsheet,
  FileJson,
  FileOutput
} from 'lucide-react';
import { toast } from 'sonner';

const ExportOptions = ({ analysis }) => {
  const [shareLink, setShareLink] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [exportSettings, setExportSettings] = useState({
    includeCertDetails: true,
    includeSecurityAnalysis: true,
    includeRecommendations: true,
    includeRawData: false,
    includeHistoricalData: false
  });

  if (!analysis) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          No analysis data available for export
        </CardContent>
      </Card>
    );
  }

  const generateShareLink = async () => {
    setIsGeneratingLink(true);
    try {
      // Simulate generating a share link (would be implemented with backend)
      await new Promise(resolve => setTimeout(resolve, 1000));
      const linkId = Math.random().toString(36).substring(2, 15);
      const generatedLink = `${window.location.origin}/certificate-analyzer/share/${linkId}`;
      setShareLink(generatedLink);
      toast.success('Share link generated successfully');
    } catch (error) {
      toast.error('Failed to generate share link');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success('Share link copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const exportToPDF = () => {
    try {
      const reportData = generateReportData();
      // In a real implementation, this would generate a PDF
      console.log('Generating PDF report...', reportData);
      toast.success('PDF report generation started');
      
      // Mock download
      const element = document.createElement('a');
      element.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent('Certificate Analysis Report (PDF format would be generated here)');
      element.download = `certificate-analysis-${getFilenameTimestamp()}.txt`;
      element.click();
    } catch (error) {
      toast.error('Failed to generate PDF report');
    }
  };

  const exportToExcel = () => {
    try {
      const excelData = generateExcelData();
      const csvContent = convertToCSV(excelData);
      
      const element = document.createElement('a');
      element.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
      element.download = `certificate-analysis-${getFilenameTimestamp()}.csv`;
      element.click();
      
      toast.success('Excel/CSV file downloaded');
    } catch (error) {
      toast.error('Failed to generate Excel file');
    }
  };

  const exportToJSON = () => {
    try {
      const jsonData = generateJSONData();
      const element = document.createElement('a');
      element.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(jsonData, null, 2));
      element.download = `certificate-analysis-${getFilenameTimestamp()}.json`;
      element.click();
      
      toast.success('JSON file downloaded');
    } catch (error) {
      toast.error('Failed to generate JSON file');
    }
  };

  const exportToCSV = () => {
    try {
      const csvData = generateCSVData();
      const element = document.createElement('a');
      element.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);
      element.download = `certificate-details-${getFilenameTimestamp()}.csv`;
      element.click();
      
      toast.success('CSV file downloaded');
    } catch (error) {
      toast.error('Failed to generate CSV file');
    }
  };

  const generateReportData = () => {
    const { certificates, chain, metadata } = analysis;
    
    return {
      summary: {
        domain: analysis.domain || 'File Upload',
        analysisDate: new Date().toISOString(),
        totalCertificates: certificates.length,
        chainValid: chain.isValid,
        securityScore: calculateSecurityScore(certificates, chain)
      },
      certificates: exportSettings.includeCertDetails ? certificates.map(cert => ({
        type: cert.type,
        subject: cert.details.subject.CN,
        issuer: cert.details.issuer.CN,
        validFrom: cert.details.validity.notBefore,
        validTo: cert.details.validity.notAfter,
        keyAlgorithm: cert.details.keyInfo.algorithm,
        keySize: cert.details.keyInfo.keySize,
        serialNumber: cert.details.serialNumber
      })) : [],
      security: exportSettings.includeSecurityAnalysis ? {
        chainValidation: chain,
        issues: certificates.flatMap(cert => cert.issues || [])
      } : null,
      metadata: exportSettings.includeRawData ? metadata : null
    };
  };

  const generateExcelData = () => {
    const { certificates } = analysis;
    
    return certificates.map(cert => ({
      'Certificate Type': cert.type,
      'Subject CN': cert.details.subject.CN,
      'Organization': cert.details.subject.O,
      'Issuer CN': cert.details.issuer.CN,
      'Valid From': cert.details.validity.notBefore,
      'Valid To': cert.details.validity.notAfter,
      'Key Algorithm': cert.details.keyInfo.algorithm,
      'Key Size': cert.details.keyInfo.keySize,
      'Serial Number': cert.details.serialNumber,
      'SHA-256 Fingerprint': cert.fingerprints.sha256
    }));
  };

  const generateJSONData = () => {
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        toolVersion: '1.0.0',
        analysisType: analysis.metadata?.analysisType || 'unknown'
      },
      analysis: {
        ...analysis,
        certificates: exportSettings.includeRawData ? 
          analysis.certificates : 
          analysis.certificates.map(cert => ({
            ...cert,
            raw: undefined // Remove raw binary data
          }))
      }
    };

    if (!exportSettings.includeCertDetails) {
      exportData.analysis.certificates = exportData.analysis.certificates.map(cert => ({
        type: cert.type,
        subject: cert.details.subject.CN,
        issuer: cert.details.issuer.CN
      }));
    }

    return exportData;
  };

  const generateCSVData = () => {
    const { certificates } = analysis;
    
    const headers = [
      'Certificate Type',
      'Subject CN',
      'Organization',
      'Country',
      'Issuer CN',
      'Valid From',
      'Valid To',
      'Key Algorithm',
      'Key Size',
      'Serial Number',
      'SHA-256 Fingerprint'
    ];

    const rows = certificates.map(cert => [
      cert.type,
      cert.details.subject.CN || '',
      cert.details.subject.O || '',
      cert.details.subject.C || '',
      cert.details.issuer.CN || '',
      cert.details.validity.notBefore || '',
      cert.details.validity.notAfter || '',
      cert.details.keyInfo.algorithm || '',
      cert.details.keyInfo.keySize || '',
      cert.details.serialNumber || '',
      cert.fingerprints.sha256 || ''
    ]);

    return convertToCSV([headers, ...rows]);
  };

  const convertToCSV = (data) => {
    return data.map(row => 
      row.map(field => 
        typeof field === 'string' && field.includes(',') ? 
          `"${field.replace(/"/g, '""')}"` : 
          field
      ).join(',')
    ).join('\n');
  };

  const calculateSecurityScore = (certificates, chain) => {
    let score = 100;
    if (!chain.isValid) score -= 30;
    
    certificates.forEach(cert => {
      if (cert.details.keyInfo.keySize < 2048) score -= 20;
      if (cert.details.keyInfo.algorithm.includes('SHA1')) score -= 15;
      
      const now = new Date();
      const expiry = new Date(cert.details.validity.notAfter);
      const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= 0) score -= 40;
      else if (daysUntilExpiry <= 30) score -= 10;
    });
    
    return Math.max(0, score);
  };

  const getFilenameTimestamp = () => {
    return new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  };

  const updateExportSetting = (key, value) => {
    setExportSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Export Formats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            Export Analysis Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-6 h-6 text-red-600" />
                  <div>
                    <h3 className="font-medium">PDF Report</h3>
                    <p className="text-sm text-gray-600">Complete analysis with visual elements</p>
                  </div>
                </div>
                <Button onClick={exportToPDF} className="w-full">
                  Download PDF
                </Button>
              </div>

              <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <FileSpreadsheet className="w-6 h-6 text-green-600" />
                  <div>
                    <h3 className="font-medium">Excel Spreadsheet</h3>
                    <p className="text-sm text-gray-600">Tabular certificate data</p>
                  </div>
                </div>
                <Button onClick={exportToExcel} variant="outline" className="w-full">
                  Download XLSX
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <FileJson className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="font-medium">JSON Data</h3>
                    <p className="text-sm text-gray-600">Raw analysis data</p>
                  </div>
                </div>
                <Button onClick={exportToJSON} variant="outline" className="w-full">
                  Download JSON
                </Button>
              </div>

              <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <FileOutput className="w-6 h-6 text-purple-600" />
                  <div>
                    <h3 className="font-medium">CSV Export</h3>
                    <p className="text-sm text-gray-600">Certificate details table</p>
                  </div>
                </div>
                <Button onClick={exportToCSV} variant="outline" className="w-full">
                  Download CSV
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Share Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-green-600" />
            Share Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sharelink" className="flex items-center gap-2 mb-2">
                <Link className="w-4 h-4" />
                Share Link (expires in 24 hours)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="sharelink"
                  value={shareLink}
                  placeholder="Click 'Generate New Link' to create a shareable link"
                  readOnly
                  className="flex-1"
                />
                {shareLink && (
                  <Button variant="outline" onClick={copyShareLink}>
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={generateShareLink} 
                disabled={isGeneratingLink}
                className="flex-1"
              >
                {isGeneratingLink ? 'Generating...' : 'Generate New Link'}
              </Button>
            </div>

            {shareLink && (
              <Alert>
                <Link className="h-4 w-4" />
                <AlertDescription>
                  Share link generated! This link will expire in 24 hours for security.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Export Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-600" />
            Report Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="includeCertDetails">Include certificate details</Label>
              <Switch
                id="includeCertDetails"
                checked={exportSettings.includeCertDetails}
                onCheckedChange={(checked) => updateExportSetting('includeCertDetails', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="includeSecurityAnalysis">Include security analysis</Label>
              <Switch
                id="includeSecurityAnalysis"
                checked={exportSettings.includeSecurityAnalysis}
                onCheckedChange={(checked) => updateExportSetting('includeSecurityAnalysis', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="includeRecommendations">Include recommendations</Label>
              <Switch
                id="includeRecommendations"
                checked={exportSettings.includeRecommendations}
                onCheckedChange={(checked) => updateExportSetting('includeRecommendations', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="includeRawData">Include raw certificate data</Label>
              <Switch
                id="includeRawData"
                checked={exportSettings.includeRawData}
                onCheckedChange={(checked) => updateExportSetting('includeRawData', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="includeHistoricalData">Include historical analysis data</Label>
              <Switch
                id="includeHistoricalData"
                checked={exportSettings.includeHistoricalData}
                onCheckedChange={(checked) => updateExportSetting('includeHistoricalData', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportOptions;