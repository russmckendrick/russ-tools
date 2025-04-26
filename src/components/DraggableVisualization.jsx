import { Box, Paper, Text, Tooltip, useMantineTheme } from '@mantine/core';
import { IconGripVertical, IconNetwork, IconBroadcast } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Netmask } from 'netmask';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Helper functions for IP math
function ipToLong(ip) {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}
function longToIp(long) {
  return [24, 16, 8, 0].map(shift => (long >>> shift) & 255).join('.');
}

// Sortable subnet segment component
function SortableSegment({ segment, index, parentSize, colors, unusedColor, borderColor }) {
  const theme = useMantineTheme();
  
  // Only make actual subnets draggable, not unused space
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
  
  // Generate a stable ID for the subnet segment
  const segmentId = segment.id || `subnet-viz-${segment.base}`;
  
  // For subnet segments, make them draggable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: segmentId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: `${widthPct(segment.start, segment.end, parentSize)}%`,
    height: '100%',
    background: colors[index % colors.length],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
    cursor: 'grab',
    borderRight: index < colors.length - 1 ? `1px solid ${borderColor}` : undefined,
  };

  return (
    <Tooltip
      label={`${segment.name} (/${segment.cidr}): ${segment.block.base} - ${segment.block.broadcast} (${segment.block.size} hosts)`}
      withArrow
    >
      <Box
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
      >
        <Text
          size="xs"
          style={{
            color: theme.white,
            textShadow: '0 0 2px rgba(0,0,0,0.5)',
            fontWeight: 600,
            userSelect: 'none',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <IconGripVertical size={12} stroke={1.5} />
          {segment.name}
        </Text>
      </Box>
    </Tooltip>
  );
}

// Helper for calculating width percentage
function widthPct(start, end, totalSize) {
  return ((end - start + 1) / totalSize) * 100;
}

export function DraggableVisualization({ parentNetwork, subnets, onReorderSubnets }) {
  const theme = useMantineTheme();
  const [animate, setAnimate] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Make dragging more responsive by reducing activation constraints
      activationConstraint: {
        distance: 2, // Reduce the activation distance for more responsive dragging
        tolerance: 5, // Add tolerance for slight movements
        delay: 0 // No delay in activation
      }
    })
  );

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

  // Process subnets and add IDs for drag and drop
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

  // Only the subnet segments (not unused space) are draggable
  const draggableSegments = segments.filter(s => s.type === 'subnet');
  
  // Create stable IDs for sortable context
  const itemIds = draggableSegments.map(s => s.id || `subnet-viz-${s.base}`);

  // Colors
  const colors = [theme.colors.blue[5], theme.colors.green[5], theme.colors.cyan[5], theme.colors.violet[5], theme.colors.orange[5], theme.colors.teal[5], theme.colors.grape[5], theme.colors.lime[5]];
  const unusedColor = theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3];
  const borderColor = theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3];

  // Calculate percent free
  const usedAddresses = subnetBlocks.reduce((acc, s) => acc + (s.end - s.start + 1), 0);
  const freeAddresses = parentSize - usedAddresses;
  const percentFree = ((freeAddresses / parentSize) * 100).toFixed(1);

  // Handle drag end event
  function handleDragEnd(event) {
    const { active, over } = event;
    
    if (active.id !== over?.id && over) {
      // Extract subnet data directly from the segments
      const activeSegment = segments.find(s => 
        s.type === 'subnet' && 
        (s.id === active.id || `subnet-viz-${s.base}` === active.id)
      );
      
      const overSegment = segments.find(s => 
        s.type === 'subnet' && 
        (s.id === over.id || `subnet-viz-${s.base}` === over.id)
      );
      
      if (activeSegment && overSegment) {
        // Find the corresponding subnet objects in the original subnets array
        const subnetsArray = [...subnets];
        
        // Get indices in the original array by matching base addresses
        const activeIndex = subnetsArray.findIndex(s => s.base === activeSegment.base);
        const overIndex = subnetsArray.findIndex(s => s.base === overSegment.base);
        
        if (activeIndex !== -1 && overIndex !== -1) {
          // Create a new array with the item moved to the new position
          const [movedItem] = subnetsArray.splice(activeIndex, 1);
          subnetsArray.splice(overIndex, 0, movedItem);
          
          console.log(`Moving subnet from index ${activeIndex} to ${overIndex}`);
          
          // Call the parent handler with the new order
          onReorderSubnets(subnetsArray);
        }
      }
    }
  }

  return (
    <Paper p="md" radius="md" withBorder mt="lg">
      <Text fw={500} mb="md">Subnet Visualization (drag to reorder)</Text>
      <Text size="sm" mb="xs" c="dimmed">{percentFree}% of the parent network is free</Text>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
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
          <SortableContext
            items={itemIds}
            strategy={horizontalListSortingStrategy}
          >
            {segments.map((segment, idx) => (
              <SortableSegment
                key={segment.type === 'subnet' ? (segment.id || `subnet-viz-${segment.base}`) : `unused-${idx}`}
                segment={segment}
                index={idx}
                parentSize={parentSize}
                colors={colors}
                unusedColor={unusedColor}
                borderColor={borderColor}
              />
            ))}
          </SortableContext>
        </Box>
      </DndContext>
      
      <Box mt="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text size="xs" c="dimmed">{parentBlock.base}</Text>
        <Text size="xs" c="dimmed">{parentBlock.broadcast}</Text>
      </Box>
    </Paper>
  );
} 