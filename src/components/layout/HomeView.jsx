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
                        <Title order={3} fw={600} lh={1.2}>
                          {tool.title}
                        </Title>
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
    </>
  );
}
