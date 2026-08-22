---
category: Surfaces
---
The single toast host for the whole app — mounted once by the shell, never by a tool.

It is a DESIGN.md panel rather than sonner's default light card: surface-raised, the outline hairline, 10px radius, with status colour on the icon only. `theme="system"` agrees with the shell's pre-paint theme script on the first frame.

**A tool never renders this.** To notify, call sonner's `toast` directly:

```jsx
import { toast } from 'sonner';

toast.success('Copied to clipboard');
toast.error('Lookup failed', { description: 'NXDOMAIN for example.invalid' });
```

Render `<Toaster />` exactly once, at the application root.
