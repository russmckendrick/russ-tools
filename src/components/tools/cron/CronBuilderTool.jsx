import React from 'react';

import { useState } from 'react';
import { 
  Paper, 
  Stack, 
  Title, 
  ThemeIcon, 
  Grid, 
  rem,
  Tabs,
  Group,
  Text,
  Code,
  Alert,
  ActionIcon,
  Tooltip,
  Badge
} from '@mantine/core';
import { IconClock, IconCopy, IconCheck, IconInfoCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import SEOHead from '../../common/SEOHead';
import { generateToolSEO } from '../../../utils/seoUtils';
import toolsConfig from '../../../utils/toolsConfig.json';
import { useClipboard } from '@mantine/hooks';
import CronFieldSelector from './CronFieldSelector';
import CronExpressionInput from './CronExpressionInput';
import CronValidationInfo from './CronValidationInfo';
import CronTranslatorDisplay from './CronTranslatorDisplay';

const defaultFields = {
  minute: '*',
  hour: '*',
  dayOfMonth: '*',
  month: '*',
  dayOfWeek: '*',
};

const CronBuilderTool = () => {
  const [fields, setFields] = useState(defaultFields);
  const clipboard = useClipboard({ timeout: 2000 });

  // Get tool configuration for SEO
  const toolConfig = toolsConfig.find(tool => tool.id === 'cron-builder');
  const seoData = generateToolSEO(toolConfig);

  // Build cron string from fields
  const cronString = `${fields.minute} ${fields.hour} ${fields.dayOfMonth} ${fields.month} ${fields.dayOfWeek}`;

  const handleFieldChange = (field, value) => {
    setFields((prev) => ({ ...prev, [field]: value }));
  };

  const handleCopy = () => {
    clipboard.copy(cronString);
    notifications.show({
      title: 'CRON Expression Copied',
      message: `Expression "${cronString}" copied to clipboard`,
      color: 'green',
      icon: <IconCopy size={16} />
    });
  };

  // Parse cron expression back into fields
  const parseCronExpression = (cronExpression) => {
    const parts = cronExpression.trim().split(/\s+/);
    if (parts.length === 5) {
      const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
      setFields({
        minute,
        hour,
        dayOfMonth,
        month,
        dayOfWeek,
      });
    }
  };

  const handleManualCronChange = (newCronString) => {
    try {
      parseCronExpression(newCronString);
      notifications.show({
        title: 'CRON Expression Loaded',
        message: 'Expression parsed and loaded into the builder',
        color: 'blue',
        icon: <IconCheck size={16} />
      });
    } catch (error) {
      notifications.show({
        title: 'Invalid CRON Expression',
        message: 'Please check your CRON expression format',
        color: 'red',
        icon: <IconInfoCircle size={16} />
      });
    }
  };

  return (
    <>
      <SEOHead {...seoData} />
      <Paper p="xl" radius="lg" withBorder>
      <Stack gap="xl">
        {/* Header */}
        <Group gap="md">
          <ThemeIcon size={48} radius="md" color="orange" variant="light">
            <IconClock size={28} />
          </ThemeIcon>
          <div>
            <Title order={2} fw={600}>
              CRON Expression Builder
            </Title>
            <Text size="sm" c="dimmed">
              Build and validate cron expressions with ease
            </Text>
          </div>
        </Group>

        <Tabs defaultValue="builder">
          <Tabs.List mb="lg">
            <Tabs.Tab value="builder" leftSection={<IconClock size={18} />}>
              CRON Builder
            </Tabs.Tab>
            <Tabs.Tab value="input" leftSection={<IconCopy size={18} />}>
              Expression Validator
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="builder" pt="lg">
            <Stack gap="lg">
              {/* Cron Expression Output */}
              <Paper p="md" withBorder radius="md">
                <Group justify="space-between" align="center">
                  <div style={{ flex: 1 }}>
                    <Text size="xs" c="dimmed" mb={4}>Generated Expression:</Text>
                    <Code block size="lg" fw="bold" c="blue">
                      {cronString}
                    </Code>
                  </div>
                  <Tooltip label={clipboard.copied ? 'Copied!' : 'Copy to clipboard'}>
                    <ActionIcon 
                      variant="light" 
                      color={clipboard.copied ? 'green' : 'blue'}
                      onClick={handleCopy}
                      size="lg"
                    >
                      {clipboard.copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                    </ActionIcon>
                  </Tooltip>
                </Group>
                <CronTranslatorDisplay cronString={cronString} />
              </Paper>

              {/* Field Selectors in Grid */}
              <Grid gutter="lg">
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="md">
                    <Group gap="xs" align="center">
                      <Badge variant="light" color="blue" size="sm">Time</Badge>
                      <Text size="xs" c="dimmed">Configure when the job runs</Text>
                    </Group>
                    <CronFieldSelector 
                      field="minute" 
                      value={fields.minute} 
                      onChange={val => handleFieldChange('minute', val)} 
                    />
                    <CronFieldSelector 
                      field="hour" 
                      value={fields.hour} 
                      onChange={val => handleFieldChange('hour', val)} 
                    />
                  </Stack>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="md">
                    <Group gap="xs" align="center">
                      <Badge variant="light" color="green" size="sm">Date</Badge>
                      <Text size="xs" c="dimmed">Configure which dates to run</Text>
                    </Group>
                    <CronFieldSelector 
                      field="dayOfMonth" 
                      value={fields.dayOfMonth} 
                      onChange={val => handleFieldChange('dayOfMonth', val)} 
                    />
                    <CronFieldSelector 
                      field="month" 
                      value={fields.month} 
                      onChange={val => handleFieldChange('month', val)} 
                    />
                    <CronFieldSelector 
                      field="dayOfWeek" 
                      value={fields.dayOfWeek} 
                      onChange={val => handleFieldChange('dayOfWeek', val)} 
                    />
                  </Stack>
                </Grid.Col>
              </Grid>

              {/* Validation Info */}
              <CronValidationInfo cronString={cronString} />
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="input" pt="lg">
            <Stack gap="lg">
              <Alert icon={<IconInfoCircle size={16} />} title="Manual Input" color="blue" variant="light">
                Enter a cron expression directly to validate and translate it
              </Alert>
              <CronExpressionInput value={cronString} onChange={handleManualCronChange} />
              <CronValidationInfo cronString={cronString} />
              <CronTranslatorDisplay cronString={cronString} />
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Paper>
    </>
  );
};

export default CronBuilderTool;
