import React from 'react';

const MicrosoftPortalsIcon = ({ size = 24, color = 'currentColor', ...props }) => {
  return (
    <svg
      fill={color}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Microsoft-style window panes representing portals */}
      <rect x="2" y="2" width="12" height="12" rx="1" />
      <rect x="18" y="2" width="12" height="12" rx="1" />
      <rect x="2" y="18" width="12" height="12" rx="1" />
      <rect x="18" y="18" width="12" height="12" rx="1" />
      
      {/* Small connection dots in center */}
      <circle cx="16" cy="8" r="1" />
      <circle cx="16" cy="24" r="1" />
      <circle cx="8" cy="16" r="1" />
      <circle cx="24" cy="16" r="1" />
    </svg>
  );
};

export default MicrosoftPortalsIcon; 