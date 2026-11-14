import * as React from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

import { copyText } from '@/core/clipboard.js';
import { Button } from './button';

export function CopyButton({
  value,
  label = 'Copy',
  variant = 'ghost',
  size = 'icon',
  children,
  ...props
}) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef(null);

  React.useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    const text = typeof value === 'function' ? value() : value;
    if (await copyText(text)) {
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } else {
      toast.error('Could not copy to the clipboard');
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={copy}
      aria-label={children ? undefined : label}
      {...props}
    >
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      {children ? (copied ? 'Copied' : children) : null}
      <span className="sr-only" role="status">
        {copied ? 'Copied' : ''}
      </span>
    </Button>
  );
}
