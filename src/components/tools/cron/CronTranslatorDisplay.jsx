import React from 'react';
import { Text, Group, Alert } from '@mantine/core';
import { IconLanguage } from '@tabler/icons-react';

const translateCronExpression = (cronString) => {
  const parts = cronString.trim().split(/\s+/);
  if (parts.length !== 5) {
    return 'Invalid cron expression format';
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Helper functions
  const formatMinute = (min) => {
    if (min === '*') return 'every minute';
    const minutes = min.split(',').sort((a, b) => Number(a) - Number(b));
    if (minutes.length === 1) {
      return `at minute ${minutes[0]}`;
    }
    return `at minutes ${minutes.join(', ')}`;
  };

  const formatHour = (hr) => {
    if (hr === '*') return 'every hour';
    const hours = hr.split(',').sort((a, b) => Number(a) - Number(b));
    const hourLabels = hours.map(h => {
      const hourNum = parseInt(h);
      const period = hourNum >= 12 ? 'PM' : 'AM';
      const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
      return `${displayHour}:00 ${period}`;
    });
    
    if (hours.length === 1) {
      return `at ${hourLabels[0]}`;
    }
    return `at ${hourLabels.join(', ')}`;
  };

  const formatDayOfMonth = (dom) => {
    if (dom === '*') return 'every day';
    const days = dom.split(',').sort((a, b) => Number(a) - Number(b)).map(d => {
      const num = parseInt(d);
      const suffix = num === 1 || num === 21 || num === 31 ? 'st' :
                    num === 2 || num === 22 ? 'nd' :
                    num === 3 || num === 23 ? 'rd' : 'th';
      return `${num}${suffix}`;
    });
    return days.length === 1 ? `on the ${days[0]}` : `on the ${days.join(', ')}`;
  };

  const formatMonth = (mon) => {
    if (mon === '*') return 'every month';
    const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const months = mon.split(',').sort((a, b) => Number(a) - Number(b)).map(m => monthNames[parseInt(m)]);
    return months.length === 1 ? `in ${months[0]}` : `in ${months.join(', ')}`;
  };

  const formatDayOfWeek = (dow) => {
    if (dow === '*') return 'every day of the week';
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const days = dow.split(',').map(d => dayNames[parseInt(d)]);
    return days.length === 1 ? `on ${days[0]}` : `on ${days.join(', ')}`;
  };

  // Build the translation
  let translation = 'Runs ';

  // Handle special cases first
  if (minute === '*' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return 'Runs every minute of every day';
  }

  // Time part
  if (hour === '*' && minute === '*') {
    translation += 'every minute ';
  } else if (hour === '*') {
    translation += `${formatMinute(minute)} of every hour `;
  } else if (minute === '*') {
    translation += `every minute ${formatHour(hour).replace('at ', 'of ')} `;
  } else {
    // Both minute and hour are specific
    const minutes = minute.split(',').sort((a, b) => Number(a) - Number(b));
    const hours = hour.split(',').sort((a, b) => Number(a) - Number(b));
    
    if (minutes.length === 1 && hours.length === 1) {
      // Single time
      const hourNum = parseInt(hours[0]);
      const minNum = parseInt(minutes[0]);
      const period = hourNum >= 12 ? 'PM' : 'AM';
      const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
      translation += `at ${displayHour}:${minNum.toString().padStart(2, '0')} ${period} `;
    } else {
      // Multiple times
      translation += `${formatMinute(minute)} ${formatHour(hour).replace('at ', 'of ')} `;
    }
  }

  // Date constraints
  const dateConstraints = [];
  
  if (dayOfMonth !== '*') {
    dateConstraints.push(formatDayOfMonth(dayOfMonth));
  }
  
  if (month !== '*') {
    dateConstraints.push(formatMonth(month));
  }
  
  if (dayOfWeek !== '*') {
    dateConstraints.push(formatDayOfWeek(dayOfWeek));
  }

  if (dateConstraints.length === 0) {
    translation += 'every day';
  } else {
    translation += dateConstraints.join(' ');
  }

  return translation;
};

const CronTranslatorDisplay = ({ cronString }) => {
  const translation = translateCronExpression(cronString);
  const isValid = !translation.startsWith('Invalid');

  return (
    <Alert 
      icon={<IconLanguage size={16} />} 
      title="Human Translation" 
      color={isValid ? 'green' : 'red'} 
      variant="light"
      mt="sm"
    >
      <Text size="sm" fw={500}>
        {translation}
      </Text>
    </Alert>
  );
};

export default CronTranslatorDisplay;
