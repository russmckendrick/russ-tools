import React, { useEffect, useState } from 'react';
import { 
  Paper, 
  Stack, 
  Title, 
  ThemeIcon, 
  Group,
  Text,
  Alert,
  Tabs,
  Grid,
  Button
} from '@mantine/core';
import { IconChartDots3, IconInfoCircle } from '@tabler/icons-react';
import { useParams } from 'react-router-dom';
import { useLocalStorage } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import SEOHead from '../../common/SEOHead';
import { generateToolSEO } from '../../../utils/seoUtils';
import toolsConfig from '../../../utils/toolsConfig.json';
import { useAzureKQL } from './hooks/useAzureKQL';
import ServiceSelector from './components/ServiceSelector';
import ParameterForm from './components/ParameterForm';
import QueryPreview from './components/QueryPreview';
import QueryHistory from './components/QueryHistory';
import QueryFavorites from './components/QueryFavorites';
import ExportOptions from './components/ExportOptions';
import TemplateEditor from './components/TemplateEditor';
import HelpSystem from './components/HelpSystem';

const AzureKQLTool = () => {
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
  } = useAzureKQL();

  // Favorites management
  const [favorites, setFavorites] = useLocalStorage({
    key: 'azure-kql-favorites',
    defaultValue: []
  });

  // Help system state
  const [helpOpened, setHelpOpened] = useState(false);
  const [helpContext, setHelpContext] = useState(null);

  // Add current query to favorites
  const addToFavorites = () => {
    if (!generatedQuery) {
      notifications.show({
        title: 'No Query',
        message: 'Generate a query first before adding to favorites',
        color: 'orange'
      });
      return;
    }

    // Check if already favorited
    const isAlreadyFavorited = favorites.some(fav => fav.query === generatedQuery);
    if (isAlreadyFavorited) {
      notifications.show({
        title: 'Already Favorited',
        message: 'This query is already in your favorites',
        color: 'orange'
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
    
    notifications.show({
      title: 'Added to Favorites',
      message: 'Query has been saved to your favorites',
      color: 'green'
    });
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
      <Paper p="xl" radius="lg" withBorder>
        <Stack gap="xl">
          {/* Header */}
          <Group justify="space-between">
            <Group gap="md">
              <ThemeIcon size={48} radius="md" color="cyan" variant="light">
                <IconChartDots3 size={28} />
              </ThemeIcon>
              <div>
                <Title order={2}>Azure KQL Query Builder</Title>
                <Text size="sm" c="dimmed">
                  Build optimized KQL queries for Azure services with guided forms
                </Text>
              </div>
            </Group>
            <Button
              variant="light"
              leftSection={<IconInfoCircle size={16} />}
              onClick={() => setHelpOpened(true)}
            >
              Help
            </Button>
          </Group>

          {/* Info Alert */}
          <Alert 
            icon={<IconInfoCircle size={16} />} 
            variant="light" 
            color="blue"
            title="Query Builder Features"
          >
            Generate KQL queries with automatic performance optimization, filter ordering, 
            and support for Azure Firewall, Application Gateway, and other Azure services.
          </Alert>

          {/* Main Interface */}
          <Tabs defaultValue="builder" keepMounted={false}>
            <Tabs.List>
              <Tabs.Tab value="builder">Query Builder</Tabs.Tab>
              <Tabs.Tab value="favorites">Favorites</Tabs.Tab>
              <Tabs.Tab value="history">Query History</Tabs.Tab>
              <Tabs.Tab value="templates">Template Editor</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="builder" pt="lg">
              <Grid>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Stack gap="md">
                    <ServiceSelector 
                      value={selectedService}
                      onChange={setSelectedService}
                    />
                    <ParameterForm
                      service={selectedService}
                      template={selectedTemplate}
                      parameters={parameters}
                      onParameterChange={updateParameter}
                      onGenerate={generateQuery}
                    />
                  </Stack>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 8 }}>
                  <Stack gap="md">
                    <QueryPreview 
                      query={generatedQuery}
                      service={selectedService}
                      parameters={parameters}
                      template={currentTemplate}
                    />
                    <ExportOptions 
                      query={generatedQuery}
                      onSave={saveQuery}
                      generateShareableURL={generateShareableURL}
                      onAddToFavorites={addToFavorites}
                    />
                  </Stack>
                </Grid.Col>
              </Grid>
            </Tabs.Panel>

            <Tabs.Panel value="favorites" pt="lg">
              <QueryFavorites 
                onLoadQuery={loadQuery}
                currentQuery={generatedQuery}
                currentService={selectedService}
                currentTemplate={selectedTemplate}
                currentParameters={parameters}
              />
            </Tabs.Panel>

            <Tabs.Panel value="history" pt="lg">
              <QueryHistory 
                history={queryHistory}
                onLoadQuery={loadQuery}
              />
            </Tabs.Panel>

            <Tabs.Panel value="templates" pt="lg">
              <TemplateEditor 
                onTemplateCreate={(template) => {
                  notifications.show({
                    title: 'Template Available',
                    message: `New template "${template.service.name}" is now available in the service selector`,
                    color: 'green'
                  });
                }}
                onTemplateUpdate={(template) => {
                  notifications.show({
                    title: 'Template Updated',
                    message: `Template "${template.service.name}" has been updated`,
                    color: 'blue'
                  });
                }}
              />
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Paper>

      {/* Help System */}
      <HelpSystem 
        opened={helpOpened}
        onClose={() => setHelpOpened(false)}
        currentContext={helpContext}
      />
    </>
  );
};

export default AzureKQLTool;