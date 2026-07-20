import React, { createContext, useContext } from 'react';
import { createPortal } from 'react-dom';

const ToolActionsContext = createContext(null);

export function ToolActionsProvider({ target, children }) {
  return (
    <ToolActionsContext.Provider value={target}>
      {children}
    </ToolActionsContext.Provider>
  );
}

export function ToolAction({ children }) {
  const target = useContext(ToolActionsContext);
  return target ? createPortal(children, target) : null;
}
