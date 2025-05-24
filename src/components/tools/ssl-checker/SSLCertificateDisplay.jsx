import React from 'react';
import { 
  Paper, 
  Stack, 
  Group, 
  Text, 
  Badge, 
  Progress,
  Alert,
  Grid,
  ThemeIcon,
  Timeline,
  Code
} from '@mantine/core';
import { 
  IconShieldCheck, 
  IconShieldX, 
  IconShieldExclamation,
  IconCalendar,
  IconCertificate,
  IconServer,
  IconAlertTriangle,
  IconCheck,
  IconInfoCircle
} from '@tabler/icons-react';

const SSLCertificateDisplay = ({ data, domain, error }) => {
  if (error && !data) {
    return (
      <Paper p="md" withBorder radius="md">
        <Alert icon={<IconShieldX size={16} />} title="SSL Check Failed" color="red" variant="light">
          {error}
        </Alert>
      </Paper>
    );
  }

  if (!data) {
    return null;
  }

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'green';
      case 'B':
        return 'lime';
      case 'C':
        return 'yellow';
      case 'D':
      case 'E':
        return 'orange';
      case 'F':
        return 'red';
      case 'T':
        return 'blue'; // Trust - basic validation
      default:
        return 'gray';
    }
  };

  const getGradeIcon = (grade, hasWarnings) => {
    if (hasWarnings) return <IconShieldExclamation size={16} />;
    if (['A+', 'A', 'B', 'T'].includes(grade)) return <IconShieldCheck size={16} />;
    if (['C', 'D'].includes(grade)) return <IconShieldExclamation size={16} />;
    return <IconShieldX size={16} />;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isBasicCheck = data.basicCheck;
  const endpoint = data.endpoints?.[0];
  const cert = endpoint?.details?.cert;

  return (
    <Paper p="md" withBorder radius="md">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <ThemeIcon 
              size="lg" 
              color={getGradeColor(endpoint?.grade)} 
              variant="light"
            >
              {getGradeIcon(endpoint?.grade, endpoint?.hasWarnings)}
            </ThemeIcon>
            <div>
              <Text size="lg" fw={600}>{domain}</Text>
              <Text size="sm" c="dimmed">SSL Certificate Status</Text>
            </div>
          </Group>
          
          {endpoint?.grade && (
            <Badge 
              size="xl" 
              color={getGradeColor(endpoint.grade)}
              variant="filled"
            >
              Grade: {endpoint.grade}
            </Badge>
          )}
        </Group>

        {/* Status Progress */}
        {data.status && (
          <div>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500}>Analysis Status</Text>
              <Text size="sm" c="dimmed">
                {data.status === 'READY' ? 'Complete' : 
                 data.status === 'IN_PROGRESS' ? 'In Progress' : 
                 data.status === 'DNS' ? 'Resolving Domain' : 
                 data.status}
              </Text>
            </Group>
            {data.assessmentProgress ? (
              <Progress 
                value={data.assessmentProgress.completionPercentage} 
                color={data.status === 'READY' ? 'green' : 'blue'}
                size="sm"
              />
            ) : (
              <Progress 
                value={endpoint?.progress || (data.status === 'READY' ? 100 : 0)} 
                color={data.status === 'READY' ? 'green' : 'blue'}
                size="sm"
              />
            )}
            {data.statusMessage && (
              <Text size="xs" c="dimmed" mt="xs">{data.statusMessage}</Text>
            )}
          </div>
        )}

        {/* Basic Certificate Info */}
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper p="sm" withBorder radius="sm">
              <Stack gap="xs">
                <Group gap="xs">
                  <IconServer size={16} />
                  <Text size="sm" fw={500}>Server Info</Text>
                </Group>
                <Text size="xs" c="dimmed">Host: {data.host}</Text>
                {endpoint?.serverName && (
                  <Text size="xs" c="dimmed">Server: {endpoint.serverName}</Text>
                )}
                {endpoint?.statusMessage && (
                  <Text size="xs" c="dimmed">Status: {endpoint.statusMessage}</Text>
                )}
                {data.apiSource && (
                  <Text size="xs" c="dimmed">Analysis by: {data.apiSource}</Text>
                )}
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper p="sm" withBorder radius="sm">
              <Stack gap="xs">
                <Group gap="xs">
                  <IconCertificate size={16} />
                  <Text size="sm" fw={500}>Certificate</Text>
                </Group>
                {cert ? (
                  <>
                    <Text size="xs" c="dimmed">Subject: {cert.subject}</Text>
                    <Text size="xs" c="dimmed">Issuer: {cert.issuerSubject}</Text>
                    <Text size="xs" c="dimmed">
                      Valid: {formatDate(cert.notBefore)} - {formatDate(cert.notAfter)}
                    </Text>
                  </>
                ) : endpoint?.details?.securityScore ? (
                  <>
                    <Text size="xs" c="dimmed">Security Score: {endpoint.details.securityScore}/100</Text>
                    <Text size="xs" c="dimmed">Security Grade: {endpoint.details.securityGrade}</Text>
                    <Text size="xs" c="dimmed">Certificate details not available from this source</Text>
                  </>
                ) : (
                  <Text size="xs" c="dimmed">
                    {isBasicCheck ? 'Basic validation performed' : 'Certificate details not available'}
                  </Text>
                )}
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* Warnings and Issues */}
        {endpoint?.hasWarnings && (
          <Alert icon={<IconAlertTriangle size={16} />} title="Warnings Detected" color="yellow" variant="light">
            This certificate has some warnings that should be reviewed.
          </Alert>
        )}

        {endpoint?.isExceptional && (
          <Alert icon={<IconCheck size={16} />} title="Exceptional Certificate" color="green" variant="light">
            This certificate meets exceptional security standards.
          </Alert>
        )}

        {isBasicCheck && (
          <Alert icon={<IconInfoCircle size={16} />} title="Basic Check Performed" color="blue" variant="light">
            A simplified SSL check was performed. For detailed analysis, the full SSL Labs scan may be needed.
          </Alert>
        )}

        {/* Certificate Chain */}
        {cert?.certChain && cert.certChain.length > 0 && (
          <div>
            <Text size="sm" fw={500} mb="xs">Certificate Chain</Text>
            <Timeline active={cert.certChain.length - 1} bulletSize={24} lineWidth={2}>
              {cert.certChain.map((chainCert, index) => (
                <Timeline.Item
                  key={index}
                  bullet={<IconCertificate size={12} />}
                  title={chainCert.subject}
                >
                  <Text size="xs" c="dimmed">
                    Issuer: {chainCert.issuerSubject}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Valid until: {formatDate(chainCert.notAfter)}
                  </Text>
                </Timeline.Item>
              ))}
            </Timeline>
          </div>
        )}

        {/* Last Check Time */}
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <IconCalendar size={14} />
            <Text size="xs" c="dimmed">
              Last checked: {formatDate(data.timestamp || Date.now())}
            </Text>
          </Group>
          {data.host && (
            <Code size="xs">https://{data.host}</Code>
          )}
        </Group>
      </Stack>
    </Paper>
  );
};

export default SSLCertificateDisplay; 