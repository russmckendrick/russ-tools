import React, { useState } from 'react';
import { Button, Card, Text, Title, Center, Stack } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

export default function ClearAllStorage() {
  const [cleared, setCleared] = useState(false);

  const handleClear = () => {
    localStorage.clear();
    setCleared(true);
  };

  return (
    <Center style={{ minHeight: '80vh' }}>
      <Card shadow="xl" padding="lg" radius="md" style={{ maxWidth: 480, width: '100%' }}>
        <Stack align="center" spacing="xl">
          <IconAlertTriangle size={64} color="#e03131" />
          <Title order={2} color="#e03131">Danger Zone!</Title>
          <Text align="center" color="#e03131" size="lg" weight={700}>
            This action will <b>permanently delete</b> all locally stored data for all tools.<br />
            This cannot be undone.
          </Text>
          <Button
            size="xl"
            color={cleared ? 'green' : 'red'}
            radius="xl"
            onClick={cleared ? undefined : handleClear}
            disabled={cleared}
          >
            {cleared ? 'All local storage cleared!' : 'DELETE ALL LOCAL STORAGE'}
          </Button>
        </Stack>
      </Card>
    </Center>
  );
}
