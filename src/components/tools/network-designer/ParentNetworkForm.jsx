import { useState } from 'react';
import { TextInput, Button, Paper, Group, Select, Stack, Text, Title, Grid } from '@mantine/core';
import { IconNetwork } from '@tabler/icons-react';
import { isValidIPv4 } from '../../../utils';
import HelpTooltip from '../azure-naming/HelpTooltip';

export function ParentNetworkForm({ onSubmit }) {
  const [ip, setIp] = useState('');
  const [cidr, setCidr] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);

  // Generate CIDR options for dropdown
  const cidrOptions = Array.from({ length: 24 }, (_, i) => {
    const value = String(i + 8); // Start from /8 to /31
    return { value, label: `/${value}` };
  });

  const handleSubmit = () => {
    // Validate IP
    if (!ip || !isValidIPv4(ip)) {
      setError('Please enter a valid IPv4 address');
      return;
    }

    // Validate CIDR
    if (!cidr) {
      setError('Please select a CIDR size');
      return;
    }

    // Reset error
    setError(null);

    // Submit parent network
    onSubmit({
      ip,
      cidr: parseInt(cidr, 10),
      name: name || `Network ${ip}/${cidr}`
    });
  };

  return (
    <Paper p="lg" withBorder radius="md" bg="white">
      <Group gap="sm" mb="lg">
        <IconNetwork size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
        <Title order={4}>Configure Parent Network</Title>
      </Group>
      
      <Stack gap="md">
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label={
                <Group gap={4} align="center">
                  <Text size="sm" fw={500}>Parent Network IP</Text>
                  <HelpTooltip content="Enter the base IP address for your network (e.g., 10.0.0.0, 192.168.1.0)" />
                </Group>
              }
              placeholder="e.g., 10.0.0.0"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              error={error && error.includes('IP') ? error : null}
              withAsterisk
              size="sm"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Select
              label={
                <Group gap={4} align="center">
                  <Text size="sm" fw={500}>CIDR Size</Text>
                  <HelpTooltip content="Select the subnet mask in CIDR notation (smaller numbers = larger networks)" />
                </Group>
              }
              placeholder="Select size"
              value={cidr}
              onChange={setCidr}
              data={cidrOptions}
              error={error && error.includes('CIDR') ? error : null}
              withAsterisk
              size="sm"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <TextInput
              label={
                <Group gap={4} align="center">
                  <Text size="sm" fw={500}>Network Name</Text>
                  <HelpTooltip content="Give your network a descriptive name (optional)" />
                </Group>
              }
              placeholder="e.g., Production VPC"
              value={name}
              onChange={(e) => setName(e.target.value)}
              size="sm"
            />
          </Grid.Col>
        </Grid>

        <Group justify="flex-end" mt="md">
          <Button 
            onClick={handleSubmit}
            leftSection={<IconNetwork size={16} />}
            size="sm"
          >
            Set Parent Network
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
} 