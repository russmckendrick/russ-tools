import { useState, useMemo } from 'react';
import { TextInput, Button, Group, Paper, Select, Text } from '@mantine/core';

export function SubnetForm({ onAddSubnet, parentCidr }) {
  const [name, setName] = useState('');
  const [cidr, setCidr] = useState('');
  const [error, setError] = useState(null);

  // Generate CIDR options for dropdown
  // Only show CIDR values larger than parent CIDR (smaller networks)
  const cidrOptions = useMemo(() => {
    if (!parentCidr) return [];
    
    return Array.from({ length: 30 - parentCidr }, (_, i) => {
      const value = String(parentCidr + i + 1); // Start from parent+1 to /30
      return { value, label: `/${value}` };
    });
  }, [parentCidr]);

  const handleSubmit = () => {
    // Validate name
    if (!name.trim()) {
      setError('Please enter a subnet name');
      return;
    }

    // Validate CIDR
    if (!cidr) {
      setError('Please select a CIDR size');
      return;
    }

    // Reset error
    setError(null);

    // Add subnet
    onAddSubnet({
      name: name.trim(),
      cidr: parseInt(cidr, 10)
    });

    // Reset form
    setName('');
    setCidr('');
  };

  return (
    <Paper p="md" radius="md" withBorder mb="md">
      <Group position="apart" spacing="md" align="flex-end">
        <TextInput
          label="Subnet Name"
          placeholder="e.g., Web Tier"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error && error.includes('name') ? error : null}
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
        <Button onClick={handleSubmit} style={{ marginBottom: '1px' }}>
          Add Subnet
        </Button>
      </Group>
      {error && !error.includes('name') && !error.includes('CIDR') && (
        <Text color="red" size="sm" mt="xs">{error}</Text>
      )}
    </Paper>
  );
} 