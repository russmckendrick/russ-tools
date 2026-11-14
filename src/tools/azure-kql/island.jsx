import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Share } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToolAction } from '@/components/ui/tool-actions';
import { copyText, downloadFile, safeFilename } from '@/core';
import { useWebMCPTool } from '@/lib/useWebMCPTool';
import FilterList from './components/FilterList.jsx';
import QueryPanel from './components/QueryPanel.jsx';
import RawPanel from './components/RawPanel.jsx';
import SaveDialog from './components/SaveDialog.jsx';
import SavedQueries from './components/SavedQueries.jsx';
import ScenarioPicker from './components/ScenarioPicker.jsx';
import ShapeControls from './components/ShapeControls.jsx';
import TimeRange from './components/TimeRange.jsx';
import { buildQuery } from './lib/build.js';
import { findScenario, findService } from './lib/catalog.js';
import { createLibrary, entryFor, openEntry, renamed, withRecent, withSaved, withoutRecent, withoutSaved } from './lib/library.js';
import { shareUrl } from './lib/share.js';
import { initialState, nameFor } from './lib/session.js';
import { reducer, scenarioState } from './lib/state.js';
import { BUILD_KQL_QUERY_TOOL } from './lib/webmcp.js';

const TARGETS = {
  time: '#kql-time [aria-pressed="true"], #kql-time [role="combobox"]',
  limit: '#kql-limit',
  group: '#kql-group',
};

const typing = (target) => target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

export default function AzureKqlTool() {
  useWebMCPTool(BUILD_KQL_QUERY_TOOL);
  const params = useParams();
  const top = useRef(null);
  const [store] = useState(createLibrary);
  const [library, setLibrary] = useState(() => store.load());
  const latest = useRef(library);
  const [state, dispatch] = useReducer(reducer, null, () => initialState(params, window.location.search, store, library));
  const [saving, setSaving] = useState(null);
  const [picking, setPicking] = useState(false);

  const service = findService(state.service);
  const scenario = findScenario(state.service, state.scenario);
  const built = useMemo(() => buildQuery(state), [state]);
  const building = state.mode === 'build';
  const kql = building ? built.kql : state.kql;
  const ready = Boolean(kql.trim());

  useEffect(() => {
    store.saveLast(state);
  }, [store, state]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey || typing(event.target)) return;
      event.preventDefault();
      dispatch({ type: 'mode', mode: 'build' });
      setPicking(true);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const update = (change) => {
    latest.current = change(latest.current);
    setLibrary(latest.current);
    store.persist(latest.current);
  };
  const undoable = (message, change) => {
    const before = latest.current;
    update(change);
    toast(message, { action: { label: 'Undo', onClick: () => update(() => before) } });
  };
  const current = () => entryFor(state, kql, nameFor(state, kql));

  const copy = async () => {
    const copied = await copyText(kql);
    if (copied) update((lib) => withRecent(lib, current()));
    else toast.error('Could not copy the query');
    return copied;
  };

  const download = () => {
    downloadFile(kql, `${safeFilename(building ? `${state.service}-${state.scenario}` : 'query')}.kql`, 'text/plain');
    update((lib) => withRecent(lib, current()));
  };

  const share = async () => {
    const url = shareUrl(state, window.location.origin);
    if (url && (await copyText(url))) toast.success('Share link copied');
    else toast.error('Could not copy the share link');
  };

  const editAsKql = () => {
    if (state.kql.trim() && state.kql !== built.kql) {
      const raw = { ...state, mode: 'kql' };
      update((lib) => withRecent(lib, entryFor(raw, state.kql, nameFor(raw, state.kql))));
      toast.message('The KQL you had before is under Recent');
    }
    dispatch({ type: 'edit-as-kql', kql: built.kql });
  };

  const open = (entry) => {
    dispatch({ type: 'load', state: openEntry(entry) });
    top.current?.scrollIntoView({ block: 'start' });
  };

  const save = (name) => {
    update((lib) => withSaved(lib, { ...saving, id: crypto.randomUUID(), name, at: new Date().toISOString() }));
    setSaving(null);
    toast.success('Query saved');
  };

  const jump = (source) => {
    if (source === 'scenario') return setPicking(true);
    const id = source.startsWith('filter:') ? source.slice(7) : null;
    const target = id ? document.getElementById(`kql-filter-${id}`) ?? document.getElementById(`kql-filter-${id}-op`) : document.querySelector(TARGETS[source]);
    target?.focus();
    return target?.select?.();
  };

  return (
    <>
      <ToolAction>
        <Button variant="outline" size="sm" onClick={share} disabled={!ready}>
          <Share aria-hidden="true" />
          <span>
            Share<span className="max-sm:sr-only"> Configuration</span>
          </span>
        </Button>
      </ToolAction>

      <div ref={top} className="flex scroll-mt-24 flex-col gap-5">
        <Tabs value={state.mode} onValueChange={(mode) => dispatch({ type: 'mode', mode })}>
          <TabsList>
            <TabsTrigger value="build">Build</TabsTrigger>
            <TabsTrigger value="kql">Write KQL</TabsTrigger>
          </TabsList>

          <TabsContent value="build" className="mt-4 flex flex-col gap-4">
            <Card>
              <CardContent className="grid gap-x-4 gap-y-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                <ScenarioPicker
                  service={service}
                  scenario={scenario}
                  open={picking}
                  onOpenChange={setPicking}
                  onPick={(serviceId, scenarioId) => dispatch({ type: 'load', state: scenarioState(serviceId, scenarioId, state) })}
                />
                {scenario && <TimeRange time={state.time} onTime={(time) => dispatch({ type: 'time', time })} />}
                {scenario && <ShapeControls table={scenario.table} group={state.group} limit={state.limit} kind={built.kind} dispatch={dispatch} />}
                {scenario && <p className="col-span-full text-body-sm text-on-surface-muted">{scenario.description}</p>}
              </CardContent>
            </Card>

            {scenario && (
              <>
                <QueryPanel built={built} onCopy={copy} onEdit={editAsKql} onSave={() => setSaving(current())} onDownload={download} onJump={jump} />
                <FilterList
                  table={scenario.table}
                  filters={state.filters}
                  problems={built.problems}
                  onAdd={(column) => dispatch({ type: 'filter-add', column })}
                  onChange={(id, patch) => dispatch({ type: 'filter-change', id, patch })}
                  onRemove={(id) => dispatch({ type: 'filter-remove', id })}
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="kql" className="mt-4">
            <RawPanel kql={state.kql} onChange={(next) => dispatch({ type: 'kql', kql: next })} onCopy={copy} onSave={() => setSaving(current())} onDownload={download} />
          </TabsContent>
        </Tabs>

        <SavedQueries
          library={library}
          onOpen={open}
          onRename={(id, name) => update((lib) => renamed(lib, id, name))}
          onDelete={(id) => undoable('Saved query deleted', (lib) => withoutSaved(lib, id))}
          onSaveRecent={(entry) => setSaving(entry)}
          onClearRecent={() => undoable('Recent queries cleared', withoutRecent)}
        />
      </div>

      <SaveDialog open={saving !== null} suggested={saving?.name ?? ''} onSave={save} onClose={() => setSaving(null)} />
    </>
  );
}
