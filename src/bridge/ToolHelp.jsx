import { CircleQuestionMark } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * The Help action every tool page carries: a link to the tool's prerendered
 * help page at `<tool.path>/help` (src/pages/[tool]/help.astro).
 *
 * This used to open a slide-in drawer that fetched and rendered the help
 * markdown on demand (see docs/BEHAVIOR_CHANGES.md). The page replaced it:
 * same docs source, but linkable, indexable, and read at a full measure. The
 * island's link interceptor turns this into a real document navigation, which
 * is exactly what a cross-page link in an MPA should be.
 *
 * @param {{ tool: { path: string, title: string } }} props
 */
export default function ToolHelp({ tool }) {
  return (
    <Button asChild variant="outline" size="sm">
      <a href={`${tool.path}/help`}>
        <CircleQuestionMark />
        Help
      </a>
    </Button>
  );
}
