import React, { useState } from 'react';
import { 
  TextInput, 
  Button, 
  Group, 
  Paper, 
  Stack, 
  Text,
  Alert,
  Loader,
  Select,
  Badge,
  Tooltip,
  ActionIcon
} from '@mantine/core';
import { IconWorld, IconSearch, IconAlertCircle, IconClock, IconShieldCheck, IconShieldX, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

const DomainInput = ({ onSubmit, loading, error, domainHistory = [], removeDomainFromHistory }) => {
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
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
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

  const exampleDomains = ['google.com', 'github.com', 'cloudflare.com', 'russ.tools'];

  // Helper function to format history items for the dropdown
  const formatHistoryOptions = () => {
    return domainHistory.map(item => {
      const timeAgo = getTimeAgo(item.timestamp);
      const gradeColor = getGradeColor(item.grade);
      
      return {
        value: item.domain,
        label: item.domain,
        description: `${item.grade} grade • ${timeAgo}`,
        gradeColor,
        hasWarnings: item.hasWarnings
      };
    });
  };

  // Helper function to get time ago string
  const getTimeAgo = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  // Helper function to get grade color
  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'green';
      case 'B':
        return 'yellow';
      case 'C':
        return 'orange';
      case 'F':
        return 'red';
      case 'T':
        return 'blue';
      default:
        return 'gray';
    }
  };

  // Handle removing a domain from history
  const handleRemoveDomain = (domainToRemove, event) => {
    event.stopPropagation(); // Prevent the dropdown from selecting the item
    if (removeDomainFromHistory) {
      removeDomainFromHistory(domainToRemove);
      notifications.show({
        title: 'Domain Removed',
        message: `${domainToRemove} has been removed from your history`,
        color: 'red',
        icon: <IconX size={16} />,
        autoClose: 3000,
      });
    }
  };

  return (
    <Paper p="md" withBorder radius="md">
      <Stack gap="md">
        <Group gap="xs" align="center">
          <Text size="sm" fw={500}>Enter Domain to Check</Text>
        </Group>

        {/* Domain History Dropdown */}
        {domainHistory.length > 0 && (
          <Stack gap="xs">
            <Text size="xs" fw={500} c="dimmed">Recently Checked Domains</Text>
            <Select
              placeholder="Select from history"
              data={formatHistoryOptions()}
              value={null}
              onChange={(value) => {
                if (value) {
                  setDomain(value);
                }
              }}
              leftSection={<IconClock size={16} />}
              searchable
              maxDropdownHeight={200}
              disabled={loading}
              renderOption={({ option }) => (
                <Group justify="space-between" wrap="nowrap">
                  <div style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>{option.label}</Text>
                    <Text size="xs" c="dimmed">{option.description}</Text>
                  </div>
                  <Group gap="xs" align="center">
                    {option.hasWarnings && (
                      <Tooltip label="Has warnings">
                        <IconShieldX size={14} color="orange" />
                      </Tooltip>
                    )}
                    <Badge 
                      size="xs" 
                      color={option.gradeColor}
                      variant="light"
                    >
                      {option.value === option.label ? 
                        domainHistory.find(h => h.domain === option.value)?.grade || 'Unknown' : 
                        'Unknown'
                      }
                    </Badge>
                    {removeDomainFromHistory && (
                      <Tooltip label={`Remove ${option.value} from history`} withArrow>
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          color="red"
                          onClick={(e) => handleRemoveDomain(option.value, e)}
                          style={{
                            transition: 'all 0.2s ease',
                            opacity: 0.6
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.opacity = '1';
                            e.target.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.opacity = '0.6';
                            e.target.style.transform = 'scale(1)';
                          }}
                        >
                          <IconX size={12} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </Group>
                </Group>
              )}
            />
          </Stack>
        )}

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <Group gap="md" align="flex-end" wrap="nowrap">
              <TextInput
                value={domain}
                onChange={handleDomainChange}
                onKeyDown={handleKeyPress}
                placeholder="Enter domain name (e.g., example.com)"
                leftSection={<IconWorld size={16} />}
                size="lg"
                style={{ flex: 1 }}
                error={validationError}
                disabled={loading}
                description="Enter just the domain name - no need for https:// or paths"
                radius="md"
              />
              <Button 
                type="submit"
                leftSection={loading ? <Loader size={18} color="white" /> : <IconSearch size={18} />}
                loading={loading}
                disabled={loading || !domain.trim()}
                size="lg"
                variant="gradient"
                gradient={{ from: 'teal', to: 'green', deg: 45 }}
                radius="md"
                styles={{
                  root: {
                    minWidth: '140px',
                    fontWeight: 600,
                    boxShadow: '0 4px 14px 0 rgba(0, 200, 83, 0.39)',
                    transition: 'all 0.2s ease',
                    '&:hover:not(:disabled)': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 6px 20px 0 rgba(0, 200, 83, 0.5)'
                    }
                  }
                }}
              >
                {loading ? 'Checking...' : 'Check SSL'}
              </Button>
            </Group>
          </Stack>
        </form>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" variant="light">
            {error}
          </Alert>
        )}

        <Group gap="xs" align="center">
          <Text size="xs" c="dimmed" fw={500}>Try these examples:</Text>
          {exampleDomains.map((example) => (
            <Button
              key={example}
              variant="light"
              size="xs"
              onClick={() => setDomain(example)}
              disabled={loading}
              color="teal"
              radius="sm"
              styles={{
                root: {
                  transition: 'all 0.15s ease',
                  '&:hover:not(:disabled)': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 2px 8px rgba(32, 201, 151, 0.25)'
                  }
                }
              }}
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