import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Netmask } from 'netmask';
import { GripVertical, Trash2, Network } from 'lucide-react';
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
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 10 : 1,
    cursor: isDragging ? 'grabbing' : 'grab'
  };

  // Ensure we have a fresh Netmask calculation with proper base address
  const block = new Netmask(subnet.base + '/' + subnet.cidr);
  
  // Get subnet color - simplified color mapping
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

  const subnetColor = subnet.color ? getColorFromName(subnet.color.name) : '#6b7280';

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="col-span-1">
      <Card 
        className={`transition-all duration-200 ${
          isDragging 
            ? 'shadow-lg scale-[1.02] ring-2 ring-blue-200' 
            : 'shadow-sm hover:shadow-md'
        }`}
        style={{
          borderLeft: `4px solid ${subnetColor}`
        }}
      >
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header with drag handle and subnet name */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 flex-1">
                <div 
                  {...listeners} 
                  className="p-1 rounded hover:bg-gray-100 cursor-grab active:cursor-grabbing transition-colors"
                >
                  <GripVertical className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Network className="h-4 w-4" style={{ color: subnetColor }} />
                    <span className="font-semibold text-sm">{subnet.name}</span>
                    <Badge variant="outline" style={{ color: subnetColor, borderColor: subnetColor }}>
                      /{subnet.cidr}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => onRemoveSubnet(index)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            {/* Network details */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network</span>
                <span className="font-mono font-medium">{block.base}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Broadcast</span>
                <span className="font-mono font-medium">{block.broadcast}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Usable Range</span>
                <span className="font-mono font-medium">{block.first} - {block.last}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Host Count</span>
                <span className="font-medium">{block.size.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subnet Mask</span>
                <span className="font-mono font-medium">{block.mask}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function DraggableSubnetsShadcn({ subnets, onReorder, onRemoveSubnet, parentNetwork }) {
  // Process subnets with proper Netmask calculations
  const processedSubnets = subnets.map((subnet, index) => {
    // Ensure subnet has a base address
    if (!subnet.base && parentNetwork) {
      const parentBlock = new Netmask(parentNetwork.ip + '/' + parentNetwork.cidr);
      subnet.base = parentBlock.base;
    }
    
    // Create a proper Netmask instance
    const block = new Netmask(subnet.base + '/' + subnet.cidr);
    
    // Generate a unique, stable ID based on the subnet's properties
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
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Network className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-center mb-2">No Subnets Added</h3>
          <p className="text-sm text-muted-foreground text-center">
            Add your first subnet using the form above to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Drag and drop to reorder subnets. Order affects IP allocation.
        </p>
      </div>
      
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedSubnets.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedSubnets.map((subnet, idx) => (
              <SortableSubnet 
                key={subnet.id}
                subnet={subnet}
                index={idx}
                onRemoveSubnet={onRemoveSubnet}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}