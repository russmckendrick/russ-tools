// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { useWebMCPTool, textResult } from './useWebMCPTool.js';

afterEach(() => {
  cleanup();
  delete document.modelContext;
});

const TOOL = {
  name: 'test_tool',
  description: 'A test tool',
  inputSchema: { type: 'object', properties: {} },
  execute: () => textResult('ok'),
};

describe('useWebMCPTool', () => {
  it('registers on mount and aborts on unmount', () => {
    const registerTool = vi.fn();
    document.modelContext = { registerTool };

    const { unmount } = renderHook(() => useWebMCPTool(TOOL));

    expect(registerTool).toHaveBeenCalledTimes(1);
    const [tool, options] = registerTool.mock.calls[0];
    expect(tool).toBe(TOOL);
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(options.signal.aborted).toBe(false);

    unmount();
    expect(options.signal.aborted).toBe(true);
  });

  it('falls back to unregisterTool when registration returns no handle', () => {
    const unregisterTool = vi.fn();
    document.modelContext = { registerTool: () => undefined, unregisterTool };

    const { unmount } = renderHook(() => useWebMCPTool(TOOL));
    unmount();

    expect(unregisterTool).toHaveBeenCalledWith('test_tool');
  });

  it('prefers a returned unregister handle', () => {
    const unregister = vi.fn();
    const unregisterTool = vi.fn();
    document.modelContext = { registerTool: () => ({ unregister }), unregisterTool };

    const { unmount } = renderHook(() => useWebMCPTool(TOOL));
    unmount();

    expect(unregister).toHaveBeenCalledTimes(1);
    expect(unregisterTool).not.toHaveBeenCalled();
  });

  it('registers once across re-renders of the same descriptor', () => {
    const registerTool = vi.fn();
    document.modelContext = { registerTool };

    const { rerender } = renderHook(() => useWebMCPTool(TOOL));
    rerender();
    rerender();

    expect(registerTool).toHaveBeenCalledTimes(1);
  });

  it('is a clean no-op without a model context', () => {
    expect(() => {
      const { unmount } = renderHook(() => useWebMCPTool(TOOL));
      unmount();
    }).not.toThrow();
  });

  it('survives a registerTool that throws', () => {
    document.modelContext = {
      registerTool: () => {
        throw new Error('nope');
      },
    };

    expect(() => {
      const { unmount } = renderHook(() => useWebMCPTool(TOOL));
      unmount();
    }).not.toThrow();
  });
});

describe('textResult', () => {
  it('wraps a string verbatim and serialises objects', () => {
    expect(textResult('hi')).toEqual({ content: [{ type: 'text', text: 'hi' }] });
    expect(textResult({ a: 1 })).toEqual({ content: [{ type: 'text', text: '{"a":1}' }] });
  });
});
