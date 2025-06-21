import React from 'react';
import { 
  Stack, 
  Text, 
  Paper, 
  Group, 
  Badge,
  Alert,
  ScrollArea
} from '@mantine/core';
import { IconCode, IconInfoCircle } from '@tabler/icons-react';
import { useMantineColorScheme } from '@mantine/core';
import Prism from 'prismjs';
import '../utils/prism-kql.js';
import '../../../../styles/prism-theme.css';

const QueryPreview = ({ query, service }) => {
  const { colorScheme } = useMantineColorScheme();

  // Render highlighted KQL code using Prism
  const renderHighlightedKQL = (kqlCode) => {
    if (!kqlCode) return null;
    
    const highlighted = Prism.highlight(kqlCode, Prism.languages.kql || Prism.languages.text, 'kql');
    
    return (
      <div className={colorScheme === 'dark' ? 'prism-dark' : ''}>
        <pre className="language-kql" style={{ 
          margin: 0,
          background: 'transparent',
          fontSize: '13px',
          lineHeight: '1.5'
        }}>
          <code 
            className="language-kql"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </pre>
      </div>
    );
  };

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
          {renderHighlightedKQL(query)}
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