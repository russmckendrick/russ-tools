import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '../../../ui/select';
import { Label } from '../../../ui/label';
import { Shield, Cloud, Globe, Monitor } from 'lucide-react';
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
    <div className="space-y-2">
      <Label htmlFor="service-select" className="text-sm font-medium">
        Azure Service
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="service-select" className="w-full">
          <SelectValue placeholder="Select an Azure service">
            {selectedService && (
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400">
                  {getServiceIcon(selectedService.value)}
                </div>
                <span>{selectedService.label}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {serviceOptions.map((service) => (
            <SelectItem key={service.value} value={service.value}>
              <div className="flex items-start gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400">
                  {getServiceIcon(service.value)}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{service.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {service.description}
                  </div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value && selectedService && (
        <p className="text-xs text-muted-foreground">
          {selectedService.description}
        </p>
      )}
    </div>
  );
};

export default ServiceSelectorShadcn;