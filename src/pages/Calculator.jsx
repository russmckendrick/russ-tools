import { useState, useEffect } from 'react';
import { Container, TextInput, Button, Paper, Title, Grid, Text, Select, Group } from '@mantine/core';
import { Netmask } from 'netmask';
import { SubnetVisualization } from '../components/SubnetVisualization';
import { ParentNetworkForm } from '../components/ParentNetworkForm';
import { SubnetForm } from '../components/SubnetForm';
import { v4 as uuidv4 } from 'uuid';

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

// Helper functions for IP math
function ipToLong(ip) {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}
function longToIp(long) {
  return [24, 16, 8, 0].map(shift => (long >>> shift) & 255).join('.');
}

export function Calculator() {
  // Multiple network designs
  const [networks, setNetworks] = useState([]); // [{id, name, parentNetwork, subnets, createdAt}]
  const [selectedNetworkId, setSelectedNetworkId] = useState(null);

  // Migration on load
  useEffect(() => {
    // Try to load new format
    const saved = localStorage.getItem('networks');
    const lastSelected = localStorage.getItem('lastSelectedNetworkId');
    if (saved) {
      const parsed = JSON.parse(saved);
      setNetworks(parsed);
      if (lastSelected && parsed.some(n => n.id === lastSelected)) {
        setSelectedNetworkId(lastSelected);
      } else {
        setSelectedNetworkId(parsed[0]?.id || null);
      }
      return;
    }
    // Migrate old format if present
    const oldParent = localStorage.getItem('parentNetwork');
    const oldSubnets = localStorage.getItem('subnets');
    if (oldParent && oldSubnets) {
      const migrated = [{
        id: uuidv4(),
        name: JSON.parse(oldParent).name || 'Migrated Network',
        parentNetwork: JSON.parse(oldParent),
        subnets: JSON.parse(oldSubnets),
        createdAt: Date.now(),
      }];
      setNetworks(migrated);
      setSelectedNetworkId(migrated[0].id);
      localStorage.setItem('networks', JSON.stringify(migrated));
      localStorage.setItem('lastSelectedNetworkId', migrated[0].id);
      localStorage.removeItem('parentNetwork');
      localStorage.removeItem('subnets');
      return;
    }
    // No data
    setNetworks([]);
  }, []);

  // Persist networks to localStorage
  useEffect(() => {
    localStorage.setItem('networks', JSON.stringify(networks));
  }, [networks]);

  // Persist last selected network ID
  useEffect(() => {
    if (selectedNetworkId) {
      localStorage.setItem('lastSelectedNetworkId', selectedNetworkId);
    }
  }, [selectedNetworkId]);

  // Get current network
  const current = networks.find(n => n.id === selectedNetworkId);

  // Dropdown options
  const networkOptions = networks.map(n => ({ value: n.id, label: n.name }));

  // Handlers
  const handleSelectNetwork = (id) => setSelectedNetworkId(id);
  const handleNewNetwork = () => {
    const newNet = {
      id: uuidv4(),
      name: 'New Network',
      parentNetwork: null,
      subnets: [],
      createdAt: Date.now(),
    };
    setNetworks(prev => [newNet, ...prev]);
    setSelectedNetworkId(newNet.id);
  };

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

  // Restore subnets from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('subnets');
    if (saved) {
      try {
        setSubnets(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Persist subnets to localStorage when they change
  useEffect(() => {
    localStorage.setItem('subnets', JSON.stringify(subnets));
  }, [subnets]);

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
    const parentStart = ipToLong(parentBlock.base);
    const parentEnd = ipToLong(parentBlock.broadcast);
    const size = Math.pow(2, 32 - subnet.cidr);

    // Build a sorted list of used ranges
    const used = subnets
      .map(s => [ipToLong(s.base), ipToLong(new Netmask(s.base + '/' + s.cidr).broadcast)])
      .sort((a, b) => a[0] - b[0]);

    // Scan for the first available gap
    let candidateStart = parentStart;
    for (let i = 0; i <= used.length; i++) {
      const nextUsedStart = used[i]?.[0] ?? (parentEnd + 1);
      const gap = nextUsedStart - candidateStart;
      if (gap >= size) {
        // Found a gap big enough
        const candidateBlock = new Netmask(longToIp(candidateStart) + '/' + subnet.cidr);
        if (
          parentBlock.contains(candidateBlock.base) &&
          parentBlock.contains(candidateBlock.broadcast)
        ) {
          setSubnets((prev) => [
            ...prev,
            { ...subnet, base: candidateBlock.base },
          ]);
          return;
        }
      }
      if (used[i]) candidateStart = used[i][1] + 1;
    }
    alert('No available space for this subnet size.');
  };

  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="lg">IPv4 Subnet Calculator</Title>
      <Group mb="md">
        <Select
          data={networkOptions}
          value={selectedNetworkId}
          onChange={handleSelectNetwork}
          placeholder="Select a network design"
          style={{ minWidth: 220 }}
        />
        <Button onClick={handleNewNetwork}>New Network</Button>
      </Group>
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
            <>
              <SubnetVisualization parentNetwork={parentNetwork} subnets={subnets} />
              <Paper p="md" radius="md" withBorder mb="md">
                <Text fw={500} mb="sm">Subnets:</Text>
                <Grid gutter="md">
                  {subnets.map((subnet, idx) => {
                    const block = new Netmask(subnet.base + '/' + subnet.cidr);
                    return (
                      <Grid.Col span={4} key={idx}>
                        <Paper p="sm" radius="sm" withBorder mb="sm">
                          <Text fw={500}>{subnet.name} (/{subnet.cidr})</Text>
                          <Text size="sm">Network Address: {block.base}</Text>
                          <Text size="sm">Broadcast Address: {block.broadcast}</Text>
                          <Text size="sm">First Usable Host: {block.first}</Text>
                          <Text size="sm">Last Usable Host: {block.last}</Text>
                          <Text size="sm">Number of Hosts: {block.size}</Text>
                          <Text size="sm">Subnet Mask: {block.mask} (/{block.bitmask})</Text>
                          <Button color="red" size="xs" mt="xs" onClick={() => setSubnets(subnets.filter((_, i) => i !== idx))}>
                            Remove
                          </Button>
                        </Paper>
                      </Grid.Col>
                    );
                  })}
                </Grid>
              </Paper>
            </>
          )}
        </>
      )}
      <Button color="yellow" fullWidth mt="xl" onClick={() => {
        setParentNetwork(null);
        setSubnets([]);
        localStorage.removeItem('parentNetwork');
        localStorage.removeItem('subnets');
      }}>
        Reset / Clear Design
      </Button>
    </Container>
  );
} 