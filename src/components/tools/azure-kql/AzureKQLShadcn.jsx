import React, { useEffect, useState } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '../../ui/card';
import { Button } from '../../ui/button';
import { Alert, AlertDescription } from '../../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { 
  BarChart3, 
  Info, 
  Share, 
  Star,
  History as HistoryIcon,
  FileCode,
  HelpCircle
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useLocalStorage } from '@mantine/hooks';
import { toast } from 'sonner';
import { copyShareableURL } from '../../../utils/sharelink';
import SEOHead from '../../common/SEOHead';
import ToolHeader from '../../common/ToolHeader';
import { generateToolSEO } from '../../../utils/seoUtils';
import toolsConfig from '../../../utils/toolsConfig.json';
import { useAzureKQLShadcn } from './hooks/useAzureKQLShadcn';
import ServiceSelectorShadcn from './components/ServiceSelectorShadcn';
import ParameterFormShadcn from './components/ParameterFormShadcn';
import QueryPreviewShadcn from './components/QueryPreviewShadcn';
import QueryHistoryShadcn from './components/QueryHistoryShadcn';
import QueryFavoritesShadcn from './components/QueryFavoritesShadcn';
import ExportOptionsShadcn from './components/ExportOptionsShadcn';
import TemplateEditorShadcn from './components/TemplateEditorShadcn';
import HelpSystemShadcn from './components/HelpSystemShadcn';

const AzureKQLShadcn = () => {
  const { service, template: templateParam } = useParams();
  const {
    selectedService,
    selectedTemplate,
    parameters,
    generatedQuery,
    currentTemplate,
    queryHistory,
    setSelectedService,
    setSelectedTemplate,
    updateParameter,
    generateQuery,
    saveQuery,
    loadQuery,
    generateShareableURL
  } = useAzureKQLShadcn();

  // Favorites management
  const [favorites, setFavorites] = useLocalStorage({
    key: 'azure-kql-favorites',
    defaultValue: []
  });

  // Help system state
  const [helpOpened, setHelpOpened] = useState(false);

  // Add current query to favorites
  const addToFavorites = () => {
    if (!generatedQuery) {
      toast.warning('No Query', {
        description: 'Generate a query first before adding to favorites'
      });
      return;
    }

    // Check if already favorited
    const isAlreadyFavorited = favorites.some(fav => fav.query === generatedQuery);
    if (isAlreadyFavorited) {
      toast.warning('Already Favorited', {
        description: 'This query is already in your favorites'
      });
      return;
    }

    const favoriteEntry = {
      id: Date.now().toString(),
      name: `${selectedService} - ${selectedTemplate}`,
      description: `Query for ${selectedService} using ${selectedTemplate} template`,
      timestamp: new Date().toISOString(),
      service: selectedService,
      template: selectedTemplate,
      parameters: { ...parameters },
      query: generatedQuery,
      tags: [selectedService, selectedTemplate]
    };

    setFavorites(prev => [favoriteEntry, ...prev]);
    
    toast.success('Added to Favorites', {
      description: 'Query has been saved to your favorites'
    });
  };

  // Share configuration
  const handleShareConfiguration = async () => {
    if (!generatedQuery) {
      toast.warning('No Query Generated', {
        description: 'Please generate a KQL query before sharing the configuration'
      });
      return;
    }

    const config = {
      selectedService,
      selectedTemplate,
      parameters
    };

    const success = await copyShareableURL(config);
    if (success) {
      toast.success('Configuration Shared', {
        description: 'Shareable link has been copied to your clipboard',
        icon: <Share className="w-4 h-4" />
      });
    }
  };

  // Get tool configuration for SEO
  const toolConfig = toolsConfig.find(tool => tool.id === 'azure-kql');
  const seoData = generateToolSEO(toolConfig);

  // Handle URL parameters
  useEffect(() => {
    if (service && service !== selectedService) {
      setSelectedService(service);
    }
    if (templateParam && templateParam !== selectedTemplate) {
      setSelectedTemplate(templateParam);
    }
  }, [service, templateParam, selectedService, selectedTemplate, setSelectedService, setSelectedTemplate]);

  return (
    <>
      <SEOHead {...seoData} />
      <ToolHeader
        icon={BarChart3}
        title="Azure KQL Query Builder"
        description="Build optimized KQL queries for Azure services with guided forms"
        iconColor="cyan"
        actions={[
          {
            text: "Copy Configuration Share URL",
            icon: Share,
            onClick: handleShareConfiguration,
            disabled: !generatedQuery,
            variant: "outline",
            size: "sm"
          },
          {
            text: "Help",
            icon: HelpCircle,
            onClick: () => setHelpOpened(true),
            variant: "outline",
            size: "sm"
          }
        ]}
        alert={{
          title: "Query Builder Features:",
          description: "Generate KQL queries with automatic performance optimization, filter ordering, and support for Azure Firewall, Application Gateway, and other Azure services."
        }}
        standalone={true}
      />
      
      {/* Main Interface */}
      <Tabs defaultValue="builder" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="builder">Query Builder</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
              <TabsTrigger value="history">Query History</TabsTrigger>
              <TabsTrigger value="templates">Template Editor</TabsTrigger>
            </TabsList>

            <TabsContent value="builder" className="mt-6">
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1">
                  <div className="space-y-4">
                    <ServiceSelectorShadcn 
                      value={selectedService}
                      onChange={setSelectedService}
                    />
                    <ParameterFormShadcn
                      service={selectedService}
                      template={selectedTemplate}
                      parameters={parameters}
                      onParameterChange={updateParameter}
                      onTemplateChange={setSelectedTemplate}
                      onGenerate={generateQuery}
                    />
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <div className="space-y-4">
                    <QueryPreviewShadcn 
                      query={generatedQuery}
                      service={selectedService}
                      parameters={parameters}
                      template={currentTemplate}
                    />
                    <ExportOptionsShadcn 
                      query={generatedQuery}
                      onSave={saveQuery}
                      onAddToFavorites={addToFavorites}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="favorites" className="mt-6">
              <QueryFavoritesShadcn 
                onLoadQuery={loadQuery}
                currentQuery={generatedQuery}
                currentService={selectedService}
                currentTemplate={selectedTemplate}
                currentParameters={parameters}
              />
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <QueryHistoryShadcn 
                history={queryHistory}
                onLoadQuery={loadQuery}
              />
            </TabsContent>

            <TabsContent value="templates" className="mt-6">
              <TemplateEditorShadcn 
                onTemplateCreate={(template) => {
                  toast.success('Template Available', {
                    description: `New template "${template.service.name}" is now available in the service selector`
                  });
                }}
                onTemplateUpdate={(template) => {
                  toast.info('Template Updated', {
                    description: `Template "${template.service.name}" has been updated`
                  });
                }}
              />
            </TabsContent>
          </Tabs>

      {/* Help System */}
      <HelpSystemShadcn 
        opened={helpOpened}
        onClose={() => setHelpOpened(false)}
        currentContext={null}
      />
    </>
  );
};

export default AzureKQLShadcn;