import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Button } from '../../../ui/button';
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
        <div className="grid grid-cols-2 gap-3">
          {services.map(service => {
            const Icon = SERVICE_ICONS[service.id] || Database;
            const isSelected = value === service.id;
            
            return (
              <Button
                key={service.id}
                variant={isSelected ? "default" : "outline"}
                className="justify-start h-auto py-4 px-4"
                onClick={() => onChange(service.id)}
              >
                <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-medium">{service.name}</div>
                  {service.description && (
                    <div className={`text-xs mt-0.5 ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
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