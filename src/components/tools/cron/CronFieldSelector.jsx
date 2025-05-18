import React from 'react';
import { Select, Group, Text, Chip, SimpleGrid, SegmentedControl, NumberInput } from '@mantine/core';

const fieldOptions = {
  minute: Array.from({ length: 60 }, (_, i) => ({ value: String(i), label: String(i) })),
  hour: Array.from({ length: 24 }, (_, i) => ({ value: String(i), label: String(i) })),
  dayOfMonth: Array.from({ length: 31 }, (_, i) => ({ value: String(i+1), label: String(i+1) })).concat([
    { value: '*', label: 'Every day (*)' },
  ]),
  month: [
    { value: '1', label: 'Jan' },
    { value: '2', label: 'Feb' },
    { value: '3', label: 'Mar' },
    { value: '4', label: 'Apr' },
    { value: '5', label: 'May' },
    { value: '6', label: 'Jun' },
    { value: '7', label: 'Jul' },
    { value: '8', label: 'Aug' },
    { value: '9', label: 'Sep' },
    { value: '10', label: 'Oct' },
    { value: '11', label: 'Nov' },
    { value: '12', label: 'Dec' },
  ],
  dayOfWeek: [
    { value: '0', label: 'Sun' },
    { value: '1', label: 'Mon' },
    { value: '2', label: 'Tue' },
    { value: '3', label: 'Wed' },
    { value: '4', label: 'Thu' },
    { value: '5', label: 'Fri' },
    { value: '6', label: 'Sat' },
  ],
};

const fieldLabels = {
  minute: 'Minute',
  hour: 'Hour',
  dayOfMonth: 'Day of Month',
  month: 'Month',
  dayOfWeek: 'Day of Week',
};

const CronFieldSelector = ({ field, value, onChange }) => {
  if (field === 'minute' || field === 'hour') {
    const isEvery = value === '*';
    return (
      <Group align="center" gap="sm">
        <Text w={120}>{fieldLabels[field]}</Text>
        <NumberInput
          min={field === 'minute' ? 0 : 0}
          max={field === 'minute' ? 59 : 23}
          value={isEvery ? '' : Number(value)}
          onChange={val => onChange(val === '' ? '*' : String(val))}
          placeholder={isEvery ? 'Every' : ''}
          style={{ flex: 1 }}
          disabled={isEvery}
        />
        <Chip
          checked={isEvery}
          onChange={checked => onChange(checked ? '*' : '0')}
          color="blue"
          variant="outline"
        >
          Every
        </Chip>
      </Group>
    );
  }

  if (field === 'month') {
    const isEvery = value === '*';
    const months = [
      { value: '1', label: 'Jan' }, { value: '2', label: 'Feb' }, { value: '3', label: 'Mar' }, { value: '4', label: 'Apr' },
      { value: '5', label: 'May' }, { value: '6', label: 'Jun' }, { value: '7', label: 'Jul' }, { value: '8', label: 'Aug' },
      { value: '9', label: 'Sep' }, { value: '10', label: 'Oct' }, { value: '11', label: 'Nov' }, { value: '12', label: 'Dec' }
    ];
    const selected = isEvery ? [] : value.split(',');
    return (
      <Group align="center" gap="sm" align-items="flex-start">
        <Text w={120}>{fieldLabels[field]}</Text>
        <div style={{ flex: 1 }}>
          <Chip.Group
            multiple
            value={selected}
            onChange={vals => onChange(vals.length ? vals.join(',') : '*')}
          >
            <SimpleGrid cols={6} spacing={4} verticalSpacing={4}>
              {months.map(opt => (
                <Chip key={opt.value} value={opt.value} color="blue" variant="filled">
                  {opt.label}
                </Chip>
              ))}
            </SimpleGrid>
          </Chip.Group>
          <Chip
            checked={isEvery}
            onChange={checked => onChange(checked ? '*' : selected.join(','))}
            color="blue"
            variant="outline"
            style={{ width: '100%', marginTop: 8 }}
          >
            Every
          </Chip>
        </div>
      </Group>
    );
  }

  if (field === 'dayOfWeek') {
    const isEvery = value === '*';
    const days = [
      { value: '0', label: 'Sun' },
      { value: '1', label: 'Mon' },
      { value: '2', label: 'Tue' },
      { value: '3', label: 'Wed' },
      { value: '4', label: 'Thu' },
      { value: '5', label: 'Fri' },
      { value: '6', label: 'Sat' },
    ];
    return (
      <Group align="center" gap="sm">
        <Text w={120}>{fieldLabels[field]}</Text>
        <SegmentedControl
          data={days}
          value={isEvery ? '' : value}
          onChange={val => onChange(val === '' ? '*' : val)}
          style={{ flex: 1 }}
          disabled={isEvery}
        />
        <Chip
          checked={isEvery}
          onChange={checked => onChange(checked ? '*' : '0')}
          color="blue"
          variant="outline"
        >
          Every
        </Chip>
      </Group>
    );
  }

  // Day of Month
  if (field === 'dayOfMonth') {
    const isEvery = value === '*';
    const days = Array.from({ length: 31 }, (_, i) => ({ value: String(i+1), label: String(i+1) }));
    const selected = isEvery ? [] : value.split(',');
    return (
      <Group align="center" gap="sm" align-items="flex-start">
        <Text w={120}>{fieldLabels[field]}</Text>
        <div style={{ flex: 1 }}>
          <Chip.Group
            multiple
            value={selected}
            onChange={vals => onChange(vals.length ? vals.join(',') : '*')}
          >
            <SimpleGrid cols={10} spacing={2} verticalSpacing={2}>
              {days.map(opt => (
                <Chip key={opt.value} value={opt.value} color="blue" variant="filled">
                  {opt.label}
                </Chip>
              ))}
            </SimpleGrid>
          </Chip.Group>
          <Chip
            checked={isEvery}
            onChange={checked => onChange(checked ? '*' : selected.join(','))}
            color="blue"
            variant="outline"
            style={{ width: '100%', marginTop: 8 }}
          >
            Every
          </Chip>
        </div>
      </Group>
    );
  }

  // fallback
  return null;
};

export default CronFieldSelector;
