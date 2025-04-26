import { useState, useEffect } from 'react';
import { Container, TextInput, Button, Paper, Title, Grid, Text } from '@mantine/core';
import { Netmask } from 'netmask';
import { SubnetVisualization } from '../components/SubnetVisualization';
import { ParentNetworkForm } from '../components/ParentNetworkForm';
import { SubnetForm } from '../components/SubnetForm';

function isValidIPv4(ip) {
  const pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!pattern.test(ip)) return false;
  return ip.split('.').every(num => {
    const n = parseInt(num, 10);
    return n >= 0 && n <= 255;
  });
}

function parseInput(ipAddress, maskInput) {
  // Clean input
  const input = maskInput.trim();
  
  // Handle CIDR notation (with or without leading slash)
  if (input.startsWith('/')) {
    return new Netmask(ipAddress + input);
  }
  
  // Handle plain CIDR number
  if (/^\d{1,2}$/.test(input)) {
    const prefix = parseInt(input, 10);
    if (prefix < 0 || prefix > 32) throw new Error('CIDR prefix must be between 0 and 32');
    return new Netmask(ipAddress + '/' + prefix);
  }
  
  // Handle subnet mask
  if (isValidIPv4(input)) {
    return new Netmask(ipAddress + '/' + input);
  }
  
  throw new Error('Invalid subnet mask or CIDR notation');
}

export function Calculator() {
  const [ipAddress, setIpAddress] = useState('');
  const [subnetMask, setSubnetMask] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [parentNetwork, setParentNetwork] = useState(null);
  const [subnets, setSubnets] = useState([]);

  // Restore parent network from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('parentNetwork');
    if (saved) {
      try {
        setParentNetwork(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Persist parent network to localStorage when it changes
  useEffect(() => {
    if (parentNetwork) {
      localStorage.setItem('parentNetwork', JSON.stringify(parentNetwork));
    }
  }, [parentNetwork]);

  const calculateSubnet = () => {
    try {
      setError('');
      setResults(null);

      if (!isValidIPv4(ipAddress)) {
        throw new Error('Invalid IP address format');
      }

      const subnet = parseInput(ipAddress, subnetMask);
      setResults({
        networkAddress: subnet.base,
        broadcastAddress: subnet.broadcast,
        firstHost: subnet.first,
        lastHost: subnet.last,
        numHosts: subnet.size,
        subnetMask: subnet.mask,
        bitmask: subnet.bitmask,
      });
    } catch (err) {
      setError(err.message);
      setResults(null);
    }
  };

  const handleAddSubnet = (subnet) => {
    if (!parentNetwork) return;
    const parentBlock = new Netmask(parentNetwork.ip + '/' + parentNetwork.cidr);
    const subnetBlock = new Netmask(parentNetwork.ip + '/' + subnet.cidr);
    if (!parentBlock.contains(subnetBlock.base) || !parentBlock.contains(subnetBlock.broadcast)) {
      alert('Subnet does not fit within the parent network.');
      return;
    }
    // Prevent overlapping subnets
    for (const existing of subnets) {
      const existingBlock = new Netmask(parentNetwork.ip + '/' + existing.cidr);
      if (
        existingBlock.contains(subnetBlock.base) ||
        existingBlock.contains(subnetBlock.broadcast) ||
        subnetBlock.contains(existingBlock.base) ||
        subnetBlock.contains(existingBlock.broadcast)
      ) {
        alert('Subnet overlaps with an existing subnet.');
        return;
      }
    }
    setSubnets((prev) => [...prev, subnet]);
  };

  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="lg">IPv4 Subnet Calculator</Title>
      <ParentNetworkForm onSubmit={setParentNetwork} />
      {parentNetwork && (
        <>
          <Paper p="md" radius="md" withBorder mb="md">
            <Text fw={500}>Parent Network:</Text>
            <Text>IP: {parentNetwork.ip} /{parentNetwork.cidr}</Text>
            <Text>Name: {parentNetwork.name}</Text>
          </Paper>
          <SubnetForm onAddSubnet={handleAddSubnet} parentCidr={parentNetwork.cidr} />
          {subnets.length > 0 && (
            <Paper p="md" radius="md" withBorder mb="md">
              <Text fw={500} mb="sm">Subnets:</Text>
              {subnets.map((subnet, idx) => (
                <Text key={idx}>Name: {subnet.name}, CIDR: /{subnet.cidr}</Text>
              ))}
            </Paper>
          )}
        </>
      )}
      <Paper p="md" radius="md" withBorder>
        <Grid>
          <Grid.Col span={6}>
            <TextInput
              label="IP Address"
              placeholder="e.g., 192.168.1.0"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              error={error && error.includes('IP address') ? error : null}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="Subnet Mask or CIDR"
              placeholder="e.g., 255.255.255.0 or /24 or 24"
              value={subnetMask}
              onChange={(e) => setSubnetMask(e.target.value)}
              error={error && !error.includes('IP address') ? error : null}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Button onClick={calculateSubnet} fullWidth>
              Calculate
            </Button>
          </Grid.Col>
        </Grid>

        {results && (
          <>
            <Grid mt="lg">
              <Grid.Col span={6}>
                <Text fw={500}>Network Address:</Text>
                <Text>{results.networkAddress}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text fw={500}>Broadcast Address:</Text>
                <Text>{results.broadcastAddress}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text fw={500}>First Usable Host:</Text>
                <Text>{results.firstHost}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text fw={500}>Last Usable Host:</Text>
                <Text>{results.lastHost}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text fw={500}>Number of Hosts:</Text>
                <Text>{results.numHosts}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text fw={500}>Subnet Mask:</Text>
                <Text>{results.subnetMask} (/{results.bitmask})</Text>
              </Grid.Col>
            </Grid>

            <SubnetVisualization subnet={results} />
          </>
        )}

        {error && (
          <Text color="red" mt="md">
            {error}
          </Text>
        )}
      </Paper>
    </Container>
  );
} 