import { Container, Title, Text, Button, Stack } from '@mantine/core';
import { Link } from 'react-router-dom';

export function Home() {
  return (
    <Container size="lg" py="xl">
      <Stack align="center" spacing="xl">
        <Title order={1}>Welcome to Subnet.Fit</Title>
        <Text size="lg" align="center" maw={600}>
          A modern, web-based IPv4 subnet calculator application. Calculate network addresses,
          broadcast addresses, usable host ranges, and more with our intuitive interface.
        </Text>
        <Button component={Link} to="/calculator" size="lg">
          Start Calculating
        </Button>
      </Stack>
    </Container>
  );
} 