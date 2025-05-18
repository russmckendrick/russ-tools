import React from 'react';

import { useState } from 'react';
import { Paper, Stack, Title } from '@mantine/core';
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
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <Paper shadow="md" radius="lg" p="xl" withBorder>
        <Stack gap="md">
          <Title order={2} mb="sm">Cron Job Expression Builder/Validator</Title>
          {/* Field selectors */}
          <CronFieldSelector field="minute" value={fields.minute} onChange={val => handleFieldChange('minute', val)} />
          <CronFieldSelector field="hour" value={fields.hour} onChange={val => handleFieldChange('hour', val)} />
          <CronFieldSelector field="dayOfMonth" value={fields.dayOfMonth} onChange={val => handleFieldChange('dayOfMonth', val)} />
          <CronFieldSelector field="month" value={fields.month} onChange={val => handleFieldChange('month', val)} />
          <CronFieldSelector field="dayOfWeek" value={fields.dayOfWeek} onChange={val => handleFieldChange('dayOfWeek', val)} />

          {/* Raw cron string input/output */}
          <CronExpressionInput value={cronString} onChange={() => {}} readOnly />

          {/* Validation and translation */}
          <CronValidationInfo cronString={cronString} />
          <CronTranslatorDisplay cronString={cronString} />
        </Stack>
      </Paper>
    </div>
  );
};

export default CronBuilderTool;
