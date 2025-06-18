import { Card, Group, Text, Title, Grid, Stack, Badge, ThemeIcon, Paper, Container } from '@mantine/core';
import { Link } from 'react-router-dom';
import { getHomeViewTools } from '../../utils/toolsUtils';
import SEOHead from '../common/SEOHead';
import { generateHomeSEO } from '../../utils/seoUtils';

export default function HomeView() {
  const tools = getHomeViewTools();
  const seoData = generateHomeSEO();

  return (
    <>
      <SEOHead {...seoData} />
      <Container size="lg" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Stack gap="lg" align="center" ta="center" mb="xl">
          <Title order={1} size="3rem" fw={700} lh={1.1} 
                 style={{ 
                   background: 'linear-gradient(45deg, var(--mantine-color-blue-6), var(--mantine-color-cyan-5))',
                   WebkitBackgroundClip: 'text',
                   WebkitTextFillColor: 'transparent',
                   backgroundClip: 'text'
                 }}>
            RussTools
          </Title>
          <Text size="xl" c="dimmed" maw={700} lh={1.5}>
            A curated collection of developer and infrastructure tools designed for modern cloud workflows
          </Text>
        </Stack>

        {/* Tools Grid */}
        <Grid gutter="lg">
          {tools.map((tool) => {
            const IconComponent = tool.icon;
            
            return (
              <Grid.Col key={tool.id} span={{ base: 12, sm: 6, lg: 4 }}>
                <Paper
                  component={Link}
                  to={tool.path}
                  p="lg"
                  radius="md"
                  withBorder
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  className="tool-card"
                >
                  <Stack gap="md" h="100%">
                    {/* Icon and Title */}
                    <Group gap="md" align="flex-start">
                      <ThemeIcon
                        size={48}
                        radius="md"
                        color={tool.iconColor}
                        variant="light"
                      >
                        <IconComponent size={24} />
                      </ThemeIcon>
                      <div style={{ flex: 1 }}>
                        <Title order={3} fw={600} lh={1.3} size="h4">
                          {tool.title}
                        </Title>
                      </div>
                    </Group>

                    {/* Description */}
                    <Text size="sm" c="dimmed" lh={1.5} style={{ flex: 1 }}>
                      {tool.shortDescription || tool.description}
                    </Text>

                    {/* Badges */}
                    <Group gap="xs" mt="auto">
                      {tool.badges.slice(0, 3).map((badge) => (
                        <Badge
                          key={badge}
                          variant="light"
                          color={tool.iconColor}
                          size="xs"
                          radius="sm"
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
    </>
  );
}
