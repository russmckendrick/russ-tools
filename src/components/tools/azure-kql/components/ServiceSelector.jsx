import React from 'react';
import { Select, Stack, Text, ThemeIcon, Group } from '@mantine/core';
import { IconShield, IconBrandAzure, IconWorldWww } from '@tabler/icons-react';
import { getAvailableServices } from '../utils/templateProcessor';

const ServiceSelector = ({ value, onChange }) => {
  const services = getAvailableServices();
  
  const serviceOptions = services.map(service => ({
    value: service.id,
    label: service.name,
    description: service.description,
    category: service.category
  }));

  const getServiceIcon = (serviceId) => {
    switch (serviceId) {
      case 'azure-firewall':
        return <IconShield size={16} />;
      case 'azure-application-gateway':
        return <IconWorldWww size={16} />;
      default:
        return <IconBrandAzure size={16} />;
    }
  };

  const renderSelectOption = ({ option }) => (
    <Group gap="sm" wrap="nowrap">
      <ThemeIcon size="sm" radius="sm" color="cyan" variant="light">
        {getServiceIcon(option.value)}
      </ThemeIcon>
      <div style={{ flex: 1 }}>
        <Text size="sm" fw={500}>
          {option.label}
        </Text>
        <Text size="xs" c="dimmed">
          {option.description}
        </Text>
      </div>
    </Group>
  );

  return (
    <Stack gap="xs">
      <Text size="sm" fw={500}>
        Azure Service
      </Text>
      <Select
        value={value}
        onChange={onChange}
        data={serviceOptions}
        renderOption={renderSelectOption}
        placeholder="Select an Azure service"
        searchable
        clearable={false}
        comboboxProps={{ withinPortal: false }}
      />
      {value && (
        <Text size="xs" c="dimmed">
          {serviceOptions.find(s => s.value === value)?.description}
        </Text>
      )}
    </Stack>
  );
};

export default ServiceSelector;