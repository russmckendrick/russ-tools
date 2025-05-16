import React, { useState } from 'react';

const HelpTooltip = ({ content, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        className="text-gray-400 hover:text-gray-500 focus:outline-none"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        <svg
          className="h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isVisible && (
        <div
          className="absolute z-10 w-64 p-2 mt-1 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg shadow-lg"
          style={{ bottom: '100%', left: '50%', transform: 'translateX(-50%)' }}
        >
          {content}
          <div
            className="absolute w-2 h-2 bg-white border border-gray-200 transform rotate-45"
            style={{
              bottom: '-6px',
              left: '50%',
              marginLeft: '-4px',
              borderTop: 'none',
              borderLeft: 'none'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default HelpTooltip; 