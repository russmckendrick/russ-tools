import { useState } from 'react';
import { Button, Grid, Paper, Text, Title } from '@mantine/core';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Netmask } from 'netmask';
import { IconGripVertical } from '@tabler/icons-react';
import { ipToLong } from '../../../utils';

// Sortable subnet item
function SortableSubnet({ subnet, index, onRemoveSubnet }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: subnet.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : 1
  };

  // Ensure we have a fresh Netmask calculation with proper base address
  const block = new Netmask(subnet.base + '/' + subnet.cidr);

  return (
    <Grid.Col span={4} ref={setNodeRef} style={style} {...attributes}>
      <Paper p="sm" radius="sm" withBorder mb="sm" shadow={isDragging ? "md" : "xs"}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <div {...listeners} style={{ cursor: 'grab', marginRight: 8, padding: 4 }}>
            <IconGripVertical size={16} stroke={1.5} />
          </div>
          <Text fw={500}>{subnet.name} (/{subnet.cidr})</Text>
        </div>
        <Text size="sm">Network Address: {block.base}</Text>
        <Text size="sm">Broadcast Address: {block.broadcast}</Text>
        <Text size="sm">First Usable Host: {block.first}</Text>
        <Text size="sm">Last Usable Host: {block.last}</Text>
        <Text size="sm">Number of Hosts: {block.size}</Text>
        <Text size="sm">Subnet Mask: {block.mask} (/{block.bitmask})</Text>
        <Button color="red" size="xs" mt="xs" onClick={() => onRemoveSubnet(index)}>
          Remove
        </Button>
      </Paper>
    </Grid.Col>
  );
}

export function DraggableSubnets({ subnets, onReorder, onRemoveSubnet, parentNetwork }) {
  // Process subnets with proper Netmask calculations
  const processedSubnets = subnets.map((subnet, index) => {
    // Ensure subnet has a base address
    if (!subnet.base && parentNetwork) {
      // If no base is provided, calculate it (should not happen but just in case)
      const parentBlock = new Netmask(parentNetwork.ip + '/' + parentNetwork.cidr);
      subnet.base = parentBlock.base;
    }
    
    // Create a proper Netmask instance
    const block = new Netmask(subnet.base + '/' + subnet.cidr);
    
    // Generate a unique, stable ID based on the subnet's properties
    // Avoid using Date.now() which can cause React key issues
    const uniqueId = subnet.id || `subnet-${subnet.name}-${subnet.cidr}-${block.base}-${index}`;
    
    return {
      ...subnet,
      base: block.base, // Make sure we use the canonical form
      id: uniqueId
    };
  });
  
  // Sort by network address
  const sortedSubnets = [...processedSubnets].sort((a, b) => {
    const aLong = ipToLong(a.base);
    const bLong = ipToLong(b.base);
    return aLong - bLong;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Reduce the activation distance for more responsive dragging
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    
    if (active.id !== over?.id && over) {
      // Find the original subnet objects
      const activeIndex = sortedSubnets.findIndex(item => item.id === active.id);
      const overIndex = sortedSubnets.findIndex(item => item.id === over.id);
      
      if (activeIndex !== -1 && overIndex !== -1) {
        const newOrder = [...sortedSubnets];
        const [movedItem] = newOrder.splice(activeIndex, 1);
        newOrder.splice(overIndex, 0, movedItem);
        
        // Call the parent component's reorder function
        onReorder(newOrder);
      }
    }
  }

  if (!sortedSubnets || sortedSubnets.length === 0) {
    return (
      <Paper p="md" radius="md" withBorder mt="lg">
        <Title order={4} mb="sm">Subnet List</Title>
        <Text color="dimmed" size="sm">No subnets have been added yet.</Text>
      </Paper>
    );
  }

  return (
    <Paper p="md" radius="md" withBorder mt="lg">
      <Title order={3} mb="md">Subnet List</Title>
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedSubnets.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <Grid gutter="md">
            {sortedSubnets.map((subnet, idx) => (
              <SortableSubnet 
                key={subnet.id}
                subnet={subnet}
                index={idx}
                onRemoveSubnet={onRemoveSubnet}
              />
            ))}
          </Grid>
        </SortableContext>
      </DndContext>
    </Paper>
  );
} 