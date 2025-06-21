import React from 'react';
import { 
  Stack, 
  Text, 
  Code, 
  Paper, 
  Group, 
  Badge,
  Alert,
  ScrollArea
} from '@mantine/core';
import { IconCode, IconInfoCircle } from '@tabler/icons-react';

const QueryPreview = ({ query, service }) => {
  if (!query) {
    return (
      <Paper p="md" withBorder>
        <Stack gap="sm" align="center">
          <IconCode size={48} color="gray" />
          <Text c="dimmed" ta="center">
            Configure parameters and generate a query to see the KQL preview
          </Text>
        </Stack>
      </Paper>
    );
  }

  // Basic query analysis
  const lineCount = query.split('\n').length;
  const hasTimeFilter = query.includes('TimeGenerated');
  const hasLimit = query.includes('limit');
  const hasAggregation = query.includes('summarize');

  return (
    <Stack gap="md">
      {/* Header */}
      <Group justify="space-between">
        <Text size="sm" fw={600}>
          KQL Query Preview
        </Text>
        <Group gap="xs">
          <Badge size="xs" color="blue">
            {lineCount} lines
          </Badge>
          {hasTimeFilter && (
            <Badge size="xs" color="green">
              Time Filtered
            </Badge>
          )}
          {hasLimit && (
            <Badge size="xs" color="cyan">
              Limited
            </Badge>
          )}
          {hasAggregation && (
            <Badge size="xs" color="violet">
              Aggregated
            </Badge>
          )}
        </Group>
      </Group>

      {/* Query Display */}
      <Paper p="md" withBorder>
        <ScrollArea.Autosize mah={400}>
          <Code block style={{ whiteSpace: 'pre-wrap' }}>
            {query}
          </Code>
        </ScrollArea.Autosize>
      </Paper>

      {/* Query Info */}
      <Alert icon={<IconInfoCircle size={16} />} variant="light" color="blue">
        <Text size="sm">
          This query will search <strong>{service}</strong> logs. 
          {!hasTimeFilter && ' Consider adding a time range filter for better performance.'}
          {!hasLimit && ' Consider adding a limit to control result size.'}
        </Text>
      </Alert>

      {/* Performance Tips */}
      {(!hasTimeFilter || !hasLimit) && (
        <Alert variant="light" color="yellow" title="Performance Tips">
          <Stack gap="xs">
            {!hasTimeFilter && (
              <Text size="sm">• Add a time range filter (TimeGenerated) for optimal performance</Text>
            )}
            {!hasLimit && (
              <Text size="sm">• Include a limit clause to control result size</Text>
            )}
            <Text size="sm">• More specific filters will improve query speed</Text>
          </Stack>
        </Alert>
      )}
    </Stack>
  );
};

export default QueryPreview;