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
    const saved = localStorage.getItem('networks');
    const lastSelected = localStorage.getItem('lastSelectedNetworkId');
    console.log('Loading from localStorage:', { saved, lastSelected });
    if (saved) {
      const parsed = JSON.parse(saved);
      setNetworks(parsed);
      if (parsed.length > 0) {
        if (lastSelected && parsed.some(n => n.id === lastSelected)) {
          setSelectedNetworkId(lastSelected);
        } else {
          setSelectedNetworkId(parsed[0].id);
        }
      } else {
        setSelectedNetworkId(null);
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
      console.log('Migrated old data to new format:', migrated);
      return;
    }
    // No data
    setNetworks([]);
    setSelectedNetworkId(null);
    console.log('No networks found in localStorage.');
  }, []);

  // Persist networks to localStorage on every change
  useEffect(() => {
    localStorage.setItem('networks', JSON.stringify(networks));
    console.log('Saved to localStorage:', networks);
  }, [networks]);

  // Persist last selected network ID
  useEffect(() => {
    if (selectedNetworkId) {
      localStorage.setItem('lastSelectedNetworkId', selectedNetworkId);
      console.log('Saved lastSelectedNetworkId:', selectedNetworkId);
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

  // Set parent network for current (do not clear subnets)
  const handleSetParentNetwork = (parentNet) => {
    setNetworks(prev => prev.map(n =>
      n.id === selectedNetworkId ? { ...n, parentNetwork: parentNet, name: parentNet.name } : n
    ));
  };

  // Add subnet to current
  const handleAddSubnet = (subnet) => {
    if (!current?.parentNetwork) return;
    const parentBlock = new Netmask(current.parentNetwork.ip + '/' + current.parentNetwork.cidr);
    const parentStart = ipToLong(parentBlock.base);
    const parentEnd = ipToLong(parentBlock.broadcast);
    const size = Math.pow(2, 32 - subnet.cidr);
    // Build a sorted list of used ranges
    const used = (current.subnets || [])
      .map(s => [ipToLong(s.base), ipToLong(new Netmask(s.base + '/' + s.cidr).broadcast)])
      .sort((a, b) => a[0] - b[0]);
    // Scan for the first available gap
    let candidateStart = parentStart;
    for (let i = 0; i <= used.length; i++) {
      const nextUsedStart = used[i]?.[0] ?? (parentEnd + 1);
      const gap = nextUsedStart - candidateStart;
      if (gap >= size) {
        const candidateBlock = new Netmask(longToIp(candidateStart) + '/' + subnet.cidr);
        if (
          parentBlock.contains(candidateBlock.base) &&
          parentBlock.contains(candidateBlock.broadcast)
        ) {
          setNetworks(prev => prev.map(n =>
            n.id === selectedNetworkId
              ? { ...n, subnets: [...(n.subnets || []), { ...subnet, base: candidateBlock.base }] }
              : n
          ));
          return;
        }
      }
      if (used[i]) candidateStart = used[i][1] + 1;
    }
    alert('No available space for this subnet size.');
  };

  // Remove subnet from current
  const handleRemoveSubnet = (idx) => {
    setNetworks(prev => prev.map(n =>
      n.id === selectedNetworkId
        ? { ...n, subnets: n.subnets.filter((_, i) => i !== idx) }
        : n
    ));
  };

  // Reset/clear current network
  const handleReset = () => {
    setNetworks(prev => prev.map(n =>
      n.id === selectedNetworkId
        ? { ...n, parentNetwork: null, subnets: [] }
        : n
    ));
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
      {!current && (
        <Paper p="md" radius="md" withBorder mt="xl">
          <Text>Select or create a network design to begin.</Text>
        </Paper>
      )}
      {current && (
        <>
          <ParentNetworkForm onSubmit={handleSetParentNetwork} />
          {current.parentNetwork && (
            <>
              <Paper p="md" radius="md" withBorder mb="md">
                <Text fw={500}>Parent Network:</Text>
                <Text>IP: {current.parentNetwork.ip} /{current.parentNetwork.cidr}</Text>
                <Text>Name: {current.parentNetwork.name}</Text>
              </Paper>
              <SubnetForm onAddSubnet={handleAddSubnet} parentCidr={current.parentNetwork.cidr} />
              {current.subnets.length > 0 && (
                <>
                  <SubnetVisualization parentNetwork={current.parentNetwork} subnets={current.subnets} />
                  <Paper p="md" radius="md" withBorder mb="md">
                    <Text fw={500} mb="sm">Subnets:</Text>
                    <Grid gutter="md">
                      {current.subnets.map((subnet, idx) => {
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
                              <Button color="red" size="xs" mt="xs" onClick={() => handleRemoveSubnet(idx)}>
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
          <Button color="yellow" fullWidth mt="xl" onClick={handleReset}>
            Reset / Clear Design
          </Button>
        </>
      )}
    </Container>
  );
} 