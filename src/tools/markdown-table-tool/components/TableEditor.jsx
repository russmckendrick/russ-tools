import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlignCenter, AlignLeft, AlignRight, Copy, Minus, Plus, Trash2 } from 'lucide-react';

const TableEditor = ({
  data,
  alignments,
  hasHeader,
  selectedCell,
  onUpdateCell,
  onAddRow,
  onRemoveRow,
  onAddColumn,
  onRemoveColumn,
  onUpdateAlignment,
  onToggleHeader,
  onClearTable
}) => {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const inputRef = useRef(null);
  const tableRef = useRef(null);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tableRef.current && !tableRef.current.contains(event.target)) {
        setEditingCell(null);
        setContextMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCellClick = (rowIndex, colIndex) => {
    const cellValue = data[rowIndex]?.[colIndex] || '';
    setEditingCell({ row: rowIndex, col: colIndex });
    setEditValue(cellValue);
    setContextMenu(null);
  };

  const handleCellSubmit = () => {
    if (editingCell) {
      onUpdateCell(editingCell.row, editingCell.col, editValue);
      setEditingCell(null);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleCellSubmit();
    } else if (event.key === 'Escape') {
      setEditingCell(null);
    } else if (event.key === 'Tab') {
      event.preventDefault();
      handleCellSubmit();
      
      if (editingCell) {
        const nextCol = editingCell.col + 1;
        const nextRow = editingCell.row;
        
        if (nextCol < data[0]?.length) {
          handleCellClick(nextRow, nextCol);
        } else if (nextRow + 1 < data.length) {
          handleCellClick(nextRow + 1, 0);
        }
      }
    }
  };

  const handleRightClick = (event, rowIndex, colIndex) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      row: rowIndex,
      col: colIndex
    });
  };

  const getAlignmentIcon = (alignment) => {
    switch (alignment) {
      case 'center': return <AlignCenter className="w-4 h-4" />;
      case 'right': return <AlignRight className="w-4 h-4" />;
      default: return <AlignLeft className="w-4 h-4" />;
    }
  };

  const isHeaderRow = (rowIndex) => hasHeader && rowIndex === 0;

  const duplicateRow = (rowIndex) => {
    const rowData = [...(data[rowIndex] || [])];
    onAddRow(rowIndex + 1);
    setTimeout(() => {
      rowData.forEach((cellValue, colIndex) => {
        onUpdateCell(rowIndex + 1, colIndex, cellValue);
      });
    }, 0);
  };

  const duplicateColumn = (colIndex) => {
    onAddColumn(colIndex + 1);
    setTimeout(() => {
      data.forEach((row, rowIndex) => {
        const cellValue = row[colIndex] || '';
        onUpdateCell(rowIndex, colIndex + 1, cellValue);
      });
    }, 0);
  };

  return (
    <div className="space-y-4" ref={tableRef}>
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <Switch
            id="has-header"
            checked={hasHeader}
            onCheckedChange={onToggleHeader}
          />
          <Label htmlFor="has-header">First row is header</Label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onAddRow()}>
            <Plus className="w-4 h-4 mr-1" />
            Add Row
          </Button>
          <Button variant="outline" size="sm" onClick={() => onAddColumn()}>
            <Plus className="w-4 h-4 mr-1" />
            Add Column
          </Button>
          <Button variant="outline" size="sm" onClick={onClearTable}>
            <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Column Alignment Controls */}
      <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg overflow-x-auto">
        <span className="text-body-sm font-medium whitespace-nowrap">Column Alignment:</span>
        {alignments.map((alignment, index) => (
          <div key={index} className="flex items-center space-x-1">
            <span className="text-data-sm font-mono text-muted-foreground">Col {index + 1}</span>
            <Select
              value={alignment}
              onValueChange={(value) => onUpdateAlignment(index, value)}
            >
              <SelectTrigger className="w-[100px] h-8">
                <SelectValue>
                  <div className="flex items-center space-x-1">
                    {getAlignmentIcon(alignment)}
                    <span className="text-body-sm">{alignment}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">
                  <div className="flex items-center space-x-2">
                    <AlignLeft className="w-4 h-4" />
                    <span>Left</span>
                  </div>
                </SelectItem>
                <SelectItem value="center">
                  <div className="flex items-center space-x-2">
                    <AlignCenter className="w-4 h-4" />
                    <span>Center</span>
                  </div>
                </SelectItem>
                <SelectItem value="right">
                  <div className="flex items-center space-x-2">
                    <AlignRight className="w-4 h-4" />
                    <span>Right</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-auto">
        <table className="w-full">
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className={isHeaderRow(rowIndex) ? 'bg-muted/30' : ''}>
                {/* Row controls */}
                <td className="w-12 p-2 border-r bg-muted/50">
                  <div className="flex flex-col items-center space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => onAddRow(rowIndex)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <span className="text-data-sm font-mono text-muted-foreground">{rowIndex + 1}</span>
                    {data.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-danger hover:text-danger"
                        onClick={() => onRemoveRow(rowIndex)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </td>

                {/* Table cells */}
                {row.map((cell, colIndex) => (
                  <td
                    key={colIndex}
                    className={`border p-1 min-w-[120px] h-12 cursor-pointer hover:bg-muted/30 ${
                      editingCell?.row === rowIndex && editingCell?.col === colIndex
                        ? 'bg-info-subtle border-info/40'
                        : ''
                    } ${
                      selectedCell?.row === rowIndex && selectedCell?.col === colIndex
                        ? 'ring-2 ring-primary'
                        : ''
                    }`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    onContextMenu={(e) => handleRightClick(e, rowIndex, colIndex)}
                  >
                    {editingCell?.row === rowIndex && editingCell?.col === colIndex ? (
                      <Input
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellSubmit}
                        onKeyDown={handleKeyDown}
                        className="h-8 border-none p-1 focus:ring-0"
                      />
                    ) : (
                      <div
                        className={`p-2 h-8 flex items-center ${
                          alignments[colIndex] === 'center' ? 'justify-center' :
                          alignments[colIndex] === 'right' ? 'justify-end' : 'justify-start'
                        } ${isHeaderRow(rowIndex) ? 'font-medium' : ''}`}
                      >
                        {cell || (
                          <span className="text-muted-foreground italic">
                            {isHeaderRow(rowIndex) ? 'Header' : 'Empty'}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}

            {/* Column controls row */}
            <tr className="bg-muted/50">
              <td className="p-2 border-r">
                <div className="text-data-sm font-mono text-muted-foreground text-center">Cols</div>
              </td>
              {alignments.map((_, colIndex) => (
                <td key={colIndex} className="border p-1">
                  <div className="flex items-center justify-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => onAddColumn(colIndex)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    {data[0]?.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-danger hover:text-danger"
                        onClick={() => onRemoveColumn(colIndex)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-background border border-border rounded-lg shadow-lg py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="w-full px-3 py-2 text-left text-body-sm hover:bg-muted/50 flex items-center space-x-2"
            onClick={() => {
              onAddRow(contextMenu.row + 1);
              setContextMenu(null);
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Insert Row Below</span>
          </button>
          
          <button
            className="w-full px-3 py-2 text-left text-body-sm hover:bg-muted/50 flex items-center space-x-2"
            onClick={() => {
              onAddColumn(contextMenu.col + 1);
              setContextMenu(null);
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Insert Column Right</span>
          </button>
          
          <button
            className="w-full px-3 py-2 text-left text-body-sm hover:bg-muted/50 flex items-center space-x-2"
            onClick={() => {
              duplicateRow(contextMenu.row);
              setContextMenu(null);
            }}
          >
            <Copy className="w-4 h-4" />
            <span>Duplicate Row</span>
          </button>
          
          <button
            className="w-full px-3 py-2 text-left text-body-sm hover:bg-muted/50 flex items-center space-x-2"
            onClick={() => {
              duplicateColumn(contextMenu.col);
              setContextMenu(null);
            }}
          >
            <Copy className="w-4 h-4" />
            <span>Duplicate Column</span>
          </button>
          
          {data.length > 1 && (
            <button
              className="w-full px-3 py-2 text-left text-body-sm hover:bg-surface-inset flex items-center space-x-2 text-danger"
              onClick={() => {
                onRemoveRow(contextMenu.row);
                setContextMenu(null);
              }}
            >
              <Minus className="w-4 h-4" />
              <span>Delete Row</span>
            </button>
          )}
          
          {data[0]?.length > 1 && (
            <button
              className="w-full px-3 py-2 text-left text-body-sm hover:bg-surface-inset flex items-center space-x-2 text-danger"
              onClick={() => {
                onRemoveColumn(contextMenu.col);
                setContextMenu(null);
              }}
            >
              <Minus className="w-4 h-4" />
              <span>Delete Column</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TableEditor;