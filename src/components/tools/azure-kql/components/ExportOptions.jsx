import React from 'react';
import { 
  Stack, 
  Button, 
  Group, 
  Text,
  Paper,
  Divider
} from '@mantine/core';
import { IconCopy, IconDownload, IconExternalLink, IconBookmark, IconStar } from '@tabler/icons-react';
import { useClipboard } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

const ExportOptions = ({ query, onSave, onAddToFavorites }) => {
  const clipboard = useClipboard();

  const handleCopyQuery = () => {
    if (!query) {
      notifications.show({
        title: 'No Query',
        message: 'Generate a query first',
        color: 'orange'
      });
      return;
    }

    clipboard.copy(query);
    notifications.show({
      title: 'Copied',
      message: 'KQL query copied to clipboard',
      color: 'green'
    });
  };

  const handleSaveQuery = () => {
    if (!query) {
      notifications.show({
        title: 'No Query',
        message: 'Generate a query first',
        color: 'orange'
      });
      return;
    }

    onSave({ name: `Query ${new Date().toLocaleString()}` });
  };

  const handleOpenInAzure = () => {
    if (!query) {
      notifications.show({
        title: 'No Query',
        message: 'Generate a query first',
        color: 'orange'
      });
      return;
    }

    // Create Azure portal deep link
    const encodedQuery = encodeURIComponent(query);
    const azureUrl = `https://portal.azure.com/#blade/Microsoft_Azure_Monitoring_Logs/LogsBlade/resourceId/%2F/source/LogsBlade.AnalyticsShareLinkToQuery/query/${encodedQuery}`;
    
    window.open(azureUrl, '_blank');
    
    notifications.show({
      title: 'Opening Azure Portal',
      message: 'Query will open in Azure Log Analytics',
      color: 'blue'
    });
  };

  const handleDownloadQuery = () => {
    if (!query) {
      notifications.show({
        title: 'No Query',
        message: 'Generate a query first',
        color: 'orange'
      });
      return;
    }

    const blob = new Blob([query], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `azure-kql-query-${new Date().toISOString().split('T')[0]}.kql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    notifications.show({
      title: 'Downloaded',
      message: 'KQL query file downloaded',
      color: 'green'
    });
  };


  const handleAddToFavorites = () => {
    if (!onAddToFavorites) {
      notifications.show({
        title: 'Favorites Unavailable',
        message: 'Favorites functionality is not available',
        color: 'orange'
      });
      return;
    }

    onAddToFavorites();
  };

  if (!query) {
    return (
      <Paper p="md" withBorder>
        <Text c="dimmed" ta="center" size="sm">
          Export options will appear after generating a query
        </Text>
      </Paper>
    );
  }

  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        <Text size="sm" fw={600}>
          Export & Execute
        </Text>
        
        <Group grow>
          <Button
            variant="filled"
            leftSection={<IconCopy size={16} />}
            onClick={handleCopyQuery}
            size="sm"
          >
            Copy Query
          </Button>
          
          <Button
            variant="light"
            leftSection={<IconExternalLink size={16} />}
            onClick={handleOpenInAzure}
            size="sm"
            color="blue"
          >
            Open in Azure
          </Button>
        </Group>

        <Divider />

        <Group grow>
          <Button
            variant="light"
            leftSection={<IconBookmark size={16} />}
            onClick={handleSaveQuery}
            size="sm"
            color="cyan"
          >
            Save to History
          </Button>
          
          <Button
            variant="light"
            leftSection={<IconStar size={16} />}
            onClick={handleAddToFavorites}
            size="sm"
            color="yellow"
          >
            Add to Favorites
          </Button>
        </Group>

        <Button
          variant="light"
          leftSection={<IconDownload size={16} />}
          onClick={handleDownloadQuery}
          size="sm"
          color="green"
          fullWidth
        >
          Download .kql File
        </Button>
      </Stack>
    </Paper>
  );
};

export default ExportOptions;