export const validateTableData = (data) => {
  const errors = [];
  const warnings = [];
  
  if (!data || !Array.isArray(data)) {
    return { isValid: false, errors: ['Invalid table data format'], warnings: [] };
  }
  
  if (data.length === 0) {
    return { isValid: false, errors: ['Table cannot be empty'], warnings: [] };
  }
  
  const columnCounts = data.map((row, index) => ({
    index,
    count: Array.isArray(row) ? row.length : 0
  }));
  
  const maxColumns = Math.max(...columnCounts.map(r => r.count));
  const minColumns = Math.min(...columnCounts.map(r => r.count));
  
  if (minColumns === 0) {
    const emptyRows = columnCounts.filter(r => r.count === 0);
    emptyRows.forEach(row => {
      errors.push(`Row ${row.index + 1} is empty`);
    });
  }
  
  if (maxColumns !== minColumns) {
    const inconsistentRows = columnCounts.filter(r => r.count !== maxColumns && r.count > 0);
    inconsistentRows.forEach(row => {
      warnings.push(`Row ${row.index + 1} has ${row.count} columns, expected ${maxColumns}`);
    });
  }
  
  data.forEach((row, rowIndex) => {
    if (!Array.isArray(row)) {
      errors.push(`Row ${rowIndex + 1} is not a valid array`);
      return;
    }
    
    row.forEach((cell, cellIndex) => {
      if (cell !== null && cell !== undefined && typeof cell !== 'string' && typeof cell !== 'number') {
        warnings.push(`Cell at row ${rowIndex + 1}, column ${cellIndex + 1} contains non-primitive value`);
      }
    });
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      rows: data.length,
      columns: maxColumns,
      inconsistentRows: columnCounts.filter(r => r.count !== maxColumns).length
    }
  };
};

export const validateAlignment = (alignment) => {
  const validAlignments = ['left', 'center', 'right'];
  return validAlignments.includes(alignment);
};

export const validateTableConfiguration = (config) => {
  const errors = [];
  const warnings = [];
  
  if (!config || typeof config !== 'object') {
    return { isValid: false, errors: ['Invalid configuration object'], warnings: [] };
  }
  
  if (config.alignments && !Array.isArray(config.alignments)) {
    errors.push('Alignments must be an array');
  } else if (config.alignments) {
    config.alignments.forEach((alignment, index) => {
      if (!validateAlignment(alignment)) {
        errors.push(`Invalid alignment "${alignment}" at index ${index}. Must be 'left', 'center', or 'right'`);
      }
    });
  }
  
  if (config.hasHeader !== undefined && typeof config.hasHeader !== 'boolean') {
    errors.push('hasHeader must be a boolean value');
  }
  
  if (config.maxRows && (typeof config.maxRows !== 'number' || config.maxRows < 1)) {
    errors.push('maxRows must be a positive number');
  }
  
  if (config.maxColumns && (typeof config.maxColumns !== 'number' || config.maxColumns < 1)) {
    errors.push('maxColumns must be a positive number');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export const sanitizeTableData = (data) => {
  if (!data || !Array.isArray(data)) {
    return [];
  }
  
  return data
    .filter(row => Array.isArray(row) && row.length > 0)
    .map(row => 
      row.map(cell => {
        if (cell === null || cell === undefined) {
          return '';
        }
        if (typeof cell === 'object') {
          return JSON.stringify(cell);
        }
        return String(cell);
      })
    );
};

export const normalizeTableData = (data, targetColumns = null) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [];
  }
  
  const maxCols = targetColumns || Math.max(...data.map(row => Array.isArray(row) ? row.length : 0));
  
  return data.map(row => {
    if (!Array.isArray(row)) {
      return new Array(maxCols).fill('');
    }
    
    const normalizedRow = [...row];
    while (normalizedRow.length < maxCols) {
      normalizedRow.push('');
    }
    
    return normalizedRow.slice(0, maxCols);
  });
};

export const getTableStats = (data) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return {
      rows: 0,
      columns: 0,
      cells: 0,
      emptyCells: 0,
      totalCharacters: 0,
      averageRowLength: 0,
      averageCellLength: 0
    };
  }
  
  const normalizedData = normalizeTableData(data);
  const rows = normalizedData.length;
  const columns = normalizedData[0]?.length || 0;
  const cells = rows * columns;
  
  let emptyCells = 0;
  let totalCharacters = 0;
  
  normalizedData.forEach(row => {
    row.forEach(cell => {
      const cellStr = String(cell || '');
      if (cellStr.trim() === '') {
        emptyCells++;
      }
      totalCharacters += cellStr.length;
    });
  });
  
  return {
    rows,
    columns,
    cells,
    emptyCells,
    totalCharacters,
    averageRowLength: rows > 0 ? totalCharacters / rows : 0,
    averageCellLength: cells > 0 ? totalCharacters / cells : 0
  };
};

export const findTableIssues = (data) => {
  const issues = [];
  
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [{ type: 'error', message: 'Table is empty', severity: 'high' }];
  }
  
  const columnCounts = data.map(row => Array.isArray(row) ? row.length : 0);
  const maxColumns = Math.max(...columnCounts);
  const minColumns = Math.min(...columnCounts);
  
  if (maxColumns === 0) {
    issues.push({
      type: 'error',
      message: 'All rows are empty',
      severity: 'high'
    });
  }
  
  if (maxColumns !== minColumns) {
    issues.push({
      type: 'warning',
      message: `Inconsistent column count: ${minColumns}-${maxColumns} columns`,
      severity: 'medium'
    });
  }
  
  data.forEach((row, rowIndex) => {
    if (!Array.isArray(row)) {
      issues.push({
        type: 'error',
        message: `Row ${rowIndex + 1} is not an array`,
        severity: 'high',
        location: { row: rowIndex }
      });
      return;
    }
    
    if (row.length === 0) {
      issues.push({
        type: 'warning',
        message: `Row ${rowIndex + 1} is empty`,
        severity: 'low',
        location: { row: rowIndex }
      });
    }
    
    const emptyCells = row.filter(cell => !cell || String(cell).trim() === '').length;
    if (emptyCells === row.length && row.length > 0) {
      issues.push({
        type: 'warning',
        message: `Row ${rowIndex + 1} contains only empty cells`,
        severity: 'low',
        location: { row: rowIndex }
      });
    }
  });
  
  if (issues.length === 0) {
    issues.push({
      type: 'success',
      message: 'Table structure is valid',
      severity: 'info'
    });
  }
  
  return issues;
};