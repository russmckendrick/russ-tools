import React from 'react';
import { Paper, Group, Text, Button, Divider, Stack, ScrollArea } from '@mantine/core';
import { useAzureNamingContext } from '../../../context/AzureNamingContext';

const NamingHistory = () => {
  const { namingHistory, clearHistory, setFormState, setPendingLoad } = useAzureNamingContext();

  const handleLoadConfiguration = async (configuration) => {
    setFormState(configuration);
    setPendingLoad(true);
  };

  if (namingHistory.length === 0) {
    return null;
  }

  return (
    <Paper radius="md" withBorder p="md" mt="md">
      <Group justify="space-between" align="center" mb="xs">
        <Text fw={600} size="md">Recent Names</Text>
        <Button onClick={clearHistory} size="xs" color="gray" variant="subtle">
          Clear History
        </Button>
      </Group>
      <Divider my="xs" />
      <ScrollArea h={220} type="auto" offsetScrollbars>
        <Stack gap={0}>
          {namingHistory.map((item) => (
            <Paper key={item.id} radius="sm" p="sm" withBorder mb="xs">
              <Group justify="space-between" align="center">
                <div style={{ minWidth: 0, flex: 1 }}>
                  {item.group && Array.isArray(item.group) ? (
                    item.group.map((g, idx) => (
                      <Text key={g.generatedName + idx} size="sm" fw={500} truncate c="blue.7">
                        {g.generatedName}
                        <Text span size="xs" c="dimmed" ml={8}>{g.resourceType}</Text>
                      </Text>
                    ))
                  ) : (
                    <Text size="sm" fw={500} truncate c="blue.7">{item.generatedName}</Text>
                  )}
                  <Text size="xs" c="dimmed">
                    {new Date(item.timestamp).toLocaleString()}
                  </Text>
                </div>
                <Button
                  onClick={() => handleLoadConfiguration(item.configuration)}
                  size="xs"
                  color="blue"
                  variant="light"
                >
                  Load
                </Button>
              </Group>
            </Paper>
          ))}
        </Stack>
      </ScrollArea>
    </Paper>
  );
};

export default NamingHistory; 