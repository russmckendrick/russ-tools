import React from 'react';
import {
  Paper,
  Stack,
  Title,
  Text,
  Progress,
  Badge,
  Group,
  Alert,
  Accordion,
  List,
  ThemeIcon,
  Tooltip,
  Grid,
  RingProgress,
  Center
} from '@mantine/core';
import {
  IconSpeedboat,
  IconAlertTriangle,
  IconBulb,
  IconClock,
  IconCoin,
  IconChartBar,
  IconCheck,
  IconX,
  IconExclamationMark
} from '@tabler/icons-react';

const PerformanceInsights = ({ analysis, query, isVisible = true }) => {
  if (!isVisible || !analysis) return null;

  const getScoreColor = (score) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    if (score >= 40) return 'orange';
    return 'red';
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return <IconCheck size={16} />;
    if (score >= 60) return <IconExclamationMark size={16} />;
    return <IconX size={16} />;
  };

  const getCostColor = (category) => {
    switch (category) {
      case 'low': return 'green';
      case 'medium': return 'yellow';
      case 'high': return 'red';
      default: return 'gray';
    }
  };

  const getTimeColor = (category) => {
    switch (category) {
      case 'fast': return 'green';
      case 'moderate': return 'yellow';
      case 'slow': return 'orange';
      case 'very_slow': return 'red';
      default: return 'gray';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'blue';
      default: return 'gray';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <IconX size={14} />;
      case 'high': return <IconAlertTriangle size={14} />;
      case 'medium': return <IconExclamationMark size={14} />;
      default: return <IconBulb size={14} />;
    }
  };

  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="sm">
            <ThemeIcon size="sm" color="blue" variant="light">
              <IconSpeedboat size={16} />
            </ThemeIcon>
            <Title order={4}>Performance Insights</Title>
          </Group>
          <Badge size="xs" color={getScoreColor(analysis.score)}>
            {analysis.score}/100
          </Badge>
        </Group>

        {/* Performance Overview */}
        <Grid>
          <Grid.Col span={4}>
            <Paper p="sm" withBorder bg="gray.0">
              <Stack gap="xs" align="center">
                <RingProgress
                  size={60}
                  thickness={6}
                  sections={[{ value: analysis.score, color: getScoreColor(analysis.score) }]}
                  label={
                    <Center>
                      <ThemeIcon size="xs" color={getScoreColor(analysis.score)} variant="light">
                        {getScoreIcon(analysis.score)}
                      </ThemeIcon>
                    </Center>
                  }
                />
                <div style={{ textAlign: 'center' }}>
                  <Text size="xs" fw={600}>Performance Score</Text>
                  <Text size="xs" c="dimmed">{analysis.score}/100</Text>
                </div>
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={4}>
            <Paper p="sm" withBorder bg="gray.0">
              <Stack gap="xs" align="center">
                <ThemeIcon size={40} color={getCostColor(analysis.estimatedCost.category)} variant="light">
                  <IconCoin size={24} />
                </ThemeIcon>
                <div style={{ textAlign: 'center' }}>
                  <Text size="xs" fw={600}>Estimated Cost</Text>
                  <Text size="xs" c="dimmed">
                    {analysis.estimatedCost.estimated} {analysis.estimatedCost.unit}
                  </Text>
                  <Badge size="xs" color={getCostColor(analysis.estimatedCost.category)}>
                    {analysis.estimatedCost.category}
                  </Badge>
                </div>
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={4}>
            <Paper p="sm" withBorder bg="gray.0">
              <Stack gap="xs" align="center">
                <ThemeIcon size={40} color={getTimeColor(analysis.executionTime.category)} variant="light">
                  <IconClock size={24} />
                </ThemeIcon>
                <div style={{ textAlign: 'center' }}>
                  <Text size="xs" fw={600}>Execution Time</Text>
                  <Text size="xs" c="dimmed">{analysis.executionTime.display}</Text>
                  <Badge size="xs" color={getTimeColor(analysis.executionTime.category)}>
                    {analysis.executionTime.category}
                  </Badge>
                </div>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* Warnings and Suggestions */}
        {(analysis.warnings.length > 0 || analysis.suggestions.length > 0) && (
          <Accordion variant="contained">
            {analysis.warnings.length > 0 && (
              <Accordion.Item value="warnings">
                <Accordion.Control 
                  icon={
                    <ThemeIcon size="sm" color="red" variant="light">
                      <IconAlertTriangle size={16} />
                    </ThemeIcon>
                  }
                >
                  <Group gap="sm">
                    <Text>Performance Warnings</Text>
                    <Badge size="xs" color="red">{analysis.warnings.length}</Badge>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="sm">
                    {analysis.warnings.map((warning, index) => (
                      <Alert
                        key={index}
                        icon={getSeverityIcon(warning.severity)}
                        color={getSeverityColor(warning.severity)}
                        variant="light"
                        title={warning.message}
                      >
                        <Stack gap="xs">
                          <Text size="sm">
                            <strong>Impact:</strong> {warning.impact}
                          </Text>
                          <Text size="sm">
                            <strong>Recommendation:</strong> {warning.recommendation}
                          </Text>
                        </Stack>
                      </Alert>
                    ))}
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            )}

            {analysis.suggestions.length > 0 && (
              <Accordion.Item value="suggestions">
                <Accordion.Control 
                  icon={
                    <ThemeIcon size="sm" color="blue" variant="light">
                      <IconBulb size={16} />
                    </ThemeIcon>
                  }
                >
                  <Group gap="sm">
                    <Text>Optimization Suggestions</Text>
                    <Badge size="xs" color="blue">{analysis.suggestions.length}</Badge>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <List
                    spacing="sm"
                    size="sm"
                    icon={
                      <ThemeIcon size="sm" color="blue" variant="light">
                        <IconBulb size={12} />
                      </ThemeIcon>
                    }
                  >
                    {analysis.suggestions.map((suggestion, index) => (
                      <List.Item key={index}>
                        <Stack gap={4}>
                          <Text size="sm" fw={500}>{suggestion.message}</Text>
                          {suggestion.benefit && (
                            <Text size="xs" c="dimmed">
                              <strong>Benefit:</strong> {suggestion.benefit}
                            </Text>
                          )}
                        </Stack>
                      </List.Item>
                    ))}
                  </List>
                </Accordion.Panel>
              </Accordion.Item>
            )}

            {analysis.optimizationTips.length > 0 && (
              <Accordion.Item value="tips">
                <Accordion.Control 
                  icon={
                    <ThemeIcon size="sm" color="green" variant="light">
                      <IconChartBar size={16} />
                    </ThemeIcon>
                  }
                >
                  <Group gap="sm">
                    <Text>Quick Optimization Tips</Text>
                    <Badge size="xs" color="green">{analysis.optimizationTips.length}</Badge>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <List
                    spacing="sm"
                    size="sm"
                    icon={
                      <ThemeIcon size="sm" color="green" variant="light">
                        <IconCheck size={12} />
                      </ThemeIcon>
                    }
                  >
                    {analysis.optimizationTips.map((tip, index) => (
                      <List.Item key={index}>
                        <Group gap="sm" align="flex-start">
                          <Badge size="xs" color={tip.priority === 'high' ? 'red' : tip.priority === 'medium' ? 'yellow' : 'blue'}>
                            {tip.priority}
                          </Badge>
                          <Stack gap={4} style={{ flex: 1 }}>
                            <Text size="sm" fw={500}>{tip.tip}</Text>
                            <Text size="xs" c="dimmed">{tip.impact}</Text>
                          </Stack>
                        </Group>
                      </List.Item>
                    ))}
                  </List>
                </Accordion.Panel>
              </Accordion.Item>
            )}
          </Accordion>
        )}

        {/* Perfect Score Message */}
        {analysis.score >= 90 && analysis.warnings.length === 0 && (
          <Alert 
            icon={<IconCheck size={16} />} 
            color="green" 
            variant="light"
            title="Excellent Query Performance!"
          >
            Your query is well-optimized and should execute efficiently with minimal cost.
          </Alert>
        )}

        {/* Poor Score Warning */}
        {analysis.score < 40 && (
          <Alert 
            icon={<IconX size={16} />} 
            color="red" 
            variant="light"
            title="Query Performance Needs Improvement"
          >
            This query may be slow and expensive to execute. Please review the warnings and suggestions above to optimize performance.
          </Alert>
        )}
      </Stack>
    </Paper>
  );
};

export default PerformanceInsights;