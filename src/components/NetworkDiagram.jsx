import { Box, Paper, Title, Text, Button, Group, Stack, useMantineTheme, Modal } from '@mantine/core';
import { IconDownload, IconNetwork, IconSubtask, IconSpace } from '@tabler/icons-react';
import { useRef, useState, useEffect } from 'react';
import { Netmask } from 'netmask';
import { longToIp, ipToLong } from '../utils';
import html2canvas from 'html2canvas';
import networkSvg from '../assets/network.svg';
import subnetSvg from '../assets/subnet.svg';
import spaceSvg from '../assets/space.svg';

export function NetworkDiagram({ parentNetwork, subnets }) {
  const theme = useMantineTheme();
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

  // Helper function to get light variant of a color
  const getLightVariant = (color) => {
    // Extract the color name and index from the color value
    for (const [colorName, shades] of Object.entries(theme.colors)) {
      const index = shades.indexOf(color);
      if (index !== -1) {
        // Return a lighter shade (0 or 1 depending on theme)
        return theme.colorScheme === 'dark' ? shades[2] : shades[0];
      }
    }
    // Fallback
    return theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[0];
  };

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

  // Process subnets with consistent color assignment based on subnet name
  const processedSubnets = subnets.map((subnet) => {
    const block = new Netmask(subnet.base + '/' + subnet.cidr);
    // Assign color based on subnet name (hash) for consistency
    const nameHash = subnet.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorIndex = nameHash % colorPalette.length;
    
    return {
      ...subnet,
      block,
      // Use consistent color based on subnet name
      color: subnet.color || colorPalette[colorIndex],
      // Add numeric representation for calculations
      startLong: block.base.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0,
      endLong: block.broadcast.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0
    };
  }).sort((a, b) => a.startLong - b.startLong); // Sort by numeric IP for accurate gap calculation

  // Export diagram as PNG
  const exportDiagram = () => {
    if (!diagramRef.current) return;
    
    html2canvas(diagramRef.current, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[0]
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
    
    const freeSpaces = [];
    
    // Check if there's space before the first subnet
    if (processedSubnets.length > 0 && processedSubnets[0].startLong > parentStartLong) {
      const size = processedSubnets[0].startLong - parentStartLong;
      if (size > 0) {
        // Calculate the IP before the first subnet's base
        const endLongIp = processedSubnets[0].startLong - 1;
        
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
      const currentEnd = processedSubnets[i].endLong;
      const nextStart = processedSubnets[i + 1].startLong;
      
      if (nextStart > currentEnd + 1) { // +1 because IPs are inclusive
        const size = nextStart - (currentEnd + 1);
        
        // Calculate the IP after the current subnet's broadcast
        const startLongIp = currentEnd + 1;
        const endLongIp = nextStart - 1;
        
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
    if (processedSubnets.length > 0 && processedSubnets[processedSubnets.length - 1].endLong < parentEndLong) {
      const lastSubnet = processedSubnets[processedSubnets.length - 1];
      const size = parentEndLong - lastSubnet.endLong;
      if (size > 0) {
        // Calculate the IP after the last subnet's broadcast
        const startLongIp = lastSubnet.endLong + 1;
        
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
  
  // Generates the SVG markup directly
  const generateSVGMarkup = () => { 
    // Set diagram dimensions
    const width = 1220;
    const subnetHeight = 80; 
    const freeSpaceHeight = 60; // Slightly smaller than subnet boxes
    const subnetSpacing = 10;
    const iconSize = 18;
    const iconPadding = 10;
    const textStartX = 45 + iconSize + iconPadding; // Start text after icon + padding
    
    // Combine subnets and free spaces for visualization in SVG
    const allItems = [];
    
    // Add subnets to the items array
    processedSubnets.forEach(subnet => {
      allItems.push({
        type: 'subnet',
        start: subnet.startLong,
        end: subnet.endLong,
        data: subnet
      });
    });
    
    // Add free spaces to the items array
    freeSpaces.forEach(space => {
      allItems.push({
        type: 'free',
        start: space.start,
        end: space.end,
        data: space
      });
    });
    
    // Sort all items by start address
    allItems.sort((a, b) => a.start - b.start);
    
    // Calculate combined items (subnets + free spaces)
    const totalItems = allItems.length;
    
    // Calculate required height
    const headerHeight = 100; // Space for parent network info
    // Calculate height based on number of items and their types
    let totalItemsHeight = 0;
    allItems.forEach(item => {
      if (item.type === 'subnet') {
        totalItemsHeight += subnetHeight + subnetSpacing;
      } else if (item.type === 'free') {
        totalItemsHeight += freeSpaceHeight + subnetSpacing;
      }
    });
    const footerHeight = 50; // Space for footer
    const bottomPadding = 40; // Extra space at the very bottom
    const height = headerHeight + totalItemsHeight + footerHeight + bottomPadding;
    
    // Layout calculations
    const parentBoxX = 20;
    const parentBoxY = 50;
    const parentBoxWidth = width - 40;
    const parentBoxHeight = height - 70; // Adjusted height for parent box
    const subnetX = 50;
    const subnetWidth = width - 100;
    const borderRadius = 5;
    
    // Background color for the SVG
    const svgBackground = theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[0];
    // Parent network container background
    const parentBoxBackground = theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.white;
    // Border color
    const borderColor = theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3];
    // Free space color - using light grey
    const freeSpaceColor = theme.colorScheme === 'dark' ? theme.colors.gray[5] : theme.colors.gray[6];
    // Use hex colors for SVG compatibility
    const freeSpaceLightColor = theme.colorScheme === 'dark' ? 
      theme.colors.dark[4] : 
      theme.colors.gray[1];
    
    // Text colors based on theme for SVG
    const titleColor = theme.colorScheme === 'dark' ? theme.white : theme.black;
    const detailColor = theme.colorScheme === 'dark' ? theme.colors.dark[1] : theme.colors.gray[7];
    const footerColor = detailColor; // Use same as detail color

    // Create SVG manually
    let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
      <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" 
           width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <style>
          text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'; }
          .title { font-size: 14px; font-weight: 600; fill: ${titleColor}; }
          .detail { font-size: 12px; fill: ${detailColor}; }
          .footer { font-size: 12px; text-anchor: middle; fill: ${footerColor}; }
        </style>
        <rect width="${width}" height="${height}" fill="${svgBackground}"></rect>
        
        <!-- Parent Network Container -->
        <rect width="${parentBoxWidth}" height="${parentBoxHeight}" 
              rx="${borderRadius}" ry="${borderRadius}" 
              fill="${parentBoxBackground}" 
              stroke-width="1.5"
              stroke="${theme.colors.blue[6]}" 
              x="${parentBoxX}" y="${parentBoxY}"></rect>
        
        <!-- Parent Network Icon -->
        <image x="40" y="70" width="${iconSize}" height="${iconSize}" href="${networkSvg}" />
        
        <!-- Parent Network header -->
        <text class="title" x="${textStartX}" y="84.484375">
          <tspan dy="0" x="${textStartX}">${parentNetwork.name || 'Parent Network'} (${parentNetwork.ip}/${parentNetwork.cidr})</tspan>
        </text>
        <text class="detail" x="${textStartX}" y="105.875">
          <tspan dy="0" x="${textStartX}">Range: ${parentBlock.base} - ${parentBlock.broadcast}</tspan>
        </text>
        <text class="detail" x="${textStartX}" y="125.875">
          <tspan dy="0" x="${textStartX}">Total IPs: ${parentBlock.size} (${freePercentage}% free)</tspan>
        </text>`;
    
    // Already defined allItems above
    
    // Add all items to the SVG
    const itemStartY = 150;
    // Track current Y position
    let currentY = itemStartY;
    
    allItems.forEach((item, index) => {
      if (item.type === 'subnet') {
        const subnet = item.data;
        const subnetY = currentY;
        const color = subnet.color;
        const subnetTextStartX = subnetX + 15 + iconSize + iconPadding;
        // Move current Y position down by subnet height + spacing
        currentY += subnetHeight + subnetSpacing; 
        
        svg += `
          <!-- Subnet ${index + 1} -->
          <rect width="${subnetWidth}" height="${subnetHeight}" 
                rx="4" ry="4" 
                fill="${getLightVariant(color)}" 
                stroke-width="1.5" 
                stroke="${color}" 
                x="${subnetX}" y="${subnetY}"></rect>
          
          <!-- Subnet Icon -->
          <image x="${subnetX + 15}" y="${subnetY + 20}" width="${iconSize}" height="${iconSize}" href="${subnetSvg}" />
                
          <!-- Subnet details -->
          <text class="title" x="${subnetTextStartX}" y="${subnetY + 30}">
            <tspan dy="0" x="${subnetTextStartX}">${subnet.name} (${subnet.block.base}/${subnet.cidr})</tspan>
          </text>
          <text class="detail" x="${subnetTextStartX}" y="${subnetY + 50}">
            <tspan dy="0" x="${subnetTextStartX}">Range: ${subnet.block.first} - ${subnet.block.last}</tspan>
          </text>
          <text class="detail" x="${subnetTextStartX}" y="${subnetY + 68}">
            <tspan dy="0" x="${subnetTextStartX}">Usable IPs: ${subnet.cidr >= 31 ? subnet.block.size : subnet.block.size - 2}</tspan>
          </text>`;
      } else if (item.type === 'free') {
        const space = item.data;
        const freeY = currentY;
        const freeTextStartX = subnetX + 15 + iconSize + iconPadding;
        // Move current Y position down by free space height + spacing
        currentY += freeSpaceHeight + subnetSpacing;
        
        svg += `
          <!-- Free Space -->
          <rect width="${subnetWidth}" height="${freeSpaceHeight}" 
                rx="4" ry="4" 
                fill="${freeSpaceLightColor}" 
                stroke-width="1.5" 
                stroke="${freeSpaceColor}" 
                x="${subnetX}" y="${freeY}"></rect>
          
          <!-- Free Space Icon -->
          <image x="${subnetX + 15}" y="${freeY + 20}" width="${iconSize}" height="${iconSize}" href="${spaceSvg}" />
                
          <!-- Free Space details -->
          <text class="title" x="${freeTextStartX}" y="${freeY + 30}">
            <tspan dy="0" x="${freeTextStartX}">Free Space (${space.size} IPs)</tspan>
          </text>
          <text class="detail" x="${freeTextStartX}" y="${freeY + 50}">
            <tspan dy="0" x="${freeTextStartX}">Range: ${space.startIp} - ${space.endIp}</tspan>
          </text>`;
      }
    });
    
    // Calculate footer position - ensure it's below the last item + padding
    const footerY = currentY + footerHeight; // Position footer well below last element
    
    svg += `
      <!-- Footer -->
      <text x="${width/2}" y="${footerY}" class="footer">
        <tspan dy="0" x="${width/2}">Total subnets: ${subnets.length} • Total IPs: ${parentBlock.size} • Free: ${freeSize} IPs (${freePercentage}%)</tspan>
      </text>
    </svg>`;
    
    return svg;
  };
  
  // Export diagram as true SVG - now only uses the manual generation
  const exportSVG = () => {
    try {
      // Generate the SVG markup directly
      const svgString = generateSVGMarkup();
      
      // Validate SVG string
      if (!svgString || typeof svgString !== 'string' || !svgString.includes('<svg')) {
        throw new Error('Invalid SVG markup generated');
      }
        
      // Create a blob and trigger download
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${parentNetwork.name || 'network'}-diagram.svg`;
      link.click();
        
      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
    } catch (e) {
      console.error('SVG export error:', e);
      setErrorModal({
        opened: true,
        message: `SVG export failed: ${e.message || 'Unknown error'}. Falling back to PNG...`
      });
      exportDiagram(); // Fallback to PNG on error
    }
  };

  return (
    <Paper p="md" radius="md" withBorder mt="lg">
      <Group position="apart" mb="md">
        <Title order={3}>Network Diagram</Title>
        <Group spacing="xs">
          <Button 
            size="xs" 
            variant="outline"
            onClick={exportSVG}
            leftSection={<IconDownload size={16} />}
          >
            Export SVG
          </Button>
          <Button 
            size="xs" 
            variant="outline"
            onClick={exportDiagram}
            leftSection={<IconDownload size={16} />}
          >
            Export PNG
          </Button>
        </Group>
      </Group>
      
      <Box 
        ref={diagramRef}
        p="lg" 
        sx={{
          backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[0],
          borderRadius: theme.radius.md,
          boxShadow: theme.shadows.sm,
        }}
      >
        {/* Parent Network Container */}
        <Box
          p="md"
          mb="md"
          style={{
            border: `2px solid ${theme.colors.blue[7]}`,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.white,
            transition: 'all 0.3s ease',
            opacity: animate ? 1 : 0,
            transform: animate ? 'translateY(0)' : 'translateY(10px)',
          }}
        >
          <Group spacing="xs" mb="sm" wrap="nowrap">
            <IconNetwork size={18} style={{ color: theme.colors.blue[7], flexShrink: 0 }} />
            <Text fw={700} size="sm">{parentNetwork.name || 'Parent Network'}</Text>
            <Text size="xs" fw={500} color="dimmed">({parentBlock.base}/{parentNetwork.cidr})</Text>
          </Group>
          <Text size="xs" color="dimmed" ml={28}>
            Range: {parentBlock.base} - {parentBlock.broadcast}
          </Text>
          <Text size="xs" color="dimmed" ml={28}>
            Total IPs: {parentBlock.size} ({freePercentage}% free)
          </Text>
          
          {/* Combine subnets and free spaces for visualization */}
          <Stack mt="lg" spacing="sm">
            {/* Create a combined array of subnets and free spaces */}
            {(() => {
              // Create a combined array of items to display
              const allItems = [];
              
              // Add subnets to the items array
              processedSubnets.forEach(subnet => {
                allItems.push({
                  type: 'subnet',
                  start: subnet.startLong,
                  end: subnet.endLong,
                  data: subnet
                });
              });
              
              // Add free spaces to the items array
              freeSpaces.forEach(space => {
                allItems.push({
                  type: 'free',
                  start: space.start,
                  end: space.end,
                  data: space
                });
              });
              
              // Sort all items by start address
              allItems.sort((a, b) => a.start - b.start);
              
              // Render all items
              return allItems.map((item, index) => {
                if (item.type === 'subnet') {
                  const subnet = item.data;
                  // Using consistent color based on subnet name
                  const color = subnet.color;
                  
                  return (
                    <Box
                      key={`subnet-${subnet.startLong}-${index}`}
                      p="sm"
                      ml="md"
                      style={{
                        border: `1px solid ${color}`,
                        borderRadius: theme.radius.sm,
                        backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[0],
                        transition: 'all 0.3s ease',
                        opacity: animate ? 1 : 0,
                        transform: animate ? 'translateY(0)' : 'translateY(5px)',
                        transitionDelay: `${index * 0.1}s`,
                      }}
                    >
                      <Group spacing="xs" wrap="nowrap">
                        <IconSubtask size={16} stroke={2} style={{ color: color, flexShrink: 0 }} />
                        <Text fw={600} size="xs">{subnet.name}</Text>
                        <Text size="xs" fw={500} color="dimmed">({subnet.block.base}/{subnet.cidr})</Text>
                      </Group>
                      <Stack spacing={2} ml={26}>
                        <Text size="xs" color="dimmed">
                          Network: {subnet.block.base}
                        </Text>
                        <Text size="xs" color="dimmed">
                          Range: {subnet.block.first} - {subnet.block.last}
                        </Text>
                        <Text size="xs" color="dimmed">
                          Usable IPs: {subnet.cidr >= 31 ? subnet.block.size : subnet.block.size - 2}
                        </Text>
                      </Stack>
                    </Box>
                  );
                } else if (item.type === 'free') {
                  const space = item.data;
                  // Using light grey for free space
                  const freeSpaceColor = theme.colorScheme === 'dark' ? theme.colors.gray[5] : theme.colors.gray[6];
                  
                  return (
                    <Box
                      key={`free-${space.start}-${index}`}
                      p="sm"
                      ml="md"
                      style={{
                        border: `1px solid ${freeSpaceColor}`,
                        borderRadius: theme.radius.sm,
                        backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[0],
                        transition: 'all 0.3s ease',
                        opacity: animate ? 1 : 0,
                        transform: animate ? 'translateY(0)' : 'translateY(5px)',
                        transitionDelay: `${index * 0.1}s`,
                      }}
                    >
                      <Group spacing="xs" wrap="nowrap">
                        <IconSpace size={16} stroke={2} style={{ color: freeSpaceColor, flexShrink: 0 }} />
                        <Text fw={600} size="xs">Free Space</Text>
                        <Text size="xs" fw={500} color="dimmed">({space.size} IPs)</Text>
                      </Group>
                      <Stack spacing={2} ml={26}>
                        <Text size="xs" color="dimmed">
                          Start: {longToIp(space.start)}
                        </Text>
                        <Text size="xs" color="dimmed">
                          End: {longToIp(space.end)}
                        </Text>
                        <Text size="xs" color="dimmed">
                          Size: {space.size} IPs
                        </Text>
                      </Stack>
                    </Box>
                  );
                }
                return null;
              });
            })()} 
          </Stack>
        </Box>
        
        {/* Network Legend */}
        <Group spacing="xs" mt="xl" position="center">
          <Text size="xs" color="dimmed">Total subnets: {subnets.length}</Text>
          <Text size="xs" color="dimmed">•</Text>
          <Text size="xs" color="dimmed">Total IPs: {parentBlock.size}</Text>
          <Text size="xs" color="dimmed">•</Text>
          <Text size="xs" color="dimmed">Free: {freeSize} IPs ({freePercentage}%)</Text>
        </Group>
      </Box>
      
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