import React from 'react';
import { Alert, Text, List } from '@mantine/core';
import { IconCheck, IconX, IconAlertTriangle } from '@tabler/icons-react';

const validateCronField = (value, min, max, fieldName) => {
  const errors = [];
  
  // Handle wildcard
  if (value === '*') {
    return errors;
  }
  
  // Handle step values (*/n or range/n)
  if (value.includes('/')) {
    const [range, step] = value.split('/');
    const stepNum = parseInt(step);
    
    if (isNaN(stepNum) || stepNum <= 0) {
      errors.push(`Invalid step value in ${fieldName}: ${step}. Step must be a positive number`);
      return errors;
    }
    
    // Validate the range part
    if (range === '*') {
      // */n format is valid
      return errors;
    } else if (range.includes('-')) {
      // range/n format
      const [start, end] = range.split('-');
      const startNum = parseInt(start);
      const endNum = parseInt(end);
      
      if (isNaN(startNum) || isNaN(endNum) || startNum < min || endNum > max || startNum >= endNum) {
        errors.push(`Invalid range in ${fieldName}: ${range}. Range must be ${min}-${max} with start < end`);
      }
    } else {
      // single value/n format
      const rangeNum = parseInt(range);
      if (isNaN(rangeNum) || rangeNum < min || rangeNum > max) {
        errors.push(`Invalid value in ${fieldName}: ${range}. Must be ${min}-${max}`);
      }
    }
    return errors;
  }
  
  // Handle comma-separated values
  const values = value.split(',');
  
  for (const val of values) {
    if (val.includes('-')) {
      // Handle range (e.g., 1-5)
      const [start, end] = val.split('-');
      const startNum = parseInt(start);
      const endNum = parseInt(end);
      
      if (isNaN(startNum) || isNaN(endNum) || startNum < min || endNum > max || startNum >= endNum) {
        errors.push(`Invalid range in ${fieldName}: ${val}. Range must be ${min}-${max} with start < end`);
      }
    } else {
      // Handle single value
      const num = parseInt(val);
      if (isNaN(num) || num < min || num > max) {
        errors.push(`Invalid ${fieldName} value: ${val}. Must be ${min}-${max} or *`);
      }
    }
  }
  
  return errors;
};

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

  // Validate each field with proper syntax support
  errors.push(...validateCronField(minute, 0, 59, 'minute'));
  errors.push(...validateCronField(hour, 0, 23, 'hour'));
  errors.push(...validateCronField(dayOfMonth, 1, 31, 'day of month'));
  errors.push(...validateCronField(month, 1, 12, 'month'));
  errors.push(...validateCronField(dayOfWeek, 0, 7, 'day of week'));

  // Additional validations for day of month
  if (dayOfMonth !== '*') {
    const dayValues = dayOfMonth.split(',');
    for (const val of dayValues) {
      if (val.includes('-')) {
        const [start, end] = val.split('-');
        if (parseInt(end) === 31) {
          warnings.push('Day 31 will be skipped in months with fewer than 31 days');
        }
      } else if (parseInt(val) === 31) {
        warnings.push('Day 31 will be skipped in months with fewer than 31 days');
      }
    }
    
    if (dayValues.some(d => parseInt(d) > 28) && month.includes('2')) {
      warnings.push('Days 29-31 may be skipped in February depending on leap year');
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

  // Check for common step patterns and provide helpful info
  if (minute.startsWith('*/')) {
    const step = parseInt(minute.split('/')[1]);
    if (!isNaN(step)) {
      warnings.push(`This will run every ${step} minute${step > 1 ? 's' : ''}`);
    }
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
