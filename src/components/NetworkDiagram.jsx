import { Box, Paper, Title, Text, Button, Group, Stack, useMantineTheme } from '@mantine/core';
import { IconDownload, IconNetwork, IconWifi } from '@tabler/icons-react';
import { useRef, useState, useEffect } from 'react';
import { Netmask } from 'netmask';
import html2canvas from 'html2canvas';

export function NetworkDiagram({ parentNetwork, subnets }) {
  const theme = useMantineTheme();
  const diagramRef = useRef(null);
  const [animate, setAnimate] = useState(false);

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
  }).sort((a, b) => new Netmask(a.base + '/' + a.cidr).size - new Netmask(b.base + '/' + b.cidr).size);

  // Export diagram as PNG
  const exportDiagram = () => {
    if (!diagramRef.current) return;
    
    html2canvas(diagramRef.current).then(canvas => {
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `${parentNetwork.name || 'network'}-diagram.png`;
      link.click();
    });
  };

  return (
    <Paper p="md" radius="md" withBorder mt="lg">
      <Group position="apart" mb="md">
        <Title order={3}>Network Diagram</Title>
        <Button 
          leftIcon={<IconDownload size={16} />} 
          size="xs" 
          variant="outline"
          onClick={exportDiagram}
        >
          Export PNG
        </Button>
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
                key={index}
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
    </Paper>
  );
} 