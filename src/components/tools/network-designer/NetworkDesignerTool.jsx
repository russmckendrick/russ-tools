import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Group,
  Paper,
  Tabs,
  Stack,
  Badge,
  ActionIcon,
  Select,
  Button,
  Modal,
  Grid,
  Space,
  Box,
  ThemeIcon,
  useMantineColorScheme
} from '@mantine/core';
import {
  IconNetwork,
  IconSubtask,
  IconChartDots3,
  IconDownload,
  IconPlus,
  IconTrash,
  IconRefresh,
  IconInfoCircle
} from '@tabler/icons-react';
import { useLocalStorage } from '@mantine/hooks';
import { Netmask } from 'netmask';
import { v4 as uuidv4 } from 'uuid';

// Import existing components
import { SubnetVisualization } from './SubnetVisualization';
import { ParentNetworkForm } from './ParentNetworkForm';
import { SubnetForm } from './SubnetForm';
import { DraggableSubnets } from './DraggableSubnets';
import { NetworkDiagram } from './NetworkDiagram';
import { NetworkDiagramSVGExport } from './NetworkDiagramSVGExport';
import { TerraformExportSection } from './TerraformExportSection';
import { isValidIPv4, ipToLong, longToIp } from '../../../utils';

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

const NetworkDesignerTool = () => {
  const [activeTab, setActiveTab] = useState('setup');
  const { colorScheme } = useMantineColorScheme();
  
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
    setActiveTab('setup'); // Switch to setup tab for new networks
  };

  // Set parent network for current
  const handleSetParentNetwork = (parentNet) => {
    if (isReconfiguring) {
      // When reconfiguring, clear existing subnets since the parent network changed
      setNetworks(networks.map(n =>
        n.id === selectedNetworkId ? { ...n, parentNetwork: parentNet, name: parentNet.name, subnets: [] } : n
      ));
      setIsReconfiguring(false);
    } else {
      // Normal case: just set the parent network
      setNetworks(networks.map(n =>
        n.id === selectedNetworkId ? { ...n, parentNetwork: parentNet, name: parentNet.name } : n
      ));
    }
    setActiveTab('design'); // Move to design tab after setting parent network
  };

  // Add subnet to current network (existing logic)
  const handleAddSubnet = (subnet) => {
    if (!current?.parentNetwork) return;
    
    const parentBlock = new Netmask(current.parentNetwork.ip + '/' + current.parentNetwork.cidr);
    const parentStart = ipToLong(parentBlock.base);
    const parentEnd = ipToLong(parentBlock.broadcast);
    
    // Calculate subnet size
    const subnetSize = Math.pow(2, 32 - subnet.cidr);
    
    // Get all used ranges
    const used = (current.subnets || []).map(s => {
      const block = new Netmask(s.base + '/' + s.cidr);
      return {
        start: ipToLong(block.base),
        end: ipToLong(block.broadcast)
      };
    }).sort((a, b) => a.start - b.start);
    
    // Find candidates that align with subnet boundaries
    const candidates = [];
    for (let addr = parentStart; addr <= parentEnd - subnetSize + 1; addr += subnetSize) {
      candidates.push(addr);
    }
    
    // Find first available candidate
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

  // Reset/clear current network OR start reconfiguring
  const handleReset = () => {
    if (current?.parentNetwork) {
      // If there's an existing parent network, we're reconfiguring
      setIsReconfiguring(true);
    } else {
      // If no parent network, we're clearing
      setNetworks(networks.map(n =>
        n.id === selectedNetworkId
          ? { ...n, parentNetwork: null, subnets: [] }
          : n
      ));
    }
    setActiveTab('setup');
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isReconfiguring, setIsReconfiguring] = useState(false);

  // Cancel reconfiguration
  const handleCancelReconfigure = () => {
    setIsReconfiguring(false);
  };

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

  // Reorder subnets (existing complex logic preserved)
  const handleReorderSubnets = (newOrder) => {
    if (!current?.parentNetwork) return;
    
    const parentBlock = new Netmask(current.parentNetwork.ip + '/' + current.parentNetwork.cidr);
    const parentStart = ipToLong(parentBlock.base);
    const parentEnd = ipToLong(parentBlock.broadcast);
    
    // Create a fresh copy of the subnets in the new order, preserving their properties
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
    for (let i = 0; i < subnetsToBePlaced.length; i++) {
      const subnet = subnetsToBePlaced[i];
      const subnetSize = Math.pow(2, 32 - subnet.cidr);
      let placed = false;
      
      safetyCounter++;
      if (safetyCounter >= maxIterations) break;
      
      // Find candidates that align with subnet boundaries
      const candidates = [];
      for (let addr = parentStart; addr <= parentEnd - subnetSize + 1; addr += subnetSize) {
        candidates.push(addr);
      }
      
      // Find first available candidate
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

  // Setup tab content
  const renderSetupTab = () => (
    <Stack gap="lg">
              <Paper p="lg" withBorder radius="md">
          <Group gap="sm" mb="lg">
            <IconNetwork size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
            <Title order={4}>Network Management</Title>
          </Group>
        
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Select
              label="Select Network"
              placeholder="Choose an existing network"
              data={networkOptions}
              value={selectedNetworkId}
              onChange={setSelectedNetworkId}
              disabled={networks.length === 0}
              size="sm"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Group gap="sm" mt={24}>
              <Button
                leftSection={<IconPlus size={16} />}
                variant="light"
                onClick={handleNewNetwork}
                size="sm"
              >
                New Network
              </Button>
              {selectedNetworkId && (
                <>
                  <ActionIcon
                    variant="light"
                    color="red"
                    onClick={() => setDeleteModalOpen(true)}
                    size="sm"
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="light"
                    color="gray"
                    onClick={handleReset}
                    size="sm"
                  >
                    <IconRefresh size={16} />
                  </ActionIcon>
                </>
              )}
            </Group>
          </Grid.Col>
        </Grid>
      </Paper>

      {current ? (
        current.parentNetwork && !isReconfiguring ? (
          <Paper p="lg" withBorder radius="md">
            <Group gap="sm" mb="md">
              <IconInfoCircle size={20} style={{ color: 'var(--mantine-color-green-6)' }} />
              <Title order={4}>Parent Network Details</Title>
              <Badge variant="light" color="green">Configured</Badge>
            </Group>
            
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack gap="xs">
                  <Text size="sm">
                    <Text span fw={500}>Network Name:</Text> {current.parentNetwork.name}
                  </Text>
                  <Text size="sm">
                    <Text span fw={500}>IP Address:</Text> {current.parentNetwork.ip}
                  </Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack gap="xs">
                  <Text size="sm">
                    <Text span fw={500}>CIDR Notation:</Text> /{current.parentNetwork.cidr}
                  </Text>
                  <Text size="sm">
                    <Text span fw={500}>Subnet Mask:</Text> {new Netmask(current.parentNetwork.ip + '/' + current.parentNetwork.cidr).mask}
                  </Text>
                </Stack>
              </Grid.Col>
            </Grid>
            
            <Group justify="flex-end" mt="md">
              <Button variant="light" onClick={handleReset} size="sm">
                Reconfigure Network
              </Button>
            </Group>
          </Paper>
        ) : (
          <ParentNetworkForm 
            onSubmit={handleSetParentNetwork} 
            existingNetwork={isReconfiguring ? current.parentNetwork : null}
            onCancel={isReconfiguring ? handleCancelReconfigure : null}
          />
        )
      ) : (
        <Paper p="xl" withBorder radius="md" bg={colorScheme === 'dark' ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-0)'}>
          <Stack align="center" gap="md">
            <IconNetwork size={48} style={{ color: colorScheme === 'dark' ? 'var(--mantine-color-dark-2)' : 'var(--mantine-color-gray-5)' }} />
            <Title order={3} ta="center" c="dimmed">No Network Selected</Title>
            <Text ta="center" c="dimmed" size="sm">
              Create a new network or select an existing one to get started
            </Text>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={handleNewNetwork}
            >
              Create New Network
            </Button>
          </Stack>
        </Paper>
      )}
    </Stack>
  );

  // Design tab content
  const renderDesignTab = () => {
    if (!current?.parentNetwork) {
      return (
        <Paper p="xl" withBorder radius="md" bg={colorScheme === 'dark' ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-0)'}>
          <Stack align="center" gap="md">
            <IconSubtask size={48} style={{ color: colorScheme === 'dark' ? 'var(--mantine-color-dark-2)' : 'var(--mantine-color-gray-5)' }} />
            <Title order={3} ta="center" c="dimmed">Configure Parent Network First</Title>
            <Text ta="center" c="dimmed" size="sm">
              Set up your parent network in the Network Setup tab before designing subnets
            </Text>
            <Button
              variant="light"
              onClick={() => setActiveTab('setup')}
            >
              Go to Network Setup
            </Button>
          </Stack>
        </Paper>
      );
    }

    return (
      <Stack gap="lg">
        <Paper p="lg" withBorder radius="md">
          <Group gap="sm" mb="lg">
            <IconSubtask size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
            <Title order={4}>Add Subnet</Title>
          </Group>
          
          <SubnetForm 
            onAddSubnet={handleAddSubnet} 
            parentCidr={current.parentNetwork.cidr} 
            parentNetwork={current.parentNetwork}
            subnets={current.subnets || []}
          />
        </Paper>

        {(current.subnets || []).length > 0 && (
          <Paper p="lg" withBorder radius="md">
            <Group gap="sm" mb="lg">
              <IconSubtask size={20} style={{ color: 'var(--mantine-color-orange-6)' }} />
              <Title order={4}>Manage Subnets</Title>
              <Badge variant="light" color="blue">{current.subnets.length} subnet{current.subnets.length !== 1 ? 's' : ''}</Badge>
            </Group>
            
            <DraggableSubnets
              subnets={current.subnets || []}
              onRemoveSubnet={handleRemoveSubnet}
              onReorder={handleReorderSubnets}
              parentNetwork={current.parentNetwork}
            />
          </Paper>
        )}
      </Stack>
    );
  };

  // Visualization tab content
  const renderVisualizationTab = () => {
    if (!current?.parentNetwork) {
      return (
        <Paper p="xl" withBorder radius="md" bg={colorScheme === 'dark' ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-0)'}>
          <Stack align="center" gap="md">
            <IconChartDots3 size={48} style={{ color: colorScheme === 'dark' ? 'var(--mantine-color-dark-2)' : 'var(--mantine-color-gray-5)' }} />
            <Title order={3} ta="center" c="dimmed">No Network to Visualize</Title>
            <Text ta="center" c="dimmed" size="sm">
              Set up your parent network and add subnets to see visualizations
            </Text>
          </Stack>
        </Paper>
      );
    }

    return (
      <Stack gap="lg">
        <SubnetVisualization
          parentNetwork={current.parentNetwork}
          subnets={current.subnets || []}
        />
        
        <NetworkDiagram
          parentNetwork={current.parentNetwork}
          subnets={current.subnets || []}
        />
      </Stack>
    );
  };

  // Export tab content
  const renderExportTab = () => {
    if (!current?.parentNetwork) {
      return (
        <Paper p="xl" withBorder radius="md" bg={colorScheme === 'dark' ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-0)'}>
          <Stack align="center" gap="md">
            <IconDownload size={48} style={{ color: colorScheme === 'dark' ? 'var(--mantine-color-dark-2)' : 'var(--mantine-color-gray-5)' }} />
            <Title order={3} ta="center" c="dimmed">No Network to Export</Title>
            <Text ta="center" c="dimmed" size="sm">
              Configure your network design before exporting
            </Text>
          </Stack>
        </Paper>
      );
    }

    return (
      <Stack gap="lg">
        {/* Diagram Export Section */}
        <Paper p="lg" withBorder radius="md">
          <Group gap="sm" mb="lg">
            <IconChartDots3 size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
            <Title order={4}>Export Diagrams</Title>
          </Group>
          
          <Group gap="md">
            <NetworkDiagramSVGExport 
              parentNetwork={current.parentNetwork} 
              subnets={current.subnets || []} 
              buttonProps={{
                variant: 'light',
                size: 'sm'
              }} 
            />
            <Text size="sm" c="dimmed">Export network diagrams as SVG files</Text>
          </Group>
        </Paper>

        {/* Terraform Export Section */}
        <TerraformExportSection
          network={current.parentNetwork}
          subnets={current.subnets || []}
        />
      </Stack>
    );
  };

  return (
    <Paper p="xl" radius="lg" withBorder>
      <Stack gap="xl">
        {/* Header */}
        <Group gap="md">
          <ThemeIcon size={48} radius="md" color="blue" variant="light">
            <IconNetwork size={28} />
          </ThemeIcon>
          <div>
            <Title order={2} fw={600}>
              Network Designer
            </Title>
            <Text size="sm" c="dimmed">
              Plan and visualize your IP subnets interactively. Design network architectures, allocate subnets, 
              and export configurations for Azure, AWS, or VMware environments.
            </Text>
            <Group gap="xs" mt="xs">
              <Badge variant="light" color="blue" size="sm">Subnet Planning</Badge>
              <Badge variant="light" color="green" size="sm">Visual Diagrams</Badge>
              <Badge variant="light" color="orange" size="sm">Terraform Export</Badge>
            </Group>
          </div>
        </Group>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List mb="lg">
          <Tabs.Tab 
            value="setup" 
            leftSection={<IconNetwork size={18} />}
          >
            Network Setup
          </Tabs.Tab>
          <Tabs.Tab 
            value="design" 
            leftSection={<IconSubtask size={18} />}
            disabled={!current?.parentNetwork}
          >
            Subnet Design
          </Tabs.Tab>
          <Tabs.Tab 
            value="visualization" 
            leftSection={<IconChartDots3 size={18} />}
            disabled={!current?.parentNetwork}
          >
            Visualization
          </Tabs.Tab>
          <Tabs.Tab 
            value="export" 
            leftSection={<IconDownload size={18} />}
            disabled={!current?.parentNetwork}
          >
            Export
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="setup">
          {renderSetupTab()}
        </Tabs.Panel>

        <Tabs.Panel value="design">
          {renderDesignTab()}
        </Tabs.Panel>

        <Tabs.Panel value="visualization">
          {renderVisualizationTab()}
        </Tabs.Panel>

        <Tabs.Panel value="export">
          {renderExportTab()}
        </Tabs.Panel>
      </Tabs>

      {/* Delete Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Network"
        centered
      >
        <Stack gap="md">
          <Text>Are you sure you want to delete this network? This action cannot be undone.</Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button color="red" onClick={handleDeleteNetwork}>
              Delete Network
            </Button>
          </Group>
        </Stack>
      </Modal>
      </Stack>
    </Paper>
  );
};

export default NetworkDesignerTool; 