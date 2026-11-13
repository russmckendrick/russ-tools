import * as React from 'react';
import { register, render } from 'pele/core';
import flowchart from 'pele/diagrams/flowchart';
import { cn } from '@/lib/utils';

register(flowchart);

/**
 * Diagrams, drawn by Pele (https://pele.run) on a piece of the site's ink
 * band.
 *
 * Pele renders Mermaid flowchart syntax to SVG synchronously and themes it
 * through CSS variables, which `.rt-diagram` in shell.css points at the band
 * tokens. Only the flowchart type is registered, so this costs a tool about
 * 63 kB gzipped and nothing at all on tools that draw no diagram.
 *
 * Two components:
 *
 * - `FlowDiagram` takes Mermaid source, for anything that is a graph.
 * - `TreeDiagram` takes a nested object and writes the source for you, for
 *   the common case of a hierarchy.
 *
 * A node that does something is given `role="button"`, a tab stop and a
 * name after each render, and answers click, Enter and Space — so the
 * diagram is a control and not only a picture.
 */

/** Mermaid reads `"` as the end of a label; this is its own escape for one. */
const esc = (text) => String(text).replace(/"/g, '#quot;');

const CONFIG = { flowchart: { curve: 'step' } };

/**
 * @param {object} props
 * @param {string} props.source Mermaid flowchart source
 * @param {string} props.label what the diagram shows, for assistive tech
 * @param {React.ReactNode} [props.caption] one line under the drawing
 * @param {Record<string, { label: string, run: () => void }>} [props.actions]
 *   node id to action; those nodes become buttons
 * @param {boolean} [props.auto] let a wide left-to-right flow turn vertical
 *   on a narrow screen
 */
export function FlowDiagram({ source, label, caption, actions, auto = false, className }) {
  const host = React.useRef(null);
  const prefix = React.useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const live = React.useRef(actions);
  live.current = actions;
  const [width, setWidth] = React.useState(0);
  const [fonts, setFonts] = React.useState(0);

  // Pele sizes nodes by measuring their labels, so it has to draw again once
  // the web font has arrived and whenever the panel changes width.
  React.useEffect(() => {
    const el = host.current;
    if (!el) return undefined;
    let alive = true;
    document.fonts?.ready?.then(() => alive && setFonts((n) => n + 1));
    if (typeof ResizeObserver === 'undefined') return () => { alive = false; };
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(el);
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, []);

  const svg = React.useMemo(() => {
    const fontFamily = host.current ? getComputedStyle(host.current).fontFamily : 'monospace';
    try {
      return render(source, {
        idPrefix: `d${prefix}`,
        fontFamily: fontFamily || 'monospace',
        fontSize: 13,
        maxWidth: width || undefined,
        autoDirection: auto,
        links: false,
        images: false,
        config: CONFIG,
      }).svg;
    } catch {
      return '';
    }
    // `fonts` is a redraw trigger, not an input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, width, fonts, prefix, auto]);

  // Pele hands back a string, so the button semantics go on afterwards.
  React.useLayoutEffect(() => {
    const el = host.current;
    if (!el) return;
    for (const node of el.querySelectorAll('.pele-node[data-id]')) {
      const action = live.current?.[node.dataset.id];
      if (!action) continue;
      node.setAttribute('role', 'button');
      node.setAttribute('tabindex', '0');
      node.setAttribute('aria-label', action.label);
    }
  }, [svg, actions]);

  // Choreography. Each new drawing is marked up once so the stylesheet can
  // animate it: nodes pop in order, solid connectors draw themselves, dotted
  // ones flow. Two rules keep a redraw calm — a node whose text was already
  // on screen stays put, and connectors only draw themselves the first time,
  // so splitting a block pops the two new blocks and nothing else.
  const seen = React.useRef(new Set());
  const marked = React.useRef('');
  React.useLayoutEffect(() => {
    const el = host.current;
    if (!el || !svg || marked.current === svg) return;
    const first = marked.current === '';
    marked.current = svg;

    const now = new Set();
    let order = 0;
    for (const node of el.querySelectorAll('.pele-node')) {
      const key = node.textContent;
      now.add(key);
      if (seen.current.has(key)) node.setAttribute('data-old', '');
      else {
        node.style.setProperty('--i', order);
        order += 1;
      }
    }
    seen.current = now;

    el.toggleAttribute('data-settled', !first);
    el.querySelectorAll('.pele-edge').forEach((edge, i) => {
      edge.style.setProperty('--i', i);
      const line = edge.querySelector('path:not(.pele-marker), line');
      if (!line) return;
      if (line.hasAttribute('stroke-dasharray')) line.classList.add('rt-flow');
      else {
        // Normalised length, so one dash rule draws a path of any size.
        line.setAttribute('pathLength', '1');
        line.classList.add('rt-draw');
      }
    });
  }, [svg]);

  const fire = (event) => {
    const node = event.target.closest?.('.pele-node[data-id]');
    const action = node && live.current?.[node.dataset.id];
    if (!action) return false;
    action.run();
    return true;
  };

  return (
    <figure className={cn('rt-diagram', className)} aria-label={label}>
      {/* The handlers are delegated: the buttons are the SVG nodes inside. */}
      <div
        ref={host}
        className="rt-diagram-scroll"
        onClick={fire}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          if (fire(event)) event.preventDefault();
        }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {caption && <figcaption className="rt-diagram-caption">{caption}</figcaption>}
    </figure>
  );
}

/**
 * @typedef {object} TreeNode
 * @property {string} id stable among siblings
 * @property {string} label
 * @property {string} [sub] a second, quieter line
 * @property {'accent'|'ok'|'warn'|'bad'|'muted'} [tone]
 * @property {string} [edge] a word on the line from its parent
 * @property {() => void} [onClick] makes the node a button
 * @property {string} [actionLabel] the button's accessible name
 * @property {TreeNode[]} [children]
 */

/** Write a nested tree as Mermaid, collecting the nodes that act. */
function treeSource(root) {
  const lines = ['flowchart TD'];
  const actions = {};
  let count = 0;

  const walk = (node, parent) => {
    const id = `n${count}`;
    count += 1;
    const text = node.sub ? `${esc(node.label)}<br/>${esc(node.sub)}` : esc(node.label);
    lines.push(`  ${id}["${text}"]${node.tone ? `:::${node.tone}` : ''}`);
    if (parent) lines.push(node.edge ? `  ${parent} ---|"${esc(node.edge)}"| ${id}` : `  ${parent} --- ${id}`);
    if (node.onClick) actions[id] = { label: node.actionLabel ?? node.label, run: node.onClick };
    for (const child of node.children ?? []) walk(child, id);
  };

  walk(root, null);
  return { source: lines.join('\n'), actions };
}

/**
 * @param {object} props
 * @param {TreeNode} props.root
 * @param {string} props.label
 * @param {React.ReactNode} [props.caption]
 */
export function TreeDiagram({ root, ...props }) {
  // Rebuilt every render on purpose: the node callbacks close over the
  // caller's current state, and the source string is what memoises the draw.
  const { source, actions } = treeSource(root);
  return <FlowDiagram source={source} actions={actions} {...props} />;
}
