import React from 'react';

/**
 * Custom JSON icon component
 * Uses a modern JSON-inspired design with nested braces and structured elements
 */
const JSONIcon = ({ size = 24, color = 'currentColor', ...props }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Left brace */}
      <path
        d="M8 3C6.5 3 6 3.5 6 5V8C6 9 5.5 9.5 4.5 9.5H4V10.5H4.5C5.5 10.5 6 11 6 12V16C6 17.5 6.5 18 8 18"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Right brace */}
      <path
        d="M16 3C17.5 3 18 3.5 18 5V8C18 9 18.5 9.5 19.5 9.5H20V10.5H19.5C18.5 10.5 18 11 18 12V16C18 17.5 17.5 18 16 18"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Key-value pairs representation */}
      <circle cx="10" cy="7" r="0.5" fill={color} />
      <line x1="11" y1="7" x2="14" y2="7" stroke={color} strokeWidth="1" strokeLinecap="round" />
      
      <circle cx="10" cy="10" r="0.5" fill={color} />
      <line x1="11" y1="10" x2="13" y2="10" stroke={color} strokeWidth="1" strokeLinecap="round" />
      
      <circle cx="10" cy="13" r="0.5" fill={color} />
      <line x1="11" y1="13" x2="15" y2="13" stroke={color} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
};

export default JSONIcon; 