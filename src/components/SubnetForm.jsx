import { useState, useMemo } from 'react';
import { TextInput, Button, Group, Paper, Select, Text } from '@mantine/core';
import { Netmask } from 'netmask';
import { ipToLong } from '../utils';

export function SubnetForm({ onAddSubnet, parentCidr, parentNetwork, subnets }) {
  const [name, setName] = useState('');
  const [cidr, setCidr] = useState('');
  const [error, setError] = useState(null);

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

    // Add subnet
    onAddSubnet({
      name: name.trim(),
      cidr: parseInt(cidr, 10)
    });

    // Reset form
    setName('');
    setCidr('');
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