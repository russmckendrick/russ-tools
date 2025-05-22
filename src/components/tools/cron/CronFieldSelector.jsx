import React from 'react';
import { 
  Select, 
  Group, 
  Text, 
  Chip, 
  SimpleGrid, 
  SegmentedControl, 
  NumberInput,
  Stack,
  Switch,
  Paper,
  Flex,
  Box,
  ThemeIcon
} from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';

const fieldLabels = {
  minute: 'Minute (0-59)',
  hour: 'Hour (0-23)',
  dayOfMonth: 'Day of Month (1-31)',
  month: 'Month',
  dayOfWeek: 'Day of Week',
};

const CronFieldSelector = ({ field, value, onChange }) => {
  const isEvery = value === '*';

  if (field === 'minute') {
    const isCustom = !isEvery && !['0', '0,30', '0,15,30,45', '0,10,20,30,40,50', '0,5,10,15,20,25,30,35,40,45,50,55'].includes(value);
    
    const presets = [
      { value: '0', label: 'Once per hour', description: 'At minute 0 (top of hour)' },
      { value: '0,30', label: 'Every 30 minutes', description: 'At minutes 0 and 30' },
      { value: '0,15,30,45', label: 'Every 15 minutes', description: 'At minutes 0, 15, 30, and 45' },
      { value: '0,10,20,30,40,50', label: 'Every 10 minutes', description: 'At minutes 0, 10, 20, 30, 40, and 50' },
      { value: '0,5,10,15,20,25,30,35,40,45,50,55', label: 'Every 5 minutes', description: 'At minutes 0, 5, 10, 15, etc.' },
    ];
    
    const selectedPreset = presets.find(p => p.value === value);
    const [showCustom, setShowCustom] = React.useState(isCustom);
    
    // Update showCustom when value changes to/from custom
    React.useEffect(() => {
      setShowCustom(isCustom);
    }, [isCustom]);
    
    return (
      <Paper p="md" withBorder radius="sm">
        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Text fw={500} size="sm">{fieldLabels[field]}</Text>
            <Switch
              label="Every"
              size="sm"
              checked={isEvery}
              onChange={event => {
                onChange(event.currentTarget.checked ? '*' : '0');
                setShowCustom(false);
              }}
            />
          </Group>
          
          {!isEvery && (
            <>
              <Text size="xs" c="dimmed" mb="xs">
                Choose a common pattern or select custom minutes
              </Text>
              
              <Stack gap="xs">
                {presets.map(preset => (
                                  <Paper
                  key={preset.value}
                  p="xs"
                  radius="sm"
                  withBorder
                  style={{ 
                    cursor: 'pointer',
                    borderColor: value === preset.value ? 'var(--mantine-color-blue-4)' : undefined,
                    backgroundColor: value === preset.value ? 'var(--mantine-color-blue-light)' : undefined
                  }}
                  onClick={() => {
                    onChange(preset.value);
                    setShowCustom(false);
                  }}
                >
                    <Group justify="space-between" align="center">
                      <div>
                        <Text size="sm" fw={500} c={value === preset.value ? 'blue' : undefined}>
                          {preset.label}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {preset.description}
                        </Text>
                      </div>
                      {value === preset.value && (
                        <ThemeIcon size="sm" color="blue" variant="light">
                          <IconCheck size={12} />
                        </ThemeIcon>
                      )}
                    </Group>
                  </Paper>
                ))}
                
                <Paper
                  p="xs"
                  radius="sm"
                  withBorder
                  style={{ 
                    cursor: 'pointer',
                    borderColor: showCustom ? 'var(--mantine-color-blue-4)' : undefined,
                    backgroundColor: showCustom ? 'var(--mantine-color-blue-light)' : undefined
                  }}
                  onClick={() => setShowCustom(true)}
                >
                  <Group justify="space-between" align="center">
                    <div>
                      <Text size="sm" fw={500} c={showCustom ? 'blue' : undefined}>
                        Custom minutes
                      </Text>
                      <Text size="xs" c="dimmed">
                        Select specific minutes manually
                      </Text>
                    </div>
                    {showCustom && (
                      <ThemeIcon size="sm" color="blue" variant="light">
                        <IconCheck size={12} />
                      </ThemeIcon>
                    )}
                  </Group>
                </Paper>
                
                {showCustom && (
                  <Paper p="sm" radius="sm" withBorder>
                    <Text size="xs" c="dimmed" mb="xs">
                      Select specific minutes (0-59):
                    </Text>
                    <Chip.Group
                      multiple
                      value={isEvery ? [] : value.split(',').filter(Boolean)}
                      onChange={vals => onChange(vals.length ? vals.sort((a, b) => Number(a) - Number(b)).join(',') : '*')}
                    >
                      <SimpleGrid cols={15} spacing="2px">
                        {Array.from({ length: 60 }, (_, i) => (
                          <Chip 
                            key={i} 
                            value={String(i)} 
                            size="xs"
                            variant="filled"
                            styles={{
                              label: {
                                padding: '2px 6px',
                                fontSize: '11px',
                                fontWeight: 500
                              }
                            }}
                          >
                            {i}
                          </Chip>
                        ))}
                      </SimpleGrid>
                    </Chip.Group>
                  </Paper>
                )}
              </Stack>
            </>
          )}
        </Stack>
      </Paper>
    );
  }

  if (field === 'hour') {
    const maxValue = 23;
    const options = Array.from({ length: maxValue + 1 }, (_, i) => ({ 
      value: String(i), 
      label: String(i)  // Simplified labels for more compact display
    }));
    const selected = isEvery ? [] : value.split(',').filter(Boolean);
    
    return (
      <Paper p="md" withBorder radius="sm">
        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Text fw={500} size="sm">{fieldLabels[field]}</Text>
            <Switch
              label="Every"
              size="sm"
              checked={isEvery}
              onChange={event => onChange(event.currentTarget.checked ? '*' : '')}
            />
          </Group>
          
          {!isEvery && (
            <>
              <Text size="xs" c="dimmed" mb="xs">
                Select specific hours (e.g., 9,12,17 for 9 AM, 12 PM, 5 PM)
              </Text>
              <Chip.Group
                multiple
                value={selected}
                onChange={vals => onChange(vals.length ? vals.join(',') : '*')}
              >
                <SimpleGrid cols={6} spacing="xs">
                  {options.map(opt => (
                    <Chip 
                      key={opt.value} 
                      value={opt.value} 
                      size="sm"
                      variant="filled"
                      styles={{
                        label: {
                          padding: '4px 8px',
                          fontSize: '12px',
                          fontWeight: 500,
                          minWidth: '32px',
                          textAlign: 'center'
                        }
                      }}
                    >
                      {opt.label}
                    </Chip>
                  ))}
                </SimpleGrid>
              </Chip.Group>
            </>
          )}
        </Stack>
      </Paper>
    );
  }

  if (field === 'month') {
    const months = [
      { value: '1', label: 'Jan' }, { value: '2', label: 'Feb' }, { value: '3', label: 'Mar' }, 
      { value: '4', label: 'Apr' }, { value: '5', label: 'May' }, { value: '6', label: 'Jun' }, 
      { value: '7', label: 'Jul' }, { value: '8', label: 'Aug' }, { value: '9', label: 'Sep' }, 
      { value: '10', label: 'Oct' }, { value: '11', label: 'Nov' }, { value: '12', label: 'Dec' }
    ];
    const selected = isEvery ? [] : value.split(',').filter(Boolean);
    
    return (
      <Paper p="md" withBorder radius="sm">
        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Text fw={500} size="sm">{fieldLabels[field]}</Text>
            <Switch
              label="Every"
              size="sm"
              checked={isEvery}
              onChange={event => onChange(event.currentTarget.checked ? '*' : '')}
            />
          </Group>
          
          {!isEvery && (
            <>
              <Text size="xs" c="dimmed" mb="xs">
                Select specific months (e.g., Jan, Apr, Jul, Oct for quarterly)
              </Text>
              <Chip.Group
                multiple
                value={selected}
                onChange={vals => onChange(vals.length ? vals.join(',') : '*')}
              >
                <SimpleGrid cols={4} spacing="xs">
                  {months.map(opt => (
                    <Chip 
                      key={opt.value} 
                      value={opt.value} 
                      size="sm"
                      variant="filled"
                    >
                      {opt.label}
                    </Chip>
                  ))}
                </SimpleGrid>
              </Chip.Group>
            </>
          )}
        </Stack>
      </Paper>
    );
  }

  if (field === 'dayOfWeek') {
    const days = [
      { value: '0', label: 'Sun' }, { value: '1', label: 'Mon' }, { value: '2', label: 'Tue' },
      { value: '3', label: 'Wed' }, { value: '4', label: 'Thu' }, { value: '5', label: 'Fri' },
      { value: '6', label: 'Sat' },
    ];
    const selected = isEvery ? [] : value.split(',').filter(Boolean);
    
    return (
      <Paper p="md" withBorder radius="sm">
        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Text fw={500} size="sm">{fieldLabels[field]}</Text>
            <Switch
              label="Every"
              size="sm"
              checked={isEvery}
              onChange={event => onChange(event.currentTarget.checked ? '*' : '')}
            />
          </Group>
          
          {!isEvery && (
            <>
              <Text size="xs" c="dimmed" mb="xs">
                Select specific days (e.g., Mon-Fri for weekdays, Sat-Sun for weekends)
              </Text>
              <Chip.Group
                multiple
                value={selected}
                onChange={vals => onChange(vals.length ? vals.join(',') : '*')}
              >
                <Group gap="xs" justify="center">
                  {days.map(opt => (
                    <Chip 
                      key={opt.value} 
                      value={opt.value} 
                      size="sm"
                      variant="filled"
                    >
                      {opt.label}
                    </Chip>
                  ))}
                </Group>
              </Chip.Group>
            </>
          )}
        </Stack>
      </Paper>
    );
  }

  // Day of Month
  if (field === 'dayOfMonth') {
    const days = Array.from({ length: 31 }, (_, i) => ({ value: String(i+1), label: String(i+1) }));
    const selected = isEvery ? [] : value.split(',').filter(Boolean);
    
    return (
      <Paper p="md" withBorder radius="sm">
        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Text fw={500} size="sm">{fieldLabels[field]}</Text>
            <Switch
              label="Every"
              size="sm"
              checked={isEvery}
              onChange={event => onChange(event.currentTarget.checked ? '*' : '')}
            />
          </Group>
          
          {!isEvery && (
            <>
              <Text size="xs" c="dimmed" mb="xs">
                Select specific days (e.g., 1,15 for 1st and 15th of each month)
              </Text>
              <Chip.Group
                multiple
                value={selected}
                onChange={vals => onChange(vals.length ? vals.sort((a, b) => Number(a) - Number(b)).join(',') : '*')}
              >
                <SimpleGrid cols={10} spacing="2px">
                  {days.map(opt => (
                    <Chip 
                      key={opt.value} 
                      value={opt.value} 
                      size="xs"
                      variant="filled"
                      styles={{
                        label: {
                          padding: '2px 6px',
                          fontSize: '11px',
                          fontWeight: 500
                        }
                      }}
                    >
                      {opt.label}
                    </Chip>
                  ))}
                </SimpleGrid>
              </Chip.Group>
            </>
          )}
        </Stack>
      </Paper>
    );
  }

  return null;
};

export default CronFieldSelector;
