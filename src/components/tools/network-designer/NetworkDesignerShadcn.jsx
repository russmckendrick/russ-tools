import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { Netmask } from 'netmask';
import { v4 as uuidv4 } from 'uuid';
import {
  Network,
  Layers3,
  BarChart3,
  Download,
  Plus,
  Trash2,
  RefreshCw,
  Info,
  Share,
  Settings
} from 'lucide-react';

import SEOHead from '../../common/SEOHead';
import ToolHeader from '../../common/ToolHeader';
import { generateToolSEO } from '../../../utils/seoUtils';
import toolsConfig from '../../../utils/toolsConfig.json';
import { parseConfigFromURL, copyShareableURL } from '../../../utils/sharelink';
import { isValidIPv4, ipToLong, longToIp } from '../../../utils';

// Import existing components that we'll convert
import { SubnetVisualizationShadcn } from './SubnetVisualizationShadcn';
import { NetworkDiagramShadcn } from './NetworkDiagramShadcn';
import { NetworkDiagramSVGExport } from './NetworkDiagramSVGExport';
import { TerraformExportSection } from './TerraformExportSection';
import { DraggableSubnetsShadcn } from './DraggableSubnetsShadcn';

// Helper function to parse network input
function parseInput(ipAddress, maskInput) {
  const input = maskInput.trim();
  
  if (input.startsWith('/')) {
    return new Netmask(ipAddress + input);
  }
  
  if (/^\d{1,2}$/.test(input)) {
    const prefix = parseInt(input, 10);
    if (prefix < 0 || prefix > 32) throw new Error('CIDR prefix must be between 0 and 32');
    return new Netmask(ipAddress + '/' + prefix);
  }
  
  if (isValidIPv4(input)) {
    return new Netmask(ipAddress + '/' + input);
  }
  
  throw new Error('Invalid subnet mask or CIDR notation');
}

// Custom localStorage hook replacement
function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  const setStoredValue = (value) => {
    try {
      setValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [value, setStoredValue];
}

// ParentNetworkForm component converted to shadcn/ui
function ParentNetworkForm({ onSubmit, existingNetwork = null, onCancel = null }) {
  const [ip, setIp] = useState(existingNetwork?.ip || '');
  const [cidr, setCidr] = useState(existingNetwork?.cidr ? String(existingNetwork.cidr) : '');
  const [name, setName] = useState(existingNetwork?.name || '');
  const [error, setError] = useState(null);

  const cidrOptions = Array.from({ length: 24 }, (_, i) => {
    const value = String(31 - i);
    return { value, label: `/${value}` };
  });

  const handleSubmit = () => {
    if (!ip || !isValidIPv4(ip)) {
      setError('Please enter a valid IPv4 address');
      return;
    }

    if (!cidr) {
      setError('Please select a CIDR size');
      return;
    }

    setError(null);

    onSubmit({
      ip,
      cidr: parseInt(cidr, 10),
      name: name || `Network ${ip}/${cidr}`
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">
            {existingNetwork ? 'Reconfigure Parent Network' : 'Configure Parent Network'}
          </CardTitle>
          {existingNetwork && (
            <Badge variant="outline" className="border-orange-500 text-orange-600">
              Editing
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {existingNetwork && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-md text-sm text-orange-800">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <strong>Warning:</strong> Changing the parent network will remove all existing subnets. You'll need to recreate them after saving.
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="parent-ip">
              Parent Network IP <span className="text-red-500">*</span>
            </Label>
            <Input
              id="parent-ip"
              placeholder="e.g., 10.0.0.0"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              className={error && error.includes('IP') ? 'border-red-500' : ''}
            />
            <p className="text-xs text-muted-foreground">
              Enter the base IP address for your network
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cidr-size">
              CIDR Size <span className="text-red-500">*</span>
            </Label>
            <Select value={cidr} onValueChange={setCidr}>
              <SelectTrigger id="cidr-size" className={error && error.includes('CIDR') ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {cidrOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Smaller numbers = larger networks
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="network-name">Network Name</Label>
            <Input
              id="network-name"
              placeholder="e.g., Production VPC"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Descriptive name (optional)
            </p>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600">{error}</div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSubmit} className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            {existingNetwork ? 'Update Parent Network' : 'Set Parent Network'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// SubnetForm component converted to shadcn/ui
function SubnetForm({ onAddSubnet, parentCidr, parentNetwork, subnets }) {
  const [name, setName] = useState('');
  const [cidr, setCidr] = useState('');
  const [error, setError] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);

  // Color palette
  const colorPalette = [
    { name: 'blue', index: 5, value: '#3b82f6' },
    { name: 'green', index: 5, value: '#10b981' },
    { name: 'purple', index: 5, value: '#8b5cf6' },
    { name: 'orange', index: 5, value: '#f97316' },
    { name: 'red', index: 5, value: '#ef4444' },
    { name: 'yellow', index: 5, value: '#eab308' },
    { name: 'teal', index: 5, value: '#14b8a6' },
    { name: 'pink', index: 5, value: '#ec4899' }
  ];

  // Set random color on mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * colorPalette.length);
    setSelectedColor(colorPalette[randomIndex]);
  }, []);

  // Generate CIDR options based on available space
  const cidrOptions = React.useMemo(() => {
    if (!parentCidr || !parentNetwork || !subnets) return [];

    const parentBlock = new Netmask(parentNetwork.ip + '/' + parentNetwork.cidr);
    const parentSize = parentBlock.size;

    const minOption = parentCidr + 1;
    const basicOptions = Array.from({ length: 31 - minOption + 1 }, (_, i) => {
      const value = String(minOption + i);
      return { value, label: `/${value}` };
    });

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

    const parentStart = ipToLong(parentBlock.base);
    const parentEnd = ipToLong(parentBlock.broadcast);

    let largestGapSize = 0;

    if (usedRanges.length > 0 && usedRanges[0].start > parentStart) {
      largestGapSize = Math.max(largestGapSize, usedRanges[0].start - parentStart);
    }

    for (let i = 0; i < usedRanges.length - 1; i++) {
      const gapSize = usedRanges[i + 1].start - usedRanges[i].end - 1;
      largestGapSize = Math.max(largestGapSize, gapSize);
    }

    if (usedRanges.length > 0) {
      const lastEnd = usedRanges[usedRanges.length - 1].end;
      if (lastEnd < parentEnd) {
        largestGapSize = Math.max(largestGapSize, parentEnd - lastEnd);
      }
    } else {
      largestGapSize = parentSize;
    }

    if (largestGapSize <= 2) return [];

    const maxPrefixForGap = 32 - Math.floor(Math.log2(largestGapSize));
    const filteredOptions = basicOptions.filter(option => parseInt(option.value, 10) >= maxPrefixForGap);
    return filteredOptions.reverse();
  }, [parentCidr, parentNetwork, subnets]);

  const handleSubmit = () => {
    setError(null);

    if (!name || !name.trim()) {
      setError('Please enter a subnet name');
      return;
    }

    if (!cidr || cidr === '' || cidr === null || cidr === undefined) {
      setError('Please select a CIDR size');
      return;
    }

    const cidrNum = parseInt(cidr, 10);
    if (isNaN(cidrNum) || cidrNum < 8 || cidrNum > 31) {
      setError('Invalid CIDR size selected');
      return;
    }

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

      setName('');
      setCidr('');
      setError(null);
      
      const randomIndex = Math.floor(Math.random() * colorPalette.length);
      setSelectedColor(colorPalette[randomIndex]);
    } catch (err) {
      setError('Failed to add subnet. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="subnet-name">
            Subnet Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="subnet-name"
            placeholder="e.g., Web Tier, Database"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="subnet-cidr">
            CIDR Size <span className="text-red-500">*</span>
          </Label>
          <Select value={cidr} onValueChange={(value) => {
            setCidr(value);
            if (error && error.includes('CIDR')) {
              setError(null);
            }
          }}>
            <SelectTrigger id="subnet-cidr" disabled={cidrOptions.length === 0}>
              <SelectValue placeholder="Choose CIDR" />
            </SelectTrigger>
            <SelectContent>
              {cidrOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Subnet Color</Label>
          <div className="flex gap-2 flex-wrap">
            {colorPalette.map((color) => (
              <button
                key={`${color.name}-${color.index}`}
                className={`w-6 h-6 rounded-full border-2 ${
                  selectedColor?.value === color.value 
                    ? 'border-gray-900 scale-110' 
                    : 'border-gray-300'
                } transition-all`}
                style={{ backgroundColor: color.value }}
                onClick={() => setSelectedColor(color)}
                type="button"
              />
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="opacity-0">Action</Label>
          <Button
            onClick={handleSubmit}
            disabled={cidrOptions.length === 0 || !name.trim() || !cidr}
            className="w-full"
          >
            Add Subnet
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}
      {cidrOptions.length === 0 && parentNetwork && (
        <div className="text-sm text-orange-600">
          No space available for additional subnets in this network
        </div>
      )}
      {cidrOptions.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Available CIDR sizes are calculated based on remaining space in your parent network
        </div>
      )}
    </div>
  );
}

const NetworkDesignerShadcn = () => {
  const [activeTab, setActiveTab] = useState('setup');
  const [searchParams] = useSearchParams();

  // Get tool configuration for SEO
  const toolConfig = toolsConfig.find(tool => tool.id === 'network-designer');
  const seoData = generateToolSEO(toolConfig);
  
  // Use custom localStorage hook
  const [networks, setNetworks] = useLocalStorage('networks', []);
  const [selectedNetworkId, setSelectedNetworkId] = useLocalStorage('selectedNetworkId', null);

  // Load configuration from URL on mount
  useEffect(() => {
    const config = parseConfigFromURL(searchParams);
    if (config && config.networks && config.selectedNetworkId) {
      setNetworks(config.networks);
      setSelectedNetworkId(config.selectedNetworkId);
      toast.success('Configuration Loaded', {
        description: 'Network configuration has been loaded from URL'
      });
    }
  }, [searchParams, setNetworks, setSelectedNetworkId]);

  // Get current network
  const current = networks.find(n => n.id === selectedNetworkId);

  // Dropdown options
  const networkOptions = networks.length > 0
    ? networks.map(n => ({ value: n.id, label: n.name }))
    : [];

  // State management
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isReconfiguring, setIsReconfiguring] = useState(false);
  const [animate, setAnimate] = useState(false);

  // Create a new network
  const handleNewNetwork = () => {
    const newNet = {
      id: uuidv4(),
      name: 'New Network',
      parentNetwork: null,
      subnets: [],
      createdAt: Date.now(),
    };
    setNetworks([newNet, ...networks]);
    setSelectedNetworkId(newNet.id);
    setActiveTab('setup');
    
    toast.success('Network Created', {
      description: 'New network created successfully. Configure your parent network to get started.',
    });
  };

  // Set parent network for current
  const handleSetParentNetwork = (parentNet) => {
    if (isReconfiguring) {
      setNetworks(networks.map(n =>
        n.id === selectedNetworkId ? { ...n, parentNetwork: parentNet, name: parentNet.name, subnets: [] } : n
      ));
      setIsReconfiguring(false);
      
      toast.success('Network Reconfigured', {
        description: `Parent network updated to ${parentNet.ip}/${parentNet.cidr}. Previous subnets have been cleared.`,
      });
    } else {
      setNetworks(networks.map(n =>
        n.id === selectedNetworkId ? { ...n, parentNetwork: parentNet, name: parentNet.name } : n
      ));
      
      toast.success('Parent Network Configured', {
        description: `Network configured with ${parentNet.ip}/${parentNet.cidr}. Ready to design subnets!`,
      });
    }
    setActiveTab('design');
  };

  // Add subnet to current network
  const handleAddSubnet = (subnet) => {
    if (!current?.parentNetwork) return;
    
    const parentBlock = new Netmask(current.parentNetwork.ip + '/' + current.parentNetwork.cidr);
    const parentStart = ipToLong(parentBlock.base);
    const parentEnd = ipToLong(parentBlock.broadcast);
    
    const subnetSize = Math.pow(2, 32 - subnet.cidr);
    
    const used = (current.subnets || []).map(s => {
      const block = new Netmask(s.base + '/' + s.cidr);
      return {
        start: ipToLong(block.base),
        end: ipToLong(block.broadcast)
      };
    }).sort((a, b) => a.start - b.start);
    
    const candidates = [];
    for (let addr = parentStart; addr <= parentEnd - subnetSize + 1; addr += subnetSize) {
      candidates.push(addr);
    }
    
    for (const candidateStart of candidates) {
      const candidateEnd = candidateStart + subnetSize - 1;
      let overlaps = false;
      
      for (const usedRange of used) {
        if (candidateStart <= usedRange.end && candidateEnd >= usedRange.start) {
          overlaps = true;
          break;
        }
      }
      
      if (!overlaps) {
        const candidateIp = longToIp(candidateStart);
        
        if (
          parentBlock.contains(candidateIp) &&
          parentBlock.contains(longToIp(candidateEnd))
        ) {
          setNetworks(networks.map(n =>
            n.id === selectedNetworkId
              ? { ...n, subnets: [...(n.subnets || []), { ...subnet, base: candidateIp }] }
              : n
          ));
          
          toast.success('Subnet Added', {
            description: `Subnet ${subnet.name} (${candidateIp}/${subnet.cidr}) added successfully`,
          });
          return;
        }
      }
    }
    
    toast.error('Subnet Addition Failed', {
      description: 'No available space for this subnet size. Please try a smaller subnet.',
    });
  };

  // Remove subnet from current
  const handleRemoveSubnet = (idx) => {
    const current = networks.find(n => n.id === selectedNetworkId);
    const subnetToRemove = current?.subnets?.[idx];
    
    setNetworks(networks.map(n =>
      n.id === selectedNetworkId
        ? { ...n, subnets: n.subnets.filter((_, i) => i !== idx) }
        : n
    ));
    
    if (subnetToRemove) {
      toast.success('Subnet Removed', {
        description: `Subnet ${subnetToRemove.name} has been removed from the network`,
      });
    }
  };

  // Reset/clear current network OR start reconfiguring
  const handleReset = () => {
    if (current?.parentNetwork) {
      setIsReconfiguring(true);
    } else {
      setNetworks(networks.map(n =>
        n.id === selectedNetworkId
          ? { ...n, parentNetwork: null, subnets: [] }
          : n
      ));
    }
    setActiveTab('setup');
  };

  // Cancel reconfiguration
  const handleCancelReconfigure = () => {
    setIsReconfiguring(false);
  };

  // Share configuration
  const handleShareConfiguration = async () => {
    if (networks.length === 0) {
      toast.error('Nothing to Share', {
        description: 'Create a network configuration first before sharing',
      });
      return;
    }

    const config = {
      networks: networks,
      selectedNetworkId: selectedNetworkId
    };

    const success = await copyShareableURL(config);
    if (success) {
      toast.success('Link Copied', {
        description: 'Shareable link has been copied to your clipboard',
      });
    }
  };

  // Delete current network
  const handleDeleteNetwork = () => {
    const networkToDelete = networks.find(n => n.id === selectedNetworkId);
    const newNetworks = networks.filter(n => n.id !== selectedNetworkId);
    setNetworks(newNetworks);
    
    if (newNetworks.length > 0) {
      setSelectedNetworkId(newNetworks[0].id);
    } else {
      setSelectedNetworkId(null);
    }
    
    setDeleteModalOpen(false);
    
    toast.success('Network Deleted', {
      description: `Network "${networkToDelete?.name || 'Unknown'}" has been permanently deleted`,
    });
  };

  // Reorder subnets (complex logic preserved from original)
  const handleReorderSubnets = (newOrder) => {
    if (!current?.parentNetwork) return;
    
    const parentBlock = new Netmask(current.parentNetwork.ip + '/' + current.parentNetwork.cidr);
    const parentStart = ipToLong(parentBlock.base);
    const parentEnd = ipToLong(parentBlock.broadcast);
    
    // Create a fresh copy of the subnets in the new order, preserving their properties
    const subnetsToBePlaced = newOrder.map(subnet => ({
      ...subnet,
      cidr: subnet.cidr,
      name: subnet.name,
      color: subnet.color
    }));
    
    // Start with an empty array for the result
    const updatedSubnets = [];
    
    // Safety counter to prevent infinite loops
    let safetyCounter = 0;
    const maxIterations = 1000;
    
    // Place each subnet one by one using the same algorithm as handleAddSubnet
    for (let i = 0; i < subnetsToBePlaced.length; i++) {
      const subnet = subnetsToBePlaced[i];
      const subnetSize = Math.pow(2, 32 - subnet.cidr);
      let placed = false;
      
      safetyCounter++;
      if (safetyCounter >= maxIterations) break;
      
      // Find candidates that align with subnet boundaries
      const candidates = [];
      for (let addr = parentStart; addr <= parentEnd - subnetSize + 1; addr += subnetSize) {
        candidates.push(addr);
      }
      
      // Find first available candidate
      for (const candidateStart of candidates) {
        const candidateEnd = candidateStart + subnetSize - 1;
        let overlaps = false;
        
        // Check if this candidate overlaps with any already placed subnet
        for (const placedSubnet of updatedSubnets) {
          const placedBlock = new Netmask(placedSubnet.base + '/' + placedSubnet.cidr);
          const placedStart = ipToLong(placedBlock.base);
          const placedEnd = ipToLong(placedBlock.broadcast);
          
          if (candidateStart <= placedEnd && candidateEnd >= placedStart) {
            overlaps = true;
            break;
          }
        }
        
        // If no overlap, we found a valid position
        if (!overlaps) {
          const candidateIp = longToIp(candidateStart);
          
          // Add the subnet with its properly calculated base address
          updatedSubnets.push({
            ...subnet,
            base: candidateIp,
            // Generate a stable ID that doesn't depend on the base address
            id: `subnet-${subnet.name}-${subnet.cidr}-${i}-${Date.now()}`
          });
          
          placed = true;
          break;
        }
      }
      
      // If we couldn't place this subnet, abort the reordering
      if (!placed) {
        console.error("Could not place subnet during reordering");
        toast.error("Reorder Failed", {
          description: "Could not reorder subnets. Please try a different arrangement."
        });
        return;
      }
    }
    
    if (safetyCounter >= maxIterations) {
      console.error("Reached safety limit while reordering subnets");
      toast.error("Reorder Failed", {
        description: "Could not reorder subnets. Please try again."
      });
      return;
    }
    
    // Update networks with a completely new reference to trigger UI updates
    const updatedNetworks = networks.map(n =>
      n.id === selectedNetworkId
        ? { ...n, subnets: updatedSubnets }
        : n
    );
    
    setNetworks(updatedNetworks);
    
    // Force refresh component
    setAnimate(prev => !prev);
  };

  // Setup tab content
  const renderSetupTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-blue-600" />
            <CardTitle>Network Management</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="network-select">Select Network</Label>
              <Select 
                value={selectedNetworkId || ''} 
                onValueChange={setSelectedNetworkId}
              >
                <SelectTrigger id="network-select" disabled={networks.length === 0}>
                  <SelectValue placeholder="Choose an existing network" />
                </SelectTrigger>
                <SelectContent>
                  {networkOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleNewNetwork} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Network
              </Button>
              {selectedNetworkId && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setDeleteModalOpen(true)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleReset}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {current ? (
        current.parentNetwork && !isReconfiguring ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-green-600" />
                <CardTitle>Parent Network Details</CardTitle>
                <Badge variant="outline" className="border-green-500 text-green-600">
                  Configured
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Network Name:</span> {current.parentNetwork.name}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">IP Address:</span> {current.parentNetwork.ip}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">CIDR Notation:</span> /{current.parentNetwork.cidr}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Subnet Mask:</span> {new Netmask(current.parentNetwork.ip + '/' + current.parentNetwork.cidr).mask}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={handleReset}>
                  Reconfigure Network
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <ParentNetworkForm 
            onSubmit={handleSetParentNetwork} 
            existingNetwork={isReconfiguring ? current.parentNetwork : null}
            onCancel={isReconfiguring ? handleCancelReconfigure : null}
          />
        )
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Network className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="text-center mb-2">No Network Selected</CardTitle>
            <CardDescription className="text-center mb-4">
              Create a new network or select an existing one to get started
            </CardDescription>
            <Button onClick={handleNewNetwork} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New Network
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Design tab content
  const renderDesignTab = () => {
    if (!current?.parentNetwork) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layers3 className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="text-center mb-2">Configure Parent Network First</CardTitle>
            <CardDescription className="text-center mb-4">
              Set up your parent network in the Network Setup tab before designing subnets
            </CardDescription>
            <Button variant="outline" onClick={() => setActiveTab('setup')}>
              Go to Network Setup
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Layers3 className="h-5 w-5 text-blue-600" />
              <CardTitle>Add Subnet</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <SubnetForm 
              onAddSubnet={handleAddSubnet} 
              parentCidr={current.parentNetwork.cidr} 
              parentNetwork={current.parentNetwork}
              subnets={current.subnets || []}
            />
          </CardContent>
        </Card>

        {(current.subnets || []).length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Layers3 className="h-5 w-5 text-orange-600" />
                <CardTitle>Manage Subnets</CardTitle>
                <Badge variant="outline" className="border-blue-500 text-blue-600">
                  {current.subnets.length} subnet{current.subnets.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <DraggableSubnetsShadcn
                subnets={current.subnets || []}
                onRemoveSubnet={handleRemoveSubnet}
                onReorder={handleReorderSubnets}
                parentNetwork={current.parentNetwork}
              />
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Visualization tab content (using existing components temporarily)
  const renderVisualizationTab = () => {
    if (!current?.parentNetwork) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="text-center mb-2">No Network to Visualize</CardTitle>
            <CardDescription className="text-center">
              Set up your parent network and add subnets to see visualizations
            </CardDescription>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        <SubnetVisualizationShadcn
          parentNetwork={current.parentNetwork}
          subnets={current.subnets || []}
        />
        
        <NetworkDiagramShadcn
          parentNetwork={current.parentNetwork}
          subnets={current.subnets || []}
        />
      </div>
    );
  };

  // Export tab content (using existing components temporarily)
  const renderExportTab = () => {
    if (!current?.parentNetwork) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Download className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="text-center mb-2">No Network to Export</CardTitle>
            <CardDescription className="text-center">
              Configure your network design before exporting
            </CardDescription>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <CardTitle>Export Diagrams</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <NetworkDiagramSVGExport 
                parentNetwork={current.parentNetwork} 
                subnets={current.subnets || []} 
                buttonProps={{
                  variant: 'outline'
                }} 
              />
              <p className="text-sm text-muted-foreground">Export network diagrams as SVG files</p>
            </div>
          </CardContent>
        </Card>

        <TerraformExportSection
          network={current.parentNetwork}
          subnets={current.subnets || []}
        />
      </div>
    );
  };

  return (
    <>
      <SEOHead {...seoData} />
      <div className="container max-w-7xl mx-auto p-6">
        <ToolHeader
          icon={Network}
          title="Network Designer"
          description="Plan and visualize your IP subnets interactively. Design network architectures, allocate subnets, and export configurations for Azure, AWS, or VMware environments."
          iconColor="blue"
          badges={[
            { text: "Subnet Planning", variant: "secondary" },
            { text: "Visual Diagrams", variant: "secondary" },
            { text: "Terraform Export", variant: "secondary" }
          ]}
          actions={[
            {
              text: "Copy Configuration Share URL",
              icon: Share,
              onClick: handleShareConfiguration,
              disabled: networks.length === 0,
              variant: "outline"
            }
          ]}
          standalone={false}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="setup" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Network Setup
            </TabsTrigger>
            <TabsTrigger value="design" className="flex items-center gap-2" disabled={!current?.parentNetwork}>
              <Layers3 className="h-4 w-4" />
              Subnet Design
            </TabsTrigger>
            <TabsTrigger value="visualization" className="flex items-center gap-2" disabled={!current?.parentNetwork}>
              <BarChart3 className="h-4 w-4" />
              Visualization
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2" disabled={!current?.parentNetwork}>
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="setup">
            {renderSetupTab()}
          </TabsContent>

          <TabsContent value="design">
            {renderDesignTab()}
          </TabsContent>

          <TabsContent value="visualization">
            {renderVisualizationTab()}
          </TabsContent>

          <TabsContent value="export">
            {renderExportTab()}
          </TabsContent>
        </Tabs>

        {/* Delete Modal */}
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Network</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this network? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteNetwork}>
                Delete Network
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default NetworkDesignerShadcn;