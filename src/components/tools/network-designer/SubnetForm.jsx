import { useState, useMemo, useEffect } from 'react';
import { TextInput, Button, Group, Paper, Select, Text, ColorSwatch, Popover, SimpleGrid, useMantineTheme, Box, Grid, Stack } from '@mantine/core';
import { Netmask } from 'netmask';
import { ipToLong } from '../../../utils';

// Helper function to find color name and index from HEX value
const findColorNameAndIndex = (hexValue, theme) => {
  for (const [name, shades] of Object.entries(theme.colors)) {
    const index = shades.indexOf(hexValue);
    if (index !== -1) {
      return { name, index };
    }
  }
  return { name: 'gray', index: 5 }; // Default fallback
};

export function SubnetForm({ onAddSubnet, parentCidr, parentNetwork, subnets }) {
  const theme = useMantineTheme();
  const [name, setName] = useState('');
  const [cidr, setCidr] = useState('');
  const [error, setError] = useState(null);
  const [colorPickerOpened, setColorPickerOpened] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null); // Now stores { name, index, value }

  // Define a palette of colors as { name, index, value } objects
  const colorPalette = useMemo(() => [
    { name: 'blue', index: 5, value: theme.colors.blue[5] }, { name: 'blue', index: 7, value: theme.colors.blue[7] }, { name: 'indigo', index: 5, value: theme.colors.indigo[5] },
    { name: 'green', index: 5, value: theme.colors.green[5] }, { name: 'green', index: 7, value: theme.colors.green[7] }, { name: 'teal', index: 5, value: theme.colors.teal[5] },
    { name: 'cyan', index: 5, value: theme.colors.cyan[5] }, { name: 'cyan', index: 7, value: theme.colors.cyan[7] },
    { name: 'violet', index: 5, value: theme.colors.violet[5] }, { name: 'violet', index: 7, value: theme.colors.violet[7] }, { name: 'grape', index: 5, value: theme.colors.grape[5] },
    { name: 'red', index: 5, value: theme.colors.red[5] }, { name: 'red', index: 7, value: theme.colors.red[7] }, { name: 'pink', index: 5, value: theme.colors.pink[5] },
    { name: 'orange', index: 5, value: theme.colors.orange[5] }, { name: 'orange', index: 7, value: theme.colors.orange[7] }, { name: 'yellow', index: 5, value: theme.colors.yellow[5] },
    { name: 'lime', index: 5, value: theme.colors.lime[5] }, { name: 'lime', index: 7, value: theme.colors.lime[7] },
    { name: 'teal', index: 7, value: theme.colors.teal[7] }, { name: 'grape', index: 7, value: theme.colors.grape[7] }, { name: 'pink', index: 7, value: theme.colors.pink[7] },
    { name: 'yellow', index: 7, value: theme.colors.yellow[7] }, { name: 'indigo', index: 7, value: theme.colors.indigo[7] }
  ], [theme]);

  // Set a random color object from the palette when the component mounts
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * colorPalette.length);
    setSelectedColor(colorPalette[randomIndex]);
  }, []); // Run only once on mount

  // Generate CIDR options for dropdown based on available space
  const cidrOptions = useMemo(() => {
    if (!parentCidr || !parentNetwork || !subnets) return [];

    // Calculate parent network details
    const parentBlock = new Netmask(parentNetwork.ip + '/' + parentNetwork.cidr);
    const parentSize = parentBlock.size;

    // Start with the basic range from parent network
    const minOption = parentCidr + 1;
    const basicOptions = Array.from({ length: 31 - minOption + 1 }, (_, i) => {
      const value = String(minOption + i);
      return { value, label: `/${value}` };
    });

    // If no subnets yet, return all options
    if (!subnets.length) return basicOptions;

    // Calculate used space and find available gaps
    const usedRanges = subnets.map(s => {
      const block = new Netmask(s.base + '/' + s.cidr);
      return {
        start: ipToLong(block.base),
        end: ipToLong(block.broadcast),
        size: block.size
      };
    }).sort((a, b) => a.start - b.start);

    // Find largest contiguous available space
    const parentStart = ipToLong(parentBlock.base);
    const parentEnd = ipToLong(parentBlock.broadcast);

    let largestGapSize = 0;

    // Check gap at the beginning
    if (usedRanges.length > 0 && usedRanges[0].start > parentStart) {
      largestGapSize = Math.max(largestGapSize, usedRanges[0].start - parentStart);
    }

    // Check gaps between used ranges
    for (let i = 0; i < usedRanges.length - 1; i++) {
      const gapSize = usedRanges[i + 1].start - usedRanges[i].end - 1;
      largestGapSize = Math.max(largestGapSize, gapSize);
    }

    // Check gap at the end
    if (usedRanges.length > 0) {
      const lastEnd = usedRanges[usedRanges.length - 1].end;
      if (lastEnd < parentEnd) {
        largestGapSize = Math.max(largestGapSize, parentEnd - lastEnd);
      }
    } else {
      // If no subnets, the largest gap is the entire network
      largestGapSize = parentSize;
    }

    // If no gaps available, return empty array
    if (largestGapSize <= 2) return []; // Need at least 2 addresses for a usable subnet

    // Calculate maximum CIDR prefix for the largest gap
    // For a subnet with n addresses, the prefix is 32 - log2(n)
    const maxPrefixForGap = 32 - Math.floor(Math.log2(largestGapSize));

    // Filter basic options to only include those that fit in the largest gap, then reverse for consistency
    const filteredOptions = basicOptions.filter(option => parseInt(option.value, 10) >= maxPrefixForGap);
    return filteredOptions.reverse(); // Show larger CIDR numbers (smaller subnets) first
  }, [parentCidr, parentNetwork, subnets]);

  const handleSubmit = () => {
    // Clear any existing errors
    setError(null);

    // Validate name
    if (!name || !name.trim()) {
      setError('Please enter a subnet name');
      return;
    }

    // Validate CIDR - be more explicit
    if (!cidr || cidr === '' || cidr === null || cidr === undefined) {
      setError('Please select a CIDR size');
      return;
    }

    // Validate CIDR is a valid number
    const cidrNum = parseInt(cidr, 10);
    if (isNaN(cidrNum) || cidrNum < 8 || cidrNum > 31) {
      setError('Invalid CIDR size selected');
      return;
    }

    // Validate that we have a selected color
    if (!selectedColor) {
      setError('Please select a color for the subnet');
      return;
    }

    const subnetToAdd = {
      name: name.trim(),
      cidr: cidrNum,
      color: { 
        name: selectedColor.name, 
        index: selectedColor.index 
      },
    };

    try {
      onAddSubnet(subnetToAdd);

      // Reset form only on successful submission
      setName('');
      setCidr('');
      setError(null);
      
      // Set a new random color for the next subnet
      const randomIndex = Math.floor(Math.random() * colorPalette.length);
      setSelectedColor(colorPalette[randomIndex]);
    } catch (err) {
      setError('Failed to add subnet. Please try again.');
    }
  };

  return (
    <Stack gap="md">
      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <TextInput
            label="Subnet Name"
            description="Enter a descriptive name"
            placeholder="e.g., Web Tier, Database, DMZ"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={error && error.includes('name') ? error : null}
            withAsterisk
            size="sm"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Select
            label="CIDR Size"
            description="Select subnet size"
            placeholder="Choose CIDR"
            value={cidr}
            onChange={(value) => {
              setCidr(value);
              // Clear any CIDR-related errors when user selects
              if (error && error.includes('CIDR')) {
                setError(null);
              }
            }}
            data={cidrOptions}
            error={error && error.includes('CIDR') ? error : null}
            disabled={cidrOptions.length === 0}
            withAsterisk
            size="sm"
            clearable={false}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Stack gap="xs">
            <Text size="sm" fw={500}>Subnet Color</Text>
            <Group gap="sm" align="center">
              <Popover
                opened={colorPickerOpened}
                position="bottom"
                width={280}
                withinPortal
                onChange={setColorPickerOpened}
              >
                <Popover.Target>
                  <Group gap="xs" style={{ cursor: 'pointer' }} onClick={() => setColorPickerOpened((o) => !o)}>
                    <ColorSwatch
                      color={selectedColor?.value || '#ccc'}
                      size={24}
                      style={{ 
                        cursor: 'pointer',
                        border: '2px solid var(--mantine-color-gray-3)'
                      }}
                    />
                    <Text size="xs" c="dimmed">Click to change</Text>
                  </Group>
                </Popover.Target>
                <Popover.Dropdown>
                  <Stack gap="xs">
                    <Text size="sm" fw={500}>Choose subnet color</Text>
                    <SimpleGrid cols={10} spacing="xs">
                      {colorPalette.map((color) => (
                        <ColorSwatch
                          key={`${color.name}-${color.index}`}
                          color={color.value}
                          size={24}
                          onClick={() => {
                            setSelectedColor(color);
                            setColorPickerOpened(false);
                          }}
                          style={{ 
                            cursor: 'pointer',
                            border: selectedColor?.value === color.value ? '2px solid var(--mantine-color-blue-5)' : '1px solid var(--mantine-color-gray-3)',
                            transform: selectedColor?.value === color.value ? 'scale(1.1)' : 'scale(1)',
                            transition: 'all 0.1s ease'
                          }}
                        />
                      ))}
                    </SimpleGrid>
                  </Stack>
                </Popover.Dropdown>
              </Popover>
            </Group>
          </Stack>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 2 }}>
          <Stack gap="xs">
            <Text size="sm" fw={500} style={{ opacity: 0 }}>Action</Text>
            <Button
              onClick={handleSubmit}
              disabled={cidrOptions.length === 0 || !name.trim() || !cidr}
              size="sm"
              fullWidth
            >
              Add Subnet
            </Button>
          </Stack>
        </Grid.Col>
      </Grid>
      
      {/* Error and info messages */}
      {error && (
        <Text c="red" size="sm">{error}</Text>
      )}
      {cidrOptions.length === 0 && parentNetwork && (
        <Text c="orange" size="sm">
          No space available for additional subnets in this network
        </Text>
      )}
      {cidrOptions.length > 0 && (
        <Text size="xs" c="dimmed">
          Available CIDR sizes are calculated based on remaining space in your parent network
        </Text>
      )}
    </Stack>
  );
}