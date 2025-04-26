import { useState } from 'react';
import { TextInput, Button, Group, Paper } from '@mantine/core';

function isValidIPv4(ip) {
  const pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!pattern.test(ip)) return false;
  return ip.split('.').every(num => {
    const n = parseInt(num, 10);
    return n >= 0 && n <= 255;
  });
}

export function ParentNetworkForm({ onSubmit }) {
  const [ip, setIp] = useState('');
  const [cidr, setCidr] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!isValidIPv4(ip)) {
      setError('Invalid IPv4 address');
      return;
    }
    const cidrNum = parseInt(cidr.replace('/', ''), 10);
    if (isNaN(cidrNum) || cidrNum < 0 || cidrNum > 32) {
      setError('CIDR must be between 0 and 32');
      return;
    }
    if (!name.trim()) {
      setError('Network name is required');
      return;
    }
    onSubmit({ ip, cidr: cidrNum, name: name.trim() });
  };

  return (
    <Paper p="md" radius="md" withBorder mb="md">
      <form onSubmit={handleSubmit}>
        <Group grow>
          <TextInput
            label="Parent Network IP"
            placeholder="e.g., 10.0.0.0"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            error={error && error.includes('IPv4') ? error : null}
          />
          <TextInput
            label="CIDR Size"
            placeholder="e.g., 16"
            value={cidr}
            onChange={(e) => setCidr(e.target.value.replace('/', ''))}
            error={error && error.includes('CIDR') ? error : null}
          />
          <TextInput
            label="Network Name"
            placeholder="e.g., Production VPC"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={error && error.includes('name') ? error : null}
          />
        </Group>
        <Button type="submit" mt="md" fullWidth>
          Set Parent Network
        </Button>
        {error && !error.includes('IPv4') && !error.includes('CIDR') && !error.includes('name') && (
          <div style={{ color: 'red', marginTop: 8 }}>{error}</div>
        )}
      </form>
    </Paper>
  );
} 