import React, { useState } from 'react';
import { Paper, Group, Button, Tabs, ActionIcon, Tooltip, Text, Title, Box, Select } from '@mantine/core';
import Prism from 'prismjs';
import 'prismjs/components/prism-hcl';
import 'prismjs/themes/prism.css';

import { IconCopy, IconBrandAws, IconBrandAzure, IconBrandTerraform } from '@tabler/icons-react';
import { generateAwsTerraform, generateAzureTerraform } from '../utils/terraformExport';
import { loadAzureRegions } from './AzureRegions';

export function TerraformExportSection({ network, subnets }) {
  const [activeTab, setActiveTab] = useState('azure');
  const [copied, setCopied] = useState(false);
  // Azure region selection with persistence and dynamic loading
  const defaultRegion = 'uksouth';
  const savedRegion = typeof window !== 'undefined' ? window.localStorage.getItem('azureRegion') : null;
  const [azureRegion, setAzureRegion] = useState(savedRegion || defaultRegion);
  const [regionList, setRegionList] = useState([]);
  const [loadingRegions, setLoadingRegions] = useState(true);
  const [regionError, setRegionError] = useState(null);

  React.useEffect(() => {
    let mounted = true;
    loadAzureRegions()
      .then(list => { if (mounted) { setRegionList(list); setLoadingRegions(false); } })
      .catch(err => {
        setRegionError('Failed to load Azure regions list');
        setRegionList([{ label: 'UK South', value: 'uksouth' }]);
        setLoadingRegions(false);
      });
    return () => { mounted = false; };
  }, []);

  const handleRegionChange = (value) => {
    setAzureRegion(value);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('azureRegion', value);
    }
  };


  const awsCode = generateAwsTerraform({
    vpcName: network?.name || 'main_vpc',
    vpcCidr: `${network?.ip}/${network?.cidr}`,
    region: 'us-east-1', // TODO: let user pick
    subnets: subnets || [],
  });
  const azureCode = generateAzureTerraform({
    vnetName: network?.name || 'main_vnet',
    vnetCidr: `${network?.ip}/${network?.cidr}`,
    location: azureRegion,
    subnets: subnets || [],
  });

  const code = activeTab === 'aws' ? awsCode : azureCode;

  // PrismJS highlighting
  const highlightedAws = Prism.highlight(awsCode, Prism.languages.hcl, 'hcl');
  const highlightedAzure = Prism.highlight(azureCode, Prism.languages.hcl, 'hcl');
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
          <pre style={{ margin: 0, padding: 0, background: 'none' }}>
            <code className="language-hcl" style={{ fontSize: 13, whiteSpace: 'pre-wrap', display: 'block' }}
              dangerouslySetInnerHTML={{ __html: highlightedAws }}
            />
          </pre>
        </Tabs.Panel>
        <Tabs.Panel value="azure" pt="md">
          <Box mb="xs">
            <Text size="sm" weight={500}>Azure Terraform HCL</Text>
          </Box>
          <Box mb="sm" style={{ maxWidth: 340 }}>
            <Select
              label="Azure Region"
              data={regionList}
              value={azureRegion}
              onChange={handleRegionChange}
              searchable
              nothingFound={loadingRegions ? 'Loading...' : 'No region found'}
              withinPortal
              disabled={loadingRegions}
              error={regionError}
              placeholder={loadingRegions ? 'Loading regions...' : undefined}
              maxDropdownHeight={350}
            />
          </Box>
          <pre style={{ margin: 0, padding: 0, background: 'none' }}>
            <code className="language-hcl" style={{ fontSize: 13, whiteSpace: 'pre-wrap', display: 'block' }}
              dangerouslySetInnerHTML={{ __html: highlightedAzure }}
            />
          </pre>
        </Tabs.Panel>
      </Tabs>
    </Paper>
  );
}
