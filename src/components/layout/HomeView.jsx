import { Card, Group, Text, Title, Grid, Stack, Badge, ThemeIcon, Paper, Container } from '@mantine/core';
import { IconNetwork, IconBrandAzure, IconClock, IconChevronRight, IconShield } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import DNSIcon from '../tools/dns-lookup/DNSIcon';

export default function HomeView() {
  const tools = [
    {
      id: 'network-designer',
      title: 'Network Designer',
      description: 'Plan and visualize your IP subnets interactively. Design network architectures, allocate subnets, and export configurations for Azure, AWS, or VMware environments.',
      icon: IconNetwork,
      iconColor: 'blue',
      badges: ['Subnet Planning', 'Visual Diagrams', 'Terraform Export'],
      path: '/network-designer'
    },
    {
      id: 'azure-naming',
      title: 'Azure Resource Naming Tool',
      description: 'Generate consistent Azure resource names following Cloud Adoption Framework best practices and your organizational conventions.',
      icon: IconBrandAzure,
      iconColor: 'cyan',
      badges: ['CAF Compliant', 'Best Practices', 'Bulk Export'],
      path: '/azure-naming'
    },
    {
      id: 'ssl-checker',
      title: 'SSL Certificate Checker',
      description: 'Analyze and validate SSL certificates for any domain. Get detailed security analysis, certificate information, and vulnerability testing using industry-standard SSL Labs API.',
      icon: IconShield,
      iconColor: 'green',
      badges: ['SSL Labs API', 'Security Analysis', 'Certificate Info'],
      path: '/ssl-checker'
    },
    {
      id: 'dns-lookup',
      title: 'DNS Lookup Tool',
      description: 'Perform comprehensive DNS queries for various record types using multiple DNS providers. Get detailed DNS information with caching and history tracking.',
      icon: DNSIcon,
      iconColor: 'indigo',
      badges: ['DNS over HTTPS', 'Multiple Providers', 'Record History'],
      path: '/dns-lookup'
    },
    {
      id: 'cron-builder',
      title: 'Cron Expression Builder',
      description: 'Build and validate cron job expressions with an intuitive interface. Generate scheduling patterns for automated tasks and system jobs.',
      icon: IconClock,
      iconColor: 'orange',
      badges: ['Schedule Builder', 'Expression Validator', 'Human Readable'],
      path: '/cron'
    }
  ];

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Stack gap="md" align="center" ta="center">
          <Title order={1} size="h1" fw={700}>
            RussTools
          </Title>
          <Text size="lg" c="dimmed" maw={600}>
            A random collection of tools for cloud infrastructure and DevOps workflows. 
          </Text>
        </Stack>

        {/* Tools Grid */}
        <Grid gutter="xl">
          {tools.map((tool) => {
            const IconComponent = tool.icon;
            
            return (
                             <Grid.Col key={tool.id} span={{ base: 12, sm: 6, md: 4 }}>
                <Paper
                  component={Link}
                  to={tool.path}
                  p="xl"
                  radius="lg"
                  withBorder
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  className="tool-card"
                  sx={(theme) => ({
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows.lg,
                      borderColor: theme.colors[tool.iconColor][3]
                    }
                  })}
                >
                  <Stack gap="lg" h="100%">
                    {/* Icon and Title */}
                    <Group gap="md" align="flex-start">
                      <ThemeIcon
                        size={48}
                        radius="md"
                        color={tool.iconColor}
                        variant="light"
                      >
                        <IconComponent size={28} />
                      </ThemeIcon>
                      <div style={{ flex: 1 }}>
                        <Group justify="space-between" align="flex-start">
                          <Title order={3} fw={600} lh={1.2}>
                            {tool.title}
                          </Title>
                          <ThemeIcon
                            size="sm"
                            variant="subtle"
                            color="gray"
                          >
                            <IconChevronRight size={16} />
                          </ThemeIcon>
                        </Group>
                      </div>
                    </Group>

                    {/* Description */}
                    <Text size="sm" c="dimmed" lh={1.5} style={{ flex: 1 }}>
                      {tool.description}
                    </Text>

                    {/* Badges */}
                    <Group gap="xs">
                      {tool.badges.map((badge) => (
                        <Badge
                          key={badge}
                          variant="light"
                          color={tool.iconColor}
                          size="sm"
                        >
                          {badge}
                        </Badge>
                      ))}
                    </Group>
                  </Stack>
                </Paper>
              </Grid.Col>
            );
          })}
        </Grid>

        {/* Footer */}
        <Stack gap="xs" align="center" ta="center" mt="xl">
          <Text size="sm" c="dimmed">
          All tools are provided as-is, without warranty of any kind.
          </Text>
        </Stack>
      </Stack>
    </Container>
  );
}
