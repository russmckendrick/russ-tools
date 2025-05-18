import React from 'react';

import { useState } from 'react';
import { Paper, Stack, Title, ThemeIcon, Divider, Grid, rem } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';
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

  // Build cron string from fields
  const cronString = `${fields.minute} ${fields.hour} ${fields.dayOfMonth} ${fields.month} ${fields.dayOfWeek}`;

  const handleFieldChange = (field, value) => {
    setFields((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Paper
      shadow="lg"
      radius="xl"
      p="xl"
      withBorder
      style={{
        maxWidth: 900,
        width: '100%',
        margin: '40px auto',
        position: 'relative',
        paddingLeft: 32,
        paddingRight: 32,
      }}
    >
      <Stack gap="lg">
        <Stack gap={4} align="center">
          <ThemeIcon size={48} radius="xl" color="blue" variant="gradient" gradient={{ from: 'blue', to: 'cyan', deg: 90 }}>
            <IconClock size={32} />
          </ThemeIcon>
          <Title order={2} style={{ fontWeight: 800, letterSpacing: -1, marginTop: 8, marginBottom: 0, textAlign: 'center' }}>
            Cron Job Expression<br />Builder/Validator
          </Title>
        </Stack>
        <Divider label="Time" labelPosition="left" color="blue.2" my={8} />
        <Stack gap="md">
          <CronFieldSelector field="minute" value={fields.minute} onChange={val => handleFieldChange('minute', val)} layout="vertical" />
          <CronFieldSelector field="hour" value={fields.hour} onChange={val => handleFieldChange('hour', val)} layout="vertical" />
        </Stack>
        <Divider label="Date" labelPosition="left" color="blue.2" my={8} />
        <Stack gap="md">
          <CronFieldSelector field="dayOfMonth" value={fields.dayOfMonth} onChange={val => handleFieldChange('dayOfMonth', val)} layout="vertical" />
          <CronFieldSelector field="month" value={fields.month} onChange={val => handleFieldChange('month', val)} layout="vertical" />
        </Stack>
        <Divider label="Repeat" labelPosition="left" color="blue.2" my={8} />
        <Stack gap="md">
          <CronFieldSelector field="dayOfWeek" value={fields.dayOfWeek} onChange={val => handleFieldChange('dayOfWeek', val)} layout="vertical" />
        </Stack>
        <Divider label="Cron Output & Feedback" labelPosition="center" color="blue.2" my={8} />
        <Stack gap="md">
          <CronExpressionInput value={cronString} onChange={() => {}} readOnly />
          <CronValidationInfo cronString={cronString} />
          <CronTranslatorDisplay cronString={cronString} />
        </Stack>
      </Stack>
    </Paper>
  );
};

export default CronBuilderTool;
