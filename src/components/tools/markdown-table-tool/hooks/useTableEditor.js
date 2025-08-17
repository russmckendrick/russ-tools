import { useState, useEffect, useCallback, useMemo } from 'react';
import { formatMarkdownTable, parseMarkdownTable, validateMarkdownTable } from '../utils/tableFormatter';
import { validateTableData, sanitizeTableData, normalizeTableData, getTableStats } from '../utils/tableValidator';

const STORAGE_KEY = 'markdown-table-tool-state';
const HISTORY_KEY = 'markdown-table-tool-history';

export const useTableEditor = () => {
  const [tableData, setTableData] = useState([['Header 1', 'Header 2'], ['Cell 1', 'Cell 2']]);
  const [alignments, setAlignments] = useState(['left', 'left']);
  const [hasHeader, setHasHeader] = useState(true);
  const [selectedCell, setSelectedCell] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const saveState = useCallback((data, aligns, header) => {
    const state = {
      tableData: data,
      alignments: aligns,
      hasHeader: header,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setLastSaved(Date.now());
  }, []);

  const loadState = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        setTableData(state.tableData || [['Header 1', 'Header 2'], ['Cell 1', 'Cell 2']]);
        setAlignments(state.alignments || ['left', 'left']);
        setHasHeader(state.hasHeader !== undefined ? state.hasHeader : true);
        setLastSaved(state.timestamp);
      }
    } catch (error) {
      console.warn('Failed to load saved state:', error);
    }
  }, []);

  const addToHistory = useCallback((data, aligns, header) => {
    const newState = {
      tableData: JSON.parse(JSON.stringify(data)),
      alignments: [...aligns],
      hasHeader: header,
      timestamp: Date.now()
    };

    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newState);
      
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory.slice(-20)));
      } catch (error) {
        console.warn('Failed to save history:', error);
      }
      
      return newHistory;
    });
    
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const updateTable = useCallback((newData, newAlignments = null, newHasHeader = null) => {
    const sanitizedData = sanitizeTableData(newData);
    const normalizedData = normalizeTableData(sanitizedData);
    
    if (normalizedData.length === 0) {
      return;
    }

    const maxCols = Math.max(...normalizedData.map(row => row.length));
    const updatedAlignments = newAlignments || [...alignments];
    
    while (updatedAlignments.length < maxCols) {
      updatedAlignments.push('left');
    }
    
    const updatedHasHeader = newHasHeader !== null ? newHasHeader : hasHeader;
    
    addToHistory(tableData, alignments, hasHeader);
    
    setTableData(normalizedData);
    setAlignments(updatedAlignments.slice(0, maxCols));
    setHasHeader(updatedHasHeader);
    
    saveState(normalizedData, updatedAlignments.slice(0, maxCols), updatedHasHeader);
  }, [tableData, alignments, hasHeader, addToHistory, saveState]);

  const updateCell = useCallback((rowIndex, colIndex, value) => {
    if (rowIndex < 0 || colIndex < 0) return;
    
    const newData = [...tableData];
    
    while (newData.length <= rowIndex) {
      const newRow = new Array(Math.max(newData[0]?.length || 1, colIndex + 1)).fill('');
      newData.push(newRow);
    }
    
    while (newData[rowIndex].length <= colIndex) {
      newData[rowIndex].push('');
    }
    
    newData[rowIndex][colIndex] = value;
    updateTable(newData);
  }, [tableData, updateTable]);

  const addRow = useCallback((index = -1) => {
    const newData = [...tableData];
    const columnCount = Math.max(...newData.map(row => row.length));
    const newRow = new Array(columnCount).fill('');
    
    if (index === -1 || index >= newData.length) {
      newData.push(newRow);
    } else {
      newData.splice(index, 0, newRow);
    }
    
    updateTable(newData);
  }, [tableData, updateTable]);

  const removeRow = useCallback((index) => {
    if (tableData.length <= 1) return;
    
    const newData = tableData.filter((_, i) => i !== index);
    updateTable(newData);
    
    if (selectedCell && selectedCell.row === index) {
      setSelectedCell(null);
    } else if (selectedCell && selectedCell.row > index) {
      setSelectedCell({ ...selectedCell, row: selectedCell.row - 1 });
    }
  }, [tableData, updateTable, selectedCell]);

  const addColumn = useCallback((index = -1) => {
    const newData = tableData.map(row => {
      const newRow = [...row];
      if (index === -1 || index >= newRow.length) {
        newRow.push('');
      } else {
        newRow.splice(index, 0, '');
      }
      return newRow;
    });
    
    const newAlignments = [...alignments];
    if (index === -1 || index >= newAlignments.length) {
      newAlignments.push('left');
    } else {
      newAlignments.splice(index, 0, 'left');
    }
    
    updateTable(newData, newAlignments);
  }, [tableData, alignments, updateTable]);

  const removeColumn = useCallback((index) => {
    if (tableData[0]?.length <= 1) return;
    
    const newData = tableData.map(row => row.filter((_, i) => i !== index));
    const newAlignments = alignments.filter((_, i) => i !== index);
    
    updateTable(newData, newAlignments);
    
    if (selectedCell && selectedCell.col === index) {
      setSelectedCell(null);
    } else if (selectedCell && selectedCell.col > index) {
      setSelectedCell({ ...selectedCell, col: selectedCell.col - 1 });
    }
  }, [tableData, alignments, updateTable, selectedCell]);

  const updateAlignment = useCallback((columnIndex, alignment) => {
    const newAlignments = [...alignments];
    newAlignments[columnIndex] = alignment;
    
    setAlignments(newAlignments);
    saveState(tableData, newAlignments, hasHeader);
  }, [alignments, tableData, hasHeader, saveState]);

  const clearTable = useCallback(() => {
    addToHistory(tableData, alignments, hasHeader);
    const newData = [['Header 1', 'Header 2'], ['', '']];
    const newAlignments = ['left', 'left'];
    
    setTableData(newData);
    setAlignments(newAlignments);
    setHasHeader(true);
    setSelectedCell(null);
    
    saveState(newData, newAlignments, true);
  }, [tableData, alignments, hasHeader, addToHistory, saveState]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setTableData(prevState.tableData);
      setAlignments(prevState.alignments);
      setHasHeader(prevState.hasHeader);
      setHistoryIndex(prev => prev - 1);
      setSelectedCell(null);
      
      saveState(prevState.tableData, prevState.alignments, prevState.hasHeader);
    }
  }, [history, historyIndex, saveState]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setTableData(nextState.tableData);
      setAlignments(nextState.alignments);
      setHasHeader(nextState.hasHeader);
      setHistoryIndex(prev => prev + 1);
      setSelectedCell(null);
      
      saveState(nextState.tableData, nextState.alignments, nextState.hasHeader);
    }
  }, [history, historyIndex, saveState]);

  const importFromMarkdown = useCallback((markdownText) => {
    try {
      setIsLoading(true);
      const { data, alignments: parsedAlignments, hasHeader: parsedHasHeader } = parseMarkdownTable(markdownText);
      
      if (data.length > 0) {
        updateTable(data, parsedAlignments, parsedHasHeader);
      }
    } catch (error) {
      console.error('Failed to import markdown:', error);
      throw new Error(`Failed to import markdown: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [updateTable]);

  const exportToMarkdown = useCallback(() => {
    return formatMarkdownTable(tableData, alignments, hasHeader);
  }, [tableData, alignments, hasHeader]);

  const validation = useMemo(() => {
    const dataValidation = validateTableData(tableData);
    const markdown = exportToMarkdown();
    const markdownValidation = validateMarkdownTable(markdown);
    
    return {
      data: dataValidation,
      markdown: markdownValidation,
      isValid: dataValidation.isValid && markdownValidation.isValid
    };
  }, [tableData, exportToMarkdown]);

  const stats = useMemo(() => {
    return getTableStats(tableData);
  }, [tableData]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  useEffect(() => {
    loadState();
    
    try {
      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (savedHistory) {
        const historyData = JSON.parse(savedHistory);
        setHistory(historyData);
        setHistoryIndex(historyData.length - 1);
      }
    } catch (error) {
      console.warn('Failed to load history:', error);
    }
  }, [loadState]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    tableData,
    alignments,
    hasHeader,
    selectedCell,
    isLoading,
    lastSaved,
    validation,
    stats,
    canUndo,
    canRedo,
    
    setTableData,
    setAlignments,
    setHasHeader: (value) => {
      setHasHeader(value);
      saveState(tableData, alignments, value);
    },
    setSelectedCell,
    
    updateTable,
    updateCell,
    addRow,
    removeRow,
    addColumn,
    removeColumn,
    updateAlignment,
    clearTable,
    undo,
    redo,
    
    importFromMarkdown,
    exportToMarkdown,
    
    saveState: () => saveState(tableData, alignments, hasHeader),
    loadState
  };
};