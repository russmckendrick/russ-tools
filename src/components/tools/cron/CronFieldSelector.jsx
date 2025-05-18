import React from 'react';
import { Select, Group, Text, Chip, SimpleGrid, SegmentedControl, NumberInput } from '@mantine/core';
import { TimeInput, DatePickerInput, MonthPickerInput } from '@mantine/dates';

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
    return (
      <Group align="center" gap="sm">
        <Text w={120}>{fieldLabels[field]}</Text>
        <MonthPickerInput
          type="multiple"
          value={isEvery ? [] : value.split(',').map(v => new Date(2023, Number(v)-1))}
          onChange={dates => {
            if (!dates || dates.length === 0) onChange('*');
            else onChange(dates.map(d => String(d.getMonth()+1)).join(','));
          }}
          placeholder={isEvery ? 'Every' : ''}
          style={{ flex: 1 }}
          disabled={isEvery}
        />
        <Chip
          checked={isEvery}
          onChange={checked => onChange(checked ? '*' : '1')}
          color="blue"
          variant="outline"
        >
          Every
        </Chip>
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
    return (
      <Group align="center" gap="sm">
        <Text w={120}>{fieldLabels[field]}</Text>
        <DatePickerInput
          type="multiple"
          value={isEvery ? [] : value.split(',').map(v => new Date(2023, 0, Number(v)))}
          onChange={dates => {
            if (!dates || dates.length === 0) onChange('*');
            else onChange(dates.map(d => String(d.getDate())).join(','));
          }}
          placeholder={isEvery ? 'Every' : ''}
          style={{ flex: 1 }}
          disabled={isEvery}
        />
        <Chip
          checked={isEvery}
          onChange={checked => onChange(checked ? '*' : '1')}
          color="blue"
          variant="outline"
        >
          Every
        </Chip>
      </Group>
    );
  }

  // fallback
  return null;
};

export default CronFieldSelector;
