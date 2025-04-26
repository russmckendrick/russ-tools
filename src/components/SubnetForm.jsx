import { useState } from 'react';
import { TextInput, Button, Group, Paper } from '@mantine/core';

export function SubnetForm({ onAddSubnet, parentCidr }) {
  const [name, setName] = useState('');
  const [cidr, setCidr] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const cidrNum = parseInt(cidr.replace('/', ''), 10);
    if (!name.trim()) {
      setError('Subnet name is required');
      return;
    }
    if (isNaN(cidrNum) || cidrNum < parentCidr || cidrNum > 32) {
      setError(`CIDR must be between ${parentCidr} and 32`);
      return;
    }
    onAddSubnet({ name: name.trim(), cidr: cidrNum });
    setName('');
    setCidr('');
  };

  return (
    <Paper p="md" radius="md" withBorder mb="md">
      <form onSubmit={handleSubmit}>
        <Group grow>
          <TextInput
            label="Subnet Name"
            placeholder="e.g., Web Tier"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={error && error.includes('name') ? error : null}
          />
          <TextInput
            label="CIDR Size"
            placeholder={`e.g., ${parentCidr + 1}`}
            value={cidr}
            onChange={(e) => setCidr(e.target.value.replace('/', ''))}
            error={error && error.includes('CIDR') ? error : null}
          />
        </Group>
        <Button type="submit" mt="md" fullWidth>
          Add Subnet
        </Button>
        {error && !error.includes('name') && !error.includes('CIDR') && (
          <div style={{ color: 'red', marginTop: 8 }}>{error}</div>
        )}
      </form>
    </Paper>
  );
} 