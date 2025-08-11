import React, { useState } from 'react';
import { Label } from '../../ui/label';
import { Button } from '../../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../../ui/tooltip';
import { 
  Server, 
  Database, 
  Network, 
  Shield, 
  Globe, 
  Plug, 
  TrendingUp, 
  Smartphone, 
  Bot, 
  ShieldCheck,
  BarChart3,
  Cloud
} from 'lucide-react';
import { useAzureNamingContextShadcn } from './context/AzureNamingContextShadcn';
import HelpTooltipShadcn from './HelpTooltipShadcn';
import MultiSelect from './MultiSelect';
import workloadGroupsData from '../../../data/azure/azure-workload-groups.json';
import { toast } from 'sonner';

const ResourceTypeSelectorShadcn = ({ formState, updateFormState, validationState, showAsterisk }) => {
  // Get resourceTypes from context (array of { value: name, label: slug })
  const { resourceTypes } = useAzureNamingContextShadcn();
  const [selectedWorkloadGroup, setSelectedWorkloadGroup] = useState(null);

  // Icon mapping for workload groups
  const getWorkloadIcon = (iconName, size = 16) => {
    const iconMap = {
      'server': Server,
      'database': Database,
      'network': Network,
      'shield': Shield,
      'world-www': Globe,
      'plug': Plug,
      'chart-line': TrendingUp,
      'device-mobile': Smartphone,
      'robot': Bot,
      'shield-check': ShieldCheck,
      'chart-bar': BarChart3
    };
    const IconComponent = iconMap[iconName] || Cloud;
    return <IconComponent size={size} />;
  };

  const handleResourceTypeChange = (value) => {
    updateFormState('resourceType', value);
  };

  const handleWorkloadGroupSelect = (groupId) => {
    // Find the workload group
    const workloadGroup = workloadGroupsData.workloadGroups.find(group => group.id === groupId);
    if (!workloadGroup) return;

    // Get the resource types for this workload group
    const workloadResourceTypeNames = workloadGroup.resourceTypes;
    
    // Convert workload resource type names to the proper format used by the context
    // Context uses format: "type|name" where we need to find matching names
    const validResourceTypes = [];
    
    workloadResourceTypeNames.forEach(workloadTypeName => {
      // Find matching resource type in context data
      const matchingResourceType = resourceTypes.find(rt => {
        // Extract the name part from "type|name" format
        const contextName = rt.value.split('|')[1];
        return contextName === workloadTypeName;
      });
      
      if (matchingResourceType) {
        validResourceTypes.push(matchingResourceType.value);
      }
    });
    
    // Add these resource types to the current selection (don't replace)
    const currentSelection = formState.resourceType || [];
    const newSelection = [...new Set([...currentSelection, ...validResourceTypes])];
    
    updateFormState('resourceType', newSelection);
    
    // Show notification about what was added
    const addedCount = newSelection.length - currentSelection.length;
    if (addedCount > 0) {
      toast.success(`${workloadGroup.name} Resources Added`, {
        description: `Added ${addedCount} resource types to your selection`,
        icon: getWorkloadIcon(workloadGroup.icon, 16)
      });
    } else {
      toast.warning('Already Selected', {
        description: `All ${workloadGroup.name} resources are already in your selection`
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Individual Resource Type Selection */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <span className="text-sm font-medium">
            Resource Types
            {showAsterisk && <span className="text-destructive ml-1">*</span>}
          </span>
          <HelpTooltipShadcn
            content="Select one or more Azure resource types you want to name. Use quick select below or search manually here."
          />
        </Label>
        
        <MultiSelect
          data={resourceTypes}
          value={formState.resourceType}
          onChange={handleResourceTypeChange}
          placeholder="Search and select resource types..."
          searchable
          error={validationState.errors.resourceType}
          className="min-h-20"
        />
      </div>

      {/* Workload Group Quick Select */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Quick select:</span>
          <HelpTooltipShadcn
            content="Click a workload type to quickly add common resource types for that scenario."
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <TooltipProvider>
            {workloadGroupsData.workloadGroups.map((group) => (
              <Tooltip key={group.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleWorkloadGroupSelect(group.id)}
                    className="h-auto gap-2 px-3 py-2 text-xs transition-colors hover:bg-accent"
                  >
                    <span>{group.name}</span>
                    {getWorkloadIcon(group.icon, 12)}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-60">
                  <p className="text-sm">{group.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

export default ResourceTypeSelectorShadcn;