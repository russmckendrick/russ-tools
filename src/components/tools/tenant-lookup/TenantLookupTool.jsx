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
  useMantineColorScheme
} from '@mantine/core';
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
  IconExternalLink
} from '@tabler/icons-react';
import { useParams, Link } from 'react-router-dom';
import { getApiEndpoint, buildApiUrl, apiFetch } from '../../../utils/apiUtils';
import TenantLookupIcon from './TenantLookupIcon';

const TenantLookupTool = () => {
  const { domain: urlDomain } = useParams();
  const { colorScheme } = useMantineColorScheme();
  const [domain, setDomain] = useState(urlDomain || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showRawData, setShowRawData] = useState(false);

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
          'Accept': 'application/json',
          'Origin': window.location.origin
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          setResult(data);
        } else {
          setError(data.error || 'Tenant lookup failed');
        }
      } else {
        setError(`Request failed with status ${response.status}`);
      }
    } catch (err) {
      console.error('Tenant lookup error:', err);
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleLookup();
    }
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
              <CopyButton value={result.tenantId}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? 'Copied!' : 'Copy Tenant ID'}>
                    <ActionIcon 
                      color={copied ? 'teal' : 'gray'} 
                      onClick={copy}
                      variant="light"
                    >
                      {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
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
            <CopyButton value={JSON.stringify(result, null, 2)}>
              {({ copied, copy }) => (
                <Button
                  size="xs"
                  variant="light"
                  leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                  onClick={copy}
                >
                  {copied ? 'Copied!' : 'Copy JSON'}
                </Button>
              )}
            </CopyButton>
          </Group>
        </Paper>
      </Stack>
    );
  };

  return (
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
    </Paper>
  );
};

export default TenantLookupTool; 