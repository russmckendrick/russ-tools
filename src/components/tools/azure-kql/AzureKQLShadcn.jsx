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
import { useLocalStorage } from '@/lib/utils';
import { toast } from 'sonner';
import { copyShareableURL } from '../../../utils/sharelink';
import SEOHead from '../../common/SEOHead';
import ToolHeader from '../../common/ToolHeader';
import { generateToolSEO } from '../../../utils/seoUtils';
import toolsConfig from '../../../utils/toolsConfig.json';
import { useAzureKQLShadcn } from './hooks/useAzureKQLShadcn';
import AzureKQLIcon from './AzureKQLIcon';
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
        icon={AzureKQLIcon}
        title="Azure KQL Query Builder"
        description="Build optimized KQL queries for Azure services with guided forms"
        iconColor="cyan"
        showTitle={false}
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
      <div className="container mx-auto max-w-7xl p-6">
        <Tabs defaultValue="builder" className="w-full space-y-8">
          <div className="flex justify-center">
            <TabsList className="inline-flex h-12 items-center justify-center rounded-xl bg-muted/50 p-1.5 text-muted-foreground backdrop-blur-sm border border-border/50">
              <TabsTrigger value="builder" className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                Query Builder
              </TabsTrigger>
              <TabsTrigger value="favorites" className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                Favorites
              </TabsTrigger>
              <TabsTrigger value="history" className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                Query History
              </TabsTrigger>
              <TabsTrigger value="templates" className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                Template Editor
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="builder" className="space-y-0">
            <div className="grid gap-8 xl:grid-cols-5 lg:grid-cols-3">
              <div className="xl:col-span-2 lg:col-span-1 space-y-6">
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
              <div className="xl:col-span-3 lg:col-span-2 space-y-6">
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
          </TabsContent>

          <TabsContent value="favorites" className="space-y-0">
            <QueryFavoritesShadcn 
              onLoadQuery={loadQuery}
              currentQuery={generatedQuery}
              currentService={selectedService}
              currentTemplate={selectedTemplate}
              currentParameters={parameters}
            />
          </TabsContent>

          <TabsContent value="history" className="space-y-0">
            <QueryHistoryShadcn 
              history={queryHistory}
              onLoadQuery={loadQuery}
            />
          </TabsContent>

          <TabsContent value="templates" className="space-y-0">
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
      </div>

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