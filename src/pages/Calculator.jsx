import { useState, useEffect } from 'react';
import { Container, TextInput, Button, Paper, Title, Grid, Text, Select, Group, Modal, Stack } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { Netmask } from 'netmask';
import { DraggableVisualization } from '../components/DraggableVisualization';
import { ParentNetworkForm } from '../components/ParentNetworkForm';
import { SubnetForm } from '../components/SubnetForm';
import { DraggableSubnets } from '../components/DraggableSubnets';
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
  // Use Mantine's useLocalStorage hook for automatic persistence
  const [networks, setNetworks] = useLocalStorage({
    key: 'networks',
    defaultValue: []
  });
  
  const [selectedNetworkId, setSelectedNetworkId] = useLocalStorage({
    key: 'selectedNetworkId',
    defaultValue: null
  });

  // Get current network
  const current = networks.find(n => n.id === selectedNetworkId);

  // Dropdown options
  const networkOptions = networks.length > 0
    ? networks.map(n => ({ value: n.id, label: n.name }))
    : [{ value: '', label: 'No networks found' }];

  // Create a new network
  const handleNewNetwork = () => {
    const newNet = {
      id: uuidv4(),
      name: 'New Network',
      parentNetwork: null,
      subnets: [],
      createdAt: Date.now(),
    };
    setNetworks([newNet, ...networks]);
    setSelectedNetworkId(newNet.id);
  };

  // Set parent network for current
  const handleSetParentNetwork = (parentNet) => {
    setNetworks(networks.map(n =>
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
          setNetworks(networks.map(n =>
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
    setNetworks(networks.map(n =>
      n.id === selectedNetworkId
        ? { ...n, subnets: n.subnets.filter((_, i) => i !== idx) }
        : n
    ));
  };

  // Reset/clear current network
  const handleReset = () => {
    setNetworks(networks.map(n =>
      n.id === selectedNetworkId
        ? { ...n, parentNetwork: null, subnets: [] }
        : n
    ));
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Delete current network
  const handleDeleteNetwork = () => {
    const newNetworks = networks.filter(n => n.id !== selectedNetworkId);
    setNetworks(newNetworks);
    
    // Select another network if available, otherwise set to null
    if (newNetworks.length > 0) {
      setSelectedNetworkId(newNetworks[0].id);
    } else {
      setSelectedNetworkId(null);
    }
    
    setDeleteModalOpen(false);
  };

  // Reorder subnets
  const handleReorderSubnets = (newOrder) => {
    if (!current?.parentNetwork) return;
    
    const parentBlock = new Netmask(current.parentNetwork.ip + '/' + current.parentNetwork.cidr);
    const parentStart = ipToLong(parentBlock.base);
    const parentEnd = ipToLong(parentBlock.broadcast);
    
    // Sort by new order but reassign IPs sequentially
    let updatedSubnets = [...newOrder];
    let candidateStart = parentStart;
    
    // Process each subnet in the new order
    for (let i = 0; i < updatedSubnets.length; i++) {
      const subnet = updatedSubnets[i];
      const size = Math.pow(2, 32 - subnet.cidr);
      
      // Align to proper network boundary based on CIDR
      const mask = 0xffffffff << (32 - subnet.cidr);
      candidateStart = (candidateStart & mask) >>> 0;
      
      // If we're not at a valid boundary for this subnet size, move to the next one
      if ((candidateStart & mask) !== candidateStart) {
        candidateStart = ((candidateStart >> (32 - subnet.cidr)) + 1) << (32 - subnet.cidr);
      }
      
      // Check if this would exceed parent network
      if (candidateStart + size - 1 > parentEnd) {
        console.error("Not enough space to reorder subnets");
        return;
      }
      
      // Assign the new base address
      const newBase = longToIp(candidateStart);
      
      // Create a new subnet object with updated base
      updatedSubnets[i] = { 
        ...subnet, 
        base: newBase,
        // Regenerate ID to force component refresh
        id: subnet.id ? `${subnet.id}-${Date.now()}` : `subnet-${i}-${Date.now()}`
      };
      
      // Move past this subnet for the next one
      candidateStart += size;
    }
    
    // Update networks with a completely new reference to trigger UI updates
    const updatedNetworks = networks.map(n =>
      n.id === selectedNetworkId
        ? { ...n, subnets: [...updatedSubnets] }
        : n
    );
    
    setNetworks(updatedNetworks);
    
    // Force refresh component
    setAnimate(prev => !prev);
  };
  
  // State to force refresh of components
  const [animate, setAnimate] = useState(false);

  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="lg">IPv4 Subnet Calculator</Title>
      <Group mb="md">
        <Select
          data={networkOptions}
          value={selectedNetworkId}
          onChange={setSelectedNetworkId}
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
              {current.subnets?.length > 0 && (
                <>
                  <DraggableVisualization 
                    parentNetwork={current.parentNetwork} 
                    subnets={current.subnets} 
                    onReorderSubnets={handleReorderSubnets}
                    key={`viz-${animate}-${current.subnets.length}`}
                  />
                  <Paper p="md" radius="md" withBorder mb="md">
                    <Text fw={500} mb="sm">Subnets (drag to reorder):</Text>
                    <DraggableSubnets 
                      subnets={current.subnets}
                      onReorder={handleReorderSubnets}
                      onRemoveSubnet={handleRemoveSubnet}
                      key={`drag-${animate}-${current.subnets.length}`}
                    />
                  </Paper>
                </>
              )}
            </>
          )}
          <Stack spacing="md" mt="xl">
            <Button color="yellow" fullWidth onClick={handleReset}>
              Reset / Clear Design
            </Button>
            <Button color="red" fullWidth onClick={() => setDeleteModalOpen(true)}>
              Remove Network
            </Button>
          </Stack>
        </>
      )}

      {/* Confirmation Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Network Design"
        centered
      >
        <Text mb="md">Are you sure you want to delete this network design?</Text>
        <Text mb="xl" c="red" fw="bold">This action cannot be undone and all network data will be lost.</Text>
        <Group position="right">
          <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
          <Button color="red" onClick={handleDeleteNetwork}>Delete</Button>
        </Group>
      </Modal>
    </Container>
  );
} 