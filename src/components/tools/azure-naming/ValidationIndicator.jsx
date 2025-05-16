import React from 'react';
import { Group, Text, ThemeIcon, Alert, Stack } from '@mantine/core';
import { IconCheck, IconAlertTriangle, IconX } from '@tabler/icons-react';

const ValidationIndicator = ({ formState, validationState }) => {
  if (!formState.resourceType || formState.resourceType.length === 0) {
    return null;
  }

  const hasErrors = Object.keys(validationState.errors).length > 0;

  let statusIcon, statusColor, statusText;
  if (hasErrors) {
    statusIcon = <IconX size={16} />;
    statusColor = 'red';
    statusText = 'Validation Errors';
  } else if (validationState.isValid) {
    statusIcon = <IconCheck size={16} />;
    statusColor = 'green';
    statusText = 'Valid';
  } else {
    statusIcon = <IconAlertTriangle size={16} />;
    statusColor = 'yellow';
    statusText = 'Incomplete';
  }

  return (
    <Stack gap="xs" mb="md">
      <Group align="center" gap={8}>
        <ThemeIcon color={statusColor} size={20} radius="xl" variant="light">
          {statusIcon}
        </ThemeIcon>
        <Text size="sm" fw={500} c="gray.7">{statusText}</Text>
      </Group>

      {/* Show general error if present */}
      {validationState.errors.general && (
        <Alert color="red" icon={<IconX size={18} />} variant="light" mb={4}>
          <Text size="sm" c="red.7">{validationState.errors.general}</Text>
        </Alert>
      )}

      {hasErrors && (
        <Alert color="red" title="Please fix the following issues:" icon={<IconX size={18} />} variant="light">
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {Object.entries(validationState.errors)
              .filter(([field]) => field !== 'general')
              .map(([field, error]) => (
                <li key={field}><Text size="sm" c="red.7">{error}</Text></li>
              ))}
          </ul>
        </Alert>
      )}

      {validationState.isValid && (
        <Alert color="green" icon={<IconCheck size={18} />} variant="light">
          <Text size="sm" c="green.8">All inputs are valid. You can generate a name for your resource.</Text>
        </Alert>
      )}
    </Stack>
  );
};

export default ValidationIndicator; 