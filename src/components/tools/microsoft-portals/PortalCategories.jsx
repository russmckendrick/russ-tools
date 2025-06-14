import React, { useState } from 'react';
import {
  Tabs,
  TextInput,
  Select,
  Group,
  Stack,
  Badge,
  Alert,
  ActionIcon,
  Tooltip,
  Button
} from '@mantine/core';
import {
  IconSearch,
  IconFilter,
  IconClearAll,
  IconCategory,
  IconBrandAzure,
  IconBuildingSkyscraper,
  IconApps,
  IconCode,
  IconInfoCircle
} from '@tabler/icons-react';
import PortalGrid from './PortalGrid';
import { getAllCategories } from './PortalLinkGenerator';

const PortalCategories = ({ links, tenantInfo }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('all');

  // Get all available categories from the links
  const getAvailableCategories = () => {
    if (!links) return [];
    
    const categories = new Set(['All']);
    
    Object.keys(links).forEach(sectionKey => {
      Object.keys(links[sectionKey]).forEach(linkKey => {
        categories.add(links[sectionKey][linkKey].category);
      });
    });
    
    return Array.from(categories).sort();
  };

  // Filter links by section for individual tabs
  const filterLinksBySection = (sectionKey) => {
    if (!links || !links[sectionKey]) return {};
    return { [sectionKey]: links[sectionKey] };
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
  };

  // Count links in each section
  const countLinksInSection = (sectionKey) => {
    if (!links || !links[sectionKey]) return 0;
    return Object.keys(links[sectionKey]).length;
  };

  // Count total links
  const totalLinks = links ? Object.keys(links).reduce((total, sectionKey) => {
    return total + countLinksInSection(sectionKey);
  }, 0) : 0;

  const availableCategories = getAvailableCategories();

  if (!links || totalLinks === 0) {
    return (
      <Alert icon={<IconInfoCircle size={16} />} title="No Portal Links Available" color="blue" variant="light">
        Perform a tenant lookup to generate Microsoft portal links for your domain.
      </Alert>
    );
  }

  return (
    <Stack gap="lg">
      {/* Search and Filter Controls */}
      <Group gap="md" align="flex-end">
        <TextInput
          placeholder="Search portal links..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.currentTarget.value)}
          leftSection={<IconSearch size={16} />}
          style={{ flex: 1 }}
          rightSection={
            searchTerm && (
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => setSearchTerm('')}
              >
                <IconClearAll size={16} />
              </ActionIcon>
            )
          }
        />
        
        <Select
          placeholder="Filter by category"
          value={selectedCategory}
          onChange={setSelectedCategory}
          data={availableCategories}
          leftSection={<IconFilter size={16} />}
          clearable={false}
          style={{ minWidth: 200 }}
        />
        
        {(searchTerm || selectedCategory !== 'All') && (
          <Tooltip label="Clear all filters">
            <ActionIcon
              variant="light"
              color="gray"
              onClick={clearFilters}
            >
              <IconClearAll size={16} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>

      {/* Filter Summary */}
      {(searchTerm || selectedCategory !== 'All') && (
        <Group gap="xs">
          <Badge variant="light" color="blue" size="sm">
            Filters Active
          </Badge>
          {searchTerm && (
            <Badge variant="outline" color="blue" size="sm">
              Search: "{searchTerm}"
            </Badge>
          )}
          {selectedCategory !== 'All' && (
            <Badge variant="outline" color="indigo" size="sm">
              Category: {selectedCategory}
            </Badge>
          )}
        </Group>
      )}

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onChange={setActiveTab} variant="pills">
        <Tabs.List grow>
          <Tabs.Tab 
            value="all" 
            leftSection={<IconCategory size={16} />}
          >
            All Portals
            <Badge variant="light" color="gray" size="xs" ml="xs">
              {totalLinks}
            </Badge>
          </Tabs.Tab>
          
          {links.azure && (
            <Tabs.Tab 
              value="azure" 
              leftSection={<IconBrandAzure size={16} />}
            >
              Azure
              <Badge variant="light" color="blue" size="xs" ml="xs">
                {countLinksInSection('azure')}
              </Badge>
            </Tabs.Tab>
          )}
          
          {links.m365 && (
            <Tabs.Tab 
              value="m365" 
              leftSection={<IconBuildingSkyscraper size={16} />}
            >
              Microsoft 365
              <Badge variant="light" color="indigo" size="xs" ml="xs">
                {countLinksInSection('m365')}
              </Badge>
            </Tabs.Tab>
          )}
          
          {links.powerPlatform && (
            <Tabs.Tab 
              value="powerPlatform" 
              leftSection={<IconApps size={16} />}
            >
              Power Platform
              <Badge variant="light" color="grape" size="xs" ml="xs">
                {countLinksInSection('powerPlatform')}
              </Badge>
            </Tabs.Tab>
          )}
          
          {links.advanced && (
            <Tabs.Tab 
              value="advanced" 
              leftSection={<IconCode size={16} />}
            >
              Developer
              <Badge variant="light" color="dark" size="xs" ml="xs">
                {countLinksInSection('advanced')}
              </Badge>
            </Tabs.Tab>
          )}
        </Tabs.List>

        {/* All Portals Tab */}
        <Tabs.Panel value="all" pt="lg">
          <PortalGrid 
            links={links}
            searchTerm={searchTerm}
            selectedCategory={selectedCategory}
          />
        </Tabs.Panel>

        {/* Azure Portal Tab */}
        {links.azure && (
          <Tabs.Panel value="azure" pt="lg">
            <Stack gap="md">
              <Alert icon={<IconBrandAzure size={16} />} title="Azure Portal Links" color="blue" variant="light">
                Deep links to Azure portal resources and management blades for tenant: {tenantInfo?.displayName || tenantInfo?.domain}
              </Alert>
              <PortalGrid 
                links={filterLinksBySection('azure')}
                searchTerm={searchTerm}
                selectedCategory={selectedCategory}
              />
            </Stack>
          </Tabs.Panel>
        )}

        {/* Microsoft 365 Tab */}
        {links.m365 && (
          <Tabs.Panel value="m365" pt="lg">
            <Stack gap="md">
              <Alert icon={<IconBuildingSkyscraper size={16} />} title="Microsoft 365 Admin Links" color="indigo" variant="light">
                Administrative portals for Microsoft 365 services and user management
              </Alert>
              <PortalGrid 
                links={filterLinksBySection('m365')}
                searchTerm={searchTerm}
                selectedCategory={selectedCategory}
              />
            </Stack>
          </Tabs.Panel>
        )}

        {/* Power Platform Tab */}
        {links.powerPlatform && (
          <Tabs.Panel value="powerPlatform" pt="lg">
            <Stack gap="md">
              <Alert icon={<IconApps size={16} />} title="Power Platform & Dynamics 365" color="grape" variant="light">
                Power Platform maker portals and Dynamics 365 business applications
              </Alert>
              <PortalGrid 
                links={filterLinksBySection('powerPlatform')}
                searchTerm={searchTerm}
                selectedCategory={selectedCategory}
              />
            </Stack>
          </Tabs.Panel>
        )}

        {/* Developer/Advanced Tab */}
        {links.advanced && (
          <Tabs.Panel value="advanced" pt="lg">
            <Stack gap="md">
              <Alert icon={<IconCode size={16} />} title="Developer & Advanced Tools" color="dark" variant="light">
                Development tools, APIs, and advanced Microsoft cloud services
              </Alert>
              <PortalGrid 
                links={filterLinksBySection('advanced')}
                searchTerm={searchTerm}
                selectedCategory={selectedCategory}
              />
            </Stack>
          </Tabs.Panel>
        )}
      </Tabs>
    </Stack>
  );
};

export default PortalCategories; 