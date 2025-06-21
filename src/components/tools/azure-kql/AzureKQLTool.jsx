import React, { useEffect } from 'react';
import { 
  Paper, 
  Stack, 
  Title, 
  ThemeIcon, 
  Group,
  Text,
  Alert,
  Tabs,
  Grid
} from '@mantine/core';
import { IconChartDots3, IconInfoCircle } from '@tabler/icons-react';
import { useParams } from 'react-router-dom';
import SEOHead from '../../common/SEOHead';
import { generateToolSEO } from '../../../utils/seoUtils';
import toolsConfig from '../../../utils/toolsConfig.json';
import { useAzureKQL } from './hooks/useAzureKQL';
import ServiceSelector from './components/ServiceSelector';
import ParameterForm from './components/ParameterForm';
import QueryPreview from './components/QueryPreview';
import QueryHistory from './components/QueryHistory';
import ExportOptions from './components/ExportOptions';

const AzureKQLTool = () => {
  const { service, template: templateParam } = useParams();
  const {
    selectedService,
    selectedTemplate,
    parameters,
    generatedQuery,
    queryHistory,
    setSelectedService,
    setSelectedTemplate,
    updateParameter,
    generateQuery,
    saveQuery,
    loadQuery,
    generateShareableURL
  } = useAzureKQL();

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
              <Tabs.Tab value="history">Query History</Tabs.Tab>
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
                    />
                    <ExportOptions 
                      query={generatedQuery}
                      onSave={saveQuery}
                      generateShareableURL={generateShareableURL}
                    />
                  </Stack>
                </Grid.Col>
              </Grid>
            </Tabs.Panel>

            <Tabs.Panel value="history" pt="lg">
              <QueryHistory 
                history={queryHistory}
                onLoadQuery={loadQuery}
              />
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Paper>
    </>
  );
};

export default AzureKQLTool;