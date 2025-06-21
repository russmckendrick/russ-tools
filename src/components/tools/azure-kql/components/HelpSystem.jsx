import React, { useState } from 'react';
import {
  Modal,
  Stack,
  Title,
  Text,
  Tabs,
  Paper,
  Group,
  Button,
  Badge,
  Accordion,
  Code,
  List,
  ThemeIcon,
  ScrollArea,
  Alert,
  Stepper,
  Anchor,
  Divider
} from '@mantine/core';
import {
  IconHelp,
  IconBook,
  IconBulb,
  IconCode,
  IconExternalLink,
  IconCheck,
  IconAlertCircle,
  IconInfoCircle,
  IconPlayerPlay,
  IconSearch
} from '@tabler/icons-react';

const HelpSystem = ({ opened, onClose, currentContext = null }) => {
  const [activeTab, setActiveTab] = useState('getting-started');
  const [tutorialStep, setTutorialStep] = useState(0);

  const contextualHelp = {
    'service-selection': {
      title: 'Service Selection',
      content: 'Choose the Azure service you want to query. Each service has its own log tables and field structures.',
      tips: [
        'Start with Azure Firewall for network security analysis',
        'Application Gateway is great for web traffic analysis',
        'Multi-Service Correlation combines data from multiple services'
      ]
    },
    'parameter-form': {
      title: 'Query Parameters',
      content: 'Fill in the parameters to build your KQL query. Required fields are marked with an asterisk.',
      tips: [
        'Always specify a time range to improve performance',
        'Use specific IP addresses when possible for faster queries',
        'Start with smaller time ranges and expand as needed'
      ]
    },
    'query-preview': {
      title: 'Query Preview',
      content: 'This shows the generated KQL query. You can copy it or execute it directly in Azure Portal.',
      tips: [
        'Review the query before execution',
        'Check performance warnings in the insights panel',
        'Use the Azure Portal link for immediate execution'
      ]
    }
  };

  const tutorials = [
    {
      title: 'Basic Security Investigation',
      description: 'Learn to investigate security incidents using Azure Firewall logs',
      steps: [
        {
          title: 'Select Azure Firewall Service',
          content: 'Start by selecting "Azure Firewall" from the service dropdown. This gives you access to network security logs.',
          action: 'Select Azure Firewall from the service dropdown'
        },
        {
          title: 'Choose Security Investigation Template',
          content: 'Select the "Security Investigation" template to focus on denied connections and security events.',
          action: 'Click on "Security Investigation" template'
        },
        {
          title: 'Set Time Range',
          content: 'Choose an appropriate time range. For active investigations, start with the last 24 hours.',
          action: 'Set time range to "24h"'
        },
        {
          title: 'Filter by Action',
          content: 'Set the Action filter to "Deny" to focus on blocked connections that might indicate threats.',
          action: 'Select "Deny" from the Action dropdown'
        },
        {
          title: 'Add Source IP (Optional)',
          content: 'If you have a specific IP address of interest, add it to the Source IP field.',
          action: 'Enter IP address in Source IP field (optional)'
        },
        {
          title: 'Review and Execute',
          content: 'Review the generated query in the preview pane, then execute it in Azure Portal.',
          action: 'Click "Execute in Azure Portal"'
        }
      ]
    },
    {
      title: 'Performance Analysis',
      description: 'Analyze Application Gateway performance metrics',
      steps: [
        {
          title: 'Select Application Gateway',
          content: 'Choose "Azure Application Gateway" to access web traffic and performance data.',
          action: 'Select Azure Application Gateway'
        },
        {
          title: 'Choose Performance Template',
          content: 'Select "Performance Monitoring" template for response time and throughput analysis.',
          action: 'Select "Performance Monitoring" template'
        },
        {
          title: 'Set Short Time Range',
          content: 'For performance analysis, use shorter time ranges like 1-4 hours for detailed metrics.',
          action: 'Set time range to "1h" or "4h"'
        },
        {
          title: 'Configure Thresholds',
          content: 'Set response time thresholds to identify slow requests (e.g., >1000ms).',
          action: 'Set response time threshold'
        },
        {
          title: 'Analyze Results',
          content: 'Look for patterns in slow requests and correlate with backend server performance.',
          action: 'Execute query and analyze results'
        }
      ]
    },
    {
      title: 'Multi-Service Correlation',
      description: 'Correlate events across multiple Azure services',
      steps: [
        {
          title: 'Select Multi-Service Correlation',
          content: 'Choose the Multi-Service Correlation option for cross-service analysis.',
          action: 'Select "Multi-Service Correlation"'
        },
        {
          title: 'Choose Services',
          content: 'Select the Azure services you want to correlate (e.g., Firewall + Application Gateway).',
          action: 'Select services to correlate'
        },
        {
          title: 'Set Correlation Window',
          content: 'Choose a time window for correlation (5-15 minutes works well for most scenarios).',
          action: 'Set correlation window to "5m"'
        },
        {
          title: 'Define Correlation Fields',
          content: 'Select fields to correlate on, typically Source IP, Time, or User identity.',
          action: 'Choose correlation fields'
        },
        {
          title: 'Execute and Analyze',
          content: 'Run the correlation query to identify patterns across services.',
          action: 'Execute correlation query'
        }
      ]
    }
  ];

  const kqlReference = {
    'basic-operators': [
      { operator: 'where', description: 'Filters rows based on conditions', example: 'where Action == "Deny"' },
      { operator: 'project', description: 'Selects specific columns', example: 'project TimeGenerated, SourceIp, Action' },
      { operator: 'summarize', description: 'Aggregates data', example: 'summarize count() by SourceIp' },
      { operator: 'order by', description: 'Sorts results', example: 'order by TimeGenerated desc' },
      { operator: 'limit', description: 'Limits number of results', example: 'limit 100' },
      { operator: 'extend', description: 'Adds calculated columns', example: 'extend Hour = datetime_part("hour", TimeGenerated)' }
    ],
    'time-functions': [
      { function: 'ago()', description: 'Time relative to now', example: 'ago(24h), ago(7d)' },
      { function: 'now()', description: 'Current time', example: 'now()' },
      { function: 'datetime()', description: 'Parse datetime string', example: 'datetime("2024-01-01")' },
      { function: 'bin()', description: 'Round time to intervals', example: 'bin(TimeGenerated, 1h)' },
      { function: 'format_datetime()', description: 'Format datetime', example: 'format_datetime(TimeGenerated, "yyyy-MM-dd")' }
    ],
    'string-functions': [
      { function: 'contains', description: 'String contains substring', example: 'RequestUri contains "/api/"' },
      { function: 'startswith', description: 'String starts with', example: 'UserAgent startswith "Mozilla"' },
      { function: 'matches regex', description: 'Regular expression match', example: 'SourceIp matches regex @"192\.168\.\d+\.\d+"' },
      { function: 'split()', description: 'Split string', example: 'split(RequestUri, "/")' },
      { function: 'strcat()', description: 'Concatenate strings', example: 'strcat(SourceIp, ":", SourcePort)' }
    ]
  };

  const bestPractices = [
    {
      category: 'Performance',
      practices: [
        'Always include time range filters - they use indexed columns',
        'Place most selective filters first (specific IPs, exact matches)',
        'Use "limit" to prevent accidentally large result sets',
        'Avoid queries spanning more than 30 days without specific filters',
        'Use "summarize" instead of returning raw data when possible'
      ]
    },
    {
      category: 'Security',
      practices: [
        'Start security investigations with denied/blocked actions',
        'Look for patterns in source IPs and time ranges',
        'Correlate firewall denies with application gateway errors',
        'Use time-based analysis to identify attack patterns',
        'Document and save important security queries as favorites'
      ]
    },
    {
      category: 'Troubleshooting',
      practices: [
        'Begin with recent time ranges (last 1-4 hours)',
        'Use specific resource IDs when investigating single resources',
        'Combine multiple log sources for complete picture',
        'Save working queries before modifying them',
        'Use performance insights to optimize slow queries'
      ]
    }
  ];

  const commonQueries = [
    {
      title: 'Top Denied Source IPs',
      description: 'Find the most frequently blocked source IP addresses',
      query: `AZFWNetworkRule
| where TimeGenerated >= ago(24h)
| where Action == "Deny"
| summarize DeniedCount = count() by SourceIp
| top 10 by DeniedCount`,
      service: 'Azure Firewall'
    },
    {
      title: 'Application Gateway Error Analysis',
      description: 'Analyze HTTP errors by status code and URI',
      query: `AzureDiagnostics
| where TimeGenerated >= ago(4h)
| where Category == "ApplicationGatewayAccessLog"
| where httpStatus_d >= 400
| summarize ErrorCount = count() by httpStatus_d, requestUri_s
| order by ErrorCount desc`,
      service: 'Application Gateway'
    },
    {
      title: 'Performance Trending',
      description: 'Track response time trends over time',
      query: `AzureDiagnostics
| where TimeGenerated >= ago(24h)
| where Category == "ApplicationGatewayAccessLog"
| summarize AvgResponseTime = avg(serverResponseLatency_d) by bin(TimeGenerated, 1h)
| order by TimeGenerated asc`,
      service: 'Application Gateway'
    }
  ];

  const getCurrentContextHelp = () => {
    if (currentContext && contextualHelp[currentContext]) {
      return contextualHelp[currentContext];
    }
    return null;
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Azure KQL Query Builder Help"
      size="xl"
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Stack gap="md">
        {/* Contextual Help */}
        {getCurrentContextHelp() && (
          <Alert icon={<IconInfoCircle size={16} />} color="blue" mb="md">
            <Stack gap="xs">
              <Text fw={600}>{getCurrentContextHelp().title}</Text>
              <Text size="sm">{getCurrentContextHelp().content}</Text>
              {getCurrentContextHelp().tips && (
                <List size="sm" spacing="xs">
                  {getCurrentContextHelp().tips.map((tip, index) => (
                    <List.Item key={index}>{tip}</List.Item>
                  ))}
                </List>
              )}
            </Stack>
          </Alert>
        )}

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="getting-started" leftSection={<IconPlayerPlay size={16} />}>
              Getting Started
            </Tabs.Tab>
            <Tabs.Tab value="tutorials" leftSection={<IconBook size={16} />}>
              Tutorials
            </Tabs.Tab>
            <Tabs.Tab value="kql-reference" leftSection={<IconCode size={16} />}>
              KQL Reference
            </Tabs.Tab>
            <Tabs.Tab value="best-practices" leftSection={<IconBulb size={16} />}>
              Best Practices
            </Tabs.Tab>
            <Tabs.Tab value="examples" leftSection={<IconSearch size={16} />}>
              Query Examples
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="getting-started" pt="md">
            <Stack gap="md">
              <Paper p="md" withBorder>
                <Stack gap="sm">
                  <Title order={3}>Welcome to Azure KQL Query Builder</Title>
                  <Text>
                    This tool helps you build KQL (Kusto Query Language) queries for Azure services 
                    without needing to know the complex syntax. Follow these steps to get started:
                  </Text>
                  
                  <Stepper active={4} breakpoint="sm">
                    <Stepper.Step label="Select Service" description="Choose your Azure service">
                      <Text size="sm">Pick the Azure service you want to query (Firewall, Application Gateway, etc.)</Text>
                    </Stepper.Step>
                    <Stepper.Step label="Choose Template" description="Select query template">
                      <Text size="sm">Choose a pre-built template that matches your use case</Text>
                    </Stepper.Step>
                    <Stepper.Step label="Set Parameters" description="Fill in the form">
                      <Text size="sm">Enter your specific parameters like time range, IP addresses, etc.</Text>
                    </Stepper.Step>
                    <Stepper.Step label="Review Query" description="Check the generated KQL">
                      <Text size="sm">Review the automatically generated query and performance insights</Text>
                    </Stepper.Step>
                    <Stepper.Step label="Execute" description="Run in Azure Portal">
                      <Text size="sm">Execute the query directly in Azure Portal or copy it for later use</Text>
                    </Stepper.Step>
                  </Stepper>
                </Stack>
              </Paper>

              <Paper p="md" withBorder>
                <Stack gap="sm">
                  <Group>
                    <ThemeIcon color="green" variant="light">
                      <IconCheck size={16} />
                    </ThemeIcon>
                    <Title order={4}>Key Features</Title>
                  </Group>
                  <List spacing="xs">
                    <List.Item>Form-based query building - no KQL knowledge required</List.Item>
                    <List.Item>Real-time query preview with syntax highlighting</List.Item>
                    <List.Item>Performance analysis and optimization suggestions</List.Item>
                    <List.Item>Query favorites and history for reuse</List.Item>
                    <List.Item>Direct Azure Portal integration</List.Item>
                    <List.Item>Template editor for custom service definitions</List.Item>
                  </List>
                </Stack>
              </Paper>

              <Paper p="md" withBorder>
                <Stack gap="sm">
                  <Group>
                    <ThemeIcon color="blue" variant="light">
                      <IconAlertCircle size={16} />
                    </ThemeIcon>
                    <Title order={4}>Before You Start</Title>
                  </Group>
                  <List spacing="xs">
                    <List.Item>Ensure you have access to Azure Log Analytics workspace</List.Item>
                    <List.Item>Verify you have Reader permissions on the resources you want to query</List.Item>
                    <List.Item>Consider starting with shorter time ranges for initial exploration</List.Item>
                    <List.Item>Review the performance insights to optimize your queries</List.Item>
                  </List>
                </Stack>
              </Paper>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="tutorials" pt="md">
            <Stack gap="md">
              {tutorials.map((tutorial, tutorialIndex) => (
                <Paper key={tutorialIndex} p="md" withBorder>
                  <Stack gap="md">
                    <Group justify="space-between">
                      <div>
                        <Title order={4}>{tutorial.title}</Title>
                        <Text size="sm" c="dimmed">{tutorial.description}</Text>
                      </div>
                      <Badge color="blue">{tutorial.steps.length} steps</Badge>
                    </Group>

                    <Stepper 
                      active={tutorialIndex === 0 ? tutorialStep : -1} 
                      onStepClick={tutorialIndex === 0 ? setTutorialStep : undefined}
                      breakpoint="sm"
                    >
                      {tutorial.steps.map((step, stepIndex) => (
                        <Stepper.Step 
                          key={stepIndex} 
                          label={step.title} 
                          description={step.action}
                        >
                          <Text size="sm" mt="md">{step.content}</Text>
                        </Stepper.Step>
                      ))}
                    </Stepper>

                    {tutorialIndex === 0 && (
                      <Group justify="center">
                        <Button 
                          variant="light" 
                          onClick={() => setTutorialStep(Math.max(0, tutorialStep - 1))}
                          disabled={tutorialStep === 0}
                        >
                          Previous
                        </Button>
                        <Button 
                          onClick={() => setTutorialStep(Math.min(tutorial.steps.length - 1, tutorialStep + 1))}
                          disabled={tutorialStep === tutorial.steps.length - 1}
                        >
                          Next
                        </Button>
                      </Group>
                    )}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="kql-reference" pt="md">
            <Stack gap="md">
              {Object.entries(kqlReference).map(([category, items]) => (
                <Paper key={category} p="md" withBorder>
                  <Stack gap="sm">
                    <Title order={4} tt="capitalize">
                      {category.replace('-', ' ')}
                    </Title>
                    <Stack gap="xs">
                      {items.map((item, index) => (
                        <Group key={index} align="flex-start" gap="md">
                          <Code color="blue" fw={600} style={{ minWidth: '120px' }}>
                            {item.operator || item.function}
                          </Code>
                          <Stack gap="xs" style={{ flex: 1 }}>
                            <Text size="sm">{item.description}</Text>
                            <Code block color="gray" size="sm">
                              {item.example}
                            </Code>
                          </Stack>
                        </Group>
                      ))}
                    </Stack>
                  </Stack>
                </Paper>
              ))}

              <Paper p="md" withBorder>
                <Stack gap="sm">
                  <Title order={4}>External Resources</Title>
                  <List spacing="xs">
                    <List.Item>
                      <Anchor href="https://docs.microsoft.com/en-us/azure/data-explorer/kusto/query/" target="_blank">
                        <Group gap="xs">
                          <span>Official KQL Documentation</span>
                          <IconExternalLink size={14} />
                        </Group>
                      </Anchor>
                    </List.Item>
                    <List.Item>
                      <Anchor href="https://docs.microsoft.com/en-us/azure/azure-monitor/logs/examples" target="_blank">
                        <Group gap="xs">
                          <span>Azure Monitor Query Examples</span>
                          <IconExternalLink size={14} />
                        </Group>
                      </Anchor>
                    </List.Item>
                    <List.Item>
                      <Anchor href="https://docs.microsoft.com/en-us/azure/firewall/logs-and-metrics" target="_blank">
                        <Group gap="xs">
                          <span>Azure Firewall Logs Reference</span>
                          <IconExternalLink size={14} />
                        </Group>
                      </Anchor>
                    </List.Item>
                  </List>
                </Stack>
              </Paper>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="best-practices" pt="md">
            <Stack gap="md">
              {bestPractices.map((category, index) => (
                <Paper key={index} p="md" withBorder>
                  <Stack gap="sm">
                    <Title order={4}>{category.category}</Title>
                    <List spacing="xs">
                      {category.practices.map((practice, practiceIndex) => (
                        <List.Item key={practiceIndex}>
                          <Text size="sm">{practice}</Text>
                        </List.Item>
                      ))}
                    </List>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="examples" pt="md">
            <Stack gap="md">
              {commonQueries.map((queryExample, index) => (
                <Paper key={index} p="md" withBorder>
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <div>
                        <Title order={4}>{queryExample.title}</Title>
                        <Text size="sm" c="dimmed">{queryExample.description}</Text>
                      </div>
                      <Badge variant="light">{queryExample.service}</Badge>
                    </Group>
                    
                    <Code block size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                      {queryExample.query}
                    </Code>
                    
                    <Group>
                      <Button 
                        size="xs" 
                        variant="light"
                        onClick={() => navigator.clipboard.writeText(queryExample.query)}
                      >
                        Copy Query
                      </Button>
                    </Group>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Tabs.Panel>
        </Tabs>

        <Divider />
        
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Need more help? Check the external documentation links in the KQL Reference tab.
          </Text>
          <Button variant="light" onClick={onClose}>
            Close Help
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default HelpSystem; 