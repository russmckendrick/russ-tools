import React from 'react';
import { 
  Stack, 
  Text, 
  Paper, 
  Button, 
  Group, 
  Badge,
  Code,
  ActionIcon,
  Tooltip,
  ScrollArea,
  Alert
} from '@mantine/core';
import { IconHistory, IconTrash, IconExternalLink, IconReload } from '@tabler/icons-react';
import { useLocalStorage } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

const QueryHistory = ({ history, onLoadQuery }) => {
  const [, setQueryHistory] = useLocalStorage({
    key: 'azure-kql-history',
    defaultValue: []
  });

  const handleLoadQuery = (historyEntry) => {
    onLoadQuery(historyEntry);
  };

  const handleDeleteQuery = (queryId) => {
    const updatedHistory = history.filter(item => item.id !== queryId);
    setQueryHistory(updatedHistory);
    
    notifications.show({
      title: 'Query Deleted',
      message: 'Query has been removed from history',
      color: 'red'
    });
  };

  const handleClearHistory = () => {
    setQueryHistory([]);
    
    notifications.show({
      title: 'History Cleared',
      message: 'All queries have been removed from history',
      color: 'orange'
    });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!history || history.length === 0) {
    return (
      <Paper p="xl" withBorder>
        <Stack gap="md" align="center">
          <IconHistory size={48} color="gray" />
          <Text c="dimmed" ta="center">
            No saved queries yet
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            Generate and save queries to see them here
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      {/* Header */}
      <Group justify="space-between">
        <Group gap="sm">
          <Text size="lg" fw={600}>
            Query History
          </Text>
          <Badge size="sm" color="gray">
            {history.length} queries
          </Badge>
        </Group>
        
        {history.length > 0 && (
          <Button
            variant="subtle"
            color="red"
            size="sm"
            leftSection={<IconTrash size={16} />}
            onClick={handleClearHistory}
          >
            Clear All
          </Button>
        )}
      </Group>

      {/* History List */}
      <Stack gap="md">
        {history.map((item) => (
          <Paper key={item.id} p="md" withBorder>
            <Stack gap="sm">
              {/* Header */}
              <Group justify="space-between">
                <div>
                  <Text fw={500} size="sm">
                    {item.name || `${item.service} Query`}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {formatDate(item.timestamp)}
                  </Text>
                </div>
                
                <Group gap="xs">
                  <Badge size="xs" color="blue">
                    {item.service}
                  </Badge>
                  {item.template && (
                    <Badge size="xs" color="gray">
                      {item.template}
                    </Badge>
                  )}
                </Group>
              </Group>

              {/* Query Preview */}
              <ScrollArea.Autosize mah={120}>
                <Code block size="xs" style={{ fontSize: '11px' }}>
                  {item.query}
                </Code>
              </ScrollArea.Autosize>

              {/* Parameters */}
              {item.parameters && Object.keys(item.parameters).length > 0 && (
                <Group gap="xs">
                  <Text size="xs" c="dimmed">Parameters:</Text>
                  {Object.entries(item.parameters)
                    .filter(([, value]) => value !== undefined && value !== null && value !== '')
                    .slice(0, 3)
                    .map(([key, value]) => (
                      <Badge key={key} size="xs" variant="light">
                        {key}: {String(value)}
                      </Badge>
                    ))}
                  {Object.entries(item.parameters).filter(([, value]) => value !== undefined && value !== null && value !== '').length > 3 && (
                    <Badge size="xs" variant="light" color="gray">
                      +{Object.entries(item.parameters).filter(([, value]) => value !== undefined && value !== null && value !== '').length - 3} more
                    </Badge>
                  )}
                </Group>
              )}

              {/* Actions */}
              <Group justify="space-between">
                <Button
                  variant="light"
                  size="xs"
                  leftSection={<IconReload size={14} />}
                  onClick={() => handleLoadQuery(item)}
                >
                  Load Query
                </Button>
                
                <Group gap="xs">
                  <Tooltip label="Open in Azure Portal">
                    <ActionIcon
                      variant="subtle"
                      size="sm"
                      onClick={() => {
                        const encodedQuery = encodeURIComponent(item.query);
                        const azureUrl = `https://portal.azure.com/#blade/Microsoft_Azure_Monitoring_Logs/LogsBlade/resourceId/%2F/source/LogsBlade.AnalyticsShareLinkToQuery/query/${encodedQuery}`;
                        window.open(azureUrl, '_blank');
                      }}
                    >
                      <IconExternalLink size={16} />
                    </ActionIcon>
                  </Tooltip>
                  
                  <Tooltip label="Delete Query">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={() => handleDeleteQuery(item.id)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
            </Stack>
          </Paper>
        ))}
      </Stack>

      {/* Info */}
      <Alert variant="light" color="blue">
        <Text size="sm">
          Query history is stored locally in your browser. 
          Only the last 50 queries are kept automatically.
        </Text>
      </Alert>
    </Stack>
  );
};

export default QueryHistory;