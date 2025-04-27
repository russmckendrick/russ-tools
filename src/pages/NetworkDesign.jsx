import { useState, useEffect } from 'react';
import { Container, TextInput, Button, Paper, Title, Grid, Text, Select, Group, Modal, Stack, Space } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { Netmask } from 'netmask';
import { SubnetVisualization } from '../components/SubnetVisualization';
import { ParentNetworkForm } from '../components/ParentNetworkForm';
import { SubnetForm } from '../components/SubnetForm';
import { DraggableSubnets } from '../components/DraggableSubnets';
import { NetworkDiagram } from '../components/NetworkDiagram';
import { NetworkDiagramSVGExport } from '../components/NetworkDiagramSVGExport';
import { TerraformExportSection } from '../components/TerraformExportSection';
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

export function NetworkDesign() {
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
    const subnetSize = Math.pow(2, 32 - subnet.cidr);
    
    // Build a sorted list of used ranges
    const used = (current.subnets || [])
      .map(s => {
        const block = new Netmask(s.base + '/' + s.cidr);
        return {
          start: ipToLong(block.base),
          end: ipToLong(block.broadcast),
          cidr: s.cidr,
          name: s.name
        };
      })
      .sort((a, b) => a.start - b.start);
    
    // Calculate the subnet mask for proper boundary alignment
    const subnetMask = 0xffffffff << (32 - subnet.cidr);
    
    // Safety counter to prevent infinite loops
    let safetyCounter = 0;
    const maxIterations = 1000; // Reasonable limit to prevent browser freezing
    
    // Create an array of all possible candidate positions within the parent network
    const candidates = [];
    
    // Start from the beginning of the parent network
    let currentPos = parentStart;
    
    // Find all valid subnet boundaries within the parent network
    while (currentPos + subnetSize - 1 <= parentEnd && safetyCounter < maxIterations) {
      safetyCounter++;
      
      // Align to proper network boundary for this subnet size
      const alignedPos = (currentPos & subnetMask) >>> 0;
      if (alignedPos < currentPos) {
        // If alignment moved us backward, we need to move to the next boundary
        currentPos = ((currentPos >> (32 - subnet.cidr)) + 1) << (32 - subnet.cidr);
      } else {
        currentPos = alignedPos;
      }
      
      // Check if this position is still within the parent network
      if (currentPos + subnetSize - 1 <= parentEnd) {
        candidates.push(currentPos);
      }
      
      // Move to the next possible position
      currentPos += subnetSize;
    }
    
    // If we have no candidates, there's no space
    if (candidates.length === 0) {
      alert('No available space for this subnet size. Please try a smaller subnet.');
      return;
    }
    
    // Check each candidate position against existing subnets
    for (const candidateStart of candidates) {
      const candidateEnd = candidateStart + subnetSize - 1;
      let overlaps = false;
      
      // Check if this candidate overlaps with any existing subnet
      for (const usedRange of used) {
        if (candidateStart <= usedRange.end && candidateEnd >= usedRange.start) {
          overlaps = true;
          break;
        }
      }
      
      // If no overlap, we found a valid position
      if (!overlaps) {
        const candidateIp = longToIp(candidateStart);
        
        // Final validation that it's within the parent network
        if (
          parentBlock.contains(candidateIp) &&
          parentBlock.contains(longToIp(candidateEnd))
        ) {
          // Add the subnet with its properly calculated base address
          setNetworks(networks.map(n =>
            n.id === selectedNetworkId
              ? { ...n, subnets: [...(n.subnets || []), { ...subnet, base: candidateIp }] }
              : n
          ));
          return;
        }
      }
    }
    
    // If we got here, we couldn't find a suitable position
    alert('No available space for this subnet size. Please try a smaller subnet.');
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
    
    // Create a fresh copy of the subnets in the new order, preserving their properties
    // but we'll recalculate their base addresses
    const subnetsToBePlaced = newOrder.map(subnet => ({
      ...subnet,
      cidr: subnet.cidr,
      name: subnet.name,
      color: subnet.color
    }));
    
    // Start with an empty array for the result
    const updatedSubnets = [];
    
    // Safety counter to prevent infinite loops
    let safetyCounter = 0;
    const maxIterations = 1000;
    
    // Place each subnet one by one using the same algorithm as handleAddSubnet
    for (let i = 0; i < subnetsToBePlaced.length && safetyCounter < maxIterations; i++) {
      safetyCounter++;
      
      const subnet = subnetsToBePlaced[i];
      const subnetSize = Math.pow(2, 32 - subnet.cidr);
      
      // Calculate the subnet mask for proper boundary alignment
      const subnetMask = 0xffffffff << (32 - subnet.cidr);
      
      // Create an array of all possible candidate positions within the parent network
      const candidates = [];
      
      // Start from the beginning of the parent network
      let currentPos = parentStart;
      let innerSafetyCounter = 0;
      const innerMaxIterations = 1000;
      
      // Find all valid subnet boundaries within the parent network
      while (currentPos + subnetSize - 1 <= parentEnd && innerSafetyCounter < innerMaxIterations) {
        innerSafetyCounter++;
        
        // Align to proper network boundary for this subnet size
        const alignedPos = (currentPos & subnetMask) >>> 0;
        if (alignedPos < currentPos) {
          // If alignment moved us backward, we need to move to the next boundary
          currentPos = ((currentPos >> (32 - subnet.cidr)) + 1) << (32 - subnet.cidr);
        } else {
          currentPos = alignedPos;
        }
        
        // Check if this position is still within the parent network
        if (currentPos + subnetSize - 1 <= parentEnd) {
          candidates.push(currentPos);
        }
        
        // Move to the next possible position
        currentPos += subnetSize;
      }
      
      // If we have no candidates, there's no space
      if (candidates.length === 0) {
        console.error("Not enough space to reorder subnets");
        alert("Error: Not enough space to reorder subnets. Please try a different arrangement.");
        return;
      }
      
      // Check each candidate position against already placed subnets
      let placed = false;
      for (const candidateStart of candidates) {
        const candidateEnd = candidateStart + subnetSize - 1;
        let overlaps = false;
        
        // Check if this candidate overlaps with any already placed subnet
        for (const placedSubnet of updatedSubnets) {
          const placedBlock = new Netmask(placedSubnet.base + '/' + placedSubnet.cidr);
          const placedStart = ipToLong(placedBlock.base);
          const placedEnd = ipToLong(placedBlock.broadcast);
          
          if (candidateStart <= placedEnd && candidateEnd >= placedStart) {
            overlaps = true;
            break;
          }
        }
        
        // If no overlap, we found a valid position
        if (!overlaps) {
          const candidateIp = longToIp(candidateStart);
          
          // Add the subnet with its properly calculated base address
          updatedSubnets.push({
            ...subnet,
            base: candidateIp,
            // Generate a stable ID that doesn't depend on the base address
            id: `subnet-${subnet.name}-${subnet.cidr}-${i}-${Date.now()}`
          });
          
          placed = true;
          break;
        }
      }
      
      // If we couldn't place this subnet, abort the reordering
      if (!placed) {
        console.error("Could not place subnet during reordering");
        alert("Error: Could not reorder subnets. Please try a different arrangement.");
        return;
      }
    }
    
    if (safetyCounter >= maxIterations) {
      console.error("Reached safety limit while reordering subnets");
      alert("Error: Could not reorder subnets. Please try again.");
      return;
    }
    
    // Update networks with a completely new reference to trigger UI updates
    const updatedNetworks = networks.map(n =>
      n.id === selectedNetworkId
        ? { ...n, subnets: updatedSubnets }
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
                <NetworkDiagramSVGExport
                  parentNetwork={current.parentNetwork}
                  subnets={current.subnets || []}
                />
                {current.parentNetwork && (
                  <TerraformExportSection
                    network={current.parentNetwork}
                    subnets={current.subnets || []}
                  />
                )}
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