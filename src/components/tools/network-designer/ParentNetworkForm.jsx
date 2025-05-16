import { useState } from 'react';
import { TextInput, Button, Paper, Group, Select } from '@mantine/core';
import { isValidIPv4 } from '../../../utils';

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
    <Paper p="md" radius="md" withBorder mb="md">
      <Group position="apart" spacing="md" align="flex-end">
        <TextInput
          label="Parent Network IP"
          placeholder="e.g., 10.0.0.0"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          error={error && error.includes('IP') ? error : null}
          style={{ flex: 1 }}
        />
        <Select
          label="CIDR Size"
          placeholder="Select size"
          value={cidr}
          onChange={setCidr}
          data={cidrOptions}
          error={error && error.includes('CIDR') ? error : null}
          style={{ width: '120px' }}
        />
        <TextInput
          label="Network Name"
          placeholder="e.g., Production VPC"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ flex: 1 }}
        />
        <Button onClick={handleSubmit} style={{ marginBottom: '1px' }}>
          Set Parent Network
        </Button>
      </Group>
    </Paper>
  );
} 