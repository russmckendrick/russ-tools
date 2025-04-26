import { useState } from 'react';
import { Button, Grid, Paper, Text } from '@mantine/core';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Netmask } from 'netmask';
import { IconGripVertical } from '@tabler/icons-react';

// Sortable subnet item
function SortableSubnet({ subnet, index, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: subnet.id || index.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const block = new Netmask(subnet.base + '/' + subnet.cidr);

  return (
    <Grid.Col span={4} ref={setNodeRef} style={style} {...attributes}>
      <Paper p="sm" radius="sm" withBorder mb="sm">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <div {...listeners} style={{ cursor: 'grab', marginRight: 8 }}>
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
        <Button color="red" size="xs" mt="xs" onClick={() => onRemove(index)}>
          Remove
        </Button>
      </Paper>
    </Grid.Col>
  );
}

export function DraggableSubnets({ subnets, onReorder, onRemoveSubnet }) {
  // Ensure all subnets have IDs for stable drag and drop
  const subnetsWithIds = subnets.map((subnet, index) => ({
    ...subnet,
    id: subnet.id || `subnet-${index}-${subnet.base}`
  }));

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = subnetsWithIds.findIndex(item => item.id === active.id);
      const newIndex = subnetsWithIds.findIndex(item => item.id === over.id);
      
      const newOrder = [...subnetsWithIds];
      const [movedItem] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, movedItem);
      
      // Call the parent component's reorder function
      onReorder(newOrder);
    }
  }

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={subnetsWithIds.map(s => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <Grid gutter="md">
          {subnetsWithIds.map((subnet, idx) => (
            <SortableSubnet 
              key={subnet.id}
              subnet={subnet}
              index={idx}
              onRemove={onRemoveSubnet}
            />
          ))}
        </Grid>
      </SortableContext>
    </DndContext>
  );
} 