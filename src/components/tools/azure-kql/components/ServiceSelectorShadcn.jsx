import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '../../../ui/select';
import { Label } from '../../../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Shield, Cloud, Globe, Monitor, Server } from 'lucide-react';
import { getAvailableServices } from '../utils/templateProcessor';

const ServiceSelectorShadcn = ({ value, onChange }) => {
  const services = getAvailableServices();
  
  const serviceOptions = services.map(service => ({
    value: service.id,
    label: service.name,
    description: service.description,
    category: service.category
  }));

  const getServiceIcon = (serviceId) => {
    switch (serviceId) {
      case 'azure-firewall':
        return <Shield className="w-4 h-4" />;
      case 'azure-application-gateway':
        return <Globe className="w-4 h-4" />;
      case 'azure-virtual-desktop':
        return <Monitor className="w-4 h-4" />;
      default:
        return <Cloud className="w-4 h-4" />;
    }
  };

  const selectedService = serviceOptions.find(s => s.value === value);

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Server className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          Azure Service Selection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Label htmlFor="service-select" className="text-sm font-medium">
            Choose Service
          </Label>
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger id="service-select" className="w-full h-12">
              <SelectValue placeholder="Select an Azure service">
                {selectedService && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400">
                      {getServiceIcon(selectedService.value)}
                    </div>
                    <span className="font-medium">{selectedService.label}</span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {serviceOptions.map((service) => (
                <SelectItem key={service.value} value={service.value} className="p-3">
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400 mt-0.5">
                      {getServiceIcon(service.value)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="font-medium text-sm">{service.label}</div>
                      <div className="text-xs text-muted-foreground leading-relaxed">
                        {service.description}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {value && selectedService && (
            <div className="rounded-lg bg-muted/50 p-3 border border-border/30">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {selectedService.description}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceSelectorShadcn;