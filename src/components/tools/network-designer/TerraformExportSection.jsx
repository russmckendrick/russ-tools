import React, { useState } from 'react';
import { Paper, Group, Button, Tabs, ActionIcon, Tooltip, Text, Title, Box, Select, TextInput } from '@mantine/core';
import Prism from 'prismjs';
import 'prismjs/components/prism-hcl';
import '../../../styles/prism-theme.css';
import { useComputedColorScheme } from '@mantine/core';

import { IconCopy, IconBrandAws, IconBrandAzure, IconBrandTerraform, IconServer } from '@tabler/icons-react';
import { generateAwsTerraform, generateAzureTerraform, generateVcdTerraform } from '../../../utils/network/terraformExport';
import { loadAzureRegions } from '../../../utils/regions/AzureRegions';
import { loadAwsRegions } from '../../../utils/regions/AwsRegions';

export function TerraformExportSection({ network, subnets }) {
  const colorScheme = useComputedColorScheme('light');
  const [activeTab, setActiveTab] = useState('azure');
  const [copied, setCopied] = useState(false);
  // Azure region selection with persistence and dynamic loading
  const defaultRegion = 'uksouth';
  const savedRegion = typeof window !== 'undefined' ? window.localStorage.getItem('azureRegion') : null;
  const [azureRegion, setAzureRegion] = useState(savedRegion || defaultRegion);
  const [regionList, setRegionList] = useState([]);
  const [loadingRegions, setLoadingRegions] = useState(true);
  const [regionError, setRegionError] = useState(null);

  // AWS region selection with persistence and dynamic loading
  const defaultAwsRegion = 'eu-west-2';
  const savedAwsRegion = typeof window !== 'undefined' ? window.localStorage.getItem('awsRegion') : null;
  const [awsRegion, setAwsRegion] = useState(savedAwsRegion || defaultAwsRegion);
  const [regionListAws, setRegionListAws] = useState([]);
  const [loadingRegionsAws, setLoadingRegionsAws] = useState(true);
  const [regionErrorAws, setRegionErrorAws] = useState(null);

  // VCD configuration with persistence
  const savedVcdOrg = typeof window !== 'undefined' ? window.localStorage.getItem('vcdOrg') : null;
  const savedVcdVdc = typeof window !== 'undefined' ? window.localStorage.getItem('vcdVdc') : null;
  const savedVcdEdgeGateway = typeof window !== 'undefined' ? window.localStorage.getItem('vcdEdgeGateway') : null;
  const savedVcdNetworkType = typeof window !== 'undefined' ? window.localStorage.getItem('vcdNetworkType') : null;
  
  const [vcdOrg, setVcdOrg] = useState(savedVcdOrg || 'my-org');
  const [vcdVdc, setVcdVdc] = useState(savedVcdVdc || 'my-vdc');
  const [vcdEdgeGateway, setVcdEdgeGateway] = useState(savedVcdEdgeGateway || 'edge-gateway');
  const [vcdNetworkType, setVcdNetworkType] = useState(savedVcdNetworkType || 'routed');

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

  const handleAwsRegionChange = (value) => {
    setAwsRegion(value);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('awsRegion', value);
    }
  };

  // VCD configuration handlers
  const handleVcdOrgChange = (value) => {
    setVcdOrg(value);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('vcdOrg', value);
    }
  };

  const handleVcdVdcChange = (value) => {
    setVcdVdc(value);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('vcdVdc', value);
    }
  };

  const handleVcdEdgeGatewayChange = (value) => {
    setVcdEdgeGateway(value);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('vcdEdgeGateway', value);
    }
  };

  const handleVcdNetworkTypeChange = (value) => {
    setVcdNetworkType(value);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('vcdNetworkType', value);
    }
  };

  React.useEffect(() => {
    let mounted = true;
    loadAwsRegions()
      .then(list => { if (mounted) { setRegionListAws(list); setLoadingRegionsAws(false); } })
      .catch(err => {
        setRegionErrorAws('Failed to load AWS regions list');
        setRegionListAws([{ label: 'US East (N. Virginia)', value: 'us-east-1' }]);
        setLoadingRegionsAws(false);
      });
    return () => { mounted = false; };
  }, []);

  const awsCode = generateAwsTerraform({
    vpcName: network?.name || 'main_vpc',
    vpcCidr: `${network?.ip}/${network?.cidr}`,
    region: awsRegion,
    subnets: subnets || [],
  });
  const azureCode = generateAzureTerraform({
    vnetName: network?.name || 'main_vnet',
    vnetCidr: `${network?.ip}/${network?.cidr}`,
    location: azureRegion,
    subnets: subnets || [],
  });
  const vcdCode = generateVcdTerraform({
    networkName: network?.name || 'main-network',
    networkCidr: `${network?.ip}/${network?.cidr}`,
    org: vcdOrg,
    vdc: vcdVdc,
    edgeGateway: vcdEdgeGateway,
    networkType: vcdNetworkType,
    subnets: subnets || [],
  });

  let code;
  if (activeTab === 'aws') code = awsCode;
  else if (activeTab === 'azure') code = azureCode;
  else if (activeTab === 'vcd') code = vcdCode;
  else code = '';

  // PrismJS highlighting
  const highlightedAws = Prism.highlight(awsCode, Prism.languages.hcl, 'hcl');
  const highlightedAzure = Prism.highlight(azureCode, Prism.languages.hcl, 'hcl');
  const highlightedVcd = Prism.highlight(vcdCode, Prism.languages.hcl, 'hcl');
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <Paper p="lg" radius="md" withBorder>
      <Group justify="space-between" mb="lg">
        <Group gap="sm">
          <IconBrandTerraform size={20} color="#7B42F6" />
          <Title order={4}>Terraform Export</Title>
        </Group>
        <Button 
          size="sm" 
          variant="light" 
          onClick={handleCopy} 
          leftSection={<IconCopy size={16} />}
        >
          {copied ? 'Copied!' : 'Copy Code'}
        </Button>
      </Group>
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="azure" leftSection={<IconBrandAzure size={16} color="#0078D4" />}>
            Microsoft Azure
          </Tabs.Tab>
          <Tabs.Tab value="aws" leftSection={<IconBrandAws size={16} color="#FF9900" />}>
            Amazon Web Services
          </Tabs.Tab>
          <Tabs.Tab value="vcd" leftSection={<IconServer size={16} color="#4A5568" />}>
            VMware Cloud Director
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="aws" pt="md">
          <Box mb="xs" style={{ maxWidth: 340 }}>
            <Select
              label="AWS Region"
              data={regionListAws}
              value={awsRegion}
              onChange={handleAwsRegionChange}
              searchable
              nothingFound={loadingRegionsAws ? 'Loading...' : 'No region found'}
              withinPortal
              disabled={loadingRegionsAws}
              error={regionErrorAws}
              placeholder={loadingRegionsAws ? 'Loading regions...' : undefined}
              maxDropdownHeight={350}
            />
          </Box>
          <div className={colorScheme === 'dark' ? 'prism-dark' : ''}>
            <pre style={{ margin: 0, padding: 0, background: 'none' }}>
              <code
                className="language-hcl"
                style={{ fontSize: 13, whiteSpace: 'pre-wrap', display: 'block' }}
                dangerouslySetInnerHTML={{ __html: highlightedAws }}
              />
            </pre>
          </div>

        </Tabs.Panel>
        <Tabs.Panel value="azure" pt="md">
          <Box mb="xs" style={{ maxWidth: 340 }}>
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
          <div className={colorScheme === 'dark' ? 'prism-dark' : ''}>
            <pre style={{ margin: 0, padding: 0, background: 'none' }}>
              <code
                className="language-hcl"
                style={{ fontSize: 13, whiteSpace: 'pre-wrap', display: 'block' }}
                dangerouslySetInnerHTML={{ __html: highlightedAzure }}
              />
            </pre>
          </div>

        </Tabs.Panel>
        <Tabs.Panel value="vcd" pt="md">
          <Group gap="md" mb="md">
            <Select
              label="Network Type"
              data={[
                { value: 'routed', label: 'Routed Network' },
                { value: 'isolated', label: 'Isolated Network' }
              ]}
              value={vcdNetworkType}
              onChange={handleVcdNetworkTypeChange}
              style={{ width: 160 }}
              size="sm"
            />
            <TextInput
              label="Organization"
              value={vcdOrg}
              onChange={(e) => handleVcdOrgChange(e.target.value)}
              placeholder="my-org"
              style={{ width: 140 }}
              size="sm"
            />
            <TextInput
              label="VDC"
              value={vcdVdc}
              onChange={(e) => handleVcdVdcChange(e.target.value)}
              placeholder="my-vdc"
              style={{ width: 140 }}
              size="sm"
            />
            {vcdNetworkType === 'routed' && (
              <TextInput
                label="Edge Gateway"
                value={vcdEdgeGateway}
                onChange={(e) => handleVcdEdgeGatewayChange(e.target.value)}
                placeholder="edge-gateway"
                style={{ width: 160 }}
                size="sm"
              />
            )}
          </Group>
          <div className={colorScheme === 'dark' ? 'prism-dark' : ''}>
            <pre style={{ margin: 0, padding: 0, background: 'none' }}>
              <code
                className="language-hcl"
                style={{ fontSize: 13, whiteSpace: 'pre-wrap', display: 'block' }}
                dangerouslySetInnerHTML={{ __html: highlightedVcd }}
              />
            </pre>
          </div>
        </Tabs.Panel>
      </Tabs>
    </Paper>
  );
}
