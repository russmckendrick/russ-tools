import React, { useState } from 'react';
import { MultiSelect, Text, Group, Stack, Chip, SimpleGrid, Badge, Divider, Button, Tooltip } from '@mantine/core';
import { IconServer, IconDatabase, IconNetwork, IconShield, IconWorldWww, IconPlug, IconChartLine, IconDeviceMobile, IconRobot, IconShieldCheck, IconBrandAzure, IconChartBar } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { devLog } from '../../../utils/devLog';
import { useAzureNamingContext } from './context/AzureNamingContext';
import HelpTooltip from './HelpTooltip';
import workloadGroupsData from '../../../data/azure/azure-workload-groups.json';

const ResourceTypeSelector = ({ formState, updateFormState, validationState, showAsterisk }) => {
  // Get resourceTypes from context (array of { value: name, label: slug })
  const { resourceTypes } = useAzureNamingContext();
  const [selectedWorkloadGroup, setSelectedWorkloadGroup] = useState(null);

  // Icon mapping for workload groups
  const getWorkloadIcon = (iconName, size = 16) => {
    const iconMap = {
      'server': IconServer,
      'database': IconDatabase,
      'network': IconNetwork,
      'shield': IconShield,
      'world-www': IconWorldWww,
      'plug': IconPlug,
      'chart-line': IconChartLine,
      'device-mobile': IconDeviceMobile,
      'robot': IconRobot,
      'shield-check': IconShieldCheck,
      'chart-bar': IconChartBar
    };
    const IconComponent = iconMap[iconName] || IconBrandAzure;
    return <IconComponent size={size} />;
  };

  const handleResourceTypeChange = (value) => {
    //devLog('[ResourceTypeSelector] onChange value:', value);
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
      notifications.show({
        title: `${workloadGroup.name} Resources Added`,
        message: `Added ${addedCount} resource types to your selection`,
        color: workloadGroup.color,
        icon: getWorkloadIcon(workloadGroup.icon, 16)
      });
    } else {
      notifications.show({
        title: 'Already Selected',
        message: `All ${workloadGroup.name} resources are already in your selection`,
        color: 'yellow'
      });
    }
  };

  return (
    <Stack gap="sm">
      {/* Individual Resource Type Selection */}
      <MultiSelect
        label={
          <Group gap={4} align="center">
            <Text size="sm" fw={500}>
              Resource Types
              {showAsterisk && (
                <Text span c="red" ml={4}>*</Text>
              )}
            </Text>
            <HelpTooltip
              content="Select one or more Azure resource types you want to name. Use quick select below or search manually here."
            />
          </Group>
        }
        placeholder="Search and select resource types..."
        data={resourceTypes}
        value={formState.resourceType}
        onChange={handleResourceTypeChange}
        error={validationState.errors.resourceType}
        searchable
        clearable
        maxDropdownHeight={400}
        size="sm"
        withAsterisk
        styles={{
          input: {
            minHeight: '80px',
          }
        }}
      />

      {/* Workload Group Quick Select */}
      <Group gap="xs" align="center" mb="xs">
        <Text size="xs" fw={500} c="dimmed">Quick select:</Text>
        <HelpTooltip
          content="Click a workload type to quickly add common resource types for that scenario."
        />
      </Group>
      
      <Group gap="xs" style={{ flexWrap: 'wrap' }}>
        {workloadGroupsData.workloadGroups.map((group) => (
          <Tooltip
            key={group.id}
            label={group.description}
            position="bottom"
            withArrow
            multiline
            w={250}
          >
            <Button
              variant="light"
              color={group.color}
              size="xs"
              onClick={() => handleWorkloadGroupSelect(group.id)}
              styles={{
                root: {
                  height: 'auto',
                  padding: '6px 10px',
                  fontSize: '11px',
                  fontWeight: 500,
                  transition: 'all 0.2s ease'
                },
                inner: {
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  gap: '8px'
                },
                section: {
                  margin: 0
                }
              }}
              leftSection={group.name}
              rightSection={getWorkloadIcon(group.icon, 12)}
            >
            </Button>
          </Tooltip>
        ))}
      </Group>
    </Stack>
  );
};

export default ResourceTypeSelector; 