import { useState } from 'react';
import { Button, Grid, Paper, Text, Title, Stack, Group, Badge, ActionIcon, useMantineTheme } from '@mantine/core';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Netmask } from 'netmask';
import { IconGripVertical, IconTrash, IconNetwork } from '@tabler/icons-react';
import { ipToLong } from '../../../utils';
import { getSubnetBgColorHex } from '../../../utils';

// Sortable subnet item
function SortableSubnet({ subnet, index, onRemoveSubnet }) {
  const theme = useMantineTheme();
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
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 10 : 1,
    cursor: isDragging ? 'grabbing' : 'grab'
  };

  // Ensure we have a fresh Netmask calculation with proper base address
  const block = new Netmask(subnet.base + '/' + subnet.cidr);
  
  // Get subnet color
  const subnetColor = subnet.color ? 
    theme.colors[subnet.color.name][subnet.color.index] : 
    theme.colors.blue[5];

  return (
    <Grid.Col span={{ base: 12, sm: 6, lg: 4 }} ref={setNodeRef} style={style} {...attributes}>
      <Paper 
        p="md" 
        radius="md" 
        withBorder 
        shadow={isDragging ? "lg" : "sm"}
        style={{
          borderLeft: `4px solid ${subnetColor}`,
          transition: 'all 0.2s ease',
          transform: isDragging ? 'scale(1.02)' : 'scale(1)'
        }}
      >
        <Stack gap="sm">
          {/* Header with drag handle and subnet name */}
          <Group justify="space-between" align="flex-start">
            <Group gap="xs" align="center">
              <div 
                {...listeners} 
                style={{ 
                  cursor: 'grab', 
                  padding: '4px',
                  borderRadius: '4px',
                  transition: 'background-color 0.1s ease'
                }}
                onMouseDown={(e) => e.target.style.backgroundColor = theme.colors.gray[1]}
                onMouseUp={(e) => e.target.style.backgroundColor = 'transparent'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <IconGripVertical size={16} color={theme.colors.gray[6]} />
              </div>
              <div>
                <Group gap="xs" align="center">
                  <IconNetwork size={16} color={subnetColor} />
                  <Text fw={600} size="sm">{subnet.name}</Text>
                  <Badge variant="light" color={subnet.color?.name || 'blue'} size="xs">
                    /{subnet.cidr}
                  </Badge>
                </Group>
              </div>
            </Group>
            <ActionIcon 
              variant="subtle" 
              color="red" 
              size="sm"
              onClick={() => onRemoveSubnet(index)}
              style={{ marginTop: 2 }}
            >
              <IconTrash size={14} />
            </ActionIcon>
          </Group>

          {/* Network details */}
          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="xs" c="dimmed">Network</Text>
              <Text size="xs" fw={500}>{block.base}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs" c="dimmed">Broadcast</Text>
              <Text size="xs" fw={500}>{block.broadcast}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs" c="dimmed">Usable Range</Text>
              <Text size="xs" fw={500}>{block.first} - {block.last}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs" c="dimmed">Host Count</Text>
              <Text size="xs" fw={500}>{block.size.toLocaleString()}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs" c="dimmed">Subnet Mask</Text>
              <Text size="xs" fw={500}>{block.mask}</Text>
            </Group>
          </Stack>
        </Stack>
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
      <Stack align="center" gap="md" p="xl">
        <IconNetwork size={48} style={{ color: 'var(--mantine-color-gray-5)' }} />
        <Title order={4} ta="center" c="dimmed">No Subnets Added</Title>
        <Text ta="center" c="dimmed" size="sm">
          Add your first subnet using the form above to get started
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Text size="sm" c="dimmed">
          Drag and drop to reorder subnets. Order affects IP allocation.
        </Text>
      </Group>
      
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
    </Stack>
  );
} 