import { AppShell, Container, Text, useMantineTheme, useComputedColorScheme } from '@mantine/core';
import { Link, Outlet } from 'react-router-dom';
import { NavbarMinimal } from './NavbarMinimal';

export function Layout() {
  const theme = useMantineTheme();
  const computedColorScheme = useComputedColorScheme('light');

  return (
    <AppShell
      padding="md"
      header={{ height: 60 }}
    >
      <AppShell.Header>
        <NavbarMinimal />
      </AppShell.Header>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}