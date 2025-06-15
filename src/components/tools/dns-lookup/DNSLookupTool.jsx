import React, { useState, useEffect } from 'react';
import {
  Paper,
  Stack,
  Title,
  ThemeIcon,
  Group,
  Text,
  Tabs,
  Alert,
  Badge,
  Button,
  Select,
  TextInput,
  Grid,
  Card,
  JsonInput,
  Code,
  Timeline,
  ActionIcon,
  Tooltip,
  LoadingOverlay,
  Divider,
  Autocomplete,
  useMantineColorScheme
} from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { useParams, Link } from 'react-router-dom';
import SEOHead from '../../common/SEOHead';
import { generateToolSEO } from '../../../utils/seoUtils';
import toolsConfig from '../../../utils/toolsConfig.json';
import {
  IconWorld,
  IconInfoCircle,
  IconHistory,
  IconDownload,
  IconTrash,
  IconSearch,
  IconCopy,
  IconRefresh,
  IconExternalLink
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { getApiEndpoint, buildApiUrl, apiFetch } from '../../../utils/api/apiUtils';
import DNSIcon from './DNSIcon';
import { useTLDs } from '../../../utils';

const DNS_RECORD_TYPES = [
  { value: 'A', label: 'A Record (IPv4)' },
  { value: 'AAAA', label: 'AAAA Record (IPv6)' },
  { value: 'MX', label: 'MX Record (Mail Exchange)' },
  { value: 'TXT', label: 'TXT Record (Text)' },
  { value: 'CNAME', label: 'CNAME Record (Alias)' },
  { value: 'NS', label: 'NS Record (Name Server)' },
  { value: 'SOA', label: 'SOA Record (Start of Authority)' },
  { value: 'PTR', label: 'PTR Record (Reverse DNS)' },
  { value: 'SRV', label: 'SRV Record (Service)' },
  { value: 'CAA', label: 'CAA Record (Certificate Authority)' }
];

const DNS_PROVIDERS = [
  { value: 'google', label: 'Google DNS (8.8.8.8)', server: '8.8.8.8' },
  { value: 'cloudflare', label: 'Cloudflare DNS (1.1.1.1)', server: '1.1.1.1' },
  { value: 'opendns', label: 'OpenDNS (208.67.222.222)', server: '208.67.222.222' },
  { value: 'auto', label: 'Browser Default', server: 'auto' }
];

const DNSLookupTool = () => {
  const [domain, setDomain] = useState('');
  const [recordType, setRecordType] = useState('A');
  const [dnsProvider, setDnsProvider] = useState('google');
  const [lookupResults, setLookupResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autocompleteData, setAutocompleteData] = useState([]);
  const { colorScheme } = useMantineColorScheme();

  // Get tool configuration for SEO
  const toolConfig = toolsConfig.find(tool => tool.id === 'dns-lookup');
  const seoData = generateToolSEO(toolConfig);
  
  // Use TLD utilities hook for domain autocomplete (with error handling)
  let tldHookResult = {};
  try {
    tldHookResult = useTLDs() || {};
  } catch (error) {
    console.error('Error loading TLD utilities:', error);
    tldHookResult = {};
  }
  const { generateSubdomainSuggestions, isReady: tldReady } = tldHookResult;

  // Get domain from URL parameters
  const { domain: urlDomain } = useParams();

  // DNS lookup history and caching
  const [lookupHistory, setLookupHistory] = useLocalStorage({
    key: 'dns-lookup-history',
    defaultValue: []
  });

  const [dnsCache, setDnsCache] = useLocalStorage({
    key: 'dns-lookup-cache',
    defaultValue: {}
  });

  // Cache duration in milliseconds (5 minutes for DNS)
  const CACHE_DURATION = 5 * 60 * 1000;

  // Effect to update autocomplete data when domain changes
  useEffect(() => {
    if (tldReady && generateSubdomainSuggestions) {
      try {
        const suggestions = generateSubdomainSuggestions(domain, 10);
        setAutocompleteData(Array.isArray(suggestions) ? suggestions : []);
      } catch (error) {
        console.error('Error generating domain suggestions:', error);
        setAutocompleteData([]);
      }
    } else {
      setAutocompleteData([]);
    }
  }, [domain, tldReady]); // Removed generateSubdomainSuggestions to prevent infinite loop

  // Effect to handle URL domain parameter
  useEffect(() => {
    if (urlDomain && urlDomain.trim()) {
      const decodedDomain = decodeURIComponent(urlDomain);
      setDomain(decodedDomain);
      performDNSLookup(decodedDomain, recordType, dnsProvider);
    }
  }, [urlDomain]); // eslint-disable-line react-hooks/exhaustive-deps

  // Helper function to check if cached data is still valid
  const isCacheValid = (cachedData) => {
    if (!cachedData || !cachedData.timestamp) return false;
    return (Date.now() - cachedData.timestamp) < CACHE_DURATION;
  };

  // Helper function to add lookup to history
  const addToHistory = (domain, recordType, provider, results) => {
    const historyItem = {
      domain,
      recordType,
      provider,
      timestamp: Date.now(),
      recordCount: results?.answer?.length || 0,
      status: results?.status || 'Success'
    };

    const filteredHistory = lookupHistory.filter(
      item => !(item.domain === domain && item.recordType === recordType && item.provider === provider)
    );
    const newHistory = [historyItem, ...filteredHistory].slice(0, 100);
    setLookupHistory(newHistory);
  };

  // Helper function to cache DNS data
  const cacheDNSData = (domain, recordType, provider, data) => {
    const cacheKey = `${domain}-${recordType}-${provider}`;
    const cacheItem = {
      ...data,
      timestamp: Date.now()
    };
    setDnsCache(prev => ({
      ...prev,
      [cacheKey]: cacheItem
    }));
  };

  // Function to perform DNS lookup using DNS over HTTPS
  const performDNSLookup = async (domainToLookup, type, provider) => {
    setLoading(true);
    setError(null);
    setLookupResults(null);

    try {
      const cleanDomain = domainToLookup.trim().toLowerCase();
      const cacheKey = `${cleanDomain}-${type}-${provider}`;

      // Check cache first
      const cachedData = dnsCache[cacheKey];
      if (cachedData && isCacheValid(cachedData)) {
        console.log(`📦 Using cached DNS data for: ${cleanDomain}`);
        setLookupResults(cachedData);
        addToHistory(cleanDomain, type, provider, cachedData);
        setLoading(false);
        return;
      }

      console.log(`🔍 Performing DNS lookup for: ${cleanDomain} (${type}) via ${provider}`);

      let dnsConfig;
      let dohUrl;

      // Set up DNS over HTTPS URL based on provider
      switch (provider) {
        case 'google':
          dnsConfig = getApiEndpoint('dns', 'google');
          dohUrl = dnsConfig.url;
          break;
        case 'cloudflare':
          dnsConfig = getApiEndpoint('dns', 'cloudflare');
          dohUrl = dnsConfig.url;
          break;
        case 'opendns':
          // OpenDNS doesn't have a public DoH JSON API, fallback to Google
          dnsConfig = getApiEndpoint('dns', 'opendns');
          dohUrl = dnsConfig.url;
          console.log('📝 OpenDNS DoH not available, using Google DNS as fallback');
          break;
        default:
          dnsConfig = getApiEndpoint('dns', 'google');
          dohUrl = dnsConfig.url;
      }

      const apiUrl = buildApiUrl(dohUrl, {
        name: cleanDomain,
        type: type,
        cd: false, // Don't check DNSSEC
        ct: 'application/dns-json'
      });

      const response = await apiFetch(apiUrl, {
        headers: {
          ...dnsConfig.headers,
          'Accept': 'application/dns-json'
        }
      });

      if (!response.ok) {
        // Try fallback to Google DNS if other providers fail
        if (provider !== 'google') {
          console.log(`⚠️ ${provider} failed, falling back to Google DNS`);
          const fallbackConfig = getApiEndpoint('dns', 'google');
          const fallbackUrl = buildApiUrl(fallbackConfig.url, {
            name: cleanDomain,
            type: type,
            cd: false,
            ct: 'application/dns-json'
          });
          const fallbackResponse = await apiFetch(fallbackUrl, {
            headers: {
              ...fallbackConfig.headers,
              'Accept': 'application/dns-json'
            }
          });
          
          if (!fallbackResponse.ok) {
            throw new Error(`DNS lookup failed: ${response.status} ${response.statusText}`);
          }
          
          const fallbackData = await fallbackResponse.json();
          
          // Process fallback results but indicate the original provider failed
          const processedResults = {
            ...fallbackData,
            domain: cleanDomain,
            recordType: type,
            provider: `${provider} (fallback: google)`,
            timestamp: Date.now(),
            status: fallbackData.Status === 0 ? 'Success' : 'Error',
            statusCode: fallbackData.Status,
            query: {
              name: cleanDomain,
              type: type,
              provider: provider
            }
          };

          setLookupResults(processedResults);
          cacheDNSData(cleanDomain, type, provider, processedResults);
          addToHistory(cleanDomain, type, provider, processedResults);

          notifications.show({
            title: 'DNS Lookup Complete (Fallback)',
            message: `${provider} failed, used Google DNS. Found ${fallbackData.Answer?.length || 0} records`,
            color: 'yellow',
            icon: <DNSIcon size={16} />
          });
          
          return;
        }
        
        throw new Error(`DNS lookup failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Process and enhance the response data
      const processedResults = {
        ...data,
        domain: cleanDomain,
        recordType: type,
        provider: provider,
        timestamp: Date.now(),
        status: data.Status === 0 ? 'Success' : 'Error',
        statusCode: data.Status,
        query: {
          name: cleanDomain,
          type: type,
          provider: provider
        }
      };

      setLookupResults(processedResults);
      cacheDNSData(cleanDomain, type, provider, processedResults);
      addToHistory(cleanDomain, type, provider, processedResults);

      notifications.show({
        title: 'DNS Lookup Complete',
        message: `Found ${data.Answer?.length || 0} records for ${cleanDomain}`,
        color: 'green',
        icon: <DNSIcon size={16} />
      });

    } catch (err) {
      console.error('💥 DNS Lookup Error:', err);
      const errorMessage = err.message || 'Failed to perform DNS lookup';
      setError(errorMessage);
      
      notifications.show({
        title: 'DNS Lookup Failed',
        message: errorMessage,
        color: 'red',
        icon: <IconInfoCircle size={16} />
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = () => {
    if (!domain.trim()) {
      notifications.show({
        title: 'Invalid Input',
        message: 'Please enter a domain name',
        color: 'orange'
      });
      return;
    }
    performDNSLookup(domain, recordType, dnsProvider);
  };

  const handleHistoryItemClick = (historyItem) => {
    setDomain(historyItem.domain);
    setRecordType(historyItem.recordType);
    setDnsProvider(historyItem.provider);
    performDNSLookup(historyItem.domain, historyItem.recordType, historyItem.provider);
  };

  const clearHistory = () => {
    setLookupHistory([]);
    setDnsCache({});
    notifications.show({
      title: 'History Cleared',
      message: 'All DNS lookup history and cache cleared',
      color: 'blue'
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    notifications.show({
      title: 'Copied',
      message: 'Copied to clipboard',
      color: 'green'
    });
  };

  const exportResults = () => {
    if (!lookupResults) return;
    
    const dataStr = JSON.stringify(lookupResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dns-lookup-${lookupResults.domain}-${lookupResults.recordType}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Helper function to detect if a string is an IP address
  const isIPAddress = (str) => {
    // IPv4 regex
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    // IPv6 regex (simplified)
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
    return ipv4Regex.test(str) || ipv6Regex.test(str);
  };

  const formatDNSRecord = (record) => {
    switch (record.type) {
      case 1: // A
        return `${record.name} → ${record.data}`;
      case 28: // AAAA
        return `${record.name} → ${record.data}`;
      case 5: // CNAME
        return `${record.name} → ${record.data}`;
      case 15: // MX
        return `${record.name} → ${record.data} (Priority: ${record.priority || 'N/A'})`;
      case 16: // TXT
        return `${record.name} → "${record.data}"`;
      case 2: // NS
        return `${record.name} → ${record.data}`;
      case 6: // SOA
        return `${record.name} → ${record.data}`;
      case 12: // PTR
        return `${record.name} → ${record.data}`;
      case 33: // SRV
        return `${record.name} → ${record.data}`;
      case 257: // CAA
        return `${record.name} → ${record.data}`;
      default:
        return `${record.name} → ${record.data}`;
    }
  };

  // Component to render DNS record with WHOIS link for IP addresses
  const DNSRecordDisplay = ({ record }) => {
    const recordText = formatDNSRecord(record);
    const isIP = isIPAddress(record.data);
    
    return (
      <Group justify="space-between" align="center" w="100%">
        <Code block style={{ flex: 1 }}>{recordText}</Code>
        <Group gap="xs">
          {isIP && (
            <Tooltip label={`WHOIS lookup for ${record.data}`}>
              <ActionIcon
                size="sm"
                variant="light"
                color="blue"
                component={Link}
                to={`/whois-lookup/${record.data}`}
              >
                <IconExternalLink size={14} />
              </ActionIcon>
            </Tooltip>
          )}
          <Tooltip label="Copy record">
            <ActionIcon
              size="sm"
              variant="light"
              onClick={() => copyToClipboard(recordText)}
            >
              <IconCopy size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
    );
  };

  return (
    <>
      <SEOHead {...seoData} />
      <Paper p="xl" radius="lg" withBorder>
      <LoadingOverlay visible={loading} overlayProps={{ radius: 'sm', blur: 2 }} />
      
      <Stack gap="xl">
        {/* Header */}
        <Group gap="md">
          <ThemeIcon size={48} radius="md" variant="light" color="indigo">
            <DNSIcon size={28} />
          </ThemeIcon>
          <div>
            <Title order={2} fw={600}>
              DNS Lookup Tool
            </Title>
            <Text size="sm" c="dimmed">
              Perform DNS queries for various record types using different DNS providers
            </Text>
          </div>
        </Group>

        {/* Lookup Form */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Autocomplete
                label="Domain Name"
                placeholder="example.com or mail.example.com"
                value={domain}
                onChange={setDomain}
                onKeyPress={(event) => event.key === 'Enter' && handleLookup()}
                leftSection={<IconWorld size={16} />}
                data={autocompleteData || []}
                limit={10}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Select
                label="Record Type"
                value={recordType}
                onChange={setRecordType}
                data={DNS_RECORD_TYPES}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Select
                label="DNS Provider"
                value={dnsProvider}
                onChange={setDnsProvider}
                data={DNS_PROVIDERS}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 2 }}>
              <Button
                fullWidth
                leftSection={<IconSearch size={16} />}
                onClick={handleLookup}
                disabled={loading}
                style={{ marginTop: 25 }}
              >
                Lookup
              </Button>
            </Grid.Col>
          </Grid>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert
            icon={<IconInfoCircle size={16} />}
            title="DNS Lookup Error"
            color="red"
            variant="filled"
          >
            {error}
          </Alert>
        )}

        {/* Results */}
        {lookupResults && (
          <Tabs defaultValue="results">
            <Tabs.List>
              <Tabs.Tab value="results" leftSection={<DNSIcon size={16} />}>
                DNS Records
              </Tabs.Tab>
              <Tabs.Tab value="details" leftSection={<IconInfoCircle size={16} />}>
                Query Details
              </Tabs.Tab>
              <Tabs.Tab value="raw" leftSection={<IconWorld size={16} />}>
                Raw Response
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="results" pt="xs">
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between" mb="md">
                  <Text size="lg" fw={500}>DNS Records</Text>
                  <Group>
                    <Badge color={lookupResults.status === 'Success' ? 'green' : 'red'}>
                      {lookupResults.status}
                    </Badge>
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconDownload size={14} />}
                      onClick={exportResults}
                    >
                      Export
                    </Button>
                  </Group>
                </Group>

                {lookupResults.Answer && lookupResults.Answer.length > 0 ? (
                  <Stack spacing="sm">
                    {lookupResults.Answer.map((record, index) => (
                      <div key={index} style={{ 
                        padding: 'var(--mantine-spacing-sm)', 
                        backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-0)', 
                        borderRadius: 'var(--mantine-radius-sm)' 
                      }}>
                        <DNSRecordDisplay record={record} />
                      </div>
                    ))}
                  </Stack>
                ) : (
                  <Alert icon={<IconInfoCircle size={16} />} title="No Records Found">
                    No DNS records of type {recordType} found for {lookupResults.domain}
                  </Alert>
                )}
              </Card>
            </Tabs.Panel>

            <Tabs.Panel value="details" pt="xs">
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Text size="lg" fw={500} mb="md">Query Details</Text>
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text size="sm" c="dimmed">Domain</Text>
                    <Text fw={500}>{lookupResults.domain}</Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text size="sm" c="dimmed">Record Type</Text>
                    <Text fw={500}>{lookupResults.recordType}</Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text size="sm" c="dimmed">DNS Provider</Text>
                    <Text fw={500}>{DNS_PROVIDERS.find(p => p.value === lookupResults.provider)?.label}</Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text size="sm" c="dimmed">Status Code</Text>
                    <Text fw={500}>{lookupResults.statusCode}</Text>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Text size="sm" c="dimmed">Query Time</Text>
                    <Text fw={500}>{new Date(lookupResults.timestamp).toLocaleString()}</Text>
                  </Grid.Col>
                </Grid>
              </Card>
            </Tabs.Panel>

            <Tabs.Panel value="raw" pt="xs">
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between" mb="md">
                  <Text size="lg" fw={500}>Raw DNS Response</Text>
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconCopy size={14} />}
                    onClick={() => copyToClipboard(JSON.stringify(lookupResults, null, 2))}
                  >
                    Copy JSON
                  </Button>
                </Group>
                <JsonInput
                  value={JSON.stringify(lookupResults, null, 2)}
                  minRows={10}
                  maxRows={20}
                  readOnly
                  formatOnBlur
                />
              </Card>
            </Tabs.Panel>
          </Tabs>
        )}

        {/* History */}
        {lookupHistory.length > 0 && (
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Text size="lg" fw={500} leftSection={<IconHistory size={18} />}>
                Recent Lookups
              </Text>
              <Button
                size="xs"
                variant="light"
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={clearHistory}
              >
                Clear History
              </Button>
            </Group>
            
            <Timeline active={-1} bulletSize={24} lineWidth={2}>
              {lookupHistory.slice(0, 10).map((item, index) => (
                <Timeline.Item
                  key={index}
                  title={
                    <Group>
                      <Text fw={500}>{item.domain}</Text>
                      <Badge size="xs" color="blue">{item.recordType}</Badge>
                      <Badge size="xs" color="gray">{item.provider}</Badge>
                    </Group>
                  }
                  bullet={<DNSIcon size={12} />}
                >
                  <Text size="xs" c="dimmed">
                    {new Date(item.timestamp).toLocaleString()} • {item.recordCount} records
                  </Text>
                  <Button
                    size="xs"
                    variant="light"
                    mt="xs"
                    leftSection={<IconRefresh size={14} />}
                    onClick={() => handleHistoryItemClick(item)}
                  >
                    Repeat Lookup
                  </Button>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        )}
      </Stack>
    </Paper>
    </>
  );
};

export default DNSLookupTool; 