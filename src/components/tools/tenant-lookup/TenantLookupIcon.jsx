import React from 'react';

const TenantLookupIcon = ({ size = 24, color = 'currentColor', ...props }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path 
        d="M3 21H21V19H3V21Z" 
        fill={color}
      />
      <path 
        d="M5 19H7V12H5V19ZM10 19H12V10H10V19ZM15 19H17V14H15V19ZM18 19H20V8H18V19Z" 
        fill={color}
      />
      <path 
        d="M2 7L12 1L22 7V9H2V7Z" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
      <circle 
        cx="12" 
        cy="5" 
        r="1.5" 
        fill={color}
      />
      <path 
        d="M6 15H8M11 15H13M16 15H18" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeLinecap="round"
      />
      <path 
        d="M6 17H8M11 17H13M16 17H18" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeLinecap="round"
      />
    </svg>
  );
};

export default TenantLookupIcon; 