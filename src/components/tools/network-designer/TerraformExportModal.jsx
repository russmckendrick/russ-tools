import React, { useState } from 'react';
import { Button, Modal, Tabs, Code, Group, ActionIcon, Tooltip, Text } from '@mantine/core';
import { IconCopy, IconServer } from '@tabler/icons-react';
import { generateAwsTerraform, generateAzureTerraform } from '../../../utils/terraformExport';

export function TerraformExportModal({ opened, onClose, network, subnets }) {
  const [activeTab, setActiveTab] = useState('azure');
  const [copied, setCopied] = useState(false);

  // Prepare props for codegen
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
    <Modal opened={opened} onClose={onClose} title="Export as Terraform" size="lg">
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="azure">Azure</Tabs.Tab>
          <Tabs.Tab value="aws">AWS</Tabs.Tab>
          <Tabs.Tab value="vcd" icon={<IconServer size={16} />}>
            VMware Cloud Director
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="azure" pt="md">
          <Group position="apart" mb="xs">
            <Text weight={500}>Azure Terraform HCL</Text>
            <Tooltip label={copied ? 'Copied!' : 'Copy to clipboard'}>
              <ActionIcon onClick={handleCopy} color={copied ? 'green' : 'blue'}>
                <IconCopy size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
          <Code block style={{ width: '100%', fontSize: 13, whiteSpace: 'pre-wrap' }}>{azureCode}</Code>
        </Tabs.Panel>
        <Tabs.Panel value="aws" pt="md">
          <Group position="apart" mb="xs">
            <Text weight={500}>AWS Terraform HCL</Text>
            <Tooltip label={copied ? 'Copied!' : 'Copy to clipboard'}>
              <ActionIcon onClick={handleCopy} color={copied ? 'green' : 'blue'}>
                <IconCopy size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
          <Code block style={{ width: '100%', fontSize: 13, whiteSpace: 'pre-wrap' }}>{awsCode}</Code>
        </Tabs.Panel>
        <Tabs.Panel value="vcd" pt="md">
          <Group position="apart" mb="xs">
            <Text weight={500}><IconServer size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />VMware Cloud Director Terraform HCL</Text>
          </Group>
          <Code block style={{ width: '100%', fontSize: 13, whiteSpace: 'pre-wrap' }}>
            {`# VMware Cloud Director Terraform export is coming soon!\n# See the provider docs: https://registry.terraform.io/providers/vmware/vcd/latest/docs`}
          </Code>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}
