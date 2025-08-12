import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '../../ui/card';
import { Button } from '../../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { 
  Share, 
  Star,
  HelpCircle,
  Copy,
  Download,
  ExternalLink,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import SEOHead from '../../common/SEOHead';
import ToolHeader from '../../common/ToolHeader';
import { generateToolSEO } from '../../../utils/seoUtils';
import toolsConfig from '../../../utils/toolsConfig.json';
import AzureKQLIcon from './AzureKQLIcon';
import ServiceSelector from './components/ServiceSelector';
import ParameterForm from './components/ParameterForm';
import QueryPreview from './components/QueryPreview';
import QueryHistory from './components/QueryHistory';
import QueryFavorites from './components/QueryFavorites';
import TemplateEditor from './components/TemplateEditor';
import HelpSystem from './components/HelpSystem';
import { useKQLStore } from './store/useKQLStore';
import { generateKQLQuery } from './utils/queryGenerator';
import { validateParameters } from './utils/validators';
import { loadTemplate } from './utils/templateLoader';

const AzureKQLTool = () => {
  const { service: urlService, template: urlTemplate } = useParams();
  const [searchParams] = useSearchParams();
  
  const {
    selectedService,
    selectedTemplate,
    parameters,
    generatedQuery,
    queryHistory,
    favorites,
    setSelectedService,
    setSelectedTemplate,
    setParameters,
    updateParameter,
    setGeneratedQuery,
    addToHistory,
    addToFavorites,
    removeFavorite,
    clearHistory
  } = useKQLStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [helpOpen, setHelpOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('builder');

  const currentTemplate = useMemo(() => {
    if (!selectedService || !selectedTemplate) return null;
    return loadTemplate(selectedService, selectedTemplate);
  }, [selectedService, selectedTemplate]);

  // Initialize parameters with template defaults when template changes
  useEffect(() => {
    if (currentTemplate?.defaultParameters && selectedTemplate && selectedService) {
      const defaultParams = currentTemplate.defaultParameters;
      for (const [key, defaultValue] of Object.entries(defaultParams)) {
        if (!parameters[key] || parameters[key] === '') {
          updateParameter(key, defaultValue);
        }
      }
    }
  }, [selectedService, selectedTemplate, currentTemplate, parameters, updateParameter]);

  useEffect(() => {
    if (urlService && urlService !== selectedService) {
      setSelectedService(urlService);
    }
    if (urlTemplate && urlTemplate !== selectedTemplate) {
      setSelectedTemplate(urlTemplate);
    }
    
    const configParam = searchParams.get('config');
    if (configParam) {
      try {
        const config = JSON.parse(atob(configParam));
        if (config.service) setSelectedService(config.service);
        if (config.template) setSelectedTemplate(config.template);
        if (config.parameters) setParameters(config.parameters);
      } catch (error) {
        console.error('Failed to parse config from URL:', error);
      }
    }
  }, [urlService, urlTemplate, searchParams]);

  const handleParameterChange = useCallback((name, value) => {
    updateParameter(name, value);
    
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }, [validationErrors, updateParameter]);

  const handleGenerateQuery = useCallback(async () => {
    if (!currentTemplate) {
      toast.error('Please select a service and template');
      return;
    }

    const errors = validateParameters(parameters, currentTemplate);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error('Please fix validation errors before generating');
      return;
    }

    setIsGenerating(true);
    setValidationErrors({});

    try {
      const query = await generateKQLQuery(currentTemplate, parameters);
      setGeneratedQuery(query);
      
      addToHistory({
        query,
        service: selectedService,
        template: selectedTemplate,
        parameters: { ...parameters },
        timestamp: new Date().toISOString()
      });
      
      toast.success('Query generated successfully');
    } catch (error) {
      toast.error('Failed to generate query: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  }, [currentTemplate, parameters, selectedService, selectedTemplate]);

  const handleCopyQuery = useCallback(() => {
    if (!generatedQuery) {
      toast.error('No query to copy');
      return;
    }
    
    navigator.clipboard.writeText(generatedQuery);
    toast.success('Query copied to clipboard');
  }, [generatedQuery]);

  const handleDownloadQuery = useCallback(() => {
    if (!generatedQuery) {
      toast.error('No query to download');
      return;
    }
    
    const blob = new Blob([generatedQuery], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedService}-${selectedTemplate}-${Date.now()}.kql`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Query downloaded');
  }, [generatedQuery, selectedService, selectedTemplate]);

  const handleOpenInPortal = useCallback(() => {
    if (!generatedQuery) {
      toast.error('No query to open');
      return;
    }
    
    const encodedQuery = encodeURIComponent(generatedQuery);
    const portalUrl = `https://portal.azure.com/#blade/Microsoft_Azure_Monitoring_Logs/LogsBlade/query/${encodedQuery}`;
    window.open(portalUrl, '_blank');
  }, [generatedQuery]);

  const handleShareConfiguration = useCallback(() => {
    const config = {
      service: selectedService,
      template: selectedTemplate,
      parameters
    };
    
    const encoded = btoa(JSON.stringify(config));
    const url = `${window.location.origin}/azure-kql?config=${encoded}`;
    
    navigator.clipboard.writeText(url);
    toast.success('Share URL copied to clipboard');
  }, [selectedService, selectedTemplate, parameters]);

  const handleAddToFavorites = useCallback(() => {
    if (!generatedQuery) {
      toast.error('Generate a query first');
      return;
    }
    
    const favorite = {
      id: Date.now().toString(),
      name: `${selectedService} - ${selectedTemplate}`,
      query: generatedQuery,
      service: selectedService,
      template: selectedTemplate,
      parameters: { ...parameters },
      timestamp: new Date().toISOString()
    };
    
    addToFavorites(favorite);
    toast.success('Added to favorites');
  }, [generatedQuery, selectedService, selectedTemplate, parameters]);

  const handleLoadFromHistory = useCallback((entry) => {
    setSelectedService(entry.service);
    setSelectedTemplate(entry.template);
    setParameters(entry.parameters);
    setGeneratedQuery(entry.query);
    setActiveTab('builder');
    toast.success('Query loaded from history');
  }, []);

  const handleLoadFavorite = useCallback((favorite) => {
    setSelectedService(favorite.service);
    setSelectedTemplate(favorite.template);
    setParameters(favorite.parameters);
    setGeneratedQuery(favorite.query);
    setActiveTab('builder');
    toast.success('Favorite loaded');
  }, []);

  const toolConfig = toolsConfig.find(tool => tool.id === 'azure-kql');
  const seoData = generateToolSEO(toolConfig);

  return (
    <>
      <SEOHead {...seoData} />
      <ToolHeader
        icon={AzureKQLIcon}
        title="Azure KQL Query Builder"
        description="Build optimized KQL queries for Azure services with guided forms"
        iconColor="cyan"
        showTitle={false}
        actions={[
          {
            text: "Share Configuration",
            icon: Share,
            onClick: handleShareConfiguration,
            disabled: !selectedService || !selectedTemplate,
            variant: "outline",
            size: "sm"
          },
          {
            text: "Help",
            icon: HelpCircle,
            onClick: () => setHelpOpen(true),
            variant: "outline",
            size: "sm"
          }
        ]}
        standalone={true}
      />
      
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="builder">Query Builder</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="builder">
            <div className="space-y-6">
              <ServiceSelector 
                value={selectedService}
                onChange={setSelectedService}
              />
              
              {selectedService && (
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <ParameterForm
                      service={selectedService}
                      template={selectedTemplate}
                      parameters={parameters}
                      errors={validationErrors}
                      onParameterChange={handleParameterChange}
                      onTemplateChange={setSelectedTemplate}
                      onGenerate={handleGenerateQuery}
                      isGenerating={isGenerating}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <QueryPreview 
                      query={generatedQuery}
                      service={selectedService}
                      template={currentTemplate}
                    />
                    
                    {generatedQuery && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Export Options</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            <Button onClick={handleCopyQuery} variant="outline" size="sm">
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Query
                            </Button>
                            <Button onClick={handleDownloadQuery} variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                            <Button onClick={handleOpenInPortal} variant="outline" size="sm">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Open in Portal
                            </Button>
                            <Button onClick={handleAddToFavorites} variant="outline" size="sm">
                              <Star className="w-4 h-4 mr-2" />
                              Add to Favorites
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="favorites">
            <QueryFavorites 
              favorites={favorites}
              onLoad={handleLoadFavorite}
              onDelete={removeFavorite}
            />
          </TabsContent>

          <TabsContent value="history">
            <QueryHistory 
              history={queryHistory}
              onLoad={handleLoadFromHistory}
              onClear={clearHistory}
            />
          </TabsContent>

          <TabsContent value="templates">
            <TemplateEditor 
              onTemplateCreate={(template) => {
                toast.success(`Template "${template.name}" created`);
              }}
              onTemplateUpdate={(template) => {
                toast.success(`Template "${template.name}" updated`);
              }}
            />
          </TabsContent>
        </Tabs>
      </div>

      <HelpSystem 
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        context={{ service: selectedService, template: selectedTemplate }}
      />
    </>
  );
};

export default AzureKQLTool;