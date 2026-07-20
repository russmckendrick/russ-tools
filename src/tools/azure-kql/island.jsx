import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ToolAction } from '@/components/ui/tool-actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Share, 
  Star,
  Copy,
  Download,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { copyText, downloadFile } from '@/core';
import ServiceSelector from './components/ServiceSelector';
import ParameterForm from './components/ParameterForm';
import QueryPreview from './components/QueryPreview';
import QueryHistory from './components/QueryHistory';
import QueryFavorites from './components/QueryFavorites';
import TemplateEditor from './components/TemplateEditor';
import { useKQLStore } from './store/useKQLStore';
import { generateKQLQuery } from './utils/queryGenerator';
import { validateParameters } from './utils/validators';
import { loadTemplate } from './utils/templateLoader';

const AzureKqlTool = () => {
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

  const handleCopyQuery = useCallback(async () => {
    if (!generatedQuery) {
      toast.error('No query to copy');
      return;
    }

    if (await copyText(generatedQuery)) {
      toast.success('Query copied to clipboard');
    } else {
      toast.error('Failed to copy to clipboard');
    }
  }, [generatedQuery]);

  const handleDownloadQuery = useCallback(() => {
    if (!generatedQuery) {
      toast.error('No query to download');
      return;
    }
    
    downloadFile(generatedQuery, `${selectedService}-${selectedTemplate}-${Date.now()}.kql`, 'text/plain');
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

  const handleShareConfiguration = useCallback(async () => {
    const config = {
      service: selectedService,
      template: selectedTemplate,
      parameters
    };

    // The ?config wire format stays uncompressed btoa: this tool's existing
    // share links use it, and its own URL effect parses exactly this.
    const encoded = btoa(JSON.stringify(config));
    const url = `${window.location.origin}/azure-kql?config=${encoded}`;

    if (await copyText(url)) {
      toast.success('Share URL copied to clipboard');
    } else {
      toast.error('Failed to copy to clipboard');
    }
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

  return (
    <>
      <ToolAction>
        <Button
          variant="outline"
          size="sm"
          onClick={handleShareConfiguration}
          disabled={!selectedService || !selectedTemplate}
        >
          <Share className="w-4 h-4 mr-2" />
          Share Configuration
        </Button>
      </ToolAction>
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
    </>
  );
};

export default AzureKqlTool;
