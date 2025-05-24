import React, { useState } from 'react';
import { 
  TextInput, 
  Button, 
  Group, 
  Paper, 
  Stack, 
  Text,
  Alert,
  Loader
} from '@mantine/core';
import { IconWorld, IconSearch, IconAlertCircle } from '@tabler/icons-react';

const DomainInput = ({ onSubmit, loading, error }) => {
  const [domain, setDomain] = useState('');
  const [validationError, setValidationError] = useState('');

  const validateDomain = (domainToValidate) => {
    if (!domainToValidate.trim()) {
      return 'Please enter a domain name';
    }

    // Clean the domain first
    const cleanedDomain = domainToValidate
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .trim()
      .toLowerCase();

    // Basic domain validation regex
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!domainRegex.test(cleanedDomain)) {
      return 'Please enter a valid domain name (e.g., example.com)';
    }

    if (cleanedDomain.length > 253) {
      return 'Domain name is too long';
    }

    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validationErr = validateDomain(domain);
    if (validationErr) {
      setValidationError(validationErr);
      return;
    }

    setValidationError('');
    onSubmit(domain);
  };

  const handleDomainChange = (event) => {
    const newDomain = event.currentTarget.value;
    setDomain(newDomain);
    
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError('');
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSubmit(event);
    }
  };

  const exampleDomains = ['google.com', 'github.com', 'cloudflare.com', 'example.com'];

  return (
    <Paper p="md" withBorder radius="md">
      <Stack gap="md">
        <Group gap="xs" align="center">
          <Text size="sm" fw={500}>Enter Domain to Check</Text>
        </Group>

        <form onSubmit={handleSubmit}>
          <Group gap="xs" align="flex-start">
            <TextInput
              value={domain}
              onChange={handleDomainChange}
              onKeyDown={handleKeyPress}
              placeholder="Enter domain name (e.g., example.com)"
              leftSection={<IconWorld size={16} />}
              size="md"
              style={{ flex: 1 }}
              error={validationError}
              disabled={loading}
              description="Enter just the domain name - no need for https:// or paths"
            />
            <Button 
              type="submit"
              leftSection={loading ? <Loader size={16} color="white" /> : <IconSearch size={16} />}
              loading={loading}
              disabled={loading || !domain.trim()}
              size="md"
              color="green"
            >
              {loading ? 'Checking...' : 'Check SSL'}
            </Button>
          </Group>
        </form>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" variant="light">
            {error}
          </Alert>
        )}

        <Group gap="xs">
          <Text size="xs" c="dimmed">Try these examples:</Text>
          {exampleDomains.map((example) => (
            <Button
              key={example}
              variant="subtle"
              size="xs"
              onClick={() => setDomain(example)}
              disabled={loading}
              color="gray"
            >
              {example}
            </Button>
          ))}
        </Group>
      </Stack>
    </Paper>
  );
};

export default DomainInput; 