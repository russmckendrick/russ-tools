import React, { useState } from 'react';
import { Button, Paper, Text, Title, Center, Stack, ThemeIcon, Group, Alert, List, Modal, Grid, Card } from '@mantine/core';
import { IconAlertTriangle, IconTrash, IconShield } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';

export default function ClearAllStorage() {
  const [cleared, setCleared] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);

  const handleClear = () => {
    localStorage.clear();
    setCleared(true);
    close();
  };

  return (
    <>
      <Paper p="xl" radius="lg" withBorder>
        <Stack gap="xl">
          {/* Header */}
          <Group gap="md">
            <ThemeIcon size={48} radius="md" color="red" variant="light">
              <IconShield size={28} />
            </ThemeIcon>
            <div>
              <Title order={2} fw={600}>
                Storage Management
              </Title>
              <Text size="sm" c="dimmed">
                Manage locally stored data across all tools
              </Text>
            </div>
          </Group>

          {/* Content Grid */}
          <Grid gutter="lg">
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Card withBorder p="lg" radius="md">
                <Stack gap="md">
                  <Group gap="xs">
                    <Text fw={600} size="lg">Local Storage Overview</Text>
                  </Group>
                  
                  <Text size="sm" c="dimmed">
                    RussTools stores data locally in your browser to enhance your experience. This includes:
                  </Text>
                  
                  <List size="sm" spacing="xs">
                    <List.Item>Azure naming tool configurations</List.Item>
                    <List.Item>Data converter history</List.Item>
                    <List.Item>DNS lookup history and cache</List.Item>
                    <List.Item>Network designer saved networks</List.Item>
                    <List.Item>Tool preferences and settings</List.Item>
                    <List.Item>WHOIS lookup history and cache</List.Item>
                  </List>
                  
                  <Text size="sm" c="dimmed">
                    All data is stored locally in your browser and never sent to external servers.
                  </Text>
                </Stack>
              </Card>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card withBorder p="lg" radius="md" style={{ height: '100%' }}>
                <Stack gap="md" justify="space-between" style={{ height: '100%' }}>
                  <div>
                    <Group gap="xs" mb="md">
                      <ThemeIcon size="sm" color="red" variant="light">
                        <IconAlertTriangle size={14} />
                      </ThemeIcon>
                      <Text fw={600} size="sm" c="red">Danger Zone</Text>
                    </Group>
                    
                    <Text size="sm" c="dimmed" mb="md">
                      Clear all locally stored data permanently. This action cannot be undone.
                    </Text>
                  </div>
                  
                  <Button
                    color="red"
                    variant="light"
                    leftSection={<IconTrash size={16} />}
                    onClick={cleared ? undefined : open}
                    disabled={cleared}
                    fullWidth
                  >
                    {cleared ? 'Storage Cleared' : 'Clear All Data'}
                  </Button>
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>

          {cleared && (
            <Alert
              icon={<IconTrash size={16} />}
              title="Storage Cleared Successfully"
              color="green"
              variant="light"
            >
              All locally stored data has been permanently removed. You can refresh the page or continue using the tools with a clean slate.
            </Alert>
          )}
        </Stack>
      </Paper>

      {/* Confirmation Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title={
          <Group gap="md">
            <ThemeIcon size={32} radius="md" color="red" variant="light">
              <IconAlertTriangle size={20} />
            </ThemeIcon>
            <Text fw={600} c="red">Confirm Data Deletion</Text>
          </Group>
        }
        centered
        size="md"
      >
        <Stack gap="lg">
          <Alert
            icon={<IconAlertTriangle size={16} />}
            title="Warning: This action cannot be undone"
            color="red"
            variant="light"
          >
            <Text size="sm">
              You are about to <Text span fw={600}>permanently delete</Text> all locally stored data for all RussTools. 
              This includes all history, cache, configurations, and preferences.
            </Text>
          </Alert>
          
          <Text size="sm" c="dimmed">
            Are you sure you want to proceed? This will clear all data and cannot be reversed.
          </Text>
          
          <Group justify="flex-end" gap="md">
            <Button variant="light" onClick={close}>
              Cancel
            </Button>
            <Button 
              color="red" 
              leftSection={<IconTrash size={16} />}
              onClick={handleClear}
            >
              Yes, Clear All Data
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
