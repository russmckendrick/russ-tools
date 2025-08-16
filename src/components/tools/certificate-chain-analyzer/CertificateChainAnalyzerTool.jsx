import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '../../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Alert, AlertDescription } from '../../ui/alert';
import { 
  Shield, 
  FileText, 
  Link, 
  Download,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import SEOHead from '../../common/SEOHead';
import ToolHeader from '../../common/ToolHeader';
import { generateToolSEO } from '../../../utils/seoUtils';
import toolsConfig from '../../../utils/toolsConfig.json';
import CertificateIcon from './CertificateIcon';
import CertificateInput from './components/CertificateInput';
import ChainOverview from './components/ChainOverview';
import CertificateDetails from './components/CertificateDetails';
import SecurityAnalysis from './components/SecurityAnalysis';
import ExportOptions from './components/ExportOptions';
import { useCertificateAnalysis } from './hooks/useCertificateAnalysis';

const CertificateChainAnalyzerTool = () => {
  const { domain } = useParams();
  const [activeTab, setActiveTab] = useState('input');
  
  const {
    analysis,
    loading,
    error,
    analyzeUrl,
    analyzeFile,
    clearAnalysis
  } = useCertificateAnalysis();

  const toolConfig = toolsConfig.find(tool => tool.id === 'certificate-chain-analyzer');
  const seoData = generateToolSEO(toolConfig);

  const handleDomainAnalysis = useCallback(async (inputDomain, port = 443) => {
    try {
      setActiveTab('overview');
      await analyzeUrl(inputDomain, port);
    } catch (err) {
      console.error('Domain analysis failed:', err);
    }
  }, [analyzeUrl]);

  const handleFileAnalysis = useCallback(async (files) => {
    try {
      setActiveTab('overview');
      await analyzeFile(files);
    } catch (err) {
      console.error('File analysis failed:', err);
    }
  }, [analyzeFile]);

  const hasAnalysis = analysis && analysis.certificates && analysis.certificates.length > 0;

  return (
    <>
      <SEOHead 
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        canonicalUrl={seoData.canonicalUrl}
      />
      
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <ToolHeader 
          title={toolConfig.title}
          description={toolConfig.description}
          icon={<CertificateIcon className="w-8 h-8" />}
          badges={toolConfig.badges}
        />

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              Certificate Chain Analysis
            </CardTitle>
            <CardDescription>
              Analyze SSL/TLS certificate chains from domains or uploaded files with comprehensive security assessment
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="input" className="flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  Input
                </TabsTrigger>
                <TabsTrigger 
                  value="overview" 
                  disabled={!hasAnalysis}
                  className="flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="details" 
                  disabled={!hasAnalysis}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Details
                </TabsTrigger>
                <TabsTrigger 
                  value="security" 
                  disabled={!hasAnalysis}
                  className="flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Security
                </TabsTrigger>
                <TabsTrigger 
                  value="export" 
                  disabled={!hasAnalysis}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <TabsContent value="input" className="space-y-4">
                  <CertificateInput
                    onDomainAnalysis={handleDomainAnalysis}
                    onFileAnalysis={handleFileAnalysis}
                    loading={loading}
                    error={error}
                    initialDomain={domain}
                  />
                </TabsContent>

                <TabsContent value="overview" className="space-y-4">
                  {hasAnalysis ? (
                    <ChainOverview analysis={analysis} />
                  ) : (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        No certificate analysis available. Please analyze a domain or upload certificate files first.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>

                <TabsContent value="details" className="space-y-4">
                  {hasAnalysis ? (
                    <CertificateDetails certificates={analysis.certificates} />
                  ) : (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        No certificate details available. Please analyze a domain or upload certificate files first.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>

                <TabsContent value="security" className="space-y-4">
                  {hasAnalysis ? (
                    <SecurityAnalysis analysis={analysis} />
                  ) : (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        No security analysis available. Please analyze a domain or upload certificate files first.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>

                <TabsContent value="export" className="space-y-4">
                  {hasAnalysis ? (
                    <ExportOptions analysis={analysis} />
                  ) : (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        No data available for export. Please analyze a domain or upload certificate files first.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>
              </div>
            </Tabs>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {loading && (
              <Alert className="mt-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Analyzing certificate chain... This may take a few moments.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CertificateChainAnalyzerTool;