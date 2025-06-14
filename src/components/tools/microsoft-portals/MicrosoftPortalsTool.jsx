import React, { useState, useEffect, useMemo } from 'react';
import {
  Paper,
  Stack,
  Title,
  ThemeIcon,
  Group,
  Text,
  TextInput,
  Button,
  Alert,
  Badge,
  LoadingOverlay,
  ActionIcon,
  Tooltip,
  Table,
  Anchor,
  Container,
  Divider,
  Select,
  Chip,
  SimpleGrid
} from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { useParams } from 'react-router-dom';
import {
  IconSearch,
  IconCopy,
  IconExternalLink,
  IconAlertCircle,
  IconFilter,
  IconClearAll
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import MicrosoftPortalsIcon from './MicrosoftPortalsIcon';
import { getTenantId, isValidDomain, extractDomain } from './TenantLookup';
import { generateAllPortalLinks } from './PortalLinkGenerator';

const MicrosoftPortalsTool = () => {
  const [searchInput, setSearchInput] = useState('');
  const [tenantInfo, setTenantInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [portalLinks, setPortalLinks] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Get domain from URL parameters
  const { domain: urlDomain } = useParams();

  // Local storage for lookup history
  const [lookupHistory, setLookupHistory] = useLocalStorage({
    key: 'microsoft-portals-history',
    defaultValue: []
  });

  // Cache for tenant lookups
  const [tenantCache, setTenantCache] = useLocalStorage({
    key: 'microsoft-portals-cache',
    defaultValue: {}
  });

  // Cache duration (10 minutes)
  const CACHE_DURATION = 10 * 60 * 1000;

  // Helper function to check if cached data is still valid
  const isCacheValid = (cachedData) => {
    if (!cachedData || !cachedData.timestamp) return false;
    return (Date.now() - cachedData.timestamp) < CACHE_DURATION;
  };

  // Add lookup to history
  const addToHistory = (domain, tenantData) => {
    const historyItem = {
      domain,
      tenantId: tenantData.tenantId,
      timestamp: Date.now()
    };

    const filteredHistory = lookupHistory.filter(item => item.domain !== domain);
    const newHistory = [historyItem, ...filteredHistory].slice(0, 10);
    setLookupHistory(newHistory);
  };

  // Cache tenant data
  const cacheTenantData = (domain, data) => {
    setTenantCache(prev => ({
      ...prev,
      [domain]: {
        ...data,
        timestamp: Date.now()
      }
    }));
  };

  // Effect to handle URL domain parameter
  useEffect(() => {
    if (urlDomain && urlDomain.trim()) {
      const decodedDomain = decodeURIComponent(urlDomain);
      setSearchInput(decodedDomain);
      handleDomainLookup(decodedDomain);
    }
  }, [urlDomain]);

  // Perform tenant lookup
  const handleDomainLookup = async (domainToLookup) => {
    const domain = extractDomain(domainToLookup || searchInput);
    
    if (!isValidDomain(domain)) {
      return; // Don't show error for invalid domains during search
    }

    setLoading(true);
    setError(null);

    try {
      // Check cache first
      const cachedData = tenantCache[domain];
      if (cachedData && isCacheValid(cachedData)) {
        setTenantInfo(cachedData);
        addToHistory(domain, cachedData);
        const links = generateAllPortalLinks(cachedData);
        setPortalLinks(links);
        setLoading(false);
        return;
      }

      const tenantData = await getTenantId(domain);
      setTenantInfo(tenantData);
      addToHistory(domain, tenantData);
      cacheTenantData(domain, tenantData);
      
      const links = generateAllPortalLinks(tenantData);
      setPortalLinks(links);
      
      notifications.show({
        title: 'Tenant Found',
        message: `Found tenant for ${domain}`,
        color: 'green'
      });

    } catch (err) {
      setError(`Could not find tenant for ${domain}`);
      setTenantInfo(null);
      setPortalLinks(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input changes
  const handleSearchChange = (value) => {
    setSearchInput(value);
  };

  // Effect to handle domain lookup when search input changes
  useEffect(() => {
    if (searchInput && (searchInput.includes('.') || searchInput.includes('@'))) {
      const domain = extractDomain(searchInput);
      if (isValidDomain(domain)) {
        const timeoutId = setTimeout(() => {
          handleDomainLookup(searchInput);
        }, 1500);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [searchInput]);

  // Flatten portal links for display (only when portalLinks exist)
  const allPortals = useMemo(() => {
    if (!portalLinks) return [];
    
    const flattened = [];
    
    Object.entries(portalLinks).forEach(([sectionKey, section]) => {
      Object.entries(section).forEach(([portalKey, portal]) => {
        flattened.push({
          key: `${sectionKey}-${portalKey}`,
          name: portal.name,
          description: portal.description,
          category: portal.category,
          url: portal.url,
          requiresTenant: portal.requiresTenant || false
        });
      });
    });
    
    return flattened;
  }, [portalLinks]);

  // Filter portals based on search and category
  const filteredPortals = useMemo(() => {
    let filtered = allPortals;

    // Filter by search term
    if (searchInput && !searchInput.includes('.') && !searchInput.includes('@')) {
      const searchTerm = searchInput.toLowerCase();
      filtered = filtered.filter(portal => 
        portal.name.toLowerCase().includes(searchTerm) ||
        portal.description.toLowerCase().includes(searchTerm) ||
        portal.category.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(portal => 
        portal.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    return filtered;
  }, [allPortals, searchInput, selectedCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(allPortals.map(portal => portal.category))].sort();
    return [{ value: 'all', label: 'All Categories' }, ...cats.map(cat => ({ value: cat.toLowerCase(), label: cat }))];
  }, [allPortals]);

  // Copy to clipboard
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      notifications.show({
        title: 'Copied',
        message: `${label} copied to clipboard`,
        color: 'blue'
      });
    });
  };

  // Clear search and filters
  const clearAll = () => {
    setSearchInput('');
    setSelectedCategory('all');
    setTenantInfo(null);
    setPortalLinks(null);
    setError(null);
  };

  return (
    <Container size="xl" py="xl">
      <LoadingOverlay visible={loading} />
      
      {/* Header */}
      <Paper p="xl" radius="lg" withBorder mb="xl">
        <Group gap="md" mb="lg">
          <ThemeIcon size={48} radius="md" variant="light" color="indigo">
            <MicrosoftPortalsIcon size={28} />
          </ThemeIcon>
          <div style={{ flex: 1 }}>
            <Title order={2} fw={600}>
              Microsoft Portal Links
            </Title>
            <Text size="sm" c="dimmed">
              Search portals or enter a domain to generate tenant-specific links
            </Text>
          </div>
        </Group>

        {/* Search and Filters */}
        <Stack gap="md">
          <Group gap="md">
            <TextInput
              placeholder="Search portals or enter domain (e.g., contoso.com)"
              value={searchInput}
              onChange={(event) => handleSearchChange(event.currentTarget.value)}
              leftSection={<IconSearch size={16} />}
              style={{ flex: 1 }}
              size="md"
            />
            <Select
              placeholder="Category"
              data={categories}
              value={selectedCategory}
              onChange={setSelectedCategory}
              leftSection={<IconFilter size={16} />}
              clearable={false}
              w={200}
            />
            <Button
              variant="light"
              leftSection={<IconClearAll size={16} />}
              onClick={clearAll}
            >
              Clear
            </Button>
          </Group>

          {/* Tenant Info Banner */}
          {tenantInfo && (
            <Alert color="green" variant="light">
              <Group gap="md">
                <div style={{ flex: 1 }}>
                  <Text size="sm" fw={500}>
                    Tenant Found: {tenantInfo.domain}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Links below are personalized for your tenant
                  </Text>
                </div>
                <Group gap="xs">
                  <Tooltip label="Copy Tenant ID">
                    <ActionIcon 
                      variant="light" 
                      size="sm"
                      onClick={() => copyToClipboard(tenantInfo.tenantId, 'Tenant ID')}
                    >
                      <IconCopy size={14} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
            </Alert>
          )}

          {/* Error Banner */}
          {error && (
            <Alert color="orange" variant="light" icon={<IconAlertCircle size={16} />}>
              {error} - Showing default portal links
            </Alert>
          )}

          {/* Recent Lookups */}
          {lookupHistory.length > 0 && !tenantInfo && (
            <Group gap="xs">
              <Text size="xs" c="dimmed">Recent:</Text>
              {lookupHistory.slice(0, 5).map((item, index) => (
                <Chip
                  key={index}
                  size="xs"
                  variant="light"
                  onClick={() => {
                    setSearchInput(item.domain);
                    handleDomainLookup(item.domain);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {item.domain}
                </Chip>
              ))}
            </Group>
          )}
        </Stack>
      </Paper>

      {/* Portal Links Table - Only show when portalLinks exist */}
      {portalLinks && (
        <Paper withBorder radius="lg" p="md">
          <Group justify="space-between" mb="md">
            <Text fw={500}>
              Portal Links ({filteredPortals.length})
            </Text>
            {selectedCategory !== 'all' && (
              <Badge variant="light" color="blue">
                {categories.find(c => c.value === selectedCategory)?.label}
              </Badge>
            )}
          </Group>

          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Portal Name</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Category</Table.Th>
                <Table.Th width={100}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredPortals.map((portal) => (
                <Table.Tr key={portal.key}>
                  <Table.Td>
                    <Group gap="xs">
                      <Anchor
                        href={portal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        fw={500}
                        size="sm"
                      >
                        {portal.name}
                      </Anchor>
                      {portal.requiresTenant && !tenantInfo && (
                        <Tooltip label="Requires tenant lookup">
                          <Badge size="xs" color="orange" variant="light">
                            Tenant
                          </Badge>
                        </Tooltip>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {portal.description}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge size="sm" variant="light" color="gray">
                      {portal.category}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Tooltip label="Copy URL">
                        <ActionIcon
                          variant="light"
                          size="sm"
                          onClick={() => copyToClipboard(portal.url, portal.name)}
                        >
                          <IconCopy size={14} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Open in new tab">
                        <ActionIcon
                          variant="light"
                          size="sm"
                          component="a"
                          href={portal.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <IconExternalLink size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          {filteredPortals.length === 0 && (
            <Text ta="center" c="dimmed" py="xl">
              No portals found matching your search criteria
            </Text>
          )}
        </Paper>
      )}

      {/* Instructions when no domain has been entered */}
      {!portalLinks && !loading && (
        <Paper withBorder radius="lg" p="xl">
          <Stack gap="md" align="center">
            <ThemeIcon size={64} radius="md" variant="light" color="blue">
              <IconSearch size={32} />
            </ThemeIcon>
            <div style={{ textAlign: 'center' }}>
              <Text fw={500} size="lg" mb="xs">
                Enter a Domain to Get Started
              </Text>
              <Text size="sm" c="dimmed" mb="md">
                Enter a domain name (e.g., contoso.com) in the search box above to discover Microsoft tenant information and generate personalized portal links.
              </Text>
              <Text size="xs" c="dimmed">
                You can also search for specific portals once links are generated.
              </Text>
            </div>
          </Stack>
        </Paper>
      )}
    </Container>
  );
};

export default MicrosoftPortalsTool; 