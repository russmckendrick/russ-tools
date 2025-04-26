import { AppShell, Container, Group, Text, Button, Paper } from '@mantine/core';
import { Link, Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <AppShell
      padding="md"
      navbar={null}
      aside={null}
      header={
        <Paper shadow="xs" p="md" withBorder>
          <Container size="lg">
            <Group position="apart">
              <Text component={Link} to="/" size="xl" weight={700}>
                Subnet.Fit
              </Text>
              <Group>
                <Button component={Link} to="/" variant="subtle">
                  Home
                </Button>
                <Button component={Link} to="/calculator" variant="subtle">
                  Calculator
                </Button>
              </Group>
            </Group>
          </Container>
        </Paper>
      }
      footer={
        <Paper shadow="xs" p="md" withBorder>
          <Container size="lg">
            <Text align="center" size="sm" color="dimmed">
              © 2024 Subnet.Fit - A modern subnet calculator
            </Text>
          </Container>
        </Paper>
      }
    >
      <Outlet />
    </AppShell>
  );
} 