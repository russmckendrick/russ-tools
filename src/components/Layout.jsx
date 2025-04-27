import { AppShell, Container, Group, Text, Paper, ActionIcon, useMantineTheme } from '@mantine/core';
import { IconBrandGithub, IconSun, IconMoonStars } from '@tabler/icons-react';
import { Link, Outlet } from 'react-router-dom';

export function Layout({ colorScheme, toggleColorScheme }) {
  const theme = useMantineTheme(); // Get theme object
  const dark = colorScheme === 'dark';

  return (
    <AppShell
      padding="md"
      header={{ height: 60 }}
      footer={{ height: 50 }}
    >
      <AppShell.Header>
        <Paper 
          shadow="xs" 
          p="md" 
          withBorder 
          style={{ height: '100%' }}
          // Add theme-aware background
          bg={dark ? theme.colors.dark[6] : theme.colors.gray[0]}
        >
          <Container size="lg" style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
            <Group justify="space-between" style={{ width: '100%' }}>
              <Text component={Link} to="/" size="xl" fw={700}>
                russ.tools
              </Text>
              <Group>
                <ActionIcon
                  component="a"
                  href="https://github.com/russmckendrick/russ-tools"
                  target="_blank"
                  variant="outline"
                  // Remove hardcoded color
                  title="GitHub Repository"
                >
                  <IconBrandGithub size={18} />
                </ActionIcon>
                <ActionIcon
                  variant="outline"
                  // Remove hardcoded color
                  onClick={() => toggleColorScheme()}
                  title="Toggle color scheme"
                >
                  {dark ? <IconSun size={18} /> : <IconMoonStars size={18} />}
                </ActionIcon>
              </Group>
            </Group>
          </Container>
        </Paper>
      </AppShell.Header>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>

      <AppShell.Footer>
        <Paper 
          shadow="xs" 
          p="md" 
          withBorder 
          style={{ height: '100%' }}
          // Add theme-aware background
          bg={dark ? theme.colors.dark[6] : theme.colors.gray[0]}
        >
          <Container size="lg" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text ta="center" size="sm" c="dimmed">
              {new Date().getFullYear()} russ.tools
            </Text>
          </Container>
        </Paper>
      </AppShell.Footer>
    </AppShell>
  );
}