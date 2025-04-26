import { Box, Paper, Title, Text, Button, Group, Stack, useMantineTheme, Modal } from '@mantine/core';
import { IconDownload, IconNetwork, IconWifi } from '@tabler/icons-react';
import { useRef, useState, useEffect } from 'react';
import { Netmask } from 'netmask';
import html2canvas from 'html2canvas';
import { SVG } from 'svg.js';

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
  const colors = [
    theme.colors.blue[5], 
    theme.colors.green[5], 
    theme.colors.violet[5], 
    theme.colors.orange[5], 
    theme.colors.teal[5], 
    theme.colors.grape[5], 
    theme.colors.red[5],
    theme.colors.cyan[5],
    theme.colors.lime[5]
  ];
  
  const processedSubnets = subnets.map((subnet, index) => {
    const block = new Netmask(subnet.base + '/' + subnet.cidr);
    return {
      ...subnet,
      block,
      color: colors[index % colors.length]
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
  
  // Export diagram as true SVG
  const exportSVG = () => {
    try {
      // Create an in-memory div for SVG.js to work with
      const container = document.createElement('div');
      document.body.appendChild(container);
      
      // Get dimensions from the actual diagram
      const boundingRect = diagramRef.current.getBoundingClientRect();
      const width = boundingRect.width;
      const height = boundingRect.height;
      
      // Initialize SVG.js
      const draw = SVG(container).size(width, height);
      
      // Background
      const bgColor = theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[0];
      draw.rect(width, height).fill(bgColor);
      
      // Parent Network Container
      const parentBoxY = 50;
      const parentBoxHeight = height - 100;
      const parentBoxWidth = width - 40;
      const parentBoxX = 20;
      
      // Draw parent network container
      const parentBox = draw.rect(parentBoxWidth, parentBoxHeight)
        .radius(5)
        .fill('white')
        .stroke({ width: 2, color: theme.colors.blue[7] })
        .move(parentBoxX, parentBoxY);
      
      // Add parent network title
      draw.text(function(add) {
        add.tspan(`${parentNetwork.name || 'Parent Network'} (${parentBlock.base}/${parentNetwork.cidr})`)
          .font({
            family: 'Arial',
            size: 16,
            weight: 'bold'
          });
      }).move(parentBoxX + 25, parentBoxY + 20);
      
      // Add parent network details
      draw.text(function(add) {
        add.tspan(`Range: ${parentBlock.base} - ${parentBlock.broadcast}`)
          .font({
            family: 'Arial',
            size: 12
          });
      }).move(parentBoxX + 25, parentBoxY + 45);
      
      draw.text(function(add) {
        add.tspan(`Total IPs: ${parentBlock.size}`)
          .font({
            family: 'Arial',
            size: 12
          });
      }).move(parentBoxX + 25, parentBoxY + 65);
      
      // Draw subnets
      const subnetStartY = parentBoxY + 100;
      const subnetHeight = 80;
      const subnetSpacing = 10;
      const subnetWidth = parentBoxWidth - 60;
      const subnetX = parentBoxX + 30;
      
      processedSubnets.forEach((subnet, index) => {
        const y = subnetStartY + (subnetHeight + subnetSpacing) * index;
        
        // Create subnet box
        const subnetBox = draw.rect(subnetWidth, subnetHeight)
          .radius(4)
          .fill(`${subnet.color}15`)
          .stroke({ width: 1, color: subnet.color })
          .move(subnetX, y);
        
        // Add subnet title
        draw.text(function(add) {
          add.tspan(`${subnet.name} (${subnet.block.base}/${subnet.cidr})`)
            .font({
              family: 'Arial',
              size: 14,
              weight: 'bold'
            });
        }).move(subnetX + 15, y + 20);
        
        // Add subnet details
        draw.text(function(add) {
          add.tspan(`Range: ${subnet.block.first} - ${subnet.block.last}`)
            .font({
              family: 'Arial',
              size: 12
            });
        }).move(subnetX + 15, y + 40);
        
        draw.text(function(add) {
          add.tspan(`Usable IPs: ${subnet.cidr >= 31 ? subnet.block.size : subnet.block.size - 2}`)
            .font({
              family: 'Arial',
              size: 12
            });
        }).move(subnetX + 15, y + 60);
      });
      
      // Add footer with subnet count
      draw.text(function(add) {
        add.tspan(`Total subnets: ${subnets.length} • Total IPs: ${parentBlock.size}`)
          .font({
            family: 'Arial',
            size: 12
          });
      }).move(width/2 - 100, height - 30);
      
      // Get the SVG as a string
      const svgString = container.innerHTML;
      
      // Remove the temporary container
      document.body.removeChild(container);
      
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
      exportDiagram();
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
          <Group spacing="xs" mb="sm">
            <IconNetwork size={18} color={theme.colors.blue[7]} />
            <Text fw={700} size="sm">{parentNetwork.name || 'Parent Network'}</Text>
            <Text size="xs" fw={500} color="dimmed">({parentBlock.base}/{parentNetwork.cidr})</Text>
          </Group>
          <Text size="xs" color="dimmed">
            Range: {parentBlock.base} - {parentBlock.broadcast}
          </Text>
          <Text size="xs" color="dimmed">
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
                  backgroundColor: `${subnet.color}15`,
                  transition: 'all 0.3s ease',
                  opacity: animate ? 1 : 0,
                  transform: animate ? 'translateY(0)' : 'translateY(5px)',
                  transitionDelay: `${index * 0.1}s`,
                }}
              >
                <Group spacing="xs">
                  <IconWifi size={16} color={subnet.color} />
                  <Text fw={600} size="xs">{subnet.name}</Text>
                  <Text size="xs" fw={500} color="dimmed">({subnet.block.base}/{subnet.cidr})</Text>
                </Group>
                <Text size="xs" ml="md" color="dimmed">
                  Range: {subnet.block.first} - {subnet.block.last}
                </Text>
                <Text size="xs" ml="md" color="dimmed">
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