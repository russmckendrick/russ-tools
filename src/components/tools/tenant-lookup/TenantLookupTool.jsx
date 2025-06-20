import React, { useState, useEffect } from 'react';
import { 
  Title, 
  Text, 
  TextInput, 
  Button, 
  Card, 
  Stack, 
  Group, 
  Badge, 
  Alert, 
  Loader,
  Paper,
  Divider,
  CopyButton,
  ActionIcon,
  Tooltip,
  Grid,
  Code,
  Collapse,
  ThemeIcon,
  useMantineColorScheme,
  Tabs,
  Modal
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { 
  IconSearch, 
  IconCopy, 
  IconCheck, 
  IconAlertCircle, 
  IconBuilding,
  IconWorld,
  IconShield,
  IconChevronDown,
  IconChevronUp,
  IconInfoCircle,
  IconExternalLink,
  IconDeviceFloppy,
  IconHistory,
  IconTrash
} from '@tabler/icons-react';
import { useParams, Link } from 'react-router-dom';
import { useLocalStorage } from '@mantine/hooks';
import { getApiEndpoint, buildApiUrl, apiFetch } from '../../../utils/api/apiUtils';
import TenantLookupIcon from './TenantLookupIcon';
import SEOHead from '../../common/SEOHead';
import { generateToolSEO } from '../../../utils/seoUtils';
import toolsConfig from '../../../utils/toolsConfig.json';

const TenantLookupTool = () => {
  // Get tool configuration for SEO
  const toolConfig = toolsConfig.find(tool => tool.id === 'tenant-lookup');
  const seoData = generateToolSEO(toolConfig);

  const { domain: urlDomain } = useParams();
  const { colorScheme } = useMantineColorScheme();
  const [domain, setDomain] = useState(urlDomain || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showRawData, setShowRawData] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ opened: false, id: null });
  
  // Saved lookups storage
  const [savedLookups, setSavedLookups] = useLocalStorage({
    key: 'tenant-lookup-saved',
    defaultValue: []
  });

  // Auto-lookup if domain is provided in URL
  useEffect(() => {
    if (urlDomain && urlDomain.trim()) {
      setDomain(urlDomain);
      handleLookup(urlDomain);
    }
  }, [urlDomain]);

  const extractDomain = (input) => {
    if (!input || typeof input !== 'string') return '';
    
    const trimmed = input.trim();
    
    // If it contains @, treat as email and extract domain
    if (trimmed.includes('@')) {
      const parts = trimmed.split('@');
      return parts[parts.length - 1].toLowerCase();
    }
    
    // Otherwise return as-is (assuming it's already a domain)
    return trimmed.toLowerCase();
  };

  const handleLookup = async (inputDomain = domain) => {
    const cleanDomain = extractDomain(inputDomain);
    
    if (!cleanDomain.trim()) {
      setError('Please enter a domain name or email address');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const tenantConfig = getApiEndpoint('tenant');
      const apiUrl = buildApiUrl(tenantConfig.url, { domain: cleanDomain });
      
      const response = await apiFetch(apiUrl, {
        method: 'GET',
        headers: {
          ...tenantConfig.headers,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          setResult(data);
          notifications.show({
            title: 'Tenant Lookup Complete',
            message: `Found tenant information for ${cleanDomain}`,
            color: 'green',
            icon: <IconBuilding size={16} />
          });
        } else {
          setError(data.error || 'Tenant lookup failed');
          notifications.show({
            title: 'Tenant Lookup Failed',
            message: data.error || 'Unable to find tenant information',
            color: 'red',
            icon: <IconAlertCircle size={16} />
          });
        }
      } else {
        setError(`Request failed with status ${response.status}`);
        notifications.show({
          title: 'Lookup Request Failed',
          message: `Server returned status ${response.status}`,
          color: 'red',
          icon: <IconAlertCircle size={16} />
        });
      }
    } catch (err) {
      console.error('Tenant lookup error:', err);
      
      // Provide more helpful error messages for common issues
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        setError('Unable to connect to the tenant lookup service. This may be due to CORS restrictions or network connectivity issues.');
      } else if (err.message.includes('CORS')) {
        setError('Cross-origin request blocked. The tenant lookup service may need to be configured to allow requests from this domain.');
      } else {
        setError(`Network error: ${err.message}`);
      }
      
      notifications.show({
        title: 'Network Error',
        message: 'Unable to connect to tenant lookup service',
        color: 'red',
        icon: <IconAlertCircle size={16} />
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleLookup();
    }
  };

  // Save current lookup result
  const handleSaveLookup = () => {
    if (!result) return;
    
    const savedLookup = {
      id: Date.now().toString(),
      domain: result.domain,
      tenantId: result.tenantId,
      displayName: result.displayName,
      savedAt: Date.now(),
      fullResult: result
    };
    
    setSavedLookups(prev => [savedLookup, ...prev]);
    
    notifications.show({
      title: 'Lookup Saved',
      message: `Tenant information for ${result.domain} has been saved`,
      color: 'green',
      icon: <IconDeviceFloppy size={16} />
    });
  };

  // Load saved lookup
  const handleLoadLookup = (savedLookup) => {
    setResult(savedLookup.fullResult);
    setDomain(savedLookup.domain);
    setError(null);
    
    notifications.show({
      title: 'Lookup Loaded',
      message: `Loaded saved tenant information for ${savedLookup.domain}`,
      color: 'blue',
      icon: <IconHistory size={16} />
    });
  };

  // Delete saved lookup
  const handleDeleteLookup = (id) => {
    setSavedLookups(prev => prev.filter(lookup => lookup.id !== id));
    setDeleteModal({ opened: false, id: null });
    
    notifications.show({
      title: 'Lookup Deleted',
      message: 'Saved tenant lookup has been removed',
      color: 'orange',
      icon: <IconTrash size={16} />
    });
  };

  // Clear all saved lookups
  const handleClearAllSaved = () => {
    setSavedLookups([]);
    
    notifications.show({
      title: 'All Lookups Cleared',
      message: 'All saved tenant lookups have been removed',
      color: 'orange',
      icon: <IconTrash size={16} />
    });
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTenantTypeColor = (tenantType) => {
    switch (tenantType) {
      case 'AAD': return 'blue';
      case 'B2C': return 'green';
      case 'AADB2C': return 'green';
      default: return 'gray';
    }
  };

  const renderTenantInfo = () => {
    if (!result) return null;

    return (
      <Stack gap="lg">
        {/* Main Tenant Information */}
        <Card withBorder radius="md" p="lg">
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              <div>
                <Title order={3} mb="xs">
                  <Group gap="sm">
                    <ThemeIcon size="lg" color="blue" variant="light">
                      <IconBuilding size={20} />
                    </ThemeIcon>
                    {result.displayName || result.domain}
                  </Group>
                </Title>
                <Text c="dimmed" size="sm">
                  Tenant ID: {result.tenantId}
                </Text>
              </div>
              <Tooltip label="Copy Tenant ID">
                <ActionIcon 
                  color="gray" 
                  onClick={() => {
                    navigator.clipboard.writeText(result.tenantId);
                    notifications.show({
                      title: 'Tenant ID Copied',
                      message: 'Tenant ID has been copied to clipboard',
                      color: 'green',
                      icon: <IconCopy size={16} />
                    });
                  }}
                  variant="light"
                >
                  <IconCopy size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>

            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Stack gap="xs">
                  <Text size="sm" fw={500}>Domain</Text>
                  <Code>{result.domain}</Code>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Stack gap="xs">
                  <Text size="sm" fw={500}>Default Domain</Text>
                  <Code>{result.defaultDomainName || 'N/A'}</Code>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Stack gap="xs">
                  <Text size="sm" fw={500}>Tenant Type</Text>
                  <Badge color={getTenantTypeColor(result.tenantType)} variant="light">
                    {result.tenantType}
                  </Badge>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Stack gap="xs">
                  <Text size="sm" fw={500}>Category</Text>
                  <Badge color="gray" variant="light">
                    {result.tenantCategory || 'Unknown'}
                  </Badge>
                </Stack>
              </Grid.Col>
            </Grid>

            {result.federationBrandName && (
              <Stack gap="xs">
                <Text size="sm" fw={500}>Federation Brand</Text>
                <Text size="sm">{result.federationBrandName}</Text>
              </Stack>
            )}

            <Group gap="xs">
              <Badge color={result.isCloudOnly ? 'green' : 'orange'} variant="light">
                {result.isCloudOnly ? 'Cloud Only' : 'Hybrid'}
              </Badge>
              <Badge color="blue" variant="light">
                {result.method}
              </Badge>
            </Group>
          </Stack>
        </Card>

        {/* DNS Information */}
        {result.dnsInfo && (
          <Card withBorder radius="md" p="lg">
            <Stack gap="md">
              <Group gap="sm">
                <ThemeIcon size="lg" color="indigo" variant="light">
                  <IconWorld size={20} />
                </ThemeIcon>
                <Title order={4}>DNS Information</Title>
              </Group>

              <Grid>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500}>Exchange Online</Text>
                    <Badge color={result.dnsInfo.hasExchangeOnline ? 'green' : 'red'} variant="light">
                      {result.dnsInfo.hasExchangeOnline ? 'Detected' : 'Not Detected'}
                    </Badge>
                  </Stack>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500}>Office 365 SPF</Text>
                    <Badge color={result.dnsInfo.hasOffice365SPF ? 'green' : 'red'} variant="light">
                      {result.dnsInfo.hasOffice365SPF ? 'Detected' : 'Not Detected'}
                    </Badge>
                  </Stack>
                </Grid.Col>
              </Grid>

              {result.dnsInfo.mxRecords && result.dnsInfo.mxRecords.length > 0 && (
                <Stack gap="xs">
                  <Text size="sm" fw={500}>MX Records</Text>
                  <Stack gap="xs">
                    {result.dnsInfo.mxRecords.map((mx, index) => (
                      <Code key={index} block>
                        {mx.priority} {mx.exchange}
                      </Code>
                    ))}
                  </Stack>
                </Stack>
              )}

              {result.dnsInfo.txtRecords && result.dnsInfo.txtRecords.length > 0 && (
                <Stack gap="xs">
                  <Text size="sm" fw={500}>TXT Records ({result.dnsInfo.txtRecords.length})</Text>
                  <Collapse in={showRawData}>
                    <Stack gap="xs">
                      {result.dnsInfo.txtRecords.map((txt, index) => (
                        <Code key={index} block>
                          {txt}
                        </Code>
                      ))}
                    </Stack>
                  </Collapse>
                  <Button
                    variant="subtle"
                    size="xs"
                    leftSection={showRawData ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
                    onClick={() => setShowRawData(!showRawData)}
                  >
                    {showRawData ? 'Hide' : 'Show'} TXT Records
                  </Button>
                </Stack>
              )}
            </Stack>
          </Card>
        )}

        {/* User Realm Information */}
        {result.userRealm && (
          <Card withBorder radius="md" p="lg">
            <Stack gap="md">
              <Group gap="sm">
                <ThemeIcon size="lg" color="green" variant="light">
                  <IconShield size={20} />
                </ThemeIcon>
                <Title order={4}>User Realm Details</Title>
              </Group>

              <Grid>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500}>Namespace Type</Text>
                    <Code>{result.userRealm.NameSpaceType}</Code>
                  </Stack>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500}>Cloud Instance</Text>
                    <Code>{result.userRealm.CloudInstanceName}</Code>
                  </Stack>
                </Grid.Col>
              </Grid>

              {result.userRealm.FederationBrandName && (
                <Stack gap="xs">
                  <Text size="sm" fw={500}>Federation Brand Name</Text>
                  <Code>{result.userRealm.FederationBrandName}</Code>
                </Stack>
              )}
            </Stack>
          </Card>
        )}

        {/* Metadata */}
        <Paper 
          p="md" 
          withBorder 
          radius="md" 
          style={{
            backgroundColor: colorScheme === 'dark' 
              ? 'var(--mantine-color-dark-6)' 
              : 'var(--mantine-color-gray-0)'
          }}
        >
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <IconInfoCircle size={16} />
              <Text size="sm" c="dimmed">
                Lookup completed at {formatTimestamp(result.timestamp)}
              </Text>
            </Group>
            <Group gap="xs">
              <Button
                size="xs"
                variant="light"
                leftSection={<IconDeviceFloppy size={14} />}
                onClick={handleSaveLookup}
                color="blue"
              >
                Save Lookup
              </Button>
              <Button
                size="xs"
                variant="light"
                leftSection={<IconCopy size={14} />}
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                  notifications.show({
                    title: 'JSON Data Copied',
                    message: 'Complete tenant information copied as JSON',
                    color: 'green',
                    icon: <IconCopy size={16} />
                  });
                }}
              >
                Copy JSON
              </Button>
            </Group>
          </Group>
        </Paper>
      </Stack>
    );
  };

  return (
    <>
      <SEOHead {...seoData} />
      <Paper p="xl" radius="lg" withBorder>
      <Stack gap="xl">
        {/* Header */}
        <Group gap="md">
          <ThemeIcon size={48} radius="md" variant="light" color="blue">
            <TenantLookupIcon size={28} />
          </ThemeIcon>
          <div>
            <Title order={2} fw={600}>Microsoft Tenant Lookup</Title>
            <Text size="sm" c="dimmed">
              Discover Microsoft tenant information for any domain. Get tenant ID, organization details, 
              DNS configuration, and authentication settings.
            </Text>
            <Badge variant="light" size="sm" mt="xs" color="blue">
              API Integration
            </Badge>
          </div>
        </Group>

        <Tabs defaultValue="lookup">
          <Tabs.List mb="lg">
            <Tabs.Tab value="lookup" leftSection={<IconSearch size={18} />}>
              Tenant Lookup
            </Tabs.Tab>
            <Tabs.Tab value="saved" leftSection={<IconHistory size={18} />}>
              Saved Lookups
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="lookup" pt="lg">
            <Stack gap="lg">
        
        {/* Search Form */}
        <Card withBorder radius="md" p="lg">
          <Stack gap="md">
            <TextInput
              label="Domain or Email Address"
              placeholder="Enter domain (e.g., contoso.com) or email (user@contoso.com)"
              value={domain}
              onChange={(event) => setDomain(event.currentTarget.value)}
              onKeyPress={handleKeyPress}
              size="md"
              leftSection={<IconSearch size={16} />}
              disabled={loading}
            />
            
            <Group justify="flex-end">
              <Button
                onClick={() => handleLookup()}
                loading={loading}
                leftSection={!loading && <IconSearch size={16} />}
                size="md"
              >
                {loading ? 'Looking up...' : 'Lookup Tenant'}
              </Button>
            </Group>
          </Stack>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert 
            icon={<IconAlertCircle size={16} />} 
            title="Lookup Failed" 
            color="red"
            variant="light"
          >
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Card withBorder radius="md" p="xl">
            <Group justify="center">
              <Loader size="md" />
              <Text>Looking up tenant information...</Text>
            </Group>
          </Card>
        )}

        {/* Results */}
        {result && renderTenantInfo()}

        {/* Microsoft Portals Link */}
        {result && (
          <Card withBorder radius="md" p="lg">
            <Group justify="space-between" align="center">
              <div>
                <Text fw={500} mb="xs">Need Microsoft Portal Links?</Text>
                <Text size="sm" c="dimmed">
                  Generate tenant-specific deep links to Microsoft admin portals for this domain.
                </Text>
              </div>
              <Button
                component={Link}
                to={`/microsoft-portals/${encodeURIComponent(result.domain)}`}
                leftSection={<IconExternalLink size={16} />}
                variant="light"
                color="indigo"
              >
                View Microsoft Portals (GDAP)
              </Button>
            </Group>
          </Card>
        )}

        {/* Usage Information */}
        <Card 
          withBorder 
          radius="md" 
          p="lg" 
          style={{
            backgroundColor: colorScheme === 'dark' 
              ? 'var(--mantine-color-dark-7)' 
              : 'var(--mantine-color-blue-0)'
          }}
        >
          <Stack gap="md">
            <Group gap="sm">
              <IconInfoCircle size={20} color="blue" />
              <Title order={4} c="blue">How it works</Title>
            </Group>
            <Text size="sm" c="dimmed">
              This tool queries Microsoft's public APIs to discover tenant information associated with a domain. 
              It uses multiple methods including Microsoft Graph API, GetUserRealm API, and DNS analysis to 
              provide comprehensive tenant details. All lookups are performed server-side through a secure 
              Cloudflare Worker to avoid CORS issues.
            </Text>
            <Text size="sm" c="dimmed">
              <strong>Supported inputs:</strong> Domain names (contoso.com) or email addresses (user@contoso.com)
            </Text>
          </Stack>
        </Card>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="saved" pt="lg">
            <Stack gap="lg">
              {savedLookups.length === 0 ? (
                <Card withBorder radius="md" p="xl">
                  <Stack align="center" gap="md">
                    <IconHistory size={48} color="gray" opacity={0.5} />
                    <Text c="dimmed" ta="center">
                      No saved tenant lookups yet
                    </Text>
                    <Text size="sm" c="dimmed" ta="center">
                      Perform a lookup and click "Save Lookup" to store tenant information for quick access
                    </Text>
                  </Stack>
                </Card>
              ) : (
                <>
                  <Group justify="space-between" align="center">
                    <Text fw={500}>Saved Tenant Lookups ({savedLookups.length})</Text>
                    <Button
                      variant="light"
                      color="red"
                      size="sm"
                      leftSection={<IconTrash size={16} />}
                      onClick={handleClearAllSaved}
                    >
                      Clear All
                    </Button>
                  </Group>
                  
                  <Stack gap="md">
                    {savedLookups.map((lookup) => (
                      <Card key={lookup.id} withBorder radius="md" p="md">
                        <Group justify="space-between" align="flex-start">
                          <Stack gap="xs" style={{ flex: 1 }}>
                            <Group gap="sm" align="center">
                              <IconBuilding size={20} color="blue" />
                              <Text fw={600} size="md">{lookup.displayName || 'Unknown Organization'}</Text>
                              <Badge variant="light" color="blue" size="xs">
                                {lookup.domain}
                              </Badge>
                            </Group>
                            <Text size="sm" c="dimmed">
                              Tenant ID: {lookup.tenantId}
                            </Text>
                            <Text size="xs" c="dimmed">
                              Saved: {formatTimestamp(lookup.savedAt)}
                            </Text>
                          </Stack>
                          <Group gap="xs">
                            <Button
                              size="xs"
                              variant="light"
                              color="blue"
                              onClick={() => handleLoadLookup(lookup)}
                            >
                              Load
                            </Button>
                            <ActionIcon
                              variant="light"
                              color="red"
                              size="sm"
                              onClick={() => setDeleteModal({ opened: true, id: lookup.id })}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Group>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                </>
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Paper>

    {/* Delete Confirmation Modal */}
    <Modal
      opened={deleteModal.opened}
      onClose={() => setDeleteModal({ opened: false, id: null })}
      title="Delete Saved Lookup"
      centered
    >
      <Stack gap="md">
        <Text>Are you sure you want to delete this saved tenant lookup? This action cannot be undone.</Text>
        <Group justify="flex-end" gap="sm">
          <Button
            variant="outline"
            onClick={() => setDeleteModal({ opened: false, id: null })}
          >
            Cancel
          </Button>
          <Button
            color="red"
            onClick={() => handleDeleteLookup(deleteModal.id)}
          >
            Delete
          </Button>
        </Group>
      </Stack>
    </Modal>
    </>
  );
};

export default TenantLookupTool; 