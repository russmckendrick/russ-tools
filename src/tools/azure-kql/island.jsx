import React, { useMemo, useReducer, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Share } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Ghost } from '@/components/ui/ghost';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToolAction } from '@/components/ui/tool-actions';
import { copyText, downloadFile, safeFilename } from '@/core';
import { useWebMCPTool } from '@/lib/useWebMCPTool';
import FilterList from './components/FilterList.jsx';
import QueryPanel from './components/QueryPanel.jsx';
import RangeControls from './components/RangeControls.jsx';
import RawPanel from './components/RawPanel.jsx';
import SaveDialog from './components/SaveDialog.jsx';
import SavedQueries from './components/SavedQueries.jsx';
import SourcePicker from './components/SourcePicker.jsx';
import { buildQuery } from './lib/build.js';
import { findScenario, findService } from './lib/catalog.js';
import { createLibrary, entryFor, openEntry, renamed, withRecent, withSaved, withoutRecent, withoutSaved } from './lib/library.js';
import { readShare, shareUrl } from './lib/share.js';
import { EMPTY_STATE, reducer, scenarioState } from './lib/state.js';
import { BUILD_KQL_QUERY_TOOL } from './lib/webmcp.js';

const GHOST_STATE = scenarioState('azure-firewall', 'denied', EMPTY_STATE);
const GHOST_QUERY = buildQuery(GHOST_STATE);
const NOTHING = () => {};

function initialState(params, library) {
  const shared = typeof window === 'undefined' ? null : readShare(window.location.search);
  if (shared) return shared;
  if (!params.service) return EMPTY_STATE;
  if (params.template && findService(params.service) && !findScenario(params.service, params.template)) {
    const saved = library.saved.find((entry) => entry.id === params.template);
    if (saved) return openEntry(saved);
  }
  return scenarioState(params.service, params.template, EMPTY_STATE);
}

function nameFor(state, kql) {
  const scenario = findScenario(state.service, state.scenario);
  if (state.mode === 'build' && scenario) return `${findService(state.service).name}: ${scenario.name}`;
  return kql.split('\n').find((line) => line.trim())?.trim().slice(0, 60) || 'KQL query';
}

export default function AzureKqlTool() {
  useWebMCPTool(BUILD_KQL_QUERY_TOOL);
  const params = useParams();
  const top = useRef(null);
  const [store] = useState(createLibrary);
  const [library, setLibrary] = useState(() => store.load());
  const latest = useRef(library);
  const [state, dispatch] = useReducer(reducer, null, () => initialState(params, library));
  const [saving, setSaving] = useState(null);

  const scenario = findScenario(state.service, state.scenario);
  const built = useMemo(() => buildQuery(state), [state]);
  const building = state.mode === 'build';
  const kql = building ? built.kql : state.kql;
  const ready = Boolean(kql.trim());

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
  const remember = () => update((lib) => withRecent(lib, current()));

  const copy = async () => {
    if (!(await copyText(kql))) return toast.error('Could not copy the query');
    toast.success('Query copied');
    return remember();
  };

  const download = () => {
    downloadFile(kql, `${safeFilename(building ? `${state.service}-${state.scenario}` : 'query')}.kql`, 'text/plain');
    remember();
  };

  const share = async () => {
    const url = shareUrl(state, window.location.origin);
    if (url && (await copyText(url))) toast.success('Share link copied');
    else toast.error('Could not copy the share link');
  };

  const editAsKql = () => {
    const earlier = state.kql.trim() && state.kql !== built.kql;
    if (earlier) {
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

      <div ref={top} className="flex scroll-mt-24 flex-col gap-6">
        <Tabs value={state.mode} onValueChange={(mode) => dispatch({ type: 'mode', mode })}>
          <TabsList>
            <TabsTrigger value="build">Build</TabsTrigger>
            <TabsTrigger value="kql">Write KQL</TabsTrigger>
          </TabsList>

          <TabsContent value="build" className="mt-5 flex flex-col gap-6">
            <Card>
              <CardContent className="grid grid-cols-2 gap-x-3 gap-y-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,1fr)_7rem]">
                <SourcePicker
                  service={state.service}
                  scenario={state.scenario}
                  onService={(service) => dispatch({ type: 'service', service })}
                  onScenario={(next) => dispatch({ type: 'scenario', scenario: next })}
                />
                {scenario && (
                  <RangeControls
                    time={state.time}
                    limit={state.limit}
                    showLimit={scenario.output.kind !== 'series'}
                    onTime={(time) => dispatch({ type: 'time', time })}
                    onLimit={(limit) => dispatch({ type: 'limit', limit })}
                  />
                )}
                <p className="col-span-full text-body-sm text-on-surface-muted">
                  {scenario ? scenario.description : 'Pick what you are investigating and the query appears below, ready to copy.'}
                </p>
              </CardContent>
            </Card>

            {scenario ? (
              <>
                <FilterList
                  table={scenario.table}
                  filters={state.filters}
                  problems={built.problems}
                  onAdd={(column) => dispatch({ type: 'filter-add', column })}
                  onChange={(id, patch) => dispatch({ type: 'filter-change', id, patch })}
                  onRemove={(id) => dispatch({ type: 'filter-remove', id })}
                />
                <QueryPanel built={built} onCopy={copy} onEdit={editAsKql} onSave={() => setSaving(current())} onDownload={download} />
              </>
            ) : (
              <Ghost className="flex flex-col gap-6">
                <FilterList table={GHOST_QUERY.table} filters={GHOST_STATE.filters} problems={[]} onAdd={NOTHING} onChange={NOTHING} onRemove={NOTHING} />
                <QueryPanel built={GHOST_QUERY} onCopy={NOTHING} onEdit={NOTHING} onSave={NOTHING} onDownload={NOTHING} />
              </Ghost>
            )}
          </TabsContent>

          <TabsContent value="kql" className="mt-5">
            <RawPanel
              kql={state.kql}
              onChange={(next) => dispatch({ type: 'kql', kql: next })}
              onCopy={copy}
              onSave={() => setSaving(current())}
              onDownload={download}
            />
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
