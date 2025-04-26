import { Box, Paper, Title, Text, Button, Group, Stack, useMantineTheme, Modal } from '@mantine/core';
// Import Tabler icons initially, we might remove them later if SVGs work well
import { IconDownload } from '@tabler/icons-react'; 
// Import custom SVGs as React components
import NetworkIcon from '../assets/network.svg?react';
import SubnetIcon from '../assets/subnet.svg?react';
import { useRef, useState, useEffect } from 'react';
import { Netmask } from 'netmask';
import html2canvas from 'html2canvas';

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
    
    // SVG icons as path data FROM YOUR FILES
    const networkIconPath = "M3 12H21M12 8V12M6.5 12V16M17.5 12V16M10.1 8H13.9C14.4601 8 14.7401 8 14.954 7.89101C15.1422 7.79513 15.2951 7.64215 15.391 7.45399C15.5 7.24008 15.5 6.96005 15.5 6.4V4.6C15.5 4.03995 15.5 3.75992 15.391 3.54601C15.2951 3.35785 15.1422 3.20487 14.954 3.10899C14.7401 3 14.4601 3 13.9 3H10.1C9.53995 3 9.25992 3 9.04601 3.10899C8.85785 3.20487 8.70487 3.35785 8.60899 3.54601C8.5 3.75992 8.5 4.03995 8.5 4.6V6.4C8.5 6.96005 8.5 7.24008 8.60899 7.45399C8.70487 7.64215 8.85785 7.79513 9.04601 7.89101C9.25992 8 9.53995 8 10.1 8ZM15.6 21H19.4C19.9601 21 20.2401 21 20.454 20.891C20.6422 20.7951 20.7951 20.6422 20.891 20.454C21 20.2401 21 19.9601 21 19.4V17.6C21 17.0399 21 16.7599 20.891 16.546C20.7951 16.3578 20.6422 16.2049 20.454 16.109C20.2401 16 19.9601 16 19.4 16H15.6C15.0399 16 14.7599 16 14.546 16.109C14.3578 16.2049 14.2049 16.3578 14.109 16.546C14 16.7599 14 17.0399 14 17.6V19.4C14 19.9601 14 20.2401 14.109 20.454C14.2049 20.6422 14.3578 20.7951 14.546 20.891C14.7599 21 15.0399 21 15.6 21ZM4.6 21H8.4C8.96005 21 9.24008 21 9.45399 20.891C9.64215 20.7951 9.79513 20.6422 9.89101 20.454C10 20.2401 10 19.9601 10 19.4V17.6C10 17.0399 10 16.7599 9.89101 16.546C9.79513 16.3578 9.64215 16.2049 9.45399 16.109C9.24008 16 8.96005 16 8.4 16H4.6C4.03995 16 3.75992 16 3.54601 16.109C3.35785 16.2049 3.20487 16.3578 3.10899 16.546C3 16.7599 3 17.0399 3 17.6V19.4C3 19.9601 3 20.2401 3.10899 20.454C3.20487 20.6422 3.35785 20.7951 3.54601 20.891C3.75992 21 4.03995 21 4.6 21Z";
    // Note: This path is complex and might require viewBox adjustments in the <g> tag if it doesn't render correctly
    const subnetIconPath = "M173,3248 L181,3248 C181.552,3248 182,3248.448 182,3249 C182,3249.552 181.552,3250 181,3250 L173,3250 C172.448,3250 172,3249.552 172,3249 C172,3248.448 172.448,3248 173,3248 L173,3248 Z M173,3255 L181,3255 C181.552,3255 182,3255.448 182,3256 C182,3256.552 181.552,3257 181,3257 L173,3257 C172.448,3257 172,3256.552 172,3256 C172,3255.448 172.448,3255 173,3255 L173,3255 Z M173,3241 L181,3241 C181.552,3241 182,3241.448 182,3242 C182,3242.552 181.552,3243 181,3243 L173,3243 C172.448,3243 172,3242.552 172,3242 C172,3241.448 172.448,3241 173,3241 L173,3241 Z M170,3243 C170,3244.105 170.895,3245 172,3245 L182,3245 C183.105,3245 184,3244.105 184,3243 L184,3241 C184,3239.895 183.105,3239 182,3239 L172,3239 C170.895,3239 170,3239.895 170,3241 L166,3241 L166,3239 L164,3239 L164,3254.999 C164,3256.104 164.896,3257 166.001,3257 L166.219,3257 L170,3257 C170,3258.105 170.895,3259 172,3259 L182,3259 C183.105,3259 184,3258.105 184,3257 L184,3255 C184,3253.895 183.105,3253 182,3253 L172,3253 C170.895,3253 170,3253.895 170,3255 L166.996,3255 C166.446,3255 166,3254.554 166,3254.004 L166,3250 L170,3250 C170,3251.105 170.895,3252 172,3252 L182,3252 C183.105,3252 184,3251.105 184,3250 L184,3248 C184,3246.895 183.105,3246 182,3246 L172,3246 C170.895,3246 170,3246.895 170,3248 L166,3248 L166,3243 L170,3243 Z";
    
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
        
        <!-- Parent Network Icon (Using network.svg path) -->
        <g transform="translate(40, 78) scale(0.8)" > 
          <path d="${networkIconPath}" stroke="${theme.colors.blue[7]}" class="iconPath" />
        </g>
        
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
        
        <!-- Subnet Icon (Using subnet.svg path) -->
        <g transform="translate(${subnetX + 15}, ${subnetY + 25}) scale(0.05)" 
           viewBox="164 3239 20 20">
          <path d="${subnetIconPath}" stroke="${color}" class="iconPath" fill="${color}" />
        </g>
              
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
        ref={diagramRef} // Ref needed for PNG export
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
            {/* Use imported NetworkIcon */} 
            <NetworkIcon 
              width={18} 
              height={18} 
              style={{ stroke: theme.colors.blue[7], flexShrink: 0 }} 
            /> 
            <Text fw={700} size="sm">{parentNetwork.name || 'Parent Network'}</Text>
            <Text size="xs" fw={500} color="dimmed">({parentBlock.base}/{parentNetwork.cidr})</Text>
          </Group>
          <Text size="xs" color="dimmed" pl={28}> {/* Indent details */}
            Range: {parentBlock.base} - {parentBlock.broadcast}
          </Text>
          <Text size="xs" color="dimmed" pl={28}> {/* Indent details */}
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
                  // Determine fill color based on theme
                  backgroundColor: theme.colorScheme === 'dark' 
                    ? theme.fn.rgba(subnet.color, 0.2) 
                    : (Object.values(theme.colors).flat().includes(subnet.color) 
                        ? theme.colors[Object.keys(theme.colors).find(key => theme.colors[key].includes(subnet.color))][0]
                        : theme.colors.gray[0]), 
                  transition: 'all 0.3s ease',
                  opacity: animate ? 1 : 0,
                  transform: animate ? 'translateY(0)' : 'translateY(5px)',
                  transitionDelay: `${index * 0.1}s`,
                }}
              >
                <Group spacing="xs" noWrap>
                  {/* Use imported SubnetIcon */} 
                  <SubnetIcon 
                    width={16} 
                    height={16} 
                    style={{ stroke: subnet.color, fill: subnet.color, flexShrink: 0 }}
                  /> 
                  <Text fw={600} size="xs">{subnet.name}</Text>
                  <Text size="xs" fw={500} color="dimmed">({subnet.block.base}/{subnet.cidr})</Text>
                </Group>
                <Text size="xs" ml={26} color="dimmed"> {/* Indent details */}
                  Range: {subnet.block.first} - {subnet.block.last}
                </Text>
                <Text size="xs" ml={26} color="dimmed"> {/* Indent details */}
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