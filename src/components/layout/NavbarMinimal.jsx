import {
  IconBrandAzure,
  IconChevronDown,
  IconSun,
  IconMoonStars,
  IconNetwork,
  IconBrandGithub,
  IconClock,
  IconShield,
} from '@tabler/icons-react';
import {
  Anchor,
  Box,
  Burger,
  Button,
  Center,
  Collapse,
  Divider,
  Drawer,
  Group,
  HoverCard,
  ScrollArea,
  SimpleGrid,
  Text,
  ThemeIcon,
  UnstyledButton,
  useMantineTheme,
  ActionIcon,
  useMantineColorScheme,
  useComputedColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import classes from './HeaderMegaMenu.module.css';
import DNSIcon from '../tools/dns-lookup/DNSIcon';
import WHOISIcon from '../tools/whois/WHOISIcon';

const mockdata = [
  {
    icon: IconNetwork,
    title: 'Network Designer',
    description: "Plan your cloud network and subnets",
    link: "/network-designer/",
  },
  {
    icon: IconBrandAzure,
    title: 'Azure Resource Naming Tool',
    description: "Generate and validate Azure resource names",
    link: "/azure-naming/",
  },
  {
    icon: IconClock,
    title: 'Cron Expression Builder',
    description: "Build and validate cron job expressions",
    link: "/cron/",
  },
  {
    icon: IconShield,
    title: 'SSL Certificate Checker',
    description: "Analyze and validate SSL certificates",
    link: "/ssl-checker/",
  },
  {
    icon: DNSIcon,
    title: 'DNS Lookup Tool',
    description: "Perform DNS queries for various record types",
    link: "/dns-lookup/",
  },
  {
    icon: WHOISIcon,
    title: 'WHOIS Lookup Tool',
    description: "Get detailed information about domains and IP addresses",
    link: "/whois-lookup/",
  },
  {
    icon: IconBrandGithub,
    title: 'Source Code',
    description: "View the source code on GitHub",
    link: "https://github.com/russmckendrick/russ-tools",
  },
];

function ThemeToggle({ size = 36, ...props }) {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light');
  return (
    <ActionIcon
      variant="outline"
      onClick={() => setColorScheme(computedColorScheme === 'dark' ? 'light' : 'dark')}
      title="Toggle color scheme"
      color="grey"
      size={size}
      style={{ minWidth: size, minHeight: size }}
      {...props}
    >
      {computedColorScheme === 'dark' ? <IconSun size={size * 0.55} /> : <IconMoonStars size={size * 0.55} />}
    </ActionIcon>
  );
}

export function NavbarMinimal() {
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const [linksOpened, { toggle: toggleLinks }] = useDisclosure(false);
  const theme = useMantineTheme();

  const links = mockdata.map((item) => (
    <a href={item.link} key={item.title}>
      <UnstyledButton className={classes.subLink}>
        <Group wrap="nowrap" align="flex-start">
          <ThemeIcon size={34} variant="default" radius="md">
          <item.icon size={22} color={theme.colors.blue[6]} />
        </ThemeIcon>
        <div>
          <Text size="sm" fw={500}>
            {item.title}
          </Text>
          <Text size="xs" c="dimmed">
            {item.description}
          </Text>
        </div>
      </Group>
    </UnstyledButton>
    </a>
  ));

  return (
    <Box pb={0}>
      <header className={classes.header}>
        <Group justify="space-between" h="100%">
          <Text fw={700} size="xl">RussTools</Text>

          <Group h="100%" gap={0} visibleFrom="sm">
            <a href="/" className={classes.link}>
              Home
            </a>
            <HoverCard width={600} position="bottom" radius="md" shadow="md" withinPortal>
              <HoverCard.Target>
                <a href="#" className={classes.link}>
                  <Center inline>
                    <Box component="span" mr={5}>
                      Tools
                    </Box>
                    <IconChevronDown size={16} color={theme.colors.blue[6]} />
                  </Center>
                </a>
              </HoverCard.Target>

              <HoverCard.Dropdown style={{ overflow: 'hidden' }}>
                <Group justify="space-between" px="md">
                  <Text fw={500}>Tools</Text>
                </Group>

                <Divider my="sm" />

                <SimpleGrid cols={2} spacing={0}>
                  {links}
                </SimpleGrid>

                <div className={classes.dropdownFooter}>
                  <Group justify="space-between">
                    <div>
                      <Text fw={500} fz="sm">
                        About
                      </Text>
                      <Text size="xs" c="dimmed">
                        Just a random collection of tools
                      </Text>
                    </div>
                    <a href="https://www.russ.cloud/about/" target="_blank" rel="noopener noreferrer"><Button variant="default">More about Russ</Button></a>
                  </Group>
                </div>
              </HoverCard.Dropdown>
            </HoverCard>
          </Group>

          <ThemeToggle size={36} visibleFrom="sm" />
          <Burger opened={drawerOpened} onClick={toggleDrawer} hiddenFrom="sm" />
        </Group>
      </header>

      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        size="100%"
        padding="md"
        title="Navigation"
        hiddenFrom="sm"
        zIndex={1000000}
      >
        <ScrollArea h="calc(100vh - 80px" mx="-md">
          <Divider my="sm" />

          <a href="/" className={classes.link}>
            Home
          </a>
          <UnstyledButton className={classes.link} onClick={toggleLinks}>
            <Center inline>
              <Box component="span" mr={5}>
                Tools
              </Box>
              <IconChevronDown size={16} color={theme.colors.blue[6]} />
            </Center>
          </UnstyledButton>
          <Collapse in={linksOpened}>{links}</Collapse>

          <Divider my="sm" />

          <Center pb="xl" px="md">
            <ThemeToggle size={36} />
          </Center>
        </ScrollArea>
      </Drawer>
    </Box>
  );
} 