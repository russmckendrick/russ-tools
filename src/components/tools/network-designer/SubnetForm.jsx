import { useState, useMemo, useEffect } from 'react';
import { TextInput, Button, Group, Paper, Select, Text, ColorSwatch, Popover, SimpleGrid, useMantineTheme, Box } from '@mantine/core';
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

    // Filter basic options to only include those that fit in the largest gap
    return basicOptions.filter(option => parseInt(option.value, 10) >= maxPrefixForGap);
  }, [parentCidr, parentNetwork, subnets]);

  const handleSubmit = () => {
    // Validate name
    if (!name.trim()) {
      setError('Please enter a subnet name');
      return;
    }

    // Validate CIDR
    if (!cidr) {
      setError('Please select a CIDR size');
      return;
    }

    // Reset error
    setError(null);

    const subnetToAdd = {
      name: name || `Subnet ${subnets?.length + 1 || 1}`,
      cidr: parseInt(cidr, 10),
      // Pass the name and index instead of the HEX value
      color: selectedColor ? { name: selectedColor.name, index: selectedColor.index } : findColorNameAndIndex(colorPalette[0].value, theme), // Fallback needed
    };

    onAddSubnet(subnetToAdd);

    // Reset form
    setName('');
    setCidr('');
    // Set a new random color for the next subnet
    const randomIndex = Math.floor(Math.random() * colorPalette.length);
    setSelectedColor(colorPalette[randomIndex]);
  };

  return (
    <Paper p="md" radius="md" withBorder mb="md">
      <Group position="apart" spacing="md" align="flex-end">
        <TextInput
          label="Subnet Name"
          placeholder="e.g., Web Tier"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error && error.includes('name') ? error : null}
          style={{ flex: 1 }}
        />
        <Select
          label="CIDR Size"
          placeholder="Select size"
          value={cidr}
          onChange={setCidr}
          data={cidrOptions}
          error={error && error.includes('CIDR') ? error : null}
          style={{ width: '120px' }}
          disabled={cidrOptions.length === 0}
        />
        <Box style={{ width: '80px' }}>
          <Text size="sm" weight={500} mb={5}>Color</Text>
          <Popover
            opened={colorPickerOpened}
            position="bottom"
            width={240}
            withinPortal
            onChange={setColorPickerOpened}
          >
            <Popover.Target>
              <ColorSwatch
                color={selectedColor?.value || '#ccc'}
                size={28}
                style={{ cursor: 'pointer', marginTop: '3px' }}
                onClick={() => setColorPickerOpened((o) => !o)}
              />
            </Popover.Target>
            <Popover.Dropdown>
              <SimpleGrid cols={8} spacing="xs">
                {colorPalette.map((color) => (
                  <ColorSwatch
                    key={`${color.name}-${color.index}`}
                    color={color.value}
                    onClick={() => {
                      setSelectedColor(color);
                      setColorPickerOpened(false);
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </SimpleGrid>
            </Popover.Dropdown>
          </Popover>
        </Box>
        <Button
          onClick={handleSubmit}
          style={{ marginBottom: '1px' }}
          disabled={cidrOptions.length === 0}
        >
          Add Subnet
        </Button>
      </Group>
      {error && !error.includes('name') && !error.includes('CIDR') && (
        <Text color="red" size="sm" mt="xs">{error}</Text>
      )}
      {cidrOptions.length === 0 && parentNetwork && (
        <Text color="orange" size="sm" mt="xs">No space available for additional subnets</Text>
      )}
    </Paper>
  );
}