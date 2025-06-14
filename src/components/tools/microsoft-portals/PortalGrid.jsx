import React, { useState } from 'react';
import {
  Card,
  Grid,
  Group,
  Text,
  ActionIcon,
  Tooltip,
  Badge,
  Stack,
  Button,
  Alert,
  useMantineColorScheme
} from '@mantine/core';
import {
  IconCopy,
  IconExternalLink,
  IconCheck,
  IconAlertCircle,
  IconInfoCircle
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

const PortalGrid = ({ links, searchTerm = '', selectedCategory = 'All' }) => {
  const [copiedLinks, setCopiedLinks] = useState(new Set());
  const { colorScheme } = useMantineColorScheme();

  // Copy to clipboard helper
  const copyToClipboard = async (url, name) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLinks(prev => new Set([...prev, url]));
      
      // Remove from copied set after 2 seconds
      setTimeout(() => {
        setCopiedLinks(prev => {
          const newSet = new Set(prev);
          newSet.delete(url);
          return newSet;
        });
      }, 2000);

      notifications.show({
        title: 'Copied',
        message: `${name} URL copied to clipboard`,
        color: 'blue',
        icon: <IconCopy size={16} />
      });
    } catch (error) {
      notifications.show({
        title: 'Copy Failed',
        message: 'Unable to copy to clipboard',
        color: 'red',
        icon: <IconAlertCircle size={16} />
      });
    }
  };

  // Open link in new tab
  const openLink = (url, name) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    notifications.show({
      title: 'Opening Portal',
      message: `Opening ${name} in new tab`,
      color: 'green',
      icon: <IconExternalLink size={16} />
    });
  };

  // Filter links based on search term and category
  const filterLinks = (sectionLinks) => {
    if (!sectionLinks) return {};
    
    return Object.keys(sectionLinks).reduce((filtered, key) => {
      const link = sectionLinks[key];
      
      // Category filter
      if (selectedCategory !== 'All' && link.category !== selectedCategory) {
        return filtered;
      }
      
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
          link.name.toLowerCase().includes(term) ||
          link.description.toLowerCase().includes(term) ||
          link.category.toLowerCase().includes(term);
        
        if (!matchesSearch) {
          return filtered;
        }
      }
      
      filtered[key] = link;
      return filtered;
    }, {});
  };

  // Get category color
  const getCategoryColor = (category) => {
    const colorMap = {
      'General': 'blue',
      'Admin Centers': 'indigo',
      'Resources': 'cyan',
      'Identity': 'teal',
      'Security': 'red',
      'Management': 'orange',
      'Monitoring': 'yellow',
      'Compute': 'lime',
      'Storage': 'green',
      'Networking': 'violet',
      'Users': 'pink',
      'Power Platform': 'grape',
      'Dynamics 365': 'indigo',
      'Developer': 'dark'
    };
    return colorMap[category] || 'gray';
  };

  // Render a single link card
  const renderLinkCard = (key, link) => (
    <Grid.Col key={key} span={{ base: 12, sm: 6, lg: 4 }}>
      <Card
        withBorder
        p="md"
        radius="md"
        style={{
          height: '100%',
          backgroundColor: colorScheme === 'dark' 
            ? 'var(--mantine-color-dark-6)' 
            : 'var(--mantine-color-gray-0)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = colorScheme === 'dark' 
            ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
            : '0 4px 12px rgba(0, 0, 0, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <Stack gap="sm" style={{ height: '100%' }}>
          {/* Header with title and category */}
          <Group justify="space-between" align="flex-start">
            <div style={{ flex: 1 }}>
              <Text fw={600} size="sm" lineClamp={2}>
                {link.name}
              </Text>
            </div>
            <Badge
              variant="light"
              color={getCategoryColor(link.category)}
              size="xs"
              style={{ flexShrink: 0 }}
            >
              {link.category}
            </Badge>
          </Group>

          {/* Description */}
          <Text size="xs" c="dimmed" lineClamp={2} style={{ flex: 1 }}>
            {link.description}
          </Text>

          {/* Actions */}
          <Group justify="space-between" align="center" mt="auto">
            <Group gap="xs">
              <Tooltip label="Copy URL">
                <ActionIcon
                  variant="light"
                  color="blue"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(link.url, link.name);
                  }}
                >
                  {copiedLinks.has(link.url) ? (
                    <IconCheck size={14} />
                  ) : (
                    <IconCopy size={14} />
                  )}
                </ActionIcon>
              </Tooltip>
              
              <Tooltip label="Open Portal">
                <ActionIcon
                  variant="light"
                  color="green"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    openLink(link.url, link.name);
                  }}
                >
                  <IconExternalLink size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
            
            <Button
              variant="light"
              size="xs"
              onClick={() => openLink(link.url, link.name)}
            >
              Open
            </Button>
          </Group>
        </Stack>
      </Card>
    </Grid.Col>
  );

  // Render section
  const renderSection = (sectionKey, sectionTitle, sectionLinks, sectionColor) => {
    const filteredLinks = filterLinks(sectionLinks);
    const linkCount = Object.keys(filteredLinks).length;
    
    if (linkCount === 0) return null;

    return (
      <Stack key={sectionKey} gap="md">
        <Group gap="md" align="center">
          <Badge variant="filled" color={sectionColor} size="lg">
            {sectionTitle}
          </Badge>
          <Badge variant="light" color={sectionColor} size="sm">
            {linkCount} portal{linkCount !== 1 ? 's' : ''}
          </Badge>
        </Group>
        
        <Grid gutter="md">
          {Object.keys(filteredLinks).map(key => 
            renderLinkCard(key, filteredLinks[key])
          )}
        </Grid>
      </Stack>
    );
  };

  // Check if we have any links to display
  const hasLinks = links && Object.keys(links).length > 0;
  
  if (!hasLinks) {
    return (
      <Alert icon={<IconInfoCircle size={16} />} title="No Portal Links" color="blue" variant="light">
        Perform a tenant lookup to generate Microsoft portal links for your domain.
      </Alert>
    );
  }

  // Count total filtered links
  const totalLinks = Object.keys(links).reduce((total, sectionKey) => {
    return total + Object.keys(filterLinks(links[sectionKey])).length;
  }, 0);

  if (totalLinks === 0) {
    return (
      <Alert icon={<IconInfoCircle size={16} />} title="No Matching Links" color="orange" variant="light">
        No portal links match your current search criteria. Try adjusting your search term or category filter.
      </Alert>
    );
  }

  return (
    <Stack gap="xl">
      {/* Summary */}
      <Alert icon={<IconInfoCircle size={16} />} title="Portal Links Generated" color="green" variant="light">
        Found {totalLinks} portal link{totalLinks !== 1 ? 's' : ''} 
        {searchTerm && ` matching "${searchTerm}"`}
        {selectedCategory !== 'All' && ` in ${selectedCategory} category`}
      </Alert>

      {/* Azure Portal Links */}
      {links.azure && renderSection(
        'azure',
        'Azure Portal',
        links.azure,
        'blue'
      )}

      {/* Microsoft 365 Admin Links */}
      {links.m365 && renderSection(
        'm365',
        'Microsoft 365 Admin',
        links.m365,
        'indigo'
      )}

      {/* Power Platform Links */}
      {links.powerPlatform && renderSection(
        'powerPlatform',
        'Power Platform & Dynamics 365',
        links.powerPlatform,
        'grape'
      )}

      {/* Advanced/Developer Links */}
      {links.advanced && renderSection(
        'advanced',
        'Developer & Advanced',
        links.advanced,
        'dark'
      )}
    </Stack>
  );
};

export default PortalGrid; 