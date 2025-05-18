import React from 'react';
import { Select, MultiSelect, Group, Text } from '@mantine/core';

const fieldOptions = {
  minute: Array.from({ length: 60 }, (_, i) => ({ value: String(i), label: String(i) })).concat([
    { value: '*', label: 'Every minute (*)' },
  ]),
  hour: Array.from({ length: 24 }, (_, i) => ({ value: String(i), label: String(i) })).concat([
    { value: '*', label: 'Every hour (*)' },
  ]),
  dayOfMonth: Array.from({ length: 31 }, (_, i) => ({ value: String(i+1), label: String(i+1) })).concat([
    { value: '*', label: 'Every day (*)' },
  ]),
  month: [
    { value: '1', label: 'January (1)' },
    { value: '2', label: 'February (2)' },
    { value: '3', label: 'March (3)' },
    { value: '4', label: 'April (4)' },
    { value: '5', label: 'May (5)' },
    { value: '6', label: 'June (6)' },
    { value: '7', label: 'July (7)' },
    { value: '8', label: 'August (8)' },
    { value: '9', label: 'September (9)' },
    { value: '10', label: 'October (10)' },
    { value: '11', label: 'November (11)' },
    { value: '12', label: 'December (12)' },
    { value: '*', label: 'Every month (*)' },
  ],
  dayOfWeek: [
    { value: '0', label: 'Sunday (0)' },
    { value: '1', label: 'Monday (1)' },
    { value: '2', label: 'Tuesday (2)' },
    { value: '3', label: 'Wednesday (3)' },
    { value: '4', label: 'Thursday (4)' },
    { value: '5', label: 'Friday (5)' },
    { value: '6', label: 'Saturday (6)' },
    { value: '*', label: 'Every day (*)' },
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
  const isMulti = field === 'month' || field === 'dayOfWeek';
  return (
    <Group align="center" gap="sm">
      <Text w={120}>{fieldLabels[field]}</Text>
      {isMulti ? (
        <MultiSelect
          data={fieldOptions[field]}
          value={value.split(',').filter(Boolean)}
          onChange={vals => onChange(vals.length ? vals.join(',') : '*')}
          searchable
          clearable={false}
          withinPortal
          style={{ flex: 1 }}
          placeholder={`Select ${fieldLabels[field]}(s)`}
        />
      ) : (
        <Select
          data={fieldOptions[field]}
          value={value}
          onChange={onChange}
          searchable
          clearable={false}
          withinPortal
          style={{ flex: 1 }}
        />
      )}
    </Group>
  );
};

export default CronFieldSelector;
