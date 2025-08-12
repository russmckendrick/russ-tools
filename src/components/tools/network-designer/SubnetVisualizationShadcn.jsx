import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { Netmask } from 'netmask';
import { ipToLong, longToIp } from '../../../utils';

// Tooltip content for subnet details
function getSubnetTooltip(subnet) {
  return `${subnet.name} (/${subnet.cidr})\nNetwork: ${subnet.block.base}\nBroadcast: ${subnet.block.broadcast}\nRange: ${subnet.block.first} - ${subnet.block.last}\nTotal IPs: ${subnet.block.size}\nUsable IPs: ${subnet.cidr >= 31 ? subnet.block.size : subnet.block.size - 2}\nSubnet Mask: ${subnet.block.mask}`;
}

// Helper function to get contrasting text color (white or black)
const getContrastColor = (hexColor) => {
  if (!hexColor) return '#000000';

  // Remove # if present
  hexColor = hexColor.replace('#', '');

  // Convert hex to RGB
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);

  // Calculate relative luminance (using standard formula)
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

  // Return white for dark backgrounds, black for light backgrounds
  return luminance < 0.5 ? '#ffffff' : '#000000';
};

// Get color from color name
const getColorFromName = (colorName) => {
  const colorMap = {
    blue: '#3b82f6',
    green: '#10b981',
    purple: '#8b5cf6',
    orange: '#f97316',
    red: '#ef4444',
    yellow: '#eab308',
    teal: '#14b8a6',
    pink: '#ec4899',
    violet: '#8b5cf6',
    cyan: '#06b6d4',
    lime: '#84cc16',
    indigo: '#6366f1',
    grape: '#8b5cf6'
  };
  return colorMap[colorName] || '#6b7280';
};

export function SubnetVisualizationShadcn({ parentNetwork, subnets }) {
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

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const unusedColor = isDark ? 'var(--color-muted)' : '#e5e7eb';
  const borderColor = isDark ? 'var(--color-border)' : '#d1d5db';

  // Calculate percent free
  const usedAddresses = subnetBlocks.reduce((acc, s) => acc + (s.end - s.start + 1), 0);
  const freeAddresses = parentSize - usedAddresses;
  const percentFree = ((freeAddresses / parentSize) * 100).toFixed(1);

  // Helper for width
  const widthPct = (start, end) => ((end - start + 1) / parentSize) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Subnet Visualization</CardTitle>
        <p className="text-sm text-muted-foreground">
          {percentFree}% of the parent network is free
        </p>
      </CardHeader>
      <CardContent>
        <div
          className="h-16 flex items-center rounded border overflow-hidden shadow-sm bg-secondary"
          style={{
            border: `1px solid ${borderColor}`,
            backgroundColor: 'var(--color-secondary)'
          }}
        >
          {segments.map((seg, idx) => {
            if (seg.end < seg.start) return null;

            if (seg.type === 'unused') {
              return (
                <div
                  key={idx}
                  className="h-full transition-all duration-700 ease-out cursor-help"
                  style={{
                    width: `${widthPct(seg.start, seg.end)}%`,
                    backgroundColor: unusedColor,
                    opacity: animate ? 1 : 0,
                  }}
                  title={`Unused: ${longToIp(seg.start)} - ${longToIp(seg.end)}`}
                />
              );
            }

            // Subnet segment
            const color = seg.color ? getColorFromName(seg.color.name) : '#6b7280';

            return (
              <div
                key={idx}
                 className="h-full flex items-center justify-center relative transition-all duration-700 ease-out cursor-help"
                style={{
                  width: `${widthPct(seg.start, seg.end)}%`,
                  backgroundColor: color,
                  opacity: animate ? 1 : 0,
                   borderRight: idx < segments.length - 1 ? `1px solid ${borderColor}` : undefined,
                }}
                title={getSubnetTooltip(seg)}
              >
                <span
                  className="text-xs font-semibold select-none z-10"
                  style={{
                    color: getContrastColor(color),
                  }}
                >
                  {seg.name}
                </span>
              </div>
            );
          })}
        </div>
        
        <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground">
          <span>{parentBlock.base}</span>
          <span>{parentBlock.broadcast}</span>
        </div>
      </CardContent>
    </Card>
  );
}