export const formatMarkdownTable = (data, alignments = [], hasHeader = true) => {
  if (!data || data.length === 0) return '';
  
  const maxCols = Math.max(...data.map(row => row.length));
  const normalizedData = data.map(row => {
    const newRow = [...row];
    while (newRow.length < maxCols) {
      newRow.push('');
    }
    return newRow;
  });
  
  const columnWidths = [];
  for (let col = 0; col < maxCols; col++) {
    let maxWidth = 3;
    for (let row = 0; row < normalizedData.length; row++) {
      const cellContent = String(normalizedData[row][col] || '');
      maxWidth = Math.max(maxWidth, cellContent.length);
    }
    columnWidths.push(maxWidth);
  }
  
  const formatRow = (row, isHeader = false) => {
    const formattedCells = row.map((cell, index) => {
      const content = String(cell || '');
      const width = columnWidths[index];
      const alignment = alignments[index] || 'left';
      
      if (isHeader) {
        return ` ${content.padEnd(width)} `;
      }
      
      switch (alignment) {
        case 'center':
          const totalPadding = width - content.length;
          const leftPadding = Math.floor(totalPadding / 2);
          const rightPadding = totalPadding - leftPadding;
          return ` ${' '.repeat(leftPadding)}${content}${' '.repeat(rightPadding)} `;
        case 'right':
          return ` ${content.padStart(width)} `;
        default: // left
          return ` ${content.padEnd(width)} `;
      }
    });
    
    return `|${formattedCells.join('|')}|`;
  };
  
  const formatSeparator = () => {
    const separators = columnWidths.map((width, index) => {
      const alignment = alignments[index] || 'left';
      const dashes = '-'.repeat(width);
      
      switch (alignment) {
        case 'center':
          return `:${dashes.substring(1, dashes.length - 1)}:`;
        case 'right':
          return `${dashes.substring(0, dashes.length - 1)}:`;
        default: // left
          return dashes;
      }
    });
    
    return `|${separators.map(sep => ` ${sep} `).join('|')}|`;
  };
  
  let result = [];
  
  if (hasHeader && normalizedData.length > 0) {
    result.push(formatRow(normalizedData[0], true));
    result.push(formatSeparator());
    
    for (let i = 1; i < normalizedData.length; i++) {
      result.push(formatRow(normalizedData[i]));
    }
  } else {
    for (let i = 0; i < normalizedData.length; i++) {
      result.push(formatRow(normalizedData[i]));
    }
  }
  
  return result.join('\n');
};

export const parseMarkdownTable = (markdownText) => {
  if (!markdownText || typeof markdownText !== 'string') {
    return { data: [], alignments: [], hasHeader: false };
  }
  
  const lines = markdownText.trim().split('\n').filter(line => line.trim());
  if (lines.length === 0) {
    return { data: [], alignments: [], hasHeader: false };
  }
  
  const isTableRow = (line) => {
    return line.trim().startsWith('|') && line.trim().endsWith('|');
  };
  
  const tableLines = lines.filter(isTableRow);
  if (tableLines.length === 0) {
    return { data: [], alignments: [], hasHeader: false };
  }
  
  const parseRow = (line) => {
    return line
      .trim()
      .slice(1, -1)
      .split('|')
      .map(cell => cell.trim());
  };
  
  const isSeparatorRow = (line) => {
    const content = line.trim().slice(1, -1);
    return /^[\s\-:|]*$/.test(content) && content.includes('-');
  };
  
  let separatorIndex = -1;
  for (let i = 0; i < tableLines.length; i++) {
    if (isSeparatorRow(tableLines[i])) {
      separatorIndex = i;
      break;
    }
  }
  
  let data = [];
  let alignments = [];
  let hasHeader = false;
  
  if (separatorIndex >= 0) {
    hasHeader = true;
    
    const separatorCells = tableLines[separatorIndex]
      .trim()
      .slice(1, -1)
      .split('|')
      .map(cell => cell.trim());
    
    alignments = separatorCells.map(cell => {
      if (cell.startsWith(':') && cell.endsWith(':')) {
        return 'center';
      } else if (cell.endsWith(':')) {
        return 'right';
      } else {
        return 'left';
      }
    });
    
    if (separatorIndex > 0) {
      data.push(parseRow(tableLines[0]));
    }
    
    for (let i = separatorIndex + 1; i < tableLines.length; i++) {
      data.push(parseRow(tableLines[i]));
    }
  } else {
    for (let i = 0; i < tableLines.length; i++) {
      data.push(parseRow(tableLines[i]));
    }
  }
  
  return { data, alignments, hasHeader };
};

export const validateMarkdownTable = (markdownText) => {
  const errors = [];
  const warnings = [];
  
  if (!markdownText || typeof markdownText !== 'string') {
    return { isValid: false, errors: ['Empty or invalid table content'], warnings: [] };
  }
  
  const lines = markdownText.trim().split('\n');
  const tableLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.startsWith('|') && trimmed.endsWith('|');
  });
  
  if (tableLines.length === 0) {
    return { isValid: false, errors: ['No valid table rows found'], warnings: [] };
  }
  
  let separatorFound = false;
  let separatorIndex = -1;
  
  for (let i = 0; i < tableLines.length; i++) {
    const line = tableLines[i];
    const content = line.trim().slice(1, -1);
    
    if (/^[\s\-:|]*$/.test(content) && content.includes('-')) {
      if (separatorFound) {
        errors.push(`Multiple separator rows found (line ${i + 1})`);
      } else {
        separatorFound = true;
        separatorIndex = i;
      }
    }
  }
  
  const columnCounts = tableLines.map((line, index) => {
    const cellCount = line.trim().slice(1, -1).split('|').length;
    return { index, count: cellCount, line };
  });
  
  const expectedColumns = columnCounts[0]?.count || 0;
  const inconsistentRows = columnCounts.filter(row => row.count !== expectedColumns);
  
  if (inconsistentRows.length > 0) {
    inconsistentRows.forEach(row => {
      warnings.push(`Row ${row.index + 1} has ${row.count} columns, expected ${expectedColumns}`);
    });
  }
  
  if (separatorFound && separatorIndex === 0) {
    errors.push('Separator row cannot be the first row');
  }
  
  if (separatorFound && separatorIndex === tableLines.length - 1) {
    warnings.push('Separator row is the last row - this may not render as expected');
  }
  
  tableLines.forEach((line, index) => {
    const unescapedPipes = (line.match(/(?<!\\)\|/g) || []).length;
    if (unescapedPipes < 2) {
      errors.push(`Row ${index + 1} must have at least two pipe characters`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalRows: tableLines.length,
      hasHeader: separatorFound,
      columns: expectedColumns
    }
  };
};

export const optimizeTableFormatting = (data, alignments = []) => {
  if (!data || data.length === 0) return { data: [], alignments: [] };
  
  const cleanedData = data.map(row => 
    row.map(cell => {
      if (typeof cell !== 'string') return String(cell || '');
      return cell.trim().replace(/\s+/g, ' ');
    })
  );
  
  const normalizedAlignments = [...alignments];
  const maxCols = Math.max(...cleanedData.map(row => row.length));
  
  while (normalizedAlignments.length < maxCols) {
    normalizedAlignments.push('left');
  }
  
  return {
    data: cleanedData,
    alignments: normalizedAlignments.slice(0, maxCols)
  };
};