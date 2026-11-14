import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { findService, servicesByGroup } from '../lib/catalog.js';

const GROUPED = servicesByGroup();

export default function SourcePicker({ service, scenario, onService, onScenario }) {
  const scenarios = findService(service)?.scenarios ?? [];
  return (
    <>
      <div className="col-span-2 flex min-w-0 flex-col gap-1.5 sm:col-span-1">
        <Label htmlFor="kql-service">Service</Label>
        <Select value={service} onValueChange={(next) => next && onService(next)}>
          <SelectTrigger id="kql-service">
            <SelectValue placeholder="Choose a service" />
          </SelectTrigger>
          <SelectContent>
            {GROUPED.map(({ group, services }) => (
              <SelectGroup key={group}>
                <SelectLabel>{group}</SelectLabel>
                {services.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-2 flex min-w-0 flex-col gap-1.5 sm:col-span-1">
        <Label htmlFor="kql-scenario">Scenario</Label>
        <Select value={scenario} onValueChange={(next) => next && onScenario(next)} disabled={scenarios.length === 0}>
          <SelectTrigger id="kql-scenario">
            <SelectValue placeholder="Choose a service first" />
          </SelectTrigger>
          <SelectContent>
            {scenarios.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
