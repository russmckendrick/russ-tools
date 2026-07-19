import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ToolIcon } from '@/components/ui/tool-icon';
import { TriangleAlert, Trash2, HardDrive } from 'lucide-react';
import { TOOLS } from '@/tools/registry.mjs';
import { toolStorageKeys, clearTool } from '@/core/storage.js';

/**
 * The storage page — what this browser is holding, per tool, and how to
 * delete it.
 *
 * It replaces a page that offered one button wired to `localStorage.clear()`
 * beside a **hand-written** list of what that would destroy. The list had
 * drifted (it named tools by nickname and missed several), and the button
 * was blunt in both directions: it took the theme preference with it, and it
 * could not delete one tool's data without deleting all of it.
 *
 * Everything here is derived from the manifests instead, so the page shows
 * and clears only data that a tool explicitly owns. Site preferences and
 * unrelated origin storage stay outside this tool-data control.
 *
 * `clearTool` from core/ is the one code path that deletes, and it removes
 * the namespaced and the legacy generation together: this page is the
 * deliberate "delete my data" action that the never-delete migration shim
 * exists to stay out of the way of.
 */

/** @param {number} bytes */
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * A stored string costs two bytes per character in every engine that matters,
 * which is close enough to explain a quota to someone.
 *
 * @param {string} key
 * @returns {number}
 */
function sizeOf(key) {
  const value = localStorage.getItem(key);
  return value === null ? 0 : (key.length + value.length) * 2;
}

/** Read the whole picture in one pass. Cheap, and always current. */
function survey() {
  const tools = TOOLS.map((tool) => {
    const entries = toolStorageKeys(tool)
      .map((key) => ({ key, bytes: sizeOf(key) }))
      .filter((entry) => entry.bytes > 0);

    return {
      tool,
      entries,
      bytes: entries.reduce((sum, entry) => sum + entry.bytes, 0),
    };
  });

  return { tools };
}

export default function StorageManager() {
  const [state, setState] = useState(null);
  const [confirming, setConfirming] = useState(null);

  const refresh = useCallback(() => setState(survey()), []);

  // localStorage is unavailable during SSR and this page is prerendered, so
  // the survey has to wait for the client.
  useEffect(refresh, [refresh]);

  if (!state) return null;

  const stored = state.tools.filter((row) => row.bytes > 0);
  const empty = state.tools.filter((row) => row.bytes === 0);
  const totalBytes = stored.reduce((sum, row) => sum + row.bytes, 0);

  const clearEverything = () => {
    for (const row of state.tools) clearTool(row.tool);
    refresh();
  };

  const confirmClearAll = {
    title: 'Delete all tool data',
    body: `This removes all saved data for every tool — ${formatSize(
      totalBytes
    )} across ${stored.length} ${stored.length === 1 ? 'tool' : 'tools'}, including saved networks and every lookup history. Site preferences are unaffected. It cannot be undone.`,
    run: clearEverything,
  };

  return (
    <div className="grid gap-4">
      <Alert>
        <HardDrive className="h-4 w-4" />
        <AlertDescription>
          Everything below was saved by a tool in this browser. Clearing it here deletes it
          permanently — there is no copy on a server to restore from.
        </AlertDescription>
      </Alert>

      {stored.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-title-sm text-on-surface-muted">Nothing stored</p>
            <p className="mt-1 text-body-sm text-on-surface-faint">
              No tool has saved anything in this browser yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-title-sm">Saved data</h2>
                <p className="mt-1 text-body-sm text-on-surface-muted">
                  {formatSize(totalBytes)} across {stored.length}{' '}
                  {stored.length === 1 ? 'tool' : 'tools'}
                </p>
              </div>
              <Button
                variant="destructive"
                className="shrink-0"
                onClick={() => setConfirming(confirmClearAll)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear all tool data
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-1.5">
            {stored.map(({ tool, entries, bytes }) => (
              <div
                key={tool.id}
                className="flex items-center gap-3 rounded-md border border-outline p-3"
                style={{ '--cat': `var(--color-category-${tool.category})` }}
              >
                <span className="shrink-0 text-[var(--cat)]">
                  <ToolIcon name={tool.icon} size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <a href={tool.path} className="text-body-md font-medium hover:text-[var(--cat)]">
                    {tool.title}
                  </a>
                  <p className="truncate text-data-sm font-mono text-on-surface-faint">
                    {entries.map((entry) => entry.key).join(' · ')}
                  </p>
                </div>
                <span className="shrink-0 text-data-sm font-mono tabular-nums text-on-surface-muted">
                  {formatSize(bytes)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  aria-label={`Clear saved data for ${tool.title}`}
                  title={`Clear ${tool.title}`}
                  onClick={() =>
                    setConfirming({
                      title: `Delete ${tool.title} data`,
                      body: `This removes ${formatSize(bytes)} of saved data for ${
                        tool.title
                      } and cannot be undone. Other tools are unaffected.`,
                      run: () => {
                        clearTool(tool);
                        refresh();
                      },
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

          </CardContent>
        </Card>
      )}

      {empty.length > 0 && (
        <p className="text-body-sm text-on-surface-faint">
          Storing nothing: {empty.map((row) => row.tool.title).join(', ')}.
        </p>
      )}

      <Dialog open={!!confirming} onOpenChange={(open) => !open && setConfirming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TriangleAlert className="h-4 w-4 text-danger" />
              {confirming?.title}
            </DialogTitle>
            <DialogDescription>{confirming?.body}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                confirming?.run();
                setConfirming(null);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
