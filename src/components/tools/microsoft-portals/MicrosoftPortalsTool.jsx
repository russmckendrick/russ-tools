import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  SimpleGrid,
  Modal,
  Popover
} from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { useParams } from 'react-router-dom';
import {
  IconSearch,
  IconCopy,
  IconExternalLink,
  IconAlertCircle,
  IconFilter,
  IconClearAll,
  IconStar,
  IconStarFilled,
  IconX,
  IconTrash
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
  const [selectedTag, setSelectedTag] = useState(null);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [domainToRemove, setDomainToRemove] = useState(null);
  const [tagsModalOpen, setTagsModalOpen] = useState(false);
  const [tagSearchTerm, setTagSearchTerm] = useState('');

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

  // Favorites storage
  const [favorites, setFavorites] = useLocalStorage({
    key: 'microsoft-portals-favorites',
    defaultValue: []
  });

  // Ref to prevent rapid multiple calls
  const toggleInProgress = useRef(false);

  // Initialize favorites from localStorage after component mounts
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

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

  // Remove domain from history
  const removeDomainFromHistory = (domainToRemove) => {
    const newHistory = lookupHistory.filter(item => item.domain !== domainToRemove);
    setLookupHistory(newHistory);
    setRemoveModalOpen(false);
    setDomainToRemove(null);
    notifications.show({
      title: 'Removed from Recent',
      message: `${domainToRemove} removed from recent domains`,
      color: 'orange'
    });
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
          tags: portal.tags,
          url: portal.url,
          requiresTenant: portal.requiresTenant || false,
          isFavorite: isClient && favorites.includes(`${sectionKey}-${portalKey}`)
        });
      });
    });
    
    // Sort by favorites first (maintaining favorite order), then alphabetically
    return flattened.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      if (a.isFavorite && b.isFavorite) {
        // Maintain favorite order
        return favorites.indexOf(a.key) - favorites.indexOf(b.key);
      }
      return a.name.localeCompare(b.name);
    });
  }, [portalLinks, favorites, isClient]);

  // Filter portals based on search, category, and tags
  const filteredPortals = useMemo(() => {
    let filtered = allPortals;

    // Filter by search term
    if (searchInput && !searchInput.includes('.') && !searchInput.includes('@')) {
      const searchTerm = searchInput.toLowerCase();
      filtered = filtered.filter(portal => 
        portal.name.toLowerCase().includes(searchTerm) ||
        portal.description.toLowerCase().includes(searchTerm) ||
        portal.category.toLowerCase().includes(searchTerm) ||
        (portal.tags && portal.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
      );
    }

    // Filter by category or favorites
    if (selectedCategory === 'favorites') {
      filtered = filtered.filter(portal => portal.isFavorite);
    } else if (selectedCategory !== 'all') {
      filtered = filtered.filter(portal => 
        portal.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by selected tag
    if (selectedTag) {
      filtered = filtered.filter(portal => 
        portal.tags && portal.tags.some(tag => tag.toLowerCase() === selectedTag.toLowerCase())
      );
    }

    return filtered;
  }, [allPortals, searchInput, selectedCategory, selectedTag]);

  // Get category counts for filter pills
  const categoryCounts = useMemo(() => {
    const counts = {};
    allPortals.forEach(portal => {
      counts[portal.category] = (counts[portal.category] || 0) + 1;
    });
    return counts;
  }, [allPortals]);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set();
    allPortals.forEach(portal => {
      if (portal.tags) {
        portal.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [allPortals]);

  // Category color mapping
  const getCategoryColor = (category) => {
    const colorMap = {
      'Azure': 'blue',
      'M365': 'indigo',
      'Power Platform': 'grape',
      'Dynamics 365': 'violet',
      'Admin Centers': 'cyan',
      'Security': 'red',
      'Developer': 'green',
      'Identity': 'orange',
      'Management': 'teal',
      'Users': 'pink',
      'Productivity': 'lime',
      'Healthcare': 'yellow',
      'Monitoring': 'dark',
      'Compute': 'blue',
      'Storage': 'indigo',
      'Networking': 'cyan',
      'Data': 'grape',
      'Database': 'violet',
      'IoT': 'orange'
    };
    return colorMap[category] || 'gray';
  };

  // Toggle favorite status
  const toggleFavorite = (portalKey, portalName) => {
    // Prevent rapid multiple calls
    if (toggleInProgress.current) {
      return;
    }
    
    toggleInProgress.current = true;
    
    const isCurrentlyFavorite = favorites.includes(portalKey);
    
    let newFavorites;
    if (isCurrentlyFavorite) {
      newFavorites = favorites.filter(key => key !== portalKey);
    } else {
      newFavorites = [...favorites, portalKey];
    }
    
    // Update favorites
    setFavorites(newFavorites);
    
    // Show notification
    setTimeout(() => {
      if (isCurrentlyFavorite) {
        notifications.show({
          title: 'Removed from Favorites',
          message: `${portalName} removed from favorites`,
          color: 'orange'
        });
      } else {
        notifications.show({
          title: 'Added to Favorites',
          message: `${portalName} added to favorites`,
          color: 'yellow'
        });
      }
      
      // Reset the toggle lock after a short delay
      setTimeout(() => {
        toggleInProgress.current = false;
      }, 100);
    }, 0);
  };

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
    setSelectedTag(null);
    setTenantInfo(null);
    setPortalLinks(null);
    setError(null);
  };

  // Clear selected tag
  const clearSelectedTag = () => {
    setSelectedTag(null);
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

        {/* Search and Clear */}
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
            <Button
              variant="light"
              leftSection={<IconClearAll size={16} />}
              onClick={clearAll}
            >
              Clear
            </Button>
          </Group>

          {/* Error Banner */}
          {error && (
            <Alert color="orange" variant="light" icon={<IconAlertCircle size={16} />}>
              {error} - Showing default portal links
            </Alert>
          )}

          {/* Recent Lookups - Always show when available */}
          {lookupHistory.length > 0 && (
            <Group gap="xs">
              <Text size="xs" c="dimmed">Recent:</Text>
              {lookupHistory.slice(0, 5).map((item, index) => (
                <Group key={index} gap={2}>
                  <Badge
                    size="sm"
                    variant={tenantInfo?.domain === item.domain ? "filled" : "light"}
                    color={tenantInfo?.domain === item.domain ? "blue" : "gray"}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSearchInput(item.domain);
                      handleDomainLookup(item.domain);
                    }}
                  >
                    {item.domain}
                  </Badge>
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    color="red"
                    onClick={() => {
                      setDomainToRemove(item.domain);
                      setRemoveModalOpen(true);
                    }}
                  >
                    <IconX size={10} />
                  </ActionIcon>
                </Group>
              ))}
            </Group>
          )}
        </Stack>
      </Paper>

      {/* Portal Links Table - Only show when portalLinks exist */}
      {portalLinks && (
        <Paper withBorder radius="lg" p="md">
          <Group justify="space-between" mb="md">
            <Group gap="md">
              <Text fw={500}>
                Portal Links ({filteredPortals.length})
                {favorites.length > 0 && (
                  <Badge variant="light" color="yellow" size="sm" ml="xs">
                    {favorites.length} favorited
                  </Badge>
                )}
              </Text>
              
              {/* Domain details moved here */}
              {tenantInfo && (
                <Group gap="xs">
                  <Text size="sm" c="dimmed">•</Text>
                  <Text size="sm" fw={500} c="green">
                    {tenantInfo.domain}
                  </Text>
                  <Text size="xs" c="dimmed">
                    ({tenantInfo.tenantId})
                  </Text>
                  <Tooltip label="Copy Tenant ID">
                    <ActionIcon 
                      variant="subtle" 
                      size="xs"
                      onClick={() => copyToClipboard(tenantInfo.tenantId, 'Tenant ID')}
                    >
                      <IconCopy size={12} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              )}
            </Group>
            
            {(selectedCategory !== 'all' || selectedTag) && (
              <Group gap="xs">
                {selectedCategory !== 'all' && (
                  <Badge variant="light" color={getCategoryColor(selectedCategory)}>
                    {selectedCategory}
                  </Badge>
                )}
                {selectedTag && (
                  <Group gap={4}>
                    <Badge variant="light" color="blue">
                      Tag: {selectedTag}
                    </Badge>
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color="gray"
                      onClick={clearSelectedTag}
                    >
                      <IconX size={10} />
                    </ActionIcon>
                  </Group>
                )}
              </Group>
            )}
          </Group>

          {/* Category Filter Pills - Color coded */}
          <Group gap="xs" mb="md">
            <Chip
              checked={selectedCategory === 'all'}
              onChange={() => {
                setSelectedCategory('all');
                setSelectedTag(null);
              }}
              variant="light"
              size="sm"
            >
              All ({allPortals.length})
            </Chip>
            {favorites.length > 0 && (
              <Chip
                checked={selectedCategory === 'favorites'}
                onChange={() => {
                  setSelectedCategory('favorites');
                  setSelectedTag(null);
                }}
                variant="light"
                size="sm"
                color="yellow"
              >
                Favorites ({favorites.length})
              </Chip>
            )}
            {Object.entries(categoryCounts)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 8)
              .map(([category, count]) => (
                <Chip
                  key={category}
                  checked={selectedCategory === category.toLowerCase()}
                  onChange={() => {
                    setSelectedCategory(category.toLowerCase());
                    setSelectedTag(null);
                  }}
                  variant="light"
                  size="sm"
                  color={getCategoryColor(category)}
                >
                  {category} ({count})
                </Chip>
              ))}
            
            {/* Tags Cloud - Always last */}
            <Chip
              checked={false}
              variant="light"
              size="sm"
              color="indigo"
              style={{ cursor: 'pointer' }}
              onClick={() => setTagsModalOpen(true)}
            >
              Tags ({allTags.length})
            </Chip>
          </Group>

          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th width={40}></Table.Th>
                <Table.Th>Portal Name</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Tags</Table.Th>
                <Table.Th width={100}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredPortals.map((portal) => (
                <Table.Tr key={portal.key}>
                  <Table.Td>
                    <Tooltip label={portal.isFavorite ? "Remove from favorites" : "Add to favorites"}>
                      <ActionIcon
                        variant="subtle"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavorite(portal.key, portal.name);
                        }}
                        color={portal.isFavorite ? "yellow" : "gray"}
                      >
                        {portal.isFavorite ? <IconStarFilled size={16} /> : <IconStar size={16} />}
                      </ActionIcon>
                    </Tooltip>
                  </Table.Td>
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
                    <Group gap="xs">
                      {portal.tags && portal.tags.slice(0, 3).map((tag, index) => (
                        <Badge
                          key={index}
                          size="xs"
                          variant="light"
                          color={getCategoryColor(tag)}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setSelectedTag(selectedTag === tag ? null : tag);
                            setSelectedCategory('all');
                          }}
                        >
                          {tag}
                        </Badge>
                      ))}
                      {portal.tags && portal.tags.length > 3 && (
                        <Popover width={300} position="bottom" withArrow shadow="md">
                          <Popover.Target>
                            <Badge 
                              size="xs" 
                              variant="light" 
                              color="gray"
                              style={{ cursor: 'pointer' }}
                            >
                              +{portal.tags.length - 3}
                            </Badge>
                          </Popover.Target>
                          <Popover.Dropdown>
                            <Text size="xs" fw={500} mb="xs">All tags for {portal.name}:</Text>
                            <Group gap="xs">
                              {portal.tags.map((tag, index) => (
                                <Badge
                                  key={index}
                                  size="xs"
                                  variant="light"
                                  color={getCategoryColor(tag)}
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => {
                                    setSelectedTag(selectedTag === tag ? null : tag);
                                    setSelectedCategory('all');
                                  }}
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </Group>
                          </Popover.Dropdown>
                        </Popover>
                      )}
                    </Group>
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

      {/* Tags Modal */}
      <Modal
        opened={tagsModalOpen}
        onClose={() => {
          setTagsModalOpen(false);
          setTagSearchTerm('');
        }}
        title="Browse All Tags"
        size="lg"
        centered
      >
        <Stack gap="md">
          {/* Search and Status */}
          <Group gap="md">
            <TextInput
              placeholder="Search tags..."
              value={tagSearchTerm}
              onChange={(event) => setTagSearchTerm(event.currentTarget.value)}
              leftSection={<IconSearch size={16} />}
              style={{ flex: 1 }}
              size="sm"
            />
            <Text size="sm" c="dimmed">
              {selectedTag ? `Selected: "${selectedTag}"` : 'No tag selected'}
            </Text>
          </Group>

          {/* Filtered Tags Display */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <Stack gap="xs">
              {(() => {
                // Filter tags based on search term
                const filteredTags = allTags.filter(tag => 
                  tag.toLowerCase().includes(tagSearchTerm.toLowerCase())
                );

                // Group tags by first letter for better organization
                const groupedTags = filteredTags.reduce((groups, tag) => {
                  const firstLetter = tag.charAt(0).toUpperCase();
                  if (!groups[firstLetter]) {
                    groups[firstLetter] = [];
                  }
                  groups[firstLetter].push(tag);
                  return groups;
                }, {});

                return Object.keys(groupedTags)
                  .sort()
                  .map(letter => (
                    <div key={letter}>
                      <Text size="xs" fw={600} c="dimmed" mb="xs" mt="sm">
                        {letter}
                      </Text>
                      <Group gap="xs">
                        {groupedTags[letter].map((tag) => {
                          // Count how many portals have this tag
                          const tagCount = allPortals.filter(portal => 
                            portal.tags && portal.tags.includes(tag)
                          ).length;
                          
                          return (
                            <Badge
                              key={tag}
                              size="sm"
                              variant={selectedTag === tag ? "filled" : "light"}
                              color={getCategoryColor(tag)}
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                setSelectedTag(selectedTag === tag ? null : tag);
                                setSelectedCategory('all');
                                setTagsModalOpen(false);
                                setTagSearchTerm('');
                              }}
                            >
                              {tag} ({tagCount})
                            </Badge>
                          );
                        })}
                      </Group>
                    </div>
                  ));
              })()}
            </Stack>
          </div>

          {/* Footer */}
          <Group justify="space-between" pt="md" style={{ borderTop: '1px solid #e9ecef' }}>
            <Text size="xs" c="dimmed">
              {(() => {
                const filteredCount = allTags.filter(tag => 
                  tag.toLowerCase().includes(tagSearchTerm.toLowerCase())
                ).length;
                return tagSearchTerm 
                  ? `${filteredCount} of ${allTags.length} tags shown`
                  : `${allTags.length} tags available`;
              })()}
            </Text>
            <Group gap="xs">
              {selectedTag && (
                <Button
                  size="sm"
                  variant="light"
                  color="gray"
                  onClick={() => {
                    clearSelectedTag();
                    setTagsModalOpen(false);
                    setTagSearchTerm('');
                  }}
                >
                  Clear Filter
                </Button>
              )}
              <Button
                size="sm"
                variant="light"
                onClick={() => {
                  setTagsModalOpen(false);
                  setTagSearchTerm('');
                }}
              >
                Close
              </Button>
            </Group>
          </Group>
        </Stack>
      </Modal>

      {/* Remove Domain Confirmation Modal */}
      <Modal
        opened={removeModalOpen}
        onClose={() => setRemoveModalOpen(false)}
        title="Remove from Recent"
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to remove <strong>{domainToRemove}</strong> from your recent domains?
          </Text>
          <Group justify="flex-end" gap="xs">
            <Button
              variant="light"
              onClick={() => setRemoveModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              color="red"
              leftSection={<IconTrash size={16} />}
              onClick={() => removeDomainFromHistory(domainToRemove)}
            >
              Remove
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};

export default MicrosoftPortalsTool; 