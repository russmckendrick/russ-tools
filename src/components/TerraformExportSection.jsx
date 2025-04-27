import React, { useState } from 'react';
import { Paper, Group, Button, Tabs, Code, ActionIcon, Tooltip, Text, Title, Box } from '@mantine/core';
import { IconCopy, IconBrandAws, IconBrandAzure, IconBrandTerraform } from '@tabler/icons-react';
import { generateAwsTerraform, generateAzureTerraform } from '../utils/terraformExport';

export function TerraformExportSection({ network, subnets }) {
  const [activeTab, setActiveTab] = useState('azure');
  const [copied, setCopied] = useState(false);

  const awsCode = generateAwsTerraform({
    vpcName: network?.name || 'main_vpc',
    vpcCidr: `${network?.ip}/${network?.cidr}`,
    region: 'us-east-1', // TODO: let user pick
    subnets: subnets || [],
  });
  const azureCode = generateAzureTerraform({
    vnetName: network?.name || 'main_vnet',
    vnetCidr: `${network?.ip}/${network?.cidr}`,
    location: 'uksouth', // TODO: let user pick
    subnets: subnets || [],
  });

  const code = activeTab === 'aws' ? awsCode : azureCode;
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <Paper p="md" radius="md" withBorder mt="xl">
      <Group position="apart" mb="xs">
        <Group>
          <IconBrandTerraform size={22} color="#7B42F6" />
          <Title order={4} ml={4}>Terraform Export</Title>
        </Group>
        <Button size="xs" color="teal" variant="outline" onClick={handleCopy} leftIcon={<IconCopy size={16} />}>
          {copied ? 'Copied!' : 'Copy Code'}
        </Button>
      </Group>
      <Tabs value={activeTab} onTabChange={setActiveTab} mt="md">
        <Tabs.List>
          <Tabs.Tab value="aws">
            <Group spacing={6} align="center">
              <IconBrandAws size={18} color="#FF9900" />
              <span>Amazon Web Services</span>
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="azure">
            <Group spacing={6} align="center">
              <IconBrandAzure size={18} color="#0078D4" />
              <span>Microsoft Azure</span>
            </Group>
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="aws" pt="md">
          <Box mb="xs">
            <Text size="sm" weight={500}>AWS Terraform HCL</Text>
          </Box>
          <Code block style={{ width: '100%', fontSize: 13, whiteSpace: 'pre-wrap' }}>{awsCode}</Code>
        </Tabs.Panel>
        <Tabs.Panel value="azure" pt="md">
          <Box mb="xs">
            <Text size="sm" weight={500}>Azure Terraform HCL</Text>
          </Box>
          <Code block style={{ width: '100%', fontSize: 13, whiteSpace: 'pre-wrap' }}>{azureCode}</Code>
        </Tabs.Panel>
      </Tabs>
    </Paper>
  );
}
