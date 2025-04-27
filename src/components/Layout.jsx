import { AppShell, Container, Group, Text, Button, Paper, ActionIcon, useMantineColorScheme } from '@mantine/core';
import { IconBrandGithub, IconSun, IconMoonStars } from '@tabler/icons-react';
import { Link, Outlet } from 'react-router-dom';

export function Layout({ colorScheme, toggleColorScheme }) {
  const dark = colorScheme === 'dark';

  return (
    <AppShell
      padding="md"
      navbar={null}
      aside={null}
      header={
        <Paper shadow="xs" p="md" withBorder>
          <Container size="lg">
            <Group justify="space-between">
              <Text component={Link} to="/" size="xl" fw={700}>
                russ.tools
              </Text>
              <Group>
                <ActionIcon
                  component="a"
                  href="https://github.com/russmckendrick/russ-tools"
                  target="_blank"
                  variant="outline"
                  color={dark ? 'yellow' : 'blue'}
                  title="GitHub Repository"
                >
                  <IconBrandGithub size="1.1rem" />
                </ActionIcon>
                <ActionIcon
                  variant="outline"
                  color={dark ? 'yellow' : 'blue'}
                  onClick={() => toggleColorScheme()}
                  title="Toggle color scheme"
                >
                  {dark ? <IconSun size="1.1rem" /> : <IconMoonStars size="1.1rem" />}
                </ActionIcon>
              </Group>
            </Group>
          </Container>
        </Paper>
      }
      footer={
        <Paper shadow="xs" p="md" withBorder>
          <Container size="lg">
            <Text ta="center" size="sm" c="dimmed">
              {new Date().getFullYear()} russ.tools
            </Text>
          </Container>
        </Paper>
      }
    >
      <Outlet />
    </AppShell>
  );
}