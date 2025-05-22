import React from 'react';
import { Alert, Text, List } from '@mantine/core';
import { IconCheck, IconX, IconAlertTriangle } from '@tabler/icons-react';

const validateCronExpression = (cronString) => {
  const parts = cronString.trim().split(/\s+/);
  const errors = [];
  const warnings = [];

  // Check basic format
  if (parts.length !== 5) {
    errors.push('Cron expression must have exactly 5 fields: minute hour day-of-month month day-of-week');
    return { isValid: false, errors, warnings };
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Validate minute (0-59)
  if (minute !== '*') {
    const minuteValues = minute.split(',');
    for (const val of minuteValues) {
      const num = parseInt(val);
      if (isNaN(num) || num < 0 || num > 59) {
        errors.push(`Invalid minute value: ${val}. Must be 0-59 or *`);
      }
    }
  }

  // Validate hour (0-23)
  if (hour !== '*') {
    const hourValues = hour.split(',');
    for (const val of hourValues) {
      const num = parseInt(val);
      if (isNaN(num) || num < 0 || num > 23) {
        errors.push(`Invalid hour value: ${val}. Must be 0-23 or *`);
      }
    }
  }

  // Validate day of month (1-31)
  if (dayOfMonth !== '*') {
    const dayValues = dayOfMonth.split(',');
    for (const val of dayValues) {
      const num = parseInt(val);
      if (isNaN(num) || num < 1 || num > 31) {
        errors.push(`Invalid day of month value: ${val}. Must be 1-31 or *`);
      }
    }
    // Warning for day 31 in months that don't have 31 days
    if (dayValues.includes('31')) {
      warnings.push('Day 31 will be skipped in months with fewer than 31 days');
    }
    if (dayValues.includes('30') && month.includes('2')) {
      warnings.push('Day 30 will be skipped in February');
    }
    if (dayValues.some(d => parseInt(d) > 28) && month.includes('2')) {
      warnings.push('Days 29-31 may be skipped in February depending on leap year');
    }
  }

  // Validate month (1-12)
  if (month !== '*') {
    const monthValues = month.split(',');
    for (const val of monthValues) {
      const num = parseInt(val);
      if (isNaN(num) || num < 1 || num > 12) {
        errors.push(`Invalid month value: ${val}. Must be 1-12 or *`);
      }
    }
  }

  // Validate day of week (0-7, where 0 and 7 are Sunday)
  if (dayOfWeek !== '*') {
    const dowValues = dayOfWeek.split(',');
    for (const val of dowValues) {
      const num = parseInt(val);
      if (isNaN(num) || num < 0 || num > 7) {
        errors.push(`Invalid day of week value: ${val}. Must be 0-7 or * (0 and 7 are Sunday)`);
      }
    }
  }

  // Check for potential logical issues
  if (dayOfMonth !== '*' && dayOfWeek !== '*') {
    warnings.push('Both day-of-month and day-of-week are specified. The job will run when EITHER condition is met (OR logic)');
  }

  // Check for overly frequent executions
  if (minute === '*' && hour === '*') {
    warnings.push('This will run every minute! Consider if this frequency is intended');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

const CronValidationInfo = ({ cronString }) => {
  const validation = validateCronExpression(cronString);

  if (validation.isValid && validation.warnings.length === 0) {
    return (
      <Alert icon={<IconCheck size={16} />} title="Valid Expression" color="green" variant="light">
        <Text size="sm">The cron expression is valid and ready to use.</Text>
      </Alert>
    );
  }

  return (
    <>
      {validation.errors.length > 0 && (
        <Alert icon={<IconX size={16} />} title="Validation Errors" color="red" variant="light">
          <List size="sm">
            {validation.errors.map((error, index) => (
              <List.Item key={index}>{error}</List.Item>
            ))}
          </List>
        </Alert>
      )}
      
      {validation.warnings.length > 0 && (
        <Alert icon={<IconAlertTriangle size={16} />} title="Warnings" color="yellow" variant="light">
          <List size="sm">
            {validation.warnings.map((warning, index) => (
              <List.Item key={index}>{warning}</List.Item>
            ))}
          </List>
        </Alert>
      )}
    </>
  );
};

export default CronValidationInfo;
