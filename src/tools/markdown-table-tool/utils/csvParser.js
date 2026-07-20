export const parseCSV = (text, delimiter = ',') => {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const lines = text.trim().split(/\r?\n/);
  const result = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const row = [];
    let current = '';
    let inQuotes = false;
    let j = 0;
    
    while (j < line.length) {
      const char = line[j];
      const nextChar = line[j + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          j += 2;
          continue;
        } else {
          inQuotes = !inQuotes;
          j++;
          continue;
        }
      }
      
      if (char === delimiter && !inQuotes) {
        row.push(current.trim());
        current = '';
        j++;
        continue;
      }
      
      current += char;
      j++;
    }
    
    row.push(current.trim());
    result.push(row);
  }
  
  return result;
};

export const detectDelimiter = (text) => {
  if (!text || typeof text !== 'string') {
    return ',';
  }
  
  const firstLine = text.split(/\r?\n/)[0] || '';
  const delimiters = [',', '\t', ';', '|'];
  let bestDelimiter = ',';
  let maxCount = 0;
  
  delimiters.forEach(delimiter => {
    const count = (firstLine.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      bestDelimiter = delimiter;
    }
  });
  
  return bestDelimiter;
};

export const convertToCSV = (data, delimiter = ',') => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return '';
  }
  
  const escapeField = (field) => {
    const str = field == null ? '' : String(field);
    if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  return data
    .map(row => row.map(escapeField).join(delimiter))
    .join('\n');
};

export const convertToTSV = (data) => {
  return convertToCSV(data, '\t');
};

/**
 * One spreadsheet cell as table text.
 *
 * read-excel-file returns *typed* values — `Date`, `boolean`, `number`,
 * `null` — where exceljs handed back `cell.text`, a pre-formatted string.
 * That is the one real behaviour difference in the swap, and it needs
 * deciding rather than defaulting: `String(someDate)` yields
 * "Mon Jan 01 1995 00:00:00 GMT+0000 (…)", which is not what anyone wants
 * in a Markdown table.
 *
 * `String()` on the rest is deliberate and preserves falsy values — `0` and
 * `false` become "0" and "false" rather than empty cells.
 */
export const excelCellToText = (value) => {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) {
    // Excel date-only values arrive at UTC midnight; render those as a plain
    // date and keep the full timestamp for anything carrying a time.
    const iso = value.toISOString();
    return iso.endsWith('T00:00:00.000Z') ? iso.slice(0, 10) : iso;
  }
  return String(value);
};

export const parseExcelData = async (file) => {
  try {
    const { readSheet } = await import('read-excel-file/browser');

    // Reads the first sheet by default, and returns an array of rows.
    const rows = await readSheet(file);

    return rows
      .map((row) => {
        const cells = row.map(excelCellToText);
        // Trailing empties are padding, not data — a sheet whose used range
        // is wider than its content produces them on every row.
        while (cells.length > 0 && cells[cells.length - 1] === '') cells.pop();
        return cells;
      })
      .filter((cells) => cells.length > 0);
  } catch (error) {
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }
};

export const parseJSONData = (text) => {
  try {
    const json = JSON.parse(text);
    
    if (Array.isArray(json)) {
      if (json.length === 0) return [];
      
      if (Array.isArray(json[0])) {
        return json;
      }
      
      if (typeof json[0] === 'object' && json[0] !== null) {
        const keys = Object.keys(json[0]);
        const result = [keys];
        
        json.forEach(obj => {
          const row = keys.map(key => obj[key] || '');
          result.push(row);
        });
        
        return result;
      }
      
      return json.map(item => [String(item)]);
    }
    
    if (typeof json === 'object' && json !== null) {
      const entries = Object.entries(json);
      return [['Key', 'Value'], ...entries.map(([key, value]) => [key, String(value)])];
    }
    
    return [[String(json)]];
  } catch (error) {
    throw new Error(`Invalid JSON format: ${error.message}`);
  }
};

export const convertToJSON = (data, hasHeader = true) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return '[]';
  }
  
  if (!hasHeader || data.length === 1) {
    return JSON.stringify(data, null, 2);
  }
  
  const headers = data[0];
  const rows = data.slice(1);
  
  const objects = rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj;
  });
  
  return JSON.stringify(objects, null, 2);
};

export const validateFileSize = (file, maxSizeMB = 10) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of ${maxSizeMB}MB`);
  }
};

export const getFileExtension = (filename) => {
  return filename.toLowerCase().split('.').pop() || '';
};

export const isValidTableFile = (file) => {
  const validExtensions = ['csv', 'tsv', 'txt', 'xlsx', 'xls', 'json'];
  const extension = getFileExtension(file.name);
  return validExtensions.includes(extension);
};