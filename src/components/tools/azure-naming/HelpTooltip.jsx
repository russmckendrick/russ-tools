import React from 'react';
import { Tooltip, ActionIcon } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';

const HelpTooltip = ({ content, className = '' }) => {
  return (
    <Tooltip label={content} withArrow position="top" className={className}>
      <ActionIcon variant="subtle" color="gray" size="sm" tabIndex={0} aria-label="Help">
        <IconInfoCircle size={16} />
      </ActionIcon>
    </Tooltip>
  );
};

export default HelpTooltip; 