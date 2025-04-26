import { useState, useEffect } from 'react';
import { Container, TextInput, Button, Paper, Title, Grid, Text, Select, Group, Modal, Stack, Space } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { Netmask } from 'netmask';
import { SubnetVisualization } from '../components/SubnetVisualization';
import { ParentNetworkForm } from '../components/ParentNetworkForm';
import { SubnetForm } from '../components/SubnetForm';
import { DraggableSubnets } from '../components/DraggableSubnets';
import { NetworkDiagram } from '../components/NetworkDiagram';
import { v4 as uuidv4 } from 'uuid';
import { isValidIPv4, ipToLong, longToIp } from '../utils';

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

  // Handle subnet resize
  const handleResizeSubnet = (subnetBase, newCidr) => {
    if (!current?.parentNetwork) return;
    
    const parentBlock = new Netmask(current.parentNetwork.ip + '/' + current.parentNetwork.cidr);
    const parentStart = ipToLong(parentBlock.base);
    const parentEnd = ipToLong(parentBlock.broadcast);
    
    // Find the subnet to resize
    const subnetIndex = current.subnets.findIndex(s => s.base === subnetBase);
    if (subnetIndex === -1) return;
    
    const subnet = current.subnets[subnetIndex];
    const oldCidr = subnet.cidr;
    
    // If CIDR hasn't changed, do nothing
    if (oldCidr === newCidr) return;
    
    // Create a new array of subnets
    const newSubnets = [...current.subnets];
    
    // If resizing to a smaller subnet (larger CIDR number), we can keep the same base
    if (newCidr > oldCidr) {
      // Just update the CIDR
      newSubnets[subnetIndex] = {
        ...subnet,
        cidr: newCidr,
        id: `${subnet.id || 'subnet'}-${Date.now()}`
      };
    } else {
      // Resizing to a larger subnet - we need to check for overlaps
      // Calculate new size
      const newSize = Math.pow(2, 32 - newCidr);
      const subnetStart = ipToLong(subnet.base);
      
      // Check if this would overlap with other subnets
      const wouldOverlap = newSubnets.some((s, idx) => {
        if (idx === subnetIndex) return false; // Skip the subnet being resized
        
        const otherStart = ipToLong(s.base);
        const otherEnd = otherStart + Math.pow(2, 32 - s.cidr) - 1;
        const newEnd = subnetStart + newSize - 1;
        
        return (subnetStart <= otherEnd && newEnd >= otherStart);
      });
      
      if (wouldOverlap) {
        alert('Cannot resize subnet - would overlap with other subnets');
        return;
      }
      
      // Check if it would exceed the parent network
      const newEnd = subnetStart + newSize - 1;
      if (subnetStart < parentStart || newEnd > parentEnd) {
        alert('Cannot resize subnet - would exceed parent network boundaries');
        return;
      }
      
      // Update the subnet
      newSubnets[subnetIndex] = {
        ...subnet,
        cidr: newCidr,
        id: `${subnet.id || 'subnet'}-${Date.now()}`
      };
    }
    
    // Update networks
    setNetworks(networks.map(n =>
      n.id === selectedNetworkId
        ? { ...n, subnets: newSubnets }
        : n
    ));
    
    // Force refresh
    setAnimate(prev => !prev);
  };

  return (
    <Container size="xl" py="md">
      <Paper p="md" radius="md" withBorder>
        <Group position="apart" mb="lg">
          <Title order={2}>Network Designer</Title>
          <Select
            placeholder="Select Network"
            data={networkOptions}
            value={selectedNetworkId}
            onChange={setSelectedNetworkId}
            mr="md"
            style={{ width: '200px' }}
            disabled={networks.length === 0}
          />
          <Group>
            <Button size="xs" color="gray" onClick={handleNewNetwork}>
              New Network
            </Button>
            {selectedNetworkId && (
              <>
                <Button size="xs" color="red" variant="outline" onClick={() => setDeleteModalOpen(true)}>
                  Delete
                </Button>
                <Button size="xs" variant="outline" onClick={handleReset}>
                  Reset
                </Button>
              </>
            )}
          </Group>
        </Group>

        {current ? (
          <>
            {!current.parentNetwork ? (
              <ParentNetworkForm onSubmit={handleSetParentNetwork} />
            ) : (
              <>
                <Grid>
                  <Grid.Col md={6}>
                    <Paper p="md" radius="md" withBorder>
                      <Title order={3} mb="md">Parent Network</Title>
                      <Text>
                        Network Name: <strong>{current.parentNetwork.name}</strong>
                      </Text>
                      <Text>
                        IP Address: <strong>{current.parentNetwork.ip}</strong>
                      </Text>
                      <Text>
                        CIDR Notation: <strong>/{current.parentNetwork.cidr}</strong>
                      </Text>
                      <Text>
                        Subnet Mask: <strong>{new Netmask(current.parentNetwork.ip + '/' + current.parentNetwork.cidr).mask}</strong>
                      </Text>
                    </Paper>
                  </Grid.Col>
                  <Grid.Col md={6}>
                    <SubnetForm 
                      onAddSubnet={handleAddSubnet} 
                      parentCidr={current.parentNetwork.cidr} 
                      parentNetwork={current.parentNetwork}
                      subnets={current.subnets || []}
                    />
                  </Grid.Col>
                </Grid>

                <DraggableSubnets
                  subnets={current.subnets || []}
                  onRemoveSubnet={handleRemoveSubnet}
                  onReorder={handleReorderSubnets}
                  parentNetwork={current.parentNetwork}
                />

                <SubnetVisualization
                  parentNetwork={current.parentNetwork}
                  subnets={current.subnets || []}
                />
                
                <NetworkDiagram
                  parentNetwork={current.parentNetwork}
                  subnets={current.subnets || []}
                />
              </>
            )}
          </>
        ) : (
          <Paper p="md" radius="md" withBorder>
            <Title order={3} mb="md">Get Started</Title>
            <Text>Click "New Network" to begin designing your network.</Text>
          </Paper>
        )}

        <Modal
          opened={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Delete Network"
        >
          <Text>Are you sure you want to delete this network?</Text>
          <Group position="right" mt="md">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button color="red" onClick={handleDeleteNetwork}>
              Delete
            </Button>
          </Group>
        </Modal>
      </Paper>
    </Container>
  );
} 