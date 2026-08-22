import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Server, Globe, Shield } from 'lucide-react';
import { getServiceList } from '../utils/templateLoader';

const SERVICE_ICONS = {
  'azure-firewall': Shield,
  'azure-virtual-desktop': Server,
  'azure-application-gateway': Globe,
  'multi-service': Database
};

const ServiceSelector = ({ value, onChange }) => {
  const services = getServiceList();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Azure Service</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {services.map(service => {
            const Icon = SERVICE_ICONS[service.id] || Database;
            const isSelected = value === service.id;
            
            return (
              <Button
                key={service.id}
                variant={isSelected ? "default" : "outline"}
                className="justify-start h-auto py-4 px-4 whitespace-normal"
                onClick={() => onChange(service.id)}
              >
                <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                <div className="min-w-0 text-left">
                  <div className="font-medium">{service.name}</div>
                  {service.description && (
                    <div className={`text-body-sm mt-0.5 ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {service.description}
                    </div>
                  )}
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceSelector;