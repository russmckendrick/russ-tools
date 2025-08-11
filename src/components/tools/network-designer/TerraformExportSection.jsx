import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { loadPrismLanguages, highlightCode } from '../../../utils/prismLoader';
import '../../../styles/prism-theme.css';
import { cn } from '@/lib/utils';

import { IconCopy, IconBrandAws, IconBrandAzure, IconBrandTerraform, IconServer } from '@tabler/icons-react';
import { toast } from 'sonner';
import { generateAwsTerraform, generateAzureTerraform, generateVcdTerraform } from '../../../utils/network/terraformExport';
import { loadAzureRegions } from '../../../utils/regions/AzureRegions';
import { loadAwsRegions } from '../../../utils/regions/AwsRegions';

export function TerraformExportSection({ network, subnets }) {
  const colorScheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
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

  // Load PrismJS languages on component mount
  useEffect(() => {
    loadPrismLanguages(['hcl']);
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
      const highlightedAws = highlightCode(awsCode, 'hcl');
    const highlightedAzure = highlightCode(azureCode, 'hcl');
    const highlightedVcd = highlightCode(vcdCode, 'hcl');
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
    
    const platformName = activeTab === 'azure' ? 'Azure' : 
                        activeTab === 'aws' ? 'AWS' : 'vCloud Director';
    
    toast.success('Terraform Code Copied', {
      description: `${platformName} Terraform configuration copied to clipboard`
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <IconBrandTerraform size={18} color="#7B42F6" />
          Terraform Export
        </CardTitle>
        <Button size="sm" onClick={handleCopy}>
          <IconCopy size={16} className="mr-2" />
          {copied ? 'Copied!' : 'Copy Code'}
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="azure">Microsoft Azure</TabsTrigger>
            <TabsTrigger value="aws">Amazon Web Services</TabsTrigger>
            <TabsTrigger value="vcd">VMware Cloud Director</TabsTrigger>
          </TabsList>

          <TabsContent value="aws" className="pt-4">
            <div className="mb-2 max-w-xs">
              <Select value={awsRegion} onValueChange={handleAwsRegionChange}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingRegionsAws ? 'Loading regions...' : 'AWS Region'} />
                </SelectTrigger>
                <SelectContent>
                  {regionListAws.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className={cn(colorScheme === 'dark' && 'prism-dark')}>
              <pre style={{ margin: 0, padding: 0, background: 'none' }}>
                <code className="language-hcl" style={{ fontSize: 13, whiteSpace: 'pre-wrap', display: 'block' }} dangerouslySetInnerHTML={{ __html: highlightedAws }} />
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="azure" className="pt-4">
            <div className="mb-2 max-w-xs">
              <Select value={azureRegion} onValueChange={handleRegionChange}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingRegions ? 'Loading regions...' : 'Azure Region'} />
                </SelectTrigger>
                <SelectContent>
                  {regionList.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className={cn(colorScheme === 'dark' && 'prism-dark')}>
              <pre style={{ margin: 0, padding: 0, background: 'none' }}>
                <code className="language-hcl" style={{ fontSize: 13, whiteSpace: 'pre-wrap', display: 'block' }} dangerouslySetInnerHTML={{ __html: highlightedAzure }} />
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="vcd" className="pt-4">
            <div className="flex flex-wrap gap-3 mb-3">
              <div className="w-40">
                <Select value={vcdNetworkType} onValueChange={handleVcdNetworkTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Network Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routed">Routed Network</SelectItem>
                    <SelectItem value="isolated">Isolated Network</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input className="w-36" value={vcdOrg} onChange={(e) => handleVcdOrgChange(e.target.value)} placeholder="Organization" />
              <Input className="w-36" value={vcdVdc} onChange={(e) => handleVcdVdcChange(e.target.value)} placeholder="VDC" />
              {vcdNetworkType === 'routed' && (
                <Input className="w-40" value={vcdEdgeGateway} onChange={(e) => handleVcdEdgeGatewayChange(e.target.value)} placeholder="Edge Gateway" />
              )}
            </div>
            <div className={cn(colorScheme === 'dark' && 'prism-dark')}>
              <pre style={{ margin: 0, padding: 0, background: 'none' }}>
                <code className="language-hcl" style={{ fontSize: 13, whiteSpace: 'pre-wrap', display: 'block' }} dangerouslySetInnerHTML={{ __html: highlightedVcd }} />
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
