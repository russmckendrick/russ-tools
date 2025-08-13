import React, { useEffect, useRef, useState } from 'react';
import { loadPrismLanguages, highlightCode } from '@/utils/prismLoader';
import './CodeEditor.css';

const CodeEditor = ({
  value,
  onChange,
  language = 'json',
  placeholder = 'Enter your code here...',
  readOnly = false,
  className = '',
  minHeight = '384px'
}) => {
  const textareaRef = useRef(null);
  const preRef = useRef(null);
  const containerRef = useRef(null);
  const [highlightedCode, setHighlightedCode] = useState('');

  // Update highlighted code when value or language changes
  useEffect(() => {
    if (!value || language === 'auto') {
      setHighlightedCode('');
      return;
    }

    loadPrismLanguages(language).then(() => {
      const highlighted = highlightCode(value, language);
      setHighlightedCode(highlighted);
    });
  }, [value, language]);

  // Sync scroll between textarea and highlighted overlay
  const handleScroll = () => {
    if (preRef.current && textareaRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleChange = (e) => {
    if (onChange && !readOnly) {
      onChange(e);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden rounded-md border ${className}`}
      style={{ minHeight }}
    >
      {/* Highlighted code overlay */}
      {highlightedCode && value && (
        <pre
          ref={preRef}
          className="absolute inset-0 p-3 m-0 font-mono text-sm leading-relaxed pointer-events-none overflow-auto whitespace-pre-wrap break-words z-10 code-highlight"
          style={{
            background: 'transparent',
            minHeight,
            tabSize: 2
          }}
          aria-hidden="true"
        >
          <code
            className={language !== 'auto' ? `language-${language}` : ''}
            dangerouslySetInnerHTML={{ 
              __html: highlightedCode
            }}
          />
        </pre>
      )}

      {/* Actual textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onScroll={handleScroll}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`
          relative w-full p-3 font-mono text-sm leading-relaxed resize-none
          bg-transparent border-0 outline-none
          ${readOnly ? 'cursor-default' : 'cursor-text'}
          ${highlightedCode && value ? 'text-transparent caret-black dark:caret-white' : 'text-foreground'}
        `}
        style={{ 
          minHeight,
          tabSize: 2
        }}
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
      />

      {/* Background for read-only styling */}
      {readOnly && (
        <div className="absolute inset-0 bg-muted/50 pointer-events-none" />
      )}
    </div>
  );
};

export default CodeEditor;