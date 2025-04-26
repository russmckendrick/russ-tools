import { Box, Paper, Text, Tooltip, useMantineTheme } from '@mantine/core';
import { IconNetwork, IconBroadcast } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

export function SubnetVisualization({ subnet }) {
  const theme = useMantineTheme();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(false);
    const timeout = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timeout);
  }, [subnet]);

  if (!subnet) return null;

  const total = subnet.numHosts;
  const usable = total > 2 ? total - 2 : 0;
  const networkWidth = 3; // percent
  const broadcastWidth = 3; // percent
  const usableWidth = 100 - networkWidth - broadcastWidth;

  // Colors for light/dark mode
  const networkColor = theme.colorScheme === 'dark' ? theme.colors.blue[7] : theme.colors.blue[5];
  const usableColor = theme.colorScheme === 'dark' ? theme.colors.green[8] : theme.colors.green[5];
  const broadcastColor = theme.colorScheme === 'dark' ? theme.colors.red[7] : theme.colors.red[5];
  const borderColor = theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3];

  return (
    <Paper p="md" radius="md" withBorder mt="lg">
      <Text fw={500} mb="md">Subnet Visualization</Text>
      <Box
        style={{
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          borderRadius: '4px',
          overflow: 'hidden',
          border: `1px solid ${borderColor}`,
          boxShadow: theme.shadows.xs,
          background: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.white,
          transition: 'box-shadow 0.3s',
        }}
      >
        {/* Network Address Segment */}
        <Tooltip label={`Network Address: ${subnet.networkAddress}`} withArrow>
          <Box
            style={{
              width: `${networkWidth}%`,
              height: '100%',
              background: networkColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              transition: 'width 0.7s cubic-bezier(.4,2,.6,1)',
              opacity: animate ? 1 : 0,
            }}
          >
            <IconNetwork size={24} color={theme.white} style={{ zIndex: 2 }} />
          </Box>
        </Tooltip>
        {/* Usable Hosts Segment */}
        <Tooltip label={`Usable Hosts: ${usable} (${subnet.first} - ${subnet.last})`} withArrow>
          <Box
            style={{
              width: `${usableWidth}%`,
              height: '100%',
              background: usableColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              transition: 'width 0.7s cubic-bezier(.4,2,.6,1)',
              opacity: animate ? 1 : 0,
            }}
          >
            <Text
              size="xs"
              style={{
                color: theme.white,
                textShadow: '0 0 2px rgba(0,0,0,0.5)',
                fontWeight: 600,
                userSelect: 'none',
                zIndex: 2,
              }}
            >
              {usable} Usable Hosts
            </Text>
          </Box>
        </Tooltip>
        {/* Broadcast Address Segment */}
        <Tooltip label={`Broadcast Address: ${subnet.broadcastAddress}`} withArrow>
          <Box
            style={{
              width: `${broadcastWidth}%`,
              height: '100%',
              background: broadcastColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              transition: 'width 0.7s cubic-bezier(.4,2,.6,1)',
              opacity: animate ? 1 : 0,
            }}
          >
            <IconBroadcast size={24} color={theme.white} style={{ zIndex: 2 }} />
          </Box>
        </Tooltip>
      </Box>
      <Box mt="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text size="xs" c="dimmed">{subnet.networkAddress}</Text>
        <Text size="xs" c="dimmed">{subnet.broadcastAddress}</Text>
      </Box>
    </Paper>
  );
} 