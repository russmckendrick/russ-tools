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
  TextInput,
  Grid,
  Card,
  Code,
  Timeline,
  ActionIcon,
  Tooltip,
  LoadingOverlay,
  Table,
  Divider,
  List,
  SimpleGrid,
  Autocomplete
} from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { useParams } from 'react-router-dom';
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
  IconMapPin,
  IconServer,
  IconCalendar,
  IconBuilding,
  IconFlag,
  IconNetwork,
  IconShield
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useMantineColorScheme } from '@mantine/core';
import { loadPrismLanguages, highlightCode } from '../../../utils/prismLoader';
import '../../../styles/prism-theme.css';
import { getApiEndpoint, buildApiUrl, apiFetch } from '../../../utils/api/apiUtils';
import WHOISIcon from './WHOISIcon';
import { useTLDs } from '../../../utils';

const WHOISLookupTool = () => {
  const [query, setQuery] = useState('');
  const [lookupResults, setLookupResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autocompleteData, setAutocompleteData] = useState([]);
  const { colorScheme } = useMantineColorScheme();

  // Get tool configuration for SEO
  const toolConfig = toolsConfig.find(tool => tool.id === 'whois-lookup');
  const seoData = generateToolSEO(toolConfig);
  
  // Use TLD utilities hook
  const { tldList, generateSuggestions, isReady: tldReady } = useTLDs();

  // Get query from URL parameters
  const { query: urlQuery } = useParams();

  // WHOIS lookup history and caching
  const [lookupHistory, setLookupHistory] = useLocalStorage({
    key: 'whois-lookup-history',
    defaultValue: []
  });

  const [whoisCache, setWhoisCache] = useLocalStorage({
    key: 'whois-lookup-cache',
    defaultValue: {}
  });

  // Cache duration in milliseconds (30 minutes for WHOIS)
  const CACHE_DURATION = 30 * 60 * 1000;

  // Effect to update autocomplete data when query changes
  useEffect(() => {
    if (tldReady) {
      const suggestions = generateSuggestions(query, 10);
      setAutocompleteData(suggestions);
    } else {
      setAutocompleteData([]);
    }
  }, [query, tldReady, generateSuggestions]);

  // Effect to handle URL query parameter
  useEffect(() => {
    if (urlQuery && urlQuery.trim()) {
      const decodedQuery = decodeURIComponent(urlQuery);
      setQuery(decodedQuery);
      performWHOISLookup(decodedQuery);
    }
  }, [urlQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load PrismJS languages on component mount
  useEffect(() => {
    loadPrismLanguages(['json']);
  }, []);

  // Helper function to check if cached data is still valid
  const isCacheValid = (cachedData) => {
    if (!cachedData || !cachedData.timestamp) return false;
    return (Date.now() - cachedData.timestamp) < CACHE_DURATION;
  };

  // Helper function to add lookup to history
  const addToHistory = (query, results) => {
    const historyItem = {
      query,
      type: results?.type || 'unknown',
      timestamp: Date.now(),
      status: results?.status || 'Unknown'
    };

    const filteredHistory = lookupHistory.filter(item => item.query !== query);
    const newHistory = [historyItem, ...filteredHistory].slice(0, 100);
    setLookupHistory(newHistory);
  };

  // Helper function to cache WHOIS data
  const cacheWHOISData = (query, data) => {
    const cacheItem = {
      ...data,
      timestamp: Date.now()
    };
    setWhoisCache(prev => ({
      ...prev,
      [query]: cacheItem
    }));
  };

  // Function to perform WHOIS lookup
  const performWHOISLookup = async (queryToLookup) => {
    setLoading(true);
    setError(null);
    setLookupResults(null);

    try {
      const cleanQuery = queryToLookup.trim().toLowerCase();

      // Check cache first
      const cachedData = whoisCache[cleanQuery];
      if (cachedData && isCacheValid(cachedData)) {
        console.log(`📦 Using cached WHOIS data for: ${cleanQuery}`);
        setLookupResults(cachedData);
        addToHistory(cleanQuery, cachedData);
        setLoading(false);
        return;
      }

      console.log(`🔍 Performing WHOIS lookup for: ${cleanQuery}`);

      const whoisConfig = getApiEndpoint('whois');
      const apiUrl = buildApiUrl(whoisConfig.url, { query: cleanQuery });

      const response = await apiFetch(apiUrl, {
        headers: {
          ...whoisConfig.headers,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`WHOIS lookup failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      setLookupResults(data);
      cacheWHOISData(cleanQuery, data);
      addToHistory(cleanQuery, data);

      notifications.show({
        title: 'WHOIS Lookup Complete',
        message: `Successfully retrieved ${data.type} information for ${cleanQuery}`,
        color: 'green',
        icon: <WHOISIcon size={16} />
      });

    } catch (err) {
      console.error('💥 WHOIS Lookup Error:', err);
      const errorMessage = err.message || 'Failed to perform WHOIS lookup';
      setError(errorMessage);
      
      notifications.show({
        title: 'WHOIS Lookup Failed',
        message: errorMessage,
        color: 'red',
        icon: <IconInfoCircle size={16} />
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = () => {
    if (!query.trim()) {
      notifications.show({
        title: 'Invalid Input',
        message: 'Please enter a domain name or IP address',
        color: 'orange'
      });
      return;
    }
    performWHOISLookup(query);
  };

  const handleHistoryItemClick = (historyItem) => {
    setQuery(historyItem.query);
    performWHOISLookup(historyItem.query);
  };

  const clearHistory = () => {
    setLookupHistory([]);
    setWhoisCache({});
    notifications.show({
      title: 'History Cleared',
      message: 'All WHOIS lookup history and cache cleared',
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
    link.download = `whois-lookup-${lookupResults.query}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Function to download domain expiration as iCal
  const downloadDomainExpiration = () => {
    if (!lookupResults?.normalized?.expires || lookupResults.type !== 'domain') return;

    const domain = lookupResults.normalized.domain;
    const expirationDate = new Date(lookupResults.normalized.expires);
    
    // Create reminder 30 days before expiration
    const reminderDate = new Date(expirationDate);
    reminderDate.setDate(reminderDate.getDate() - 30);

    const formatDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//RussTools//WHOIS Lookup//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:domain-expiration-${domain}-${Date.now()}@russ.tools`,
      `DTSTART:${formatDate(reminderDate)}`,
      `DTEND:${formatDate(reminderDate)}`,
      `DTSTAMP:${formatDate(new Date())}`,
      `SUMMARY:Domain Renewal Reminder: ${domain}`,
      `DESCRIPTION:The domain ${domain} expires on ${expirationDate.toLocaleDateString()}. Consider renewing before this date to avoid service interruption.`,
      `LOCATION:${domain}`,
      'STATUS:CONFIRMED',
      'TRANSPARENCY:OPAQUE',
      'BEGIN:VALARM',
      'TRIGGER:-P7D',
      'ACTION:DISPLAY',
      `DESCRIPTION:Domain ${domain} expires in 7 days`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `domain-expiration-${domain}.ics`;
    link.click();
    URL.revokeObjectURL(url);

    notifications.show({
      title: 'Calendar Event Downloaded',
      message: `Domain expiration reminder for ${domain} has been downloaded`,
      color: 'green',
      icon: <IconCalendar size={16} />
    });
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'Unknown') return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getCountryFlag = (countryCode) => {
    if (!countryCode) return '🌍';
    try {
      return String.fromCodePoint(
        ...countryCode.toUpperCase().split('').map(char => 0x1F1E6 + char.charCodeAt(0) - 65)
      );
    } catch {
      return '🌍';
    }
  };

  // Render highlighted JSON using Prism
  const renderHighlightedJSON = (data) => {
    const jsonString = JSON.stringify(data, null, 2);
    const highlighted = highlightCode(jsonString, 'json');
    
    return (
      <div className={colorScheme === 'dark' ? 'prism-dark' : ''}>
        <pre style={{ 
          margin: 0, 
          padding: '1rem',
          backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-0)',
          borderRadius: 'var(--mantine-radius-md)',
          fontSize: '0.875rem',
          lineHeight: 1.5,
          overflow: 'auto',
          maxHeight: '500px',
          border: colorScheme === 'dark' ? '1px solid var(--mantine-color-dark-4)' : '1px solid var(--mantine-color-gray-3)'
        }}>
          <code 
            dangerouslySetInnerHTML={{ __html: highlighted }}
            className="language-json"
          />
        </pre>
      </div>
    );
  };

  // Render IP lookup results
  const renderIPResults = () => {
    if (!lookupResults?.normalized) return null;
    
    const { normalized } = lookupResults;
    
    return (
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        {/* Location Information */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group mb="md">
            <ThemeIcon size="lg" radius="md" variant="light" color="blue">
              <IconMapPin size={20} />
            </ThemeIcon>
            <Text size="lg" fw={500}>Location Information</Text>
          </Group>
          
          <Stack spacing="sm">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">IP Address</Text>
              <Code>{normalized.ip}</Code>
            </Group>
            
            {normalized.location?.city && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">City</Text>
                <Text fw={500}>{normalized.location.city}</Text>
              </Group>
            )}
            
            {normalized.location?.region && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Region</Text>
                <Text fw={500}>{normalized.location.region}</Text>
              </Group>
            )}
            
            {normalized.location?.country && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Country</Text>
                <Group spacing="xs">
                  <Text span>{getCountryFlag(normalized.location.country_code)}</Text>
                  <Text fw={500}>{normalized.location.country}</Text>
                </Group>
              </Group>
            )}
            
            {normalized.location?.coordinates && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Coordinates</Text>
                <Text fw={500}>{normalized.location.coordinates}</Text>
              </Group>
            )}
            
            {normalized.location?.timezone && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Timezone</Text>
                <Text fw={500}>{normalized.location.timezone}</Text>
              </Group>
            )}
          </Stack>
        </Card>

        {/* Network Information */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group mb="md">
            <ThemeIcon size="lg" radius="md" variant="light" color="green">
              <IconNetwork size={20} />
            </ThemeIcon>
            <Text size="lg" fw={500}>Network Information</Text>
          </Group>
          
          <Stack spacing="sm">
            {normalized.organization?.name && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Organization</Text>
                <Text fw={500}>{normalized.organization.name}</Text>
              </Group>
            )}
            
            {normalized.network?.isp && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">ISP</Text>
                <Text fw={500}>{normalized.network.isp}</Text>
              </Group>
            )}
            
            {normalized.network?.as && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">ASN</Text>
                <Text fw={500}>{normalized.network.as}</Text>
              </Group>
            )}
            
            {normalized.network?.hostname && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Hostname</Text>
                <Text fw={500}>{normalized.network.hostname}</Text>
              </Group>
            )}
            
            {normalized.network?.reverse && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Reverse DNS</Text>
                <Text fw={500}>{normalized.network.reverse}</Text>
              </Group>
            )}
          </Stack>
        </Card>

        {/* Security Information */}
        {normalized.security && (
          <Card shadow="sm" padding="lg" radius="md" withBorder style={{ gridColumn: '1 / -1' }}>
            <Group mb="md">
              <ThemeIcon size="lg" radius="md" variant="light" color="red">
                <IconShield size={20} />
              </ThemeIcon>
              <Text size="lg" fw={500}>Security Information</Text>
            </Group>
            
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Mobile Network</Text>
                <Badge color={normalized.security.mobile ? 'orange' : 'green'}>
                  {normalized.security.mobile ? 'Yes' : 'No'}
                </Badge>
              </Group>
              
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Proxy/VPN</Text>
                <Badge color={normalized.security.proxy ? 'red' : 'green'}>
                  {normalized.security.proxy ? 'Yes' : 'No'}
                </Badge>
              </Group>
              
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Hosting Provider</Text>
                <Badge color={normalized.security.hosting ? 'blue' : 'gray'}>
                  {normalized.security.hosting ? 'Yes' : 'No'}
                </Badge>
              </Group>
            </SimpleGrid>
          </Card>
        )}
      </SimpleGrid>
    );
  };

  // Render domain results
  const renderDomainResults = () => {
    if (!lookupResults?.normalized) return null;
    
    const { normalized } = lookupResults;
    
    return (
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        {/* Registration Information */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group mb="md">
            <ThemeIcon size="lg" radius="md" variant="light" color="blue">
              <IconCalendar size={20} />
            </ThemeIcon>
            <Text size="lg" fw={500}>Registration Information</Text>
          </Group>
          
          <Stack spacing="sm">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Domain</Text>
              <Code>{normalized.domain}</Code>
            </Group>
            
            {normalized.created && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Created</Text>
                <Text fw={500}>{formatDate(normalized.created)}</Text>
              </Group>
            )}
            
            {normalized.expires && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Expires</Text>
                <Text fw={500}>{formatDate(normalized.expires)}</Text>
              </Group>
            )}
            
            {normalized.updated && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Last Updated</Text>
                <Text fw={500}>{formatDate(normalized.updated)}</Text>
              </Group>
            )}
            
            {normalized.registrar?.name && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Registrar</Text>
                <Text fw={500}>{normalized.registrar.name}</Text>
              </Group>
            )}
          </Stack>
        </Card>

        {/* Domain Status */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group mb="md">
            <ThemeIcon size="lg" radius="md" variant="light" color="orange">
              <IconInfoCircle size={20} />
            </ThemeIcon>
            <Text size="lg" fw={500}>Domain Status</Text>
          </Group>
          
          <Stack spacing="xs">
            {normalized.status && normalized.status.length > 0 ? (
              normalized.status.map((status, index) => (
                <Badge key={index} variant="light" color="blue" style={{ textTransform: 'none' }}>
                  {status}
                </Badge>
              ))
            ) : (
              <Text c="dimmed" size="sm">No status information available</Text>
            )}
          </Stack>
        </Card>

        {/* Nameservers */}
        {normalized.nameservers && normalized.nameservers.length > 0 && (
          <Card shadow="sm" padding="lg" radius="md" withBorder style={{ gridColumn: '1 / -1' }}>
            <Group mb="md">
              <ThemeIcon size="lg" radius="md" variant="light" color="green">
                <IconServer size={20} />
              </ThemeIcon>
              <Text size="lg" fw={500}>Nameservers</Text>
            </Group>
            
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
              {normalized.nameservers.map((ns, index) => (
                <Group key={index} spacing="xs">
                  <IconServer size={16} color="var(--mantine-color-green-6)" />
                  <Code>{ns.name}</Code>
                </Group>
              ))}
            </SimpleGrid>
          </Card>
        )}
      </SimpleGrid>
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
          <ThemeIcon size={48} radius="md" variant="light" color="violet">
            <WHOISIcon size={28} />
          </ThemeIcon>
          <div>
            <Title order={2} fw={600}>
              WHOIS Lookup Tool
            </Title>
            <Text size="sm" c="dimmed">
              Get detailed information about domains and IP addresses
            </Text>
          </div>
        </Group>

        {/* Lookup Form */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Grid>
            <Grid.Col span={{ base: 12, md: 10 }}>
              <Autocomplete
                label="Domain or IP Address"
                placeholder="example.com or 8.8.8.8"
                value={query}
                onChange={setQuery}
                onKeyPress={(event) => event.key === 'Enter' && handleLookup()}
                leftSection={<IconWorld size={16} />}
                data={autocompleteData || []}
                limit={10}
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
            title="WHOIS Lookup Error"
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
              <Tabs.Tab value="results" leftSection={<WHOISIcon size={16} />}>
                {lookupResults.type === 'ip' ? 'IP Information' : 'Domain Information'}
              </Tabs.Tab>
              <Tabs.Tab value="sources" leftSection={<IconInfoCircle size={16} />}>
                Data Sources
              </Tabs.Tab>
              <Tabs.Tab value="raw" leftSection={<IconWorld size={16} />}>
                Raw Data
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="results" pt="xs">
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between" mb="md">
                  <Text size="lg" fw={500}>
                    {lookupResults.type === 'ip' ? 'IP Address Information' : 'Domain Registration Information'}
                  </Text>
                  <Group>
                    <Badge color={lookupResults.status === 'success' ? 'green' : 'red'}>
                      {lookupResults.status}
                    </Badge>
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconDownload size={14} />}
                      onClick={exportResults}
                    >
                      Export JSON
                    </Button>
                    {lookupResults.type === 'domain' && lookupResults.normalized?.expires && (
                      <Button
                        size="xs"
                        variant="light"
                        color="orange"
                        leftSection={<IconCalendar size={14} />}
                        onClick={downloadDomainExpiration}
                      >
                        Add to Calendar
                      </Button>
                    )}
                  </Group>
                </Group>

                {lookupResults.type === 'ip' ? renderIPResults() : renderDomainResults()}
              </Card>
            </Tabs.Panel>

            <Tabs.Panel value="sources" pt="xs">
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Text size="lg" fw={500} mb="md">Data Sources</Text>
                
                <Timeline active={-1} bulletSize={24} lineWidth={2}>
                  {lookupResults.sources?.map((source, index) => (
                    <Timeline.Item
                      key={index}
                      title={
                        <Group>
                          <Text fw={500}>{source.name}</Text>
                          <Badge size="xs" color={source.status === 'success' ? 'green' : 'red'}>
                            {source.status}
                          </Badge>
                        </Group>
                      }
                      bullet={<IconInfoCircle size={12} />}
                    >
                      {source.service && (
                        <Text size="xs" c="dimmed">Service: {source.service}</Text>
                      )}
                      {source.tld && (
                        <Text size="xs" c="dimmed">TLD: {source.tld}</Text>
                      )}
                      {source.error && (
                        <Text size="xs" c="red">Error: {source.error}</Text>
                      )}
                      <Text size="xs" c="dimmed">
                        {new Date(source.timestamp).toLocaleString()}
                      </Text>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Card>
            </Tabs.Panel>

            <Tabs.Panel value="raw" pt="xs">
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between" mb="md">
                  <Text size="lg" fw={500}>Raw Response Data</Text>
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconCopy size={14} />}
                    onClick={() => copyToClipboard(JSON.stringify(lookupResults, null, 2))}
                  >
                    Copy JSON
                  </Button>
                </Group>
                {renderHighlightedJSON(lookupResults)}
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
                      <Text fw={500}>{item.query}</Text>
                      <Badge size="xs" color={item.type === 'ip' ? 'blue' : 'green'}>
                        {item.type}
                      </Badge>
                    </Group>
                  }
                  bullet={<WHOISIcon size={12} />}
                >
                  <Text size="xs" color="dimmed">
                    {new Date(item.timestamp).toLocaleString()} • {item.status}
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

export default WHOISLookupTool; 