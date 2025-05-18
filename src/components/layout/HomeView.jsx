import { Card, Image, Group, Text, Title, Grid } from '@mantine/core';
import { Link } from 'react-router-dom';

export default function HomeView() {
  return (
    <div style={{ padding: '2rem', height: '100%' }}>
      <Grid gutter="xl" align="stretch" style={{ height: '100%' }}>
  <Grid.Col span={{ base: 12, md: 6 }} style={{ height: '100%' }}>

        <Card shadow="sm" padding="lg" radius="md" withBorder style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Card.Section style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
  <Image
    src="/assets/home-network-designer.png"
    alt="Network Designer"
    height={200}
    fit="contain"
    style={{ maxWidth: '100%', height: '400px', objectFit: 'contain' }}
  />
</Card.Section>
          <Group position="apart" mt="md" mb="xs">
            <Text weight={500}>Network Designer</Text>
          </Group>
          <Text size="sm" color="dimmed">
            Plan and visualize your IP subnets interactively. Allocate, manage, and export network diagrams.
          </Text>
          <div style={{ flex: 1 }} />
          <Link to="/network-designer" style={{ textDecoration: 'none', marginTop: 'auto' }}>
            <Text mt="md" color="blue" weight={600}>
              Open Network Designer →
            </Text>
          </Link>
        </Card>
  </Grid.Col>
  <Grid.Col span={{ base: 12, md: 6 }} style={{ height: '100%' }}>
        <Card shadow="sm" padding="lg" radius="md" withBorder style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Card.Section style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
  <Image
    src="/assets/home-azure-naming.png"
    alt="Azure Naming Tool"
    height={200}
    fit="contain"
    style={{ maxWidth: '100%', height: '400px', objectFit: 'contain' }}
  />
</Card.Section>
          <Group position="apart" mt="md" mb="xs">
            <Text weight={500}>Azure Resource Naming Tool</Text>
          </Group>
          <Text size="sm" color="dimmed">
            Generate consistent Azure resource names following best practices and your conventions.
          </Text>
          <div style={{ flex: 1 }} />
          <Link to="/azure-naming" style={{ textDecoration: 'none', marginTop: 'auto' }}>
            <Text mt="md" color="blue" weight={600}>
              Open Azure Resource Naming Tool →
            </Text>
          </Link>
        </Card>
  </Grid.Col>
</Grid>
    </div>
  );
}
