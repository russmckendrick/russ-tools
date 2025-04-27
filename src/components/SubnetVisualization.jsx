import { Box, Paper, Text, Tooltip, useMantineTheme } from '@mantine/core';
import { IconNetwork, IconBroadcast } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Netmask } from 'netmask';
import { ipToLong, longToIp } from '../utils';

// Tooltip content for subnet details
function getSubnetTooltip(subnet) {
  return (
    <>
      <strong>{subnet.name} (/{subnet.cidr})</strong><br />
      Network: {subnet.block.base}<br />
      Broadcast: {subnet.block.broadcast}<br />
      Range: {subnet.block.first} - {subnet.block.last}<br />
      Total IPs: {subnet.block.size}<br />
      Usable IPs: {subnet.cidr >= 31 ? subnet.block.size : subnet.block.size - 2}<br />
      Subnet Mask: {subnet.block.mask}
    </>
  );
}

export function SubnetVisualization({ parentNetwork, subnets }) {
  const theme = useMantineTheme();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(false);
    const timeout = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timeout);
  }, [parentNetwork, subnets]);

  if (!parentNetwork || !subnets || subnets.length === 0) return null;

  // Calculate parent block and total size
  const parentBlock = new Netmask(parentNetwork.ip + '/' + parentNetwork.cidr);
  const parentSize = parentBlock.size;
  const parentStart = ipToLong(parentBlock.base);
  const parentEnd = ipToLong(parentBlock.broadcast);

  // Process subnets
  const subnetBlocks = subnets.map(s => {
    const block = new Netmask(s.base + '/' + s.cidr);
    return {
      ...s,
      block,
      start: ipToLong(block.base),
      end: ipToLong(block.broadcast),
    };
  }).sort((a, b) => a.start - b.start);

  // Build segments: subnets and unused space
  let segments = [];
  let lastEnd = parentStart;
  subnetBlocks.forEach((s, idx) => {
    if (s.start > lastEnd) {
      // Unused space before this subnet
      segments.push({
        type: 'unused',
        start: lastEnd,
        end: s.start - 1,
      });
    }
    segments.push({
      type: 'subnet',
      ...s,
    });
    lastEnd = s.end + 1;
  });
  if (lastEnd <= parentEnd) {
    segments.push({
      type: 'unused',
      start: lastEnd,
      end: parentEnd,
    });
  }

  // Default colors for fallback and unused space
  const defaultColors = [
    theme.colors.blue[5], theme.colors.green[5], theme.colors.cyan[5], 
    theme.colors.violet[5], theme.colors.orange[5], theme.colors.teal[5], 
    theme.colors.grape[5], theme.colors.lime[5]
  ];
  const unusedColor = theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3];
  const borderColor = theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3];
  
  // Helper to get a light variant of a color for dark mode
  const getLightVariant = (color) => {
    // Extract the color name and index from the color value
    for (const [colorName, shades] of Object.entries(theme.colors)) {
      const index = shades.indexOf(color);
      if (index !== -1) {
        // Return a lighter shade (0 or 1 depending on theme)
        return theme.colorScheme === 'dark' ? theme.fn.rgba(color, 0.7) : color;
      }
    }
    // Fallback
    return color;
  };

  // Calculate percent free
  const usedAddresses = subnetBlocks.reduce((acc, s) => acc + (s.end - s.start + 1), 0);
  const freeAddresses = parentSize - usedAddresses;
  const percentFree = ((freeAddresses / parentSize) * 100).toFixed(1);

  // Helper for width
  const widthPct = (start, end) => ((end - start + 1) / parentSize) * 100;

  return (
    <Paper p="md" radius="md" withBorder mt="lg">
      <Text fw={500} mb="md">Subnet Visualization</Text>
      <Text size="sm" mb="xs" c="dimmed">{percentFree}% of the parent network is free</Text>
      
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
        {segments.map((seg, idx) => {
          if (seg.type === 'unused') {
            return (
              <Tooltip key={idx} label={`Unused: ${longToIp(seg.start)} - ${longToIp(seg.end)}`} withArrow>
                <Box
                  style={{
                    width: `${widthPct(seg.start, seg.end)}%`,
                    height: '100%',
                    background: unusedColor,
                    opacity: animate ? 1 : 0,
                    transition: 'width 0.7s cubic-bezier(.4,2,.6,1)',
                  }}
                />
              </Tooltip>
            );
          }
          // Subnet segment - use the subnet's color if available, or fall back to a default
          const color = seg.color || defaultColors[idx % defaultColors.length];
          return (
            <Tooltip
              key={idx}
              label={getSubnetTooltip(seg)}
              withArrow
              multiline
              width={260}
            >
              <Box
                style={{
                  width: `${widthPct(seg.start, seg.end)}%`,
                  height: '100%',
                  background: getLightVariant(color),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  opacity: animate ? 1 : 0,
                  transition: 'width 0.7s cubic-bezier(.4,2,.6,1)',
                  borderRight: idx < segments.length - 1 ? `1px solid ${borderColor}` : undefined,
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
                  {seg.name}
                </Text>
              </Box>
            </Tooltip>
          );
        })}
      </Box>
      
      <Box mt="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text size="xs" c="dimmed">{parentBlock.base}</Text>
        <Text size="xs" c="dimmed">{parentBlock.broadcast}</Text>
      </Box>
    </Paper>
  );
} 