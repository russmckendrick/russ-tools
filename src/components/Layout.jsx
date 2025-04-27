import { AppShell, Container, Group, Text, Paper, ActionIcon, useMantineTheme, useMantineColorScheme, useComputedColorScheme } from '@mantine/core';
import { IconBrandGithub, IconSun, IconMoonStars } from '@tabler/icons-react';
import { Link, Outlet } from 'react-router-dom';

export function Layout() {
  const theme = useMantineTheme(); 
  const { setColorScheme } = useMantineColorScheme(); 
  const computedColorScheme = useComputedColorScheme('light'); 

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
          bg={computedColorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0]}
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
                  title="GitHub Repository"
                >
                  <IconBrandGithub size={18} />
                </ActionIcon>
                <ActionIcon
                  variant="outline"
                  onClick={() => setColorScheme(computedColorScheme === 'dark' ? 'light' : 'dark')}
                  title="Toggle color scheme"
                >
                  {computedColorScheme === 'dark' ? <IconSun size={18} /> : <IconMoonStars size={18} />}
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
          bg={computedColorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0]}
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