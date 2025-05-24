import React from 'react';
import { 
  Paper, 
  Stack, 
  Group, 
  Text, 
  Badge, 
  Alert,
  Grid,
  List,
  Accordion,
  Progress,
  ThemeIcon
} from '@mantine/core';
import { 
  IconShieldCheck, 
  IconShieldX, 
  IconShieldExclamation,
  IconLock,
  IconKey,
  IconCertificate2,
  IconInfoCircle,
  IconAlertTriangle,
  IconCheck,
  IconX
} from '@tabler/icons-react';

const SSLValidationInfo = ({ data, domain }) => {
  if (!data || !data.endpoints || data.endpoints.length === 0) {
    return null;
  }

  // Only show security analysis if we have at least one complete endpoint with meaningful data
  const hasCompleteResults = data.endpoints.some(endpoint => 
    endpoint.isComplete && 
    endpoint.grade && 
    endpoint.grade !== '-' && 
    endpoint.grade !== 'T' &&
    endpoint.details?.cert
  );

  // Don't render the security analysis section if we don't have complete results
  if (!hasCompleteResults) {
    return null;
  }

  // Find the first endpoint with complete results for analysis
  const endpoint = data.endpoints.find(ep => 
    ep.isComplete && 
    ep.grade && 
    ep.grade !== '-' && 
    ep.details?.cert
  ) || data.endpoints[0];

  const details = endpoint.details;
  const cert = details?.cert;
  const protocols = details?.protocols;
  const suites = details?.suites;

  const getSecurityLevel = (grade) => {
    switch (grade) {
      case 'A+':
        return { level: 'Excellent', color: 'green', icon: IconShieldCheck };
      case 'A':
        return { level: 'Good', color: 'green', icon: IconShieldCheck };
      case 'B':
        return { level: 'Fair', color: 'lime', icon: IconShieldCheck };
      case 'C':
        return { level: 'Poor', color: 'yellow', icon: IconShieldExclamation };
      case 'D':
      case 'E':
        return { level: 'Bad', color: 'orange', icon: IconShieldExclamation };
      case 'F':
        return { level: 'Critical', color: 'red', icon: IconShieldX };
      case 'T':
        return { level: 'Trusted', color: 'blue', icon: IconShieldCheck };
      default:
        return { level: 'Unknown', color: 'gray', icon: IconShieldExclamation };
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysUntilExpiry = (timestamp) => {
    if (!timestamp) return null;
    const now = new Date();
    const expiry = new Date(timestamp);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const security = getSecurityLevel(endpoint.grade);
  const daysUntilExpiry = cert ? getDaysUntilExpiry(cert.notAfter) : null;
  const SecurityIcon = security.icon;

  const certificateValidation = [
    {
      label: 'Domain Validation',
      status: cert ? 'valid' : 'unknown',
      description: 'Certificate matches the domain'
    },
    {
      label: 'Certificate Authority',
      status: cert ? 'valid' : 'unknown',
      description: 'Issued by a trusted CA'
    },
    {
      label: 'Certificate Chain',
      status: cert ? 'valid' : 'unknown',
      description: 'Complete chain of trust'
    },
    {
      label: 'Expiration Date',
      status: daysUntilExpiry > 30 ? 'valid' : daysUntilExpiry > 0 ? 'warning' : 'invalid',
      description: cert ? `Expires ${formatDate(cert.notAfter)}` : 'Unknown expiration'
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'valid':
        return <IconCheck size={16} color="green" />;
      case 'warning':
        return <IconAlertTriangle size={16} color="orange" />;
      case 'invalid':
        return <IconX size={16} color="red" />;
      default:
        return <IconInfoCircle size={16} color="gray" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'valid':
        return 'green';
      case 'warning':
        return 'yellow';
      case 'invalid':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <Paper p="md" withBorder radius="md">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <ThemeIcon size="md" color={security.color} variant="light">
              <SecurityIcon size={18} />
            </ThemeIcon>
            <div>
              <Text size="md" fw={600}>Security Analysis</Text>
              <Text size="sm" c="dimmed">Detailed validation results</Text>
            </div>
          </Group>
          <Badge size="lg" color={security.color} variant="filled">
            {security.level}
          </Badge>
        </Group>

        {/* Certificate Expiry Warning */}
        {daysUntilExpiry !== null && (
          <div>
            {daysUntilExpiry <= 0 ? (
              <Alert icon={<IconX size={16} />} title="Certificate Expired" color="red" variant="light">
                This certificate expired on {formatDate(cert.notAfter)}
              </Alert>
            ) : daysUntilExpiry <= 30 ? (
              <Alert icon={<IconAlertTriangle size={16} />} title="Certificate Expiring Soon" color="orange" variant="light">
                This certificate will expire in {daysUntilExpiry} days on {formatDate(cert.notAfter)}
              </Alert>
            ) : (
              <Alert icon={<IconCheck size={16} />} title="Certificate Valid" color="green" variant="light">
                Certificate is valid until {formatDate(cert.notAfter)} ({daysUntilExpiry} days remaining)
              </Alert>
            )}
          </div>
        )}

        {/* Certificate Validation Results */}
        <div>
          <Text size="sm" fw={500} mb="xs">Certificate Validation</Text>
          <Grid gutter="xs">
            {certificateValidation.map((item, index) => (
              <Grid.Col span={{ base: 12, sm: 6 }} key={index}>
                <Group gap="xs" align="center">
                  {getStatusIcon(item.status)}
                  <div style={{ flex: 1 }}>
                    <Text size="sm">{item.label}</Text>
                    <Text size="xs" c="dimmed">{item.description}</Text>
                  </div>
                  <Badge size="xs" color={getStatusColor(item.status)} variant="light">
                    {item.status}
                  </Badge>
                </Group>
              </Grid.Col>
            ))}
          </Grid>
        </div>

        {/* Detailed Information Accordion */}
        <Accordion variant="separated" radius="md">
          {/* Certificate Details */}
          {cert && (
            <Accordion.Item value="certificate">
              <Accordion.Control icon={<IconCertificate2 size={20} />}>
                Certificate Details
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Subject:</Text>
                    <Text size="sm" font="monospace">{cert.subject}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Issuer:</Text>
                    <Text size="sm" font="monospace">{cert.issuerSubject}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Valid From:</Text>
                    <Text size="sm">{formatDate(cert.notBefore)}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Valid Until:</Text>
                    <Text size="sm">{formatDate(cert.notAfter)}</Text>
                  </Group>
                  {cert.sigAlg && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Signature Algorithm:</Text>
                      <Text size="sm">{cert.sigAlg}</Text>
                    </Group>
                  )}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          )}

          {/* Supported Protocols */}
          {protocols && protocols.length > 0 && (
            <Accordion.Item value="protocols">
              <Accordion.Control icon={<IconLock size={20} />}>
                Supported Protocols
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="xs">
                  {protocols.map((protocol, index) => (
                    <Group key={index} justify="space-between">
                      <Text size="sm">{protocol.name} {protocol.version}</Text>
                      <Badge 
                        size="sm" 
                        color={protocol.version >= '1.2' ? 'green' : 'orange'} 
                        variant="light"
                      >
                        {protocol.version >= '1.2' ? 'Secure' : 'Legacy'}
                      </Badge>
                    </Group>
                  ))}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          )}

          {/* Cipher Suites */}
          {suites && suites.list && suites.list.length > 0 && (
            <Accordion.Item value="ciphers">
              <Accordion.Control icon={<IconKey size={20} />}>
                Cipher Suites ({suites.list.length})
              </Accordion.Control>
              <Accordion.Panel>
                <List size="sm" spacing="xs">
                  {suites.list.slice(0, 10).map((suite, index) => (
                    <List.Item key={index}>
                      <Text size="sm" font="monospace">{suite.name}</Text>
                    </List.Item>
                  ))}
                  {suites.list.length > 10 && (
                    <List.Item>
                      <Text size="sm" c="dimmed">
                        ... and {suites.list.length - 10} more cipher suites
                      </Text>
                    </List.Item>
                  )}
                </List>
              </Accordion.Panel>
            </Accordion.Item>
          )}
        </Accordion>

        {/* Basic Check Notice */}
        {data.basicCheck && (
          <Alert icon={<IconInfoCircle size={16} />} title="Limited Analysis" color="blue" variant="light">
            This was a basic connectivity check. For comprehensive security analysis including protocol details and vulnerabilities, a full SSL Labs scan would be required.
          </Alert>
        )}
      </Stack>
    </Paper>
  );
};

export default SSLValidationInfo; 