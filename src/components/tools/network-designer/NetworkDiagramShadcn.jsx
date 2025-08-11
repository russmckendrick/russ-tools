import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRef, useState, useEffect } from 'react';
import { Netmask } from 'netmask';
import { longToIp, ipToLong } from '../../../utils';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import {
  Network,
  Layers3,
  Square,
  FileImage,
  FileCode
} from 'lucide-react';

// Import existing NetworkDiagramSVGExport component
import { NetworkDiagramSVGExport } from './NetworkDiagramSVGExport';

// Get color from color name
const getColorFromName = (colorName) => {
  const colorMap = {
    blue: '#3b82f6',
    green: '#10b981',
    purple: '#8b5cf6',
    orange: '#f97316',
    red: '#ef4444',
    yellow: '#eab308',
    teal: '#14b8a6',
    pink: '#ec4899',
    violet: '#8b5cf6',
    cyan: '#06b6d4',
    lime: '#84cc16',
    indigo: '#6366f1',
    grape: '#8b5cf6'
  };
  return colorMap[colorName] || '#6b7280';
};

// Get base color (darker version for borders)
const getBaseColor = (colorName) => {
  const baseColorMap = {
    blue: '#1e40af',
    green: '#059669',
    purple: '#7c3aed',
    orange: '#ea580c',
    red: '#dc2626',
    yellow: '#ca8a04',
    teal: '#0f766e',
    pink: '#db2777',
    violet: '#7c3aed',
    cyan: '#0891b2',
    lime: '#65a30d',
    indigo: '#4338ca',
    grape: '#7c3aed'
  };
  return baseColorMap[colorName] || '#374151';
};

export function NetworkDiagramShadcn({ parentNetwork, subnets }) {
  const diagramRef = useRef(null);
  const [animate, setAnimate] = useState(false);
  const [errorModal, setErrorModal] = useState({ opened: false, message: '' });

  // Animation effect when diagram changes
  useEffect(() => {
    setAnimate(false);
    const timeout = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timeout);
  }, [parentNetwork, subnets]);

  if (!parentNetwork || !subnets || subnets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Network Diagram</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Add a parent network and subnets to generate a diagram.</p>
        </CardContent>
      </Card>
    );
  }

  // Process parent network
  const parentBlock = new Netmask(parentNetwork.ip + '/' + parentNetwork.cidr);
  
  // Process subnets
  const processedSubnets = subnets.map((subnet, index) => {
    const block = new Netmask(subnet.base + '/' + subnet.cidr);
    return {
      ...subnet,
      block,
      networkLong: ipToLong(block.base),
      broadcastLong: ipToLong(block.broadcast),
      id: subnet.id || `subnet-${index}`
    };
  }).sort((a, b) => a.networkLong - b.networkLong);

  // Export diagram as PNG
  const exportDiagram = () => {
    if (!diagramRef.current) return;
    
    html2canvas(diagramRef.current, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    }).then(canvas => {
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      const filename = `${parentNetwork.name || 'network'}-diagram.png`;
      link.download = filename;
      link.click();
      
      toast.success('PNG Export Complete', {
        description: `Network diagram exported as ${filename}`,
      });
    }).catch(err => {
      console.error('PNG export error:', err);
      setErrorModal({
        opened: true,
        message: 'PNG export failed. Please try again later.'
      });
    });
  };

  // Calculate free space between subnets
  const calculateFreeSpace = () => {
    if (processedSubnets.length === 0) {
      return [{
        start: ipToLong(parentBlock.base),
        end: ipToLong(parentBlock.broadcast),
        size: parentBlock.size,
        startIp: parentBlock.base,
        endIp: parentBlock.broadcast
      }];
    }

    const parentStartLong = ipToLong(parentBlock.base);
    const parentEndLong = ipToLong(parentBlock.broadcast);
    
    let freeSpaces = [];
    
    // Check if there's space before the first subnet
    if (processedSubnets.length > 0 && processedSubnets[0].networkLong > parentStartLong) {
      const firstSubnetStart = processedSubnets[0].networkLong;
      const size = firstSubnetStart - parentStartLong;
      if (size > 0) {
        const endLongIp = firstSubnetStart - 1;
        freeSpaces.push({
          start: parentStartLong,
          end: endLongIp,
          size: size,
          startIp: parentBlock.base,
          endIp: longToIp(endLongIp)
        });
      }
    }
    
    // Check for gaps between subnets
    for (let i = 0; i < processedSubnets.length - 1; i++) {
      const currentBroadcast = processedSubnets[i].broadcastLong;
      const nextNetwork = processedSubnets[i + 1].networkLong;
      
      if (nextNetwork > currentBroadcast + 1) { 
        const startLongIp = currentBroadcast + 1;
        const endLongIp = nextNetwork - 1;
        const size = endLongIp - startLongIp + 1;
        
        freeSpaces.push({
          start: startLongIp,
          end: endLongIp,
          size: size,
          startIp: longToIp(startLongIp),
          endIp: longToIp(endLongIp)
        });
      }
    }
    
    // Check if there's space after the last subnet
    if (processedSubnets.length > 0) {
      const lastSubnet = processedSubnets[processedSubnets.length - 1];
      const lastSubnetBroadcast = lastSubnet.broadcastLong;

      if (lastSubnetBroadcast < parentEndLong) {
        const startLongIp = lastSubnetBroadcast + 1;
        const size = parentEndLong - startLongIp + 1;

        freeSpaces.push({
          start: startLongIp,
          end: parentEndLong,
          size: size,
          startIp: longToIp(startLongIp),
          endIp: parentBlock.broadcast
        });
      }
    }
    
    return freeSpaces;
  };
  
  // Get the free space
  const freeSpaces = calculateFreeSpace();
  
  // Calculate the percentage of free space
  const totalParentSize = parentBlock.size;
  const usedSize = processedSubnets.reduce((acc, subnet) => acc + subnet.block.size, 0);
  const freeSize = totalParentSize - usedSize;
  const freePercentage = ((freeSize / totalParentSize) * 100).toFixed(1);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Network Diagram</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={exportDiagram}
              className="flex items-center gap-2"
            >
              <FileImage className="h-4 w-4" />
              Export PNG
            </Button>
            <NetworkDiagramSVGExport 
              parentNetwork={parentNetwork} 
              subnets={subnets} 
              buttonProps={{
                variant: 'outline',
                className: 'flex items-center gap-2'
              }} 
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          ref={diagramRef}
          className="p-6 bg-gray-50 rounded-lg shadow-sm"
        >
          {/* Parent Network Container */}
          <div
            className={`p-4 mb-4 border-2 border-blue-600 rounded-lg bg-white transition-all duration-300 ${
              animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Network className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">{parentNetwork.name || 'Parent Network'}</h3>
              <Badge variant="outline" className="text-xs border-gray-400 text-gray-600">
                {parentBlock.base}/{parentNetwork.cidr}
              </Badge>
            </div>
            <div className="text-sm text-gray-600 ml-7 space-y-1">
              <div>Range: {parentBlock.first} - {parentBlock.last}</div>
              <div>Total IPs: {totalParentSize.toLocaleString()} ({freePercentage}% free)</div>
            </div>
            
            {/* Combine subnets and free spaces for visualization */}
            <div className="mt-4 space-y-2">
              {(() => {
                // Combine subnets and free spaces, then sort by starting IP
                const allItems = [
                  ...processedSubnets.map(s => ({ type: 'subnet', data: s, startLong: s.networkLong })),
                  ...freeSpaces.map(fs => ({ type: 'freeSpace', data: fs, startLong: fs.start }))
                ].sort((a, b) => a.startLong - b.startLong);

                return allItems.map((item, index) => {
                  if (item.type === 'subnet') {
                    const subnet = item.data;
                    const subnetColor = subnet.color ? getColorFromName(subnet.color.name) : '#6b7280';
                    const borderColor = subnet.color ? getBaseColor(subnet.color.name) : '#374151';

                    return (
                      <div
                        key={`subnet-${subnet.id || index}`}
                        className={`p-3 rounded border transition-all duration-500 ${
                          animate ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{
                          borderColor: borderColor,
                          backgroundColor: `${subnetColor}20`, // 20% opacity
                          animationDelay: `${index * 100}ms`
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Layers3 className="h-4 w-4" style={{ color: borderColor }} />
                            <div>
                              <div className="font-semibold text-sm">{subnet.name}</div>
                              <div className="text-xs text-gray-600">
                                Range: {subnet.block.base} - {subnet.block.broadcast} ({subnet.block.mask})
                              </div>
                              <div className="text-xs text-gray-600">
                                Usable IPs: {Math.max(0, subnet.block.size - 2).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" style={{ color: borderColor, borderColor }}>
                            {subnet.block.base}/{subnet.cidr}
                          </Badge>
                        </div>
                      </div>
                    );
                  } else if (item.type === 'freeSpace') {
                    const space = item.data;

                    return (
                      <div
                        key={`free-${index}`}
                        className={`p-3 rounded border border-dashed border-gray-400 bg-gray-100 transition-all duration-500 ${
                          animate ? 'opacity-80' : 'opacity-0'
                        }`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-center gap-2">
                          <Square className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="font-semibold text-sm text-gray-700">Free Space</div>
                            <div className="text-xs text-gray-600">
                              Range: {space.startIp} - {space.endIp} ({space.size.toLocaleString()} IPs)
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                });
              })()}
            </div>
          </div>
        </div>
        
        {/* Summary Footer */}
        <div className="flex justify-center gap-4 mt-6 text-sm text-gray-600">
          <span>Total subnets: {subnets.length}</span>
          <span>•</span>
          <span>Total IPs: {parentBlock.size.toLocaleString()}</span>
          <span>•</span>
          <span>Free: {freeSize.toLocaleString()} IPs ({freePercentage}%)</span>
        </div>
      </CardContent>
      
      {/* Error Modal */}
      <Dialog open={errorModal.opened} onOpenChange={(open) => setErrorModal({ opened: open, message: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Notification</DialogTitle>
            <DialogDescription>
              {errorModal.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setErrorModal({ opened: false, message: '' })}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}