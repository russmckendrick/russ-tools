import { Box, Paper, Title, Text, Button, Group, Stack, useMantineTheme, Modal, useMantineColorScheme } from '@mantine/core';
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

  // Simplified helper function - accepts color name and current scheme
  const getThemeAwareSubnetBackground = (colorName, currentScheme) => {
    // Default to gray if colorName is invalid or not found
    const shades = theme.colors[colorName] || theme.colors.gray; 
    
    if (currentScheme === 'dark') { 
      // Use index 7 for dark mode background
      const darkIndex = shades.length > 7 ? 7 : shades.length - 1; // Ensure index exists
      return shades[darkIndex];
    } else {
      // Use index 0 for light mode background
      return shades[0];
    }
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
    const colorIndexInPalette = nameHash % colorPalette.length;
    const assignedColorValue = colorPalette[colorIndexInPalette]; // e.g., theme.colors.blue[5]

    // Find the color name (e.g., 'blue') corresponding to the assignedColorValue
    let colorName = 'gray'; // default
    for (const [name, shades] of Object.entries(theme.colors)) {
        const index = shades.indexOf(assignedColorValue);
        if (index !== -1) {
            colorName = name;
            break;
        }
    }

    return {
      ...subnet,
      block,
      networkLong: ipToLong(block.base),
      broadcastLong: ipToLong(block.broadcast),
      color: assignedColorValue, // Keep the original color value (e.g., shades[5]) for border/icon
      colorName: colorName, // Add color name ('blue')
    };
  }).sort((a, b) => a.networkLong - b.networkLong); // Sort by network address

  // Export diagram as PNG
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

    // Theme-aware colors
    const isDark = colorScheme === 'dark';
    const bgColor = isDark ? theme.colors.dark[7] : theme.colors.gray[0];
    const parentBorderColor = isDark ? theme.colors.dark[5] : theme.colors.gray[3];
    const parentHeaderBg = isDark ? theme.colors.dark[6] : theme.white;
    const defaultTextColor = isDark ? theme.colors.dark[0] : theme.colors.gray[7];
    const dimmedTextColor = theme.colors.gray[6];
    const parentIconColor = theme.colors.blue[isDark ? 4 : 7];
    const freeSpaceBgColor = isDark ? theme.colors.lime[9] : theme.colors.lime[1];
    const freeSpaceBorderColor = isDark ? theme.colors.lime[7] : theme.colors.lime[4];
    const freeSpaceTextColor = isDark ? theme.colors.lime[2] : theme.colors.lime[8];
    const freeSpaceIconColor = isDark ? theme.colors.lime[3] : theme.colors.lime[6];
    const footerTextColor = isDark ? theme.colors.dark[2] : theme.colors.gray[6];

    // Combine subnets and free spaces, then sort by starting IP
    const allItems = [
      ...processedSubnets.map(s => ({ type: 'subnet', data: s, startLong: s.networkLong })),
      ...freeSpaces.map(fs => ({ type: 'freeSpace', data: fs, startLong: fs.start }))
    ].sort((a, b) => a.startLong - b.startLong);

    let currentY = 20; // Initial Y padding
    let svgContent = '';

    // 1. Parent Network Box
    const parentBoxHeight = 80;
    svgContent += `
      <rect x="10" y="${currentY}" width="${width - 20}" height="${parentBoxHeight}" rx="8" ry="8" fill="${parentHeaderBg}" stroke="${parentBorderColor}" stroke-width="1" />
      <image href="${networkSvg}" x="25" y="${currentY + 20}" height="${iconSize}" width="${iconSize}" />
      <text x="${textStartX}" y="${currentY + 35}" font-family="${theme.fontFamily}" font-size="14px" font-weight="700" fill="${defaultTextColor}">${parentNetwork.name || 'Parent Network'}</text>
      <text x="${textStartX}" y="${currentY + 55}" font-family="${theme.fontFamily}" font-size="12px" fill="${dimmedTextColor}">
        Range: ${parentBlock.first} - ${parentBlock.last} (${parentBlock.size} IPs)
      </text>
      <text x="${width - 35}" y="${currentY + 35}" font-family="${theme.fontFamily}" text-anchor="end" font-size="12px" font-weight="500" fill="${dimmedTextColor}">
        (${parentBlock.base}/${parentNetwork.cidr})
      </text>
    `;
    currentY += parentBoxHeight + subnetSpacing * 2; // Move down for the next items

    // 2. Subnets and Free Spaces
    allItems.forEach((item) => {
      if (item.type === 'subnet') {
        const subnet = item.data;
        const subnetY = currentY;
        const colorValue = subnet.color; // e.g., theme.colors.blue[5]
        const colorName = subnet.colorName; // e.g., 'blue'
        
        // Determine background based on dark/light mode using the color name
        const subnetBgColor = getThemeAwareSubnetBackground(colorName, colorScheme);
        // Use the original strong color for the icon/border
        const subnetIconBorderColor = colorValue;

        svgContent += `
          <rect x="10" y="${subnetY}" width="${width - 20}" height="${subnetHeight}" rx="8" ry="8" fill="${subnetBgColor}" stroke="${subnetIconBorderColor}" stroke-width="1" />
          <image href="${subnetSvg}" x="25" y="${subnetY + (subnetHeight / 2) - (iconSize / 2)}" height="${iconSize}" width="${iconSize}" />
          <text x="${textStartX}" y="${subnetY + 25}" font-family="${theme.fontFamily}" font-size="14px" font-weight="700" fill="${defaultTextColor}">${subnet.name}</text>
          <text x="${textStartX}" y="${subnetY + 45}" font-family="${theme.fontFamily}" font-size="12px" fill="${dimmedTextColor}">
            Range: ${subnet.block.base} - ${subnet.block.broadcast} (${subnet.block.mask})
          </text>
          <text x="${textStartX}" y="${subnetY + 65}" font-family="${theme.fontFamily}" font-size="12px" fill="${dimmedTextColor}">
            Usable IPs: ${subnet.block.size - 2}
          </text>
          <text x="${width - 35}" y="${subnetY + 25}" font-family="${theme.fontFamily}" text-anchor="end" font-size="12px" font-weight="500" fill="${dimmedTextColor}">
            (${subnet.block.base}/${subnet.cidr})
          </text>
        `;
        currentY += subnetHeight + subnetSpacing;
      } else if (item.type === 'freeSpace') {
        const space = item.data;
        const spaceY = currentY;
        svgContent += `
          <rect x="10" y="${spaceY}" width="${width - 20}" height="${freeSpaceHeight}" rx="8" ry="8" fill="${freeSpaceBgColor}" stroke="${freeSpaceBorderColor}" stroke-width="1" stroke-dasharray="4 2" />
          <image href="${spaceSvg}" x="25" y="${spaceY + (freeSpaceHeight / 2) - (iconSize / 2)}" height="${iconSize}" width="${iconSize}" />
          <text x="${textStartX}" y="${spaceY + 25}" font-family="${theme.fontFamily}" font-size="13px" font-weight="600" fill="${freeSpaceTextColor}">Free Space</text>
          <text x="${textStartX}" y="${spaceY + 45}" font-family="${theme.fontFamily}" font-size="12px" fill="${freeSpaceTextColor}" opacity="0.8">
            Range: ${space.startIp} - ${space.endIp} (${space.size} IPs)
          </text>
        `;
        currentY += freeSpaceHeight + subnetSpacing;
      }
    });

    // 3. Footer Information
    const footerY = currentY + 15; // Add some padding before the footer
    svgContent += `
      <text x="15" y="${footerY}" font-family="${theme.fontFamily}" font-size="12px" fill="${footerTextColor}">
        Total subnets: ${processedSubnets.length}
      </text>
      <text x="${width / 2}" text-anchor="middle" y="${footerY}" font-family="${theme.fontFamily}" font-size="12px" fill="${footerTextColor}">
        Total IPs: ${totalParentSize}
      </text>
      <text x="${width - 15}" text-anchor="end" y="${footerY}" font-family="${theme.fontFamily}" font-size="12px" fill="${footerTextColor}">
        Free IPs: ${freeSize} (${freePercentage}%)
      </text>
    `;

    const totalHeight = footerY + 20; // Add padding below footer

    return `<svg width="${width}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="background-color: ${bgColor}; font-family: ${theme.fontFamily}, sans-serif;">
      ${svgContent}
    </svg>`;
  };
  
  // Export diagram as true SVG
  const exportSVG = () => {
    try {
      const svgData = generateSVGMarkup();
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = svgUrl;
      downloadLink.download = `${parentNetwork.name || 'network'}-diagram.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(svgUrl);
    } catch (err) {
      console.error('SVG export error:', err);
      setErrorModal({
        opened: true,
        message: 'SVG export failed. Could not generate diagram markup.',
      });
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
            <IconNetwork size={18} style={{ flexShrink: 0 }} /> 
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
                  // Use the strong color for border/icon
                  const subnetIconBorderColor = subnet.color;
                  // Use the theme-aware background
                  const subnetBgColor = getThemeAwareSubnetBackground(subnet.colorName, colorScheme);

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
                          <IconSubtask size={18} style={{ color: subnetIconBorderColor, flexShrink: 0 }} />
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
                        <IconSpace size={18} style={{ color: freeSpaceIconColor, flexShrink: 0 }} />
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