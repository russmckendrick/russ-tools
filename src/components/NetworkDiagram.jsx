import { Box, Paper, Title, Text, Button, Group, Stack, useMantineTheme, Modal } from '@mantine/core';
import { IconDownload, IconNetwork, IconSubtask } from '@tabler/icons-react';
import { useRef, useState, useEffect } from 'react';
import { Netmask } from 'netmask';
import html2canvas from 'html2canvas';
import networkSvg from '../assets/network.svg';
import subnetSvg from '../assets/subnet.svg';

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

  // Process parent network
  const parentBlock = new Netmask(parentNetwork.ip + '/' + parentNetwork.cidr);
  
  // Process subnets with color assignment
  const processedSubnets = subnets.map((subnet, index) => {
    const block = new Netmask(subnet.base + '/' + subnet.cidr);
    return {
      ...subnet,
      block,
      // Ensure color property exists for consistency
      color: subnet.color || theme.colors.gray[5]
    };
  }).sort((a, b) => a.block.base.localeCompare(b.block.base));

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
  
  // Renamed function: Generates the SVG markup directly
  const generateSVGMarkup = () => {
    // Set diagram dimensions
    const width = 1220;
    const subnetHeight = 80; 
    const subnetSpacing = 10;
    const iconSize = 18;
    const iconPadding = 10;
    const textStartX = 45 + iconSize + iconPadding; // Start text after icon + padding
    
    // Calculate required height
    const headerHeight = 100; // Space for parent network info
    const totalSubnetsHeight = (processedSubnets.length * (subnetHeight + subnetSpacing));
    const footerHeight = 50; // Space for footer
    const bottomPadding = 40; // Extra space at the very bottom
    const height = headerHeight + totalSubnetsHeight + footerHeight + bottomPadding;
    
    // Layout calculations
    const parentBoxX = 20;
    const parentBoxY = 50;
    const parentBoxWidth = width - 40;
    const parentBoxHeight = height - 70; // Adjusted height for parent box
    const subnetX = 50;
    const subnetWidth = width - 100;
    const borderRadius = 5;
    
    // Get light theme colors for fills
    const lightColors = {
      blue: theme.colors.blue[0],
      green: theme.colors.green[0],
      violet: theme.colors.violet[0],
      gray: theme.colors.gray[0] // Fallback
    };
    
    // Use the imported SVG files for icons
    // We'll embed them directly in the SVG output
    
    // Create SVG manually
    let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
      <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" 
           width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <style>
          text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'; }
          .title { font-size: 14px; font-weight: 600; }
          .detail { font-size: 12px; fill: #495057; }
          .footer { font-size: 12px; text-anchor: middle; fill: #495057; }
          .iconPath { stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; fill: none; }
        </style>
        <rect width="${width}" height="${height}" fill="${theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[0]}"></rect>
        
        <!-- Parent Network Container -->
        <rect width="${parentBoxWidth}" height="${parentBoxHeight}" 
              rx="${borderRadius}" ry="${borderRadius}" 
              fill="white" 
              stroke-width="1"
              stroke="${theme.colors.blue[7]}" 
              x="${parentBoxX}" y="${parentBoxY}"></rect>
        
        <!-- Parent Network Icon (Using network.svg as embedded image) -->
        <image x="40" y="70" width="${iconSize}" height="${iconSize}" href="${networkSvg}" />
        
        <!-- Parent Network header -->
        <text font-family="Arial" font-size="16" font-weight="bold" x="${textStartX}" y="84.484375">
          <tspan dy="0" x="${textStartX}">${parentNetwork.name || 'Parent Network'} (${parentNetwork.ip}/${parentNetwork.cidr})</tspan>
        </text>
        <text font-family="Arial" font-size="12" x="${textStartX}" y="105.875">
          <tspan dy="0" x="${textStartX}">Range: ${parentBlock.base} - ${parentBlock.broadcast}</tspan>
        </text>
        <text font-family="Arial" font-size="12" x="${textStartX}" y="125.875">
          <tspan dy="0" x="${textStartX}">Total IPs: ${parentBlock.size}</tspan>
        </text>`;
    
    // Add subnets
    const subnetStartY = 150;
    processedSubnets.forEach((subnet, index) => {
      const subnetY = subnetStartY + (subnetHeight + subnetSpacing) * index;
      const color = subnet.color;
      const colorName = Object.keys(theme.colors).find(key => theme.colors[key].includes(color)) || 'gray';
      const fillColor = lightColors[colorName];
      const subnetTextStartX = subnetX + 15 + iconSize + iconPadding; 
      
      svg += `
        <!-- Subnet ${index + 1} -->
        <rect width="${subnetWidth}" height="${subnetHeight}" 
              rx="4" ry="4" 
              fill="${fillColor}" 
              stroke-width="1" 
              stroke="${color}" 
              x="${subnetX}" y="${subnetY}"></rect>
        
        <!-- Subnet Icon (Using subnet.svg as embedded image) -->
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
    });
    
    // Calculate footer position - ensure it's below the last subnet + padding
    const lastElementBottom = subnetStartY + totalSubnetsHeight;
    const footerY = lastElementBottom + footerHeight; // Position footer well below last element
    
    svg += `
      <!-- Footer -->
      <text x="${width/2}" y="${footerY}" class="footer">
        <tspan dy="0" x="${width/2}">Total subnets: ${subnets.length} • Total IPs: ${parentBlock.size}</tspan>
      </text>
    </svg>`;
    
    return svg;
  };
  
  // Export diagram as true SVG - now only uses the manual generation
  const exportSVG = () => {
    try {
      // Generate the SVG markup directly
      const svgString = generateSVGMarkup();
        
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
        message: 'SVG export failed. Falling back to PNG...'
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
            leftIcon={<IconDownload size={16} />} 
            size="xs" 
            variant="outline"
            onClick={exportSVG}
          >
            Export SVG
          </Button>
          <Button 
            leftIcon={<IconDownload size={16} />} 
            size="xs" 
            variant="outline"
            onClick={exportDiagram}
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
          <Group spacing="xs" mb="sm" noWrap>
            <IconNetwork size={18} style={{ color: theme.colors.blue[7], flexShrink: 0 }} />
            <Text fw={700} size="sm">{parentNetwork.name || 'Parent Network'}</Text>
            <Text size="xs" fw={500} color="dimmed">({parentBlock.base}/{parentNetwork.cidr})</Text>
          </Group>
          <Text size="xs" color="dimmed" ml={28}>
            Range: {parentBlock.base} - {parentBlock.broadcast}
          </Text>
          <Text size="xs" color="dimmed" ml={28}>
            Total IPs: {parentBlock.size}
          </Text>
          
          {/* Subnets inside parent network */}
          <Stack mt="lg" spacing="sm">
            {processedSubnets.map((subnet, index) => (
              <Box
                key={subnet.base || index}
                p="sm"
                ml="md"
                style={{
                  border: `1px solid ${subnet.color}`,
                  borderRadius: theme.radius.sm,
                  backgroundColor: theme.colorScheme === 'dark' 
                    ? theme.fn.rgba(subnet.color, 0.2) 
                    : (Object.keys(theme.colors).some(key => theme.colors[key].includes(subnet.color))
                        ? theme.colors[Object.keys(theme.colors).find(key => theme.colors[key].includes(subnet.color))][0]
                        : theme.colors.gray[0]), 
                  transition: 'all 0.3s ease',
                  opacity: animate ? 1 : 0,
                  transform: animate ? 'translateY(0)' : 'translateY(5px)',
                  transitionDelay: `${index * 0.1}s`,
                }}
              >
                <Group spacing="xs" noWrap>
                  <IconSubtask size={16} style={{ color: subnet.color, flexShrink: 0 }} />
                  <Text fw={600} size="xs">{subnet.name}</Text>
                  <Text size="xs" fw={500} color="dimmed">({subnet.block.base}/{subnet.cidr})</Text>
                </Group>
                <Text size="xs" ml={26} color="dimmed">
                  Range: {subnet.block.first} - {subnet.block.last}
                </Text>
                <Text size="xs" ml={26} color="dimmed">
                  Usable IPs: {subnet.cidr >= 31 ? subnet.block.size : subnet.block.size - 2}
                </Text>
              </Box>
            ))}
          </Stack>
        </Box>
        
        {/* Network Legend */}
        <Group spacing="xs" mt="xl" position="center">
          <Text size="xs" color="dimmed">Total subnets: {subnets.length}</Text>
          <Text size="xs" color="dimmed">•</Text>
          <Text size="xs" color="dimmed">
            Total IPs: {parentBlock.size}
          </Text>
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