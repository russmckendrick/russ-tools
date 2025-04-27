import { Box, Paper, Title, Text, Button, Group, Stack, useMantineTheme, Modal, useMantineColorScheme } from '@mantine/core';
import { getSubnetBgColorHex } from '../utils';
import { processSubnets, calculateFreeSpace, getBaseColorHex } from '../utils/networkDiagramUtils';
import { IconDownload, IconNetwork, IconSubtask, IconSpace, IconFileTypeSvg, IconFileTypePng } from '@tabler/icons-react';
import { NetworkDiagramSVGExport } from './NetworkDiagramSVGExport';
import { useRef, useState, useEffect } from 'react';
import { Netmask } from 'netmask';
import { longToIp, ipToLong } from '../utils';
import html2canvas from 'html2canvas';
import networkSvg from '../assets/network.svg';
import subnetSvg from '../assets/subnet.svg';
import spaceSvg from '../assets/space.svg';

export function NetworkDiagram({ parentNetwork, subnets }) {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const diagramRef = useRef(null);
  const [animate, setAnimate] = useState(false);
  const [errorModal, setErrorModal] = useState({ opened: false, message: '' });

  // Animation effect when diagram changes
  useEffect(() => {
    setAnimate(false);
    const timeout = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timeout);
  }, [parentNetwork, subnets]);

  if (!parentNetwork || !subnets || subnets.length === 0) {
    return (
      <Paper p="md" radius="md" withBorder mt="lg">
        <Title order={3} mb="md">Network Diagram</Title>
        <Text color="dimmed">Add a parent network and subnets to generate a diagram.</Text>
      </Paper>
    );
  }

  // Process parent network
  const parentBlock = new Netmask(parentNetwork.ip + '/' + parentNetwork.cidr);
  
  // Define a consistent color palette (same as SubnetVisualization)
  const colorPalette = [
    theme.colors.blue[5], 
    theme.colors.green[5], 
    theme.colors.cyan[5], 
    theme.colors.violet[5], 
    theme.colors.orange[5], 
    theme.colors.teal[5], 
    theme.colors.grape[5], 
    theme.colors.lime[5]
  ];

  // Process subnets and calculate free space using shared utils
  const processedSubnets = processSubnets(subnets);



  // Export diagram as PNG (SVG export moved to NetworkDiagramSVGExport.jsx)
  const exportDiagram = () => {
    if (!diagramRef.current) return;
    
    html2canvas(diagramRef.current, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[0]
    }).then(canvas => {
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `${parentNetwork.name || 'network'}-diagram.png`;
      link.click();
    }).catch(err => {
      console.error('PNG export error:', err);
      setErrorModal({
        opened: true,
        message: 'PNG export failed. Please try again later.'
      });
    });
  };

  // For SVG export, use the NetworkDiagramSVGExport component.
  
  // Calculate free space between subnets
  const calculateFreeSpace = () => {
    // If there are no subnets, the entire parent network is free
    if (processedSubnets.length === 0) {
      return [{
        start: ipToLong(parentBlock.base),
        end: ipToLong(parentBlock.broadcast),
        size: parentBlock.size,
        startIp: parentBlock.base,
        endIp: parentBlock.broadcast
      }];
    }

    const parentStartLong = ipToLong(parentBlock.base);
    const parentEndLong = ipToLong(parentBlock.broadcast);
    
    let freeSpaces = [];
    
    // Check if there's space before the first subnet
    if (processedSubnets.length > 0 && processedSubnets[0].networkLong > parentStartLong) {
      const firstSubnetStart = processedSubnets[0].networkLong;
      const size = firstSubnetStart - parentStartLong;
      if (size > 0) {
        // Calculate the IP before the first subnet's base
        const endLongIp = firstSubnetStart - 1;
        
        freeSpaces.push({
          start: parentStartLong,
          end: endLongIp,
          size: size,
          startIp: parentBlock.base,
          endIp: longToIp(endLongIp)
        });
      }
    }
    
    // Check for gaps between subnets
    for (let i = 0; i < processedSubnets.length - 1; i++) {
      // Use broadcast address of current and network address of next
      const currentBroadcast = processedSubnets[i].broadcastLong;
      const nextNetwork = processedSubnets[i + 1].networkLong;
      
      // Check if there's a gap (next network starts after current broadcast + 1)
      if (nextNetwork > currentBroadcast + 1) { 
        const startLongIp = currentBroadcast + 1;
        const endLongIp = nextNetwork - 1;
        const size = endLongIp - startLongIp + 1; // Size is inclusive
        
        freeSpaces.push({
          start: startLongIp,
          end: endLongIp,
          size: size,
          startIp: longToIp(startLongIp),
          endIp: longToIp(endLongIp)
        });
      }
    }
    
    // Check if there's space after the last subnet
    if (processedSubnets.length > 0) {
      const lastSubnet = processedSubnets[processedSubnets.length - 1];
      const lastSubnetBroadcast = lastSubnet.broadcastLong;

      if (lastSubnetBroadcast < parentEndLong) {
        const startLongIp = lastSubnetBroadcast + 1;
        const size = parentEndLong - startLongIp + 1; // Size is inclusive

        freeSpaces.push({
          start: startLongIp,
          end: parentEndLong,
          size: size,
          startIp: longToIp(startLongIp),
          endIp: parentBlock.broadcast
        });
      }
    }
    
    return freeSpaces;
  };
  
  // Get the free space
  const freeSpaces = calculateFreeSpace();
  
  // Calculate the percentage of free space
  const totalParentSize = parentBlock.size;
  const usedSize = processedSubnets.reduce((acc, subnet) => acc + subnet.block.size, 0);
  const freeSize = totalParentSize - usedSize;
  const freePercentage = ((freeSize / totalParentSize) * 100).toFixed(1);

  // SVG export logic has been moved to NetworkDiagramSVGExport.jsx
  // Please use that component for SVG export functionality.

  return (
    <Paper p="md" radius="md" withBorder mt="lg">
      <Group position="apart" align="center" mb="md" noWrap>
        <Title order={3}>Network Diagram</Title>
        <Group spacing="xs" align="center" noWrap>
          <Button
            rightSection={<IconFileTypePng stroke={2} size={18} />}
            variant="outline"
            onClick={exportDiagram}
          >
            Export PNG
          </Button>
          <NetworkDiagramSVGExport parentNetwork={parentNetwork} subnets={subnets} buttonProps={{
            rightSection: <IconFileTypeSvg stroke={2} size={18} />,
            variant: 'outline',
            style: { marginLeft: 0 }
          }} />
        </Group>
      </Group>
      
      <Box 
        ref={diagramRef}
        p="lg" 
        sx={{
          // Use theme-aware background for the outer container
          backgroundColor: colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[0],
          borderRadius: theme.radius.md,
          boxShadow: theme.shadows.sm,
        }}
      >
        {/* Parent Network Container - styled as per .bak */}
        <Box
          p="md"
          mb="md"
          style={{
            border: `2px solid ${theme.colors.blue[7]}`,
            borderRadius: theme.radius.md,
            backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.white,
            transition: 'all 0.3s ease',
            opacity: animate ? 1 : 0,
            transform: animate ? 'translateY(0)' : 'translateY(10px)',
          }}
        >
          <Group spacing="xs" mb="sm" wrap="nowrap">
            {/* Let Mantine handle icon color based on theme */}
            <IconNetwork
  size={18}
  style={{
    color: colorScheme === 'dark' ? theme.colors.blue[3] : theme.colors.blue[7],
    flexShrink: 0
  }}
/> 
            {/* Use Title component for better theme consistency */}
            <Title order={5} >{parentNetwork.name || 'Parent Network'}</Title> 
            <Text size="xs" fw={500} color={colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[7]}>({parentBlock.base}/{parentNetwork.cidr})</Text>
          </Group>
          <Text size="xs" color={colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[7]} ml={28}>
            Range: {parentBlock.first} - {parentBlock.last} {/* Use calculated first/last */}
          </Text>
          <Text size="xs" color={colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[7]} ml={28}>
            Total IPs: {totalParentSize} ({freePercentage}% free)
          </Text>
          
          {/* Combine subnets and free spaces for visualization - styled as per .bak */}
          <Stack mt="lg" spacing="sm">
            {(() => {
              // Combine subnets and free spaces, then sort by starting IP
              const allItems = [
                ...processedSubnets.map(s => ({ type: 'subnet', data: s, startLong: s.networkLong })),
                ...freeSpaces.map(fs => ({ type: 'freeSpace', data: fs, startLong: fs.start }))
              ].sort((a, b) => a.startLong - b.startLong);

              return allItems.map((item, index) => {
                if (item.type === 'subnet') {
                  const subnet = item.data;

                  // Calculate colors based on the color object
                  const subnetIconBorderColor = getBaseColorHex(subnet.color);
                  const subnetBgColor = getSubnetBgColorHex(subnet.color, theme, colorScheme);

                  return (
                    <Box
                      key={`subnet-${subnet.id || index}`}
                      p="sm"
                      radius="sm"
                      style={{
                        border: `1px solid ${subnetIconBorderColor}`,
                        backgroundColor: subnetBgColor,
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        animation: animate ? 'fadeInUp 0.5s ease forwards' : 'none',
                        opacity: animate ? 1 : 0,
                      }}
                    >
                      <Group position="apart" align="center" wrap="nowrap">
                        <Group spacing="xs" wrap="nowrap">
                          <IconSubtask
  size={18}
  style={{
    color: colorScheme === 'dark' ? theme.colors.gray[2] : theme.colors.gray[8],
    flexShrink: 0
  }}
/>
                          <Stack spacing={0}>
                            <Text fw={700} size="sm" style={{ color: colorScheme === 'dark' ? theme.white : theme.black }}>{subnet.name}</Text>
                            <Text size="xs" style={{ color: colorScheme === 'dark' ? theme.colors.gray[3] : theme.colors.gray[7] }}>
                              Range: {subnet.block.base} - {subnet.block.broadcast} ({subnet.block.mask})
                            </Text>
                            <Text size="xs" style={{ color: colorScheme === 'dark' ? theme.colors.gray[3] : theme.colors.gray[7] }}>
                              Usable IPs: {subnet.block.size - 2}
                            </Text>
                          </Stack>
                        </Group>
                        <Text size="xs" fw={500} style={{ color: colorScheme === 'dark' ? theme.colors.gray[5] : theme.colors.gray[6] }}>
                          ({subnet.block.base}/{subnet.cidr})
                        </Text>
                      </Group>
                    </Box>
                  );
                } else if (item.type === 'freeSpace') {
                  const space = item.data;
                  // Use Gray color scheme for Free Space
                  const freeSpaceBg = colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0];
                  const freeSpaceBorder = colorScheme === 'dark' ? theme.colors.gray[7] : theme.colors.gray[4];
                  const freeSpaceTextColor = colorScheme === 'dark' ? theme.colors.gray[4] : theme.colors.gray[7]; 
                  const freeSpaceIconColor = colorScheme === 'dark' ? theme.colors.gray[5] : theme.colors.gray[6];

                  return (
                    <Box
                      key={`free-${index}`}
                      p="sm"
                      radius="sm"
                      style={{
                        border: `1px dashed ${freeSpaceBorder}`,
                        backgroundColor: freeSpaceBg,
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        animation: animate ? 'fadeInUp 0.5s ease forwards' : 'none',
                        opacity: animate ? 0.8 : 0, // Slightly transparent
                      }}
                    >
                      <Group spacing="xs" wrap="nowrap">
                        <IconSpace
  size={18}
  style={{
    color: colorScheme === 'dark' ? theme.colors.gray[4] : theme.colors.gray[6],
    flexShrink: 0
  }}
/>
                        <Stack spacing={0}>
                          <Text fw={600} size="sm" style={{ color: freeSpaceTextColor }}>Free Space</Text>
                          <Text size="xs" style={{ color: freeSpaceTextColor, opacity: 0.9 }}>
                            Range: {space.startIp} - {space.endIp} ({space.size} IPs)
                          </Text>
                        </Stack>
                      </Group>
                    </Box>
                  );
                }
                return null;
              });
            })()}
          </Stack>
        </Box>
      </Box>
      
      {/* Summary Footer */}
      <Group spacing="xs" mt="xl" position="center">
        <Text size="xs" color={colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[7]}>Total subnets: {subnets.length}</Text>
        <Text size="xs" color={colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[7]}>•</Text>
        <Text size="xs" color={colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[7]}>Total IPs: {parentBlock.size}</Text>
        <Text size="xs" color={colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[7]}>•</Text>
        <Text size="xs" color={colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[7]}>Free: {freeSize} IPs ({freePercentage}%)</Text>
      </Group>
      
      {/* Error Modal */}
      <Modal
        opened={errorModal.opened}
        onClose={() => setErrorModal({ opened: false, message: '' })}
        title="Export Notification"
        size="sm"
        centered
      >
        <Text>{errorModal.message}</Text>
        <Group position="right" mt="md">
          <Button onClick={() => setErrorModal({ opened: false, message: '' })}>
            Close
          </Button>
        </Group>
      </Modal>
    </Paper>
  );
} 