import { useState } from 'react';
import { TextInput, Button, Paper, Group, Select, Stack, Text, Title, Grid, Badge } from '@mantine/core';
import { IconNetwork } from '@tabler/icons-react';
import { isValidIPv4 } from '../../../utils';
import HelpTooltip from '../azure-naming/HelpTooltip';

export function ParentNetworkForm({ onSubmit, existingNetwork = null, onCancel = null }) {
  const [ip, setIp] = useState(existingNetwork?.ip || '');
  const [cidr, setCidr] = useState(existingNetwork?.cidr ? String(existingNetwork.cidr) : '');
  const [name, setName] = useState(existingNetwork?.name || '');
  const [error, setError] = useState(null);

  // Generate CIDR options for dropdown (reversed: /31 to /8)
  const cidrOptions = Array.from({ length: 24 }, (_, i) => {
    const value = String(31 - i); // Start from /31 down to /8
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
        <Title order={4}>
          {existingNetwork ? 'Reconfigure Parent Network' : 'Configure Parent Network'}
        </Title>
        {existingNetwork && (
          <Badge variant="light" color="orange">Editing</Badge>
        )}
      </Group>
      
      <Stack gap="md">
        {existingNetwork && (
          <Text size="sm" c="orange" p="sm" bg="orange.0" style={{ borderRadius: '4px', border: '1px solid var(--mantine-color-orange-3)' }}>
            ⚠️ <strong>Warning:</strong> Changing the parent network will remove all existing subnets. You'll need to recreate them after saving.
          </Text>
        )}
        
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Parent Network IP"
              description={
                <Group gap={4} align="center">
                  <Text size="xs" c="dimmed">Enter the base IP address for your network</Text>
                  <HelpTooltip content="Examples: 10.0.0.0, 192.168.1.0, 172.16.0.0" />
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
              label="CIDR Size"
              description={
                <Group gap={4} align="center">
                  <Text size="xs" c="dimmed">Subnet mask notation</Text>
                  <HelpTooltip content="Smaller numbers = larger networks (e.g., /16 = 65,536 IPs, /24 = 256 IPs)" />
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
              label="Network Name"
              description={
                <Group gap={4} align="center">
                  <Text size="xs" c="dimmed">Descriptive name (optional)</Text>
                  <HelpTooltip content="Give your network a meaningful name for easier identification" />
                </Group>
              }
              placeholder="e.g., Production VPC"
              value={name}
              onChange={(e) => setName(e.target.value)}
              size="sm"
            />
          </Grid.Col>
        </Grid>

        <Group justify="flex-end" mt="md" gap="sm">
          {onCancel && (
            <Button 
              variant="outline"
              onClick={onCancel}
              size="sm"
            >
              Cancel
            </Button>
          )}
          <Button 
            onClick={handleSubmit}
            leftSection={<IconNetwork size={16} />}
            size="sm"
          >
            {existingNetwork ? 'Update Parent Network' : 'Set Parent Network'}
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
} 