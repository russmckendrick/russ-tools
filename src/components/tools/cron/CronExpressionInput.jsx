import React, { useState } from 'react';
import { TextInput, Group, ActionIcon, Tooltip, Text, Paper, Stack } from '@mantine/core';
import { IconEdit, IconCheck, IconX } from '@tabler/icons-react';

const CronExpressionInput = ({ value, onChange, readOnly = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleStartEdit = () => {
    setEditValue(value);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (onChange) {
      onChange(editValue);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSaveEdit();
    } else if (event.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Update editValue when value prop changes
  React.useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  if (readOnly) {
    return (
      <Paper p="md" withBorder radius="sm" bg="gray.0">
        <Stack gap="xs">
          <Text size="xs" c="dimmed">Generated Cron Expression:</Text>
          <Group justify="space-between" align="center">
            <Text 
              font="monospace" 
              size="lg" 
              fw="bold" 
              c="blue"
              style={{ 
                backgroundColor: 'var(--mantine-color-blue-0)',
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid var(--mantine-color-blue-2)',
                flex: 1
              }}
            >
              {value}
            </Text>
          </Group>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper p="md" withBorder radius="sm" bg="gray.0">
      <Stack gap="xs">
        <Text size="xs" c="dimmed">Manual Cron Expression Input:</Text>
        {isEditing ? (
          <Group gap="xs">
            <TextInput
              value={editValue}
              onChange={(event) => setEditValue(event.currentTarget.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter cron expression (e.g., 0 9 * * 1-5)"
              font="monospace"
              size="sm"
              style={{ flex: 1 }}
              autoFocus
              description="Format: minute hour day-of-month month day-of-week"
            />
            <Tooltip label="Save changes">
              <ActionIcon 
                color="green" 
                variant="filled" 
                onClick={handleSaveEdit}
                size="lg"
              >
                <IconCheck size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Cancel">
              <ActionIcon 
                color="red" 
                variant="filled" 
                onClick={handleCancelEdit}
                size="lg"
              >
                <IconX size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        ) : (
          <Group justify="space-between" align="center">
            <Text 
              font="monospace" 
              size="sm" 
              c={value ? "dark" : "dimmed"}
              style={{ 
                backgroundColor: 'white',
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid var(--mantine-color-gray-3)',
                flex: 1,
                minHeight: '36px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {value || 'Click edit to enter a cron expression manually'}
            </Text>
            <Tooltip label="Edit expression">
              <ActionIcon 
                color="blue" 
                variant="light" 
                onClick={handleStartEdit}
                size="lg"
              >
                <IconEdit size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        )}
        <Text size="xs" c="dimmed">
          Tip: Press Enter to save, Escape to cancel
        </Text>
      </Stack>
    </Paper>
  );
};

export default CronExpressionInput;
