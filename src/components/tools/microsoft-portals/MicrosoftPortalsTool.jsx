import React, { useState, useEffect } from 'react';
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
  Card,
  LoadingOverlay,
  Grid,
  Code,
  ActionIcon,
  Tooltip,
  useMantineColorScheme,
  Tabs
} from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import {
  IconSearch,
  IconInfoCircle,
  IconCopy,
  IconCheck,
  IconExternalLink,
  IconAlertCircle,
  IconLink,
  IconHistory
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import MicrosoftPortalsIcon from './MicrosoftPortalsIcon';
import { getTenantId, isValidDomain, extractDomain } from './TenantLookup';
import { generateAllPortalLinks } from './PortalLinkGenerator';
import PortalCategories from './PortalCategories';

const MicrosoftPortalsTool = () => {
  const [domainInput, setDomainInput] = useState('');
  const [tenantInfo, setTenantInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [portalLinks, setPortalLinks] = useState(null);
  const [activeTab, setActiveTab] = useState('lookup');
  const { colorScheme } = useMantineColorScheme();

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
    const newHistory = [historyItem, ...filteredHistory].slice(0, 20);
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

  // Perform tenant lookup
  const handleLookup = async () => {
    if (!domainInput.trim()) {
      setError('Please enter a domain name');
      return;
    }

    const domain = extractDomain(domainInput);
    
    if (!isValidDomain(domain)) {
      setError('Please enter a valid domain name (e.g., contoso.com)');
      return;
    }

    setLoading(true);
    setError(null);
    setTenantInfo(null);

    try {
      // Check cache first
      const cachedData = tenantCache[domain];
      if (cachedData && isCacheValid(cachedData)) {
        console.log(`📦 Using cached tenant data for: ${domain}`);
        setTenantInfo(cachedData);
        addToHistory(domain, cachedData);
        
        // Generate portal links for cached data
        const links = generateAllPortalLinks(cachedData);
        setPortalLinks(links);
        setActiveTab('portals');
        
        setLoading(false);
        return;
      }

      console.log(`🔍 Looking up tenant for domain: ${domain}`);
      const tenantData = await getTenantId(domain);
      
      setTenantInfo(tenantData);
      addToHistory(domain, tenantData);
      cacheTenantData(domain, tenantData);
      
      // Generate portal links
      const links = generateAllPortalLinks(tenantData);
      setPortalLinks(links);
      
      // Switch to portal links tab
      setActiveTab('portals');
      
      notifications.show({
        title: 'Tenant Found',
        message: `Successfully found tenant information for ${domain}`,
        color: 'green',
        icon: <IconCheck size={16} />
      });

    } catch (err) {
      console.error('Tenant lookup error:', err);
      setError(err.message || 'Failed to lookup tenant information');
      
      notifications.show({
        title: 'Lookup Failed',
        message: err.message || 'Failed to lookup tenant information',
        color: 'red',
        icon: <IconAlertCircle size={16} />
      });
    } finally {
      setLoading(false);
    }
  };



  // Handle Enter key press
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleLookup();
    }
  };

  // Copy to clipboard helper
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      notifications.show({
        title: 'Copied',
        message: `${label} copied to clipboard`,
        color: 'blue',
        icon: <IconCopy size={16} />
      });
    }).catch(() => {
      notifications.show({
        title: 'Copy Failed',
        message: 'Unable to copy to clipboard',
        color: 'red',
        icon: <IconAlertCircle size={16} />
      });
    });
  };

  // Handle history item click
  const handleHistoryClick = (historyItem) => {
    setDomainInput(historyItem.domain);
    const cachedData = tenantCache[historyItem.domain];
    if (cachedData && isCacheValid(cachedData)) {
      setTenantInfo(cachedData);
      setError(null);
      
      // Generate portal links for history item
      const links = generateAllPortalLinks(cachedData);
      setPortalLinks(links);
      setActiveTab('portals');
    }
  };

  return (
    <Paper p="xl" radius="lg" withBorder>
      <Stack gap="xl">
        {/* Header */}
        <Group gap="md">
          <ThemeIcon size={48} radius="md" variant="light" color="indigo">
            <MicrosoftPortalsIcon size={28} />
          </ThemeIcon>
          <div style={{ flex: 1 }}>
            <Title order={2} fw={600}>
              Microsoft Portal Links
            </Title>
            <Text size="sm" c="dimmed">
              Generate deep links to Microsoft portals using domain/tenant information
            </Text>
            <Badge variant="light" color="indigo" size="sm" mt="xs">
              Phase 2: Portal Link Generator
            </Badge>
          </div>
        </Group>

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onChange={setActiveTab} variant="pills">
          <Tabs.List grow>
            <Tabs.Tab value="lookup" leftSection={<IconSearch size={16} />}>
              Tenant Lookup
            </Tabs.Tab>
            <Tabs.Tab 
              value="portals" 
              leftSection={<IconLink size={16} />}
              disabled={!tenantInfo}
            >
              Portal Links
              {portalLinks && (
                <Badge variant="light" color="blue" size="xs" ml="xs">
                  {Object.keys(portalLinks).reduce((total, section) => 
                    total + Object.keys(portalLinks[section]).length, 0
                  )}
                </Badge>
              )}
            </Tabs.Tab>
            <Tabs.Tab 
              value="history" 
              leftSection={<IconHistory size={16} />}
              disabled={lookupHistory.length === 0}
            >
              History
              {lookupHistory.length > 0 && (
                <Badge variant="light" color="gray" size="xs" ml="xs">
                  {lookupHistory.length}
                </Badge>
              )}
            </Tabs.Tab>
          </Tabs.List>

          {/* Tenant Lookup Tab */}
          <Tabs.Panel value="lookup" pt="lg">
            <Stack gap="lg">
              {/* Domain Input Section */}
        <Card withBorder p="lg" radius="md">
          <Stack gap="md">
            <Group gap="xs">
              <IconSearch size={16} />
              <Text fw={500}>Domain Lookup</Text>
            </Group>
            
            <Text size="sm" c="dimmed">
              Enter a domain name or email address to discover the associated Microsoft tenant information.
            </Text>

            <Group gap="md">
              <TextInput
                placeholder="Enter domain (e.g., contoso.com) or email"
                value={domainInput}
                onChange={(event) => setDomainInput(event.currentTarget.value)}
                onKeyPress={handleKeyPress}
                style={{ flex: 1 }}
                disabled={loading}
              />
              <Button
                onClick={handleLookup}
                loading={loading}
                leftSection={<IconSearch size={16} />}
                disabled={!domainInput.trim()}
              >
                Lookup
              </Button>
            </Group>

            {error && (
              <Alert color="red" icon={<IconAlertCircle size={16} />}>
                {error}
              </Alert>
            )}
          </Stack>
        </Card>

        {/* Tenant Information Display */}
        {tenantInfo && (
          <Card withBorder p="lg" radius="md">
            <LoadingOverlay visible={loading} />
            <Stack gap="md">
              <Group gap="xs">
                <IconInfoCircle size={16} />
                <Text fw={500}>Tenant Information</Text>
              </Group>

              <Grid gutter="md">
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500}>Domain</Text>
                    <Group gap="xs">
                      <Code 
                        block 
                        style={{ 
                          backgroundColor: colorScheme === 'dark' 
                            ? 'var(--mantine-color-dark-6)' 
                            : 'var(--mantine-color-gray-0)',
                          flex: 1
                        }}
                      >
                        {tenantInfo.domain}
                      </Code>
                      <Tooltip label="Copy domain">
                        <ActionIcon 
                          variant="light" 
                          onClick={() => copyToClipboard(tenantInfo.domain, 'Domain')}
                        >
                          <IconCopy size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Stack>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500}>Tenant ID</Text>
                    <Group gap="xs">
                      <Code 
                        block 
                        style={{ 
                          backgroundColor: colorScheme === 'dark' 
                            ? 'var(--mantine-color-dark-6)' 
                            : 'var(--mantine-color-gray-0)',
                          flex: 1
                        }}
                      >
                        {tenantInfo.tenantId}
                      </Code>
                      <Tooltip label="Copy tenant ID">
                        <ActionIcon 
                          variant="light" 
                          onClick={() => copyToClipboard(tenantInfo.tenantId, 'Tenant ID')}
                        >
                          <IconCopy size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Stack>
                </Grid.Col>

                {tenantInfo.displayName && (
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                      <Text size="sm" fw={500}>Organization Name</Text>
                      <Code 
                        block 
                        style={{ 
                          backgroundColor: colorScheme === 'dark' 
                            ? 'var(--mantine-color-dark-6)' 
                            : 'var(--mantine-color-gray-0)'
                        }}
                      >
                        {tenantInfo.displayName}
                      </Code>
                    </Stack>
                  </Grid.Col>
                )}

                {tenantInfo.method && (
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                      <Text size="sm" fw={500}>Lookup Method</Text>
                      <Badge variant="light" color="blue">
                        {tenantInfo.method}
                      </Badge>
                    </Stack>
                  </Grid.Col>
                )}

                {/* Additional Tenant Information */}
                {tenantInfo.tenantType && (
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                      <Text size="sm" fw={500}>Tenant Type</Text>
                      <Badge variant="light" color="green">
                        {tenantInfo.tenantType}
                      </Badge>
                    </Stack>
                  </Grid.Col>
                )}

                {tenantInfo.tenantCategory && (
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                      <Text size="sm" fw={500}>Category</Text>
                      <Badge variant="light" color="violet">
                        {tenantInfo.tenantCategory}
                      </Badge>
                    </Stack>
                  </Grid.Col>
                )}

                {tenantInfo.isCloudOnly !== undefined && (
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                      <Text size="sm" fw={500}>Identity Type</Text>
                      <Badge variant="light" color={tenantInfo.isCloudOnly ? "blue" : "orange"}>
                        {tenantInfo.isCloudOnly ? "Cloud-only" : "Federated"}
                      </Badge>
                    </Stack>
                  </Grid.Col>
                )}

                {tenantInfo.defaultDomainName && tenantInfo.defaultDomainName !== tenantInfo.domain && (
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                      <Text size="sm" fw={500}>Default Domain</Text>
                      <Code 
                        block 
                        style={{ 
                          backgroundColor: colorScheme === 'dark' 
                            ? 'var(--mantine-color-dark-6)' 
                            : 'var(--mantine-color-gray-0)'
                        }}
                      >
                        {tenantInfo.defaultDomainName}
                      </Code>
                    </Stack>
                  </Grid.Col>
                )}

                {tenantInfo.federationBrandName && (
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                      <Text size="sm" fw={500}>Federation Brand</Text>
                      <Code 
                        block 
                        style={{ 
                          backgroundColor: colorScheme === 'dark' 
                            ? 'var(--mantine-color-dark-6)' 
                            : 'var(--mantine-color-gray-0)'
                        }}
                      >
                        {tenantInfo.federationBrandName}
                      </Code>
                    </Stack>
                  </Grid.Col>
                )}

                {tenantInfo.issuer && (
                  <Grid.Col span={12}>
                    <Stack gap="xs">
                      <Text size="sm" fw={500}>OpenID Connect Issuer</Text>
                      <Group gap="xs">
                        <Code 
                          block 
                          style={{ 
                            backgroundColor: colorScheme === 'dark' 
                              ? 'var(--mantine-color-dark-6)' 
                              : 'var(--mantine-color-gray-0)',
                            flex: 1
                          }}
                        >
                          {tenantInfo.issuer}
                        </Code>
                        <Tooltip label="Copy issuer URL">
                          <ActionIcon 
                            variant="light" 
                            onClick={() => copyToClipboard(tenantInfo.issuer, 'Issuer URL')}
                          >
                            <IconCopy size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Open in new tab">
                          <ActionIcon 
                            variant="light" 
                            onClick={() => window.open(tenantInfo.issuer, '_blank')}
                          >
                            <IconExternalLink size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Stack>
                  </Grid.Col>
                )}
              </Grid>

              {/* Verified Domains Section */}
              {tenantInfo.verifiedDomains && tenantInfo.verifiedDomains.length > 0 && (
                <Stack gap="xs">
                  <Text size="sm" fw={500}>Verified Domains</Text>
                  <Grid gutter="xs">
                    {tenantInfo.verifiedDomains.map((domain, index) => (
                      <Grid.Col key={index} span={{ base: 12, sm: 6, md: 4 }}>
                        <Group gap="xs">
                          <Badge 
                            variant="light" 
                            color={domain.isDefault ? "blue" : domain.isInitial ? "green" : "gray"}
                            size="sm"
                          >
                            {domain.name}
                          </Badge>
                          {domain.isDefault && <Text size="xs" c="dimmed">(Default)</Text>}
                          {domain.isInitial && <Text size="xs" c="dimmed">(Initial)</Text>}
                        </Group>
                      </Grid.Col>
                    ))}
                  </Grid>
                </Stack>
              )}

              {/* Assigned Plans Section */}
              {tenantInfo.assignedPlans && tenantInfo.assignedPlans.length > 0 && (
                <Stack gap="xs">
                  <Text size="sm" fw={500}>Active Services</Text>
                  <Grid gutter="xs">
                    {tenantInfo.assignedPlans.slice(0, 8).map((plan, index) => (
                      <Grid.Col key={index} span={{ base: 12, sm: 6, md: 4 }}>
                        <Badge variant="light" color="teal" size="sm">
                          {plan.service}
                        </Badge>
                      </Grid.Col>
                    ))}
                    {tenantInfo.assignedPlans.length > 8 && (
                      <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                        <Text size="xs" c="dimmed">
                          +{tenantInfo.assignedPlans.length - 8} more services
                        </Text>
                      </Grid.Col>
                    )}
                  </Grid>
                </Stack>
              )}

              <Alert color="green" icon={<IconCheck size={16} />}>
                <Text size="sm">
                  <strong>Tenant Discovery Complete!</strong> All available public information has been gathered 
                  including OpenID configuration, user realm details, DNS analysis, and federation metadata.
                </Text>
              </Alert>
            </Stack>
          </Card>
        )}

        {/* Comprehensive Tenant Data Display */}
        {tenantInfo && (tenantInfo.openIdConfig || tenantInfo.userRealm || tenantInfo.dnsInfo) && (
          <Card withBorder p="lg" radius="md">
            <Stack gap="md">
              <Group gap="xs">
                <IconInfoCircle size={16} />
                <Text fw={500}>Comprehensive Tenant Analysis</Text>
                <Badge variant="light" color="indigo" size="sm">
                  Public APIs
                </Badge>
              </Group>

              {/* OpenID Configuration */}
              {tenantInfo.openIdConfig && (
                <Stack gap="xs">
                  <Text size="sm" fw={500}>OpenID Connect Configuration</Text>
                  <Grid gutter="md">
                    {tenantInfo.openIdConfig.authorization_endpoint && (
                      <Grid.Col span={12}>
                        <Stack gap="xs">
                          <Text size="xs" fw={500} c="dimmed">Authorization Endpoint</Text>
                          <Group gap="xs">
                            <Code 
                              block 
                              style={{ 
                                backgroundColor: colorScheme === 'dark' 
                                  ? 'var(--mantine-color-dark-6)' 
                                  : 'var(--mantine-color-gray-0)',
                                flex: 1,
                                fontSize: '11px'
                              }}
                            >
                              {tenantInfo.openIdConfig.authorization_endpoint}
                            </Code>
                            <Tooltip label="Copy authorization endpoint">
                              <ActionIcon 
                                variant="light" 
                                size="sm"
                                onClick={() => copyToClipboard(tenantInfo.openIdConfig.authorization_endpoint, 'Authorization Endpoint')}
                              >
                                <IconCopy size={14} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Stack>
                      </Grid.Col>
                    )}

                    {tenantInfo.openIdConfig.token_endpoint && (
                      <Grid.Col span={12}>
                        <Stack gap="xs">
                          <Text size="xs" fw={500} c="dimmed">Token Endpoint</Text>
                          <Group gap="xs">
                            <Code 
                              block 
                              style={{ 
                                backgroundColor: colorScheme === 'dark' 
                                  ? 'var(--mantine-color-dark-6)' 
                                  : 'var(--mantine-color-gray-0)',
                                flex: 1,
                                fontSize: '11px'
                              }}
                            >
                              {tenantInfo.openIdConfig.token_endpoint}
                            </Code>
                            <Tooltip label="Copy token endpoint">
                              <ActionIcon 
                                variant="light" 
                                size="sm"
                                onClick={() => copyToClipboard(tenantInfo.openIdConfig.token_endpoint, 'Token Endpoint')}
                              >
                                <IconCopy size={14} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Stack>
                      </Grid.Col>
                    )}
                  </Grid>
                </Stack>
              )}

              {/* User Realm Information */}
              {tenantInfo.userRealm && (
                <Stack gap="xs">
                  <Text size="sm" fw={500}>User Realm Information</Text>
                  <Grid gutter="md">
                    {tenantInfo.userRealm.NameSpaceType && (
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Stack gap="xs">
                          <Text size="xs" fw={500} c="dimmed">Authentication Type</Text>
                          <Badge variant="light" color={tenantInfo.userRealm.NameSpaceType === 'Managed' ? 'blue' : 'orange'}>
                            {tenantInfo.userRealm.NameSpaceType}
                          </Badge>
                        </Stack>
                      </Grid.Col>
                    )}

                    {tenantInfo.userRealm.FederationBrandName && (
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Stack gap="xs">
                          <Text size="xs" fw={500} c="dimmed">Federation Brand</Text>
                          <Code 
                            style={{ 
                              backgroundColor: colorScheme === 'dark' 
                                ? 'var(--mantine-color-dark-6)' 
                                : 'var(--mantine-color-gray-0)'
                            }}
                          >
                            {tenantInfo.userRealm.FederationBrandName}
                          </Code>
                        </Stack>
                      </Grid.Col>
                    )}

                    {tenantInfo.userRealm.AuthURL && (
                      <Grid.Col span={12}>
                        <Stack gap="xs">
                          <Text size="xs" fw={500} c="dimmed">Federation Auth URL</Text>
                          <Group gap="xs">
                            <Code 
                              block 
                              style={{ 
                                backgroundColor: colorScheme === 'dark' 
                                  ? 'var(--mantine-color-dark-6)' 
                                  : 'var(--mantine-color-gray-0)',
                                flex: 1,
                                fontSize: '11px'
                              }}
                            >
                              {tenantInfo.userRealm.AuthURL}
                            </Code>
                            <Tooltip label="Copy auth URL">
                              <ActionIcon 
                                variant="light" 
                                size="sm"
                                onClick={() => copyToClipboard(tenantInfo.userRealm.AuthURL, 'Auth URL')}
                              >
                                <IconCopy size={14} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Stack>
                      </Grid.Col>
                    )}
                  </Grid>
                </Stack>
              )}

              {/* DNS Information */}
              {tenantInfo.dnsInfo && (
                <Stack gap="xs">
                  <Text size="sm" fw={500}>DNS Analysis</Text>
                  <Grid gutter="md">
                    {tenantInfo.dnsInfo.hasExchangeOnline !== undefined && (
                      <Grid.Col span={{ base: 12, md: 4 }}>
                        <Stack gap="xs">
                          <Text size="xs" fw={500} c="dimmed">Exchange Online</Text>
                          <Badge variant="light" color={tenantInfo.dnsInfo.hasExchangeOnline ? 'green' : 'gray'}>
                            {tenantInfo.dnsInfo.hasExchangeOnline ? 'Detected' : 'Not Detected'}
                          </Badge>
                        </Stack>
                      </Grid.Col>
                    )}

                    {tenantInfo.dnsInfo.hasOffice365SPF !== undefined && (
                      <Grid.Col span={{ base: 12, md: 4 }}>
                        <Stack gap="xs">
                          <Text size="xs" fw={500} c="dimmed">Office 365 SPF</Text>
                          <Badge variant="light" color={tenantInfo.dnsInfo.hasOffice365SPF ? 'green' : 'gray'}>
                            {tenantInfo.dnsInfo.hasOffice365SPF ? 'Configured' : 'Not Found'}
                          </Badge>
                        </Stack>
                      </Grid.Col>
                    )}

                    {tenantInfo.dnsInfo.mxRecords && tenantInfo.dnsInfo.mxRecords.length > 0 && (
                      <Grid.Col span={12}>
                        <Stack gap="xs">
                          <Text size="xs" fw={500} c="dimmed">MX Records</Text>
                          <Stack gap="xs">
                            {tenantInfo.dnsInfo.mxRecords.slice(0, 3).map((mx, index) => (
                              <Code 
                                key={index}
                                size="xs"
                                style={{ 
                                  backgroundColor: colorScheme === 'dark' 
                                    ? 'var(--mantine-color-dark-6)' 
                                    : 'var(--mantine-color-gray-0)'
                                }}
                              >
                                {mx.priority} {mx.exchange}
                              </Code>
                            ))}
                          </Stack>
                        </Stack>
                      </Grid.Col>
                    )}
                  </Grid>
                </Stack>
              )}

              {/* Tenant Domains */}
              {tenantInfo.tenantDomains && tenantInfo.tenantDomains.length > 0 && (
                <Stack gap="xs">
                  <Text size="sm" fw={500}>All Tenant Domains</Text>
                  <Grid gutter="xs">
                    {tenantInfo.tenantDomains.map((domain, index) => (
                      <Grid.Col key={index} span={{ base: 12, sm: 6, md: 4 }}>
                        <Group gap="xs">
                          <Badge 
                            variant="light" 
                            color={domain.type === 'Federated' ? 'orange' : 'blue'}
                            size="sm"
                          >
                            {domain.name}
                          </Badge>
                          <Text size="xs" c="dimmed">({domain.type})</Text>
                        </Group>
                      </Grid.Col>
                    ))}
                  </Grid>
                </Stack>
              )}

              <Alert color="indigo" icon={<IconInfoCircle size={16} />}>
                <Text size="sm">
                  <strong>Comprehensive Analysis Complete:</strong> All available tenant information gathered using public APIs. 
                  This data is publicly available and doesn't require authentication or special permissions.
                </Text>
              </Alert>
            </Stack>
          </Card>
        )}

            </Stack>
          </Tabs.Panel>

          {/* Portal Links Tab */}
          <Tabs.Panel value="portals" pt="lg">
            <Stack gap="lg">
              {tenantInfo && portalLinks ? (
                <PortalCategories 
                  links={portalLinks}
                  tenantInfo={tenantInfo}
                />
              ) : (
                <Alert icon={<IconInfoCircle size={16} />} title="No Portal Links" color="blue" variant="light">
                  Perform a tenant lookup first to generate Microsoft portal links.
                </Alert>
              )}
            </Stack>
          </Tabs.Panel>

          {/* History Tab */}
          <Tabs.Panel value="history" pt="lg">
            <Stack gap="lg">
              <Alert icon={<IconHistory size={16} />} title="Lookup History" color="green" variant="light">
                Your recent tenant lookups are cached for quick access
              </Alert>
              
              {lookupHistory.length > 0 ? (
                <Grid gutter="md">
                  {lookupHistory.map((item, index) => (
                    <Grid.Col key={index} span={{ base: 12, sm: 6, md: 4 }}>
                      <Card withBorder p="md" radius="md" style={{ cursor: 'pointer' }} onClick={() => handleHistoryClick(item)}>
                        <Stack gap="xs">
                          <Group justify="space-between">
                            <Text fw={500} size="sm">{item.domain}</Text>
                            <Badge variant="light" color="blue" size="xs">
                              {new Date(item.timestamp).toLocaleDateString()}
                            </Badge>
                          </Group>
                          <Text size="xs" c="dimmed" lineClamp={1}>
                            Tenant ID: {item.tenantId}
                          </Text>
                          <Button variant="light" size="xs" fullWidth>
                            Load Tenant
                          </Button>
                        </Stack>
                      </Card>
                    </Grid.Col>
                  ))}
                </Grid>
              ) : (
                <Alert icon={<IconInfoCircle size={16} />} title="No History" color="gray" variant="light">
                  No recent tenant lookups found. Perform a lookup to see it here.
                </Alert>
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Paper>
  );
};

export default MicrosoftPortalsTool; 