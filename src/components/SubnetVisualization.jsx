import { Box, Paper, Text, Tooltip, useMantineTheme } from '@mantine/core';
import { IconResize, IconGripVertical } from '@tabler/icons-react';
import { useEffect, useState, useRef } from 'react';
import { Netmask } from 'netmask';

// Helper functions for IP math
function ipToLong(ip) {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}
function longToIp(long) {
  return [24, 16, 8, 0].map(shift => (long >>> shift) & 255).join('.');
}

// Helper for calculating width percentage
function widthPct(start, end, totalSize) {
  return ((end - start + 1) / totalSize) * 100;
}

// Tooltip content for segment details
function getSegmentTooltip(segment) {
  const ipCount = segment.block.size;
  const usableIps = segment.cidr >= 31 ? ipCount : ipCount - 2;
  
  return (
    <>
      <strong>{segment.name} (/{segment.cidr})</strong><br />
      Network: {segment.block.base}<br />
      Broadcast: {segment.block.broadcast}<br />
      Range: {segment.block.first} - {segment.block.last}<br />
      Total IPs: {ipCount} (Usable: {usableIps})<br />
      Mask: {segment.block.mask}
    </>
  );
}

// Subnet segment component
function SubnetSegment({ 
  segment, 
  index, 
  parentSize, 
  colors, 
  unusedColor, 
  borderColor, 
  activeSegment,
  onResizeStart,
  onResize,
  onResizeEnd,
  parentCidr,
  maxCidr
}) {
  const theme = useMantineTheme();
  const [isDragging, setIsDragging] = useState(false);
  const [currentCidr, setCurrentCidr] = useState(segment.cidr);
  const handleRef = useRef(null);
  
  if (segment.type === 'unused') {
    return (
      <Tooltip label={`Unused: ${longToIp(segment.start)} - ${longToIp(segment.end)}`} withArrow>
        <Box
          style={{
            width: `${widthPct(segment.start, segment.end, parentSize)}%`,
            height: '100%',
            background: unusedColor,
            transition: 'width 0.3s ease',
          }}
        />
      </Tooltip>
    );
  }
  
  // For subnet segments
  const width = widthPct(segment.start, segment.end, parentSize);
  const isActive = activeSegment?.id === segment.id;
  
  // Handle mouse events for direct dragging
  const handleMouseDown = (e) => {
    e.preventDefault(); // Prevent text selection during drag
    e.stopPropagation();
    setIsDragging(true);
    onResizeStart(segment);
    
    // Add global event listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };
  
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    // Calculate mouse position relative to parent container
    const container = handleRef.current?.closest('[data-visualization-container]');
    if (!container) return;
    
    const { left, width: containerWidth } = container.getBoundingClientRect();
    const mouseX = Math.max(0, Math.min(containerWidth, e.clientX - left));
    const percentagePosition = (mouseX / containerWidth) * 100;
    
    // Calculate new CIDR based on percentage position
    const totalBits = 32 - parentCidr;
    const bitsToUse = Math.max(0, Math.min(totalBits, Math.round((percentagePosition / 100) * totalBits)));
    const newCidr = Math.min(maxCidr, Math.max(parentCidr, parentCidr + bitsToUse));

    if (newCidr !== currentCidr) {
      setCurrentCidr(newCidr);
      onResize(segment, newCidr);
    }
  };
  
  const handleMouseUp = (e) => {
    if (!isDragging) return;
    
    setIsDragging(false);
    onResizeEnd();
    
    // Remove global event listeners
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };
  
  // Clear event listeners when component unmounts
  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]); // eslint-disable-line react-hooks/exhaustive-deps
  
  return (
    <Tooltip
      label={getSegmentTooltip(segment)}
      withArrow
      disabled={isActive || isDragging}
      multiline
      width={260}
    >
      <Box
        style={{
          width: `${width}%`,
          height: '100%',
          background: colors[index % colors.length],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          cursor: 'pointer',
          borderRight: index < colors.length - 1 ? `1px solid ${borderColor}` : undefined,
          boxShadow: isActive ? `0 0 0 2px ${theme.colors.blue[5]}` : 'none',
          zIndex: isActive ? 10 : 1,
          minWidth: '40px', // Minimum width to ensure it's grabbable
          transition: isDragging ? 'none' : 'width 0.2s ease, box-shadow 0.2s ease',
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
            padding: '0 8px',
            textAlign: 'center',
            flex: 1,
          }}
        >
          {isActive ? `${segment.name} (/${currentCidr})` : segment.name}
        </Text>
        
        {/* Right resize handle */}
        <Box
          ref={handleRef}
          style={{
            position: 'absolute',
            right: '-6px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '14px',
            height: '28px',
            cursor: 'ew-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5,
            background: isDragging ? theme.colors.blue[5] : 'rgba(255,255,255,0.5)',
            borderRadius: '4px',
            border: '2px solid rgba(255,255,255,0.8)',
            boxShadow: isDragging ? '0 0 8px rgba(0,0,0,0.4)' : '0 0 5px rgba(0,0,0,0.2)',
            outline: isDragging ? `2px solid ${theme.colors.blue[3]}` : 'none',
            touchAction: 'none', // Prevents browser handling of all panning and zooming gestures
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={(e) => {
            e.preventDefault();
            const touch = e.touches[0];
            handleMouseDown({
              preventDefault: () => {},
              stopPropagation: () => {},
              clientX: touch.clientX,
              clientY: touch.clientY,
            });
          }}
        >
          <IconGripVertical 
            size={14} 
            stroke={2.5} 
            color="#fff" 
            style={{ 
              opacity: isDragging ? 1 : 0.9
            }} 
          />
        </Box>
      </Box>
    </Tooltip>
  );
}

// Component for the CIDR indicator that appears during resizing
function CidrIndicator({ cidr, position, ipCount }) {
  const theme = useMantineTheme();
  
  return (
    <Box
      style={{
        position: 'absolute',
        left: `${position}%`,
        top: '-30px',
        transform: 'translateX(-50%)',
        background: theme.colors.blue[6],
        color: theme.white,
        borderRadius: '4px',
        padding: '4px 8px',
        fontSize: '12px',
        fontWeight: 'bold',
        zIndex: 100,
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        pointerEvents: 'none', // Allow mouse events to pass through
        border: '1px solid rgba(255,255,255,0.6)',
      }}
    >
      /{cidr} ({ipCount} IPs)
    </Box>
  );
}

export function SubnetVisualization({ parentNetwork, subnets, onResizeSubnet }) {
  const theme = useMantineTheme();
  const [animate, setAnimate] = useState(false);
  const [activeSegment, setActiveSegment] = useState(null);
  const [tempCidr, setTempCidr] = useState(null);
  const [indicatorPosition, setIndicatorPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

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

  // Process subnets and add IDs for visualization
  const subnetBlocks = subnets.map((s, idx) => {
    const block = new Netmask(s.base + '/' + s.cidr);
    return {
      ...s,
      id: s.id || `subnet-viz-${idx}-${s.base}`,
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

  // Colors
  const colors = [theme.colors.blue[5], theme.colors.green[5], theme.colors.cyan[5], theme.colors.violet[5], theme.colors.orange[5], theme.colors.teal[5], theme.colors.grape[5], theme.colors.lime[5]];
  const unusedColor = theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3];
  const borderColor = theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3];

  // Calculate percent free
  const usedAddresses = subnetBlocks.reduce((acc, s) => acc + (s.end - s.start + 1), 0);
  const freeAddresses = parentSize - usedAddresses;
  const percentFree = ((freeAddresses / parentSize) * 100).toFixed(1);

  // Min and max CIDR values based on parent network
  const minCidr = parentNetwork.cidr; // Can't be smaller than parent
  const maxCidr = 30; // Smallest practical subnet (/31 and /32 are special cases)

  // Handle subnet resize start
  const handleResizeStart = (segment) => {
    setActiveSegment(segment);
    setTempCidr(segment.cidr);
    setIsDragging(true);
    
    // Calculate initial indicator position
    const totalBits = 32 - parentNetwork.cidr;
    const currentUsedBits = segment.cidr - parentNetwork.cidr;
    const percent = (currentUsedBits / totalBits) * 100;
    setIndicatorPosition(percent);
  };

  // Handle resize during drag
  const handleResize = (segment, newCidr) => {
    setTempCidr(newCidr);
    
    // Update indicator position
    const totalBits = 32 - parentNetwork.cidr;
    const bitsToUse = newCidr - parentNetwork.cidr;
    const percent = (bitsToUse / totalBits) * 100;
    setIndicatorPosition(percent);
  };

  // Handle resize end
  const handleResizeEnd = () => {
    setIsDragging(false);
    if (activeSegment && tempCidr && tempCidr !== activeSegment.cidr) {
      onResizeSubnet(activeSegment.base, tempCidr);
    }
    setActiveSegment(null);
    setTempCidr(null);
  };

  // Cancel resize on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeSegment) {
        setActiveSegment(null);
        setTempCidr(null);
        setIsDragging(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSegment]);

  return (
    <Paper p="md" radius="md" withBorder mt="lg" mb="xl">
      <Text fw={500} mb="md">Subnet Visualization (grab and drag the white handles to resize)</Text>
      <Text size="sm" mb="xs" c="dimmed">{percentFree}% of the parent network is free</Text>
      
      <Box
        ref={containerRef}
        data-visualization-container
        style={{
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          borderRadius: '4px',
          overflow: 'visible', // Allow the handles to overflow
          border: `1px solid ${borderColor}`,
          boxShadow: isDragging ? theme.shadows.md : theme.shadows.xs,
          background: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.white,
          transition: isDragging ? 'none' : 'box-shadow 0.3s',
          position: 'relative',
          marginBottom: '20px', // Space for the info text below
          cursor: isDragging ? 'ew-resize' : 'default',
        }}
      >
        {segments.map((segment, idx) => (
          <SubnetSegment
            key={segment.type === 'subnet' ? (segment.id || `subnet-viz-${segment.base}`) : `unused-${idx}`}
            segment={segment}
            index={idx}
            parentSize={parentSize}
            colors={colors}
            unusedColor={unusedColor}
            borderColor={borderColor}
            activeSegment={activeSegment}
            onResizeStart={handleResizeStart}
            onResize={handleResize}
            onResizeEnd={handleResizeEnd}
            parentCidr={parentNetwork.cidr}
            maxCidr={maxCidr}
          />
        ))}
        
        {activeSegment && tempCidr && (
          <CidrIndicator 
            cidr={tempCidr} 
            position={indicatorPosition}
            ipCount={new Netmask('0.0.0.0/' + tempCidr).size}
          />
        )}
      </Box>
      
      <Box mt="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text size="xs" c="dimmed">{parentBlock.base}</Text>
        <Text size="xs" c="dimmed">{parentBlock.broadcast}</Text>
      </Box>
      
      {activeSegment && (
        <Text size="xs" c="dimmed" style={{ textAlign: 'center', marginTop: '8px' }}>
          Resizing: {activeSegment.name} - Current size: /{tempCidr || activeSegment.cidr} ({new Netmask('0.0.0.0/' + (tempCidr || activeSegment.cidr)).size} IPs) - Press ESC to cancel
        </Text>
      )}
    </Paper>
  );
} 