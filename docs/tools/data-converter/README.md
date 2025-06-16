# Data Converter

## Overview

The Data Converter is a comprehensive tool for converting, validating, and analyzing data between popular formats including JSON, YAML, and TOML. It features advanced validation, schema checking, data analysis, and format-specific optimization capabilities designed for developers, system administrators, and data engineers.

## Purpose

This tool addresses critical data format challenges:
- **Format Conversion**: Seamless conversion between JSON, YAML, and TOML
- **Data Validation**: Comprehensive validation with detailed error reporting
- **Schema Compliance**: JSON Schema validation for data integrity
- **Structure Analysis**: Deep analysis of data structure and patterns
- **Development Workflow**: Integration with development and deployment pipelines

## Key Features

### 1. Multi-Format Support
- **JSON**: JavaScript Object Notation with minification and formatting
- **YAML**: Human-readable data serialization with flow and block styles
- **TOML**: Tom's Obvious, Minimal Language for configuration files
- **Auto-Detection**: Intelligent format detection for mixed workflows
- **Bidirectional Conversion**: Convert between any supported formats

### 2. Advanced Validation Engine
- **Real-time Validation**: Instant feedback on data structure and syntax
- **Enhanced Error Reporting**: Detailed error messages with context and suggestions
- **Line-Level Errors**: Precise error location with surrounding context
- **Format-Specific Rules**: Validation tailored to each format's requirements
- **Contextual Help**: Actionable suggestions for error resolution

### 3. JSON Schema Validation
- **Pre-built Schemas**: Common schemas for users, products, and configurations
- **Custom Schema Support**: Define and validate against custom JSON schemas
- **Field-Level Validation**: Detailed field validation with type checking
- **Requirement Checking**: Validation of required fields and constraints
- **Format Validation**: Email, URL, date, and other format validations

### 4. Data Structure Analysis
- **Hierarchy Analysis**: Deep structure examination with depth metrics
- **Type Distribution**: Breakdown of data types throughout the structure
- **Statistical Analysis**: Counts of keys, values, arrays, and objects
- **Memory Usage**: Analysis of data size and complexity
- **Performance Metrics**: Validation and conversion timing

### 5. Professional Formatting Options
- **Customizable Indentation**: Spaces or tabs with configurable size
- **Key Sorting**: Alphabetical sorting for consistent output
- **Minification**: Compact output for production environments
- **Pretty Printing**: Human-readable formatting with proper indentation
- **Format-Specific Options**: YAML flow level, TOML optimization

## Usage Instructions

### Basic Conversion

1. **Input Data**
   - Paste data directly into the input field
   - Or use sample data buttons for quick testing
   - Or load data from files using the upload feature

2. **Format Selection**
   - **Auto-detect**: Let the tool identify input format automatically
   - **Manual Selection**: Choose specific input format if needed
   - **Output Format**: Select desired output format

3. **Convert Data**
   - Click the conversion arrow or use keyboard shortcuts
   - Real-time validation provides immediate feedback
   - Results appear instantly in the output panel

4. **Review Results**
   - **Converter Tab**: Main conversion interface
   - **Analysis Tab**: Data structure analysis
   - **Schema Tab**: Schema validation results

### Advanced Features

#### File Operations
- **Upload Files**: Support for .json, .yaml/.yml, .toml files
- **Download Results**: Export converted data as files
- **Batch Processing**: Handle multiple files in sequence

#### Schema Validation
- **Enable Schema Validation**: Toggle in schema tab
- **Choose Schema Type**: User profile, product data, or configuration
- **Custom Schemas**: Define your own JSON schemas
- **Validation Results**: Detailed field-by-field validation

#### Formatting Options
- **Indentation Settings**: Configure spaces (1-8) or tabs
- **Key Sorting**: Alphabetical ordering of object keys
- **Minification**: Remove whitespace for compact output
- **Format-Specific**: YAML flow level, TOML section formatting

## Technical Implementation

### Architecture

```
DataConverterTool (Main Component)
├── Format Detection - Automatic format identification
├── Validation Engine - Multi-format validation system
├── Schema Validation - JSON Schema compliance checking
├── Conversion Engine - Format transformation logic
├── Analysis Engine - Data structure analysis
├── Settings Management - User preferences and options
└── History Tracking - Conversion history management
```

### Core Conversion Logic

#### Format Detection Algorithm
```javascript
const detectFormat = (text) => {
  // Try JSON first
  try {
    JSON.parse(text);
    return 'json';
  } catch (e) {}
  
  // Check TOML patterns before YAML
  const tomlPatterns = [
    /^\s*\[.*\]\s*$/m,           // Section headers
    /^\s*\w+\s*=\s*.+$/m,        // Key-value pairs
    /^\s*#.*$/m,                 // Comments
    /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/ // ISO datetime
  ];
  
  if (tomlPatterns.some(pattern => pattern.test(text))) {
    try {
      TOML.parse(text);
      return 'toml';
    } catch (e) {}
  }
  
  // Try YAML last (most permissive)
  try {
    yaml.load(text);
    return 'yaml';
  } catch (e) {}
  
  return null;
};
```

#### Conversion Engine
```javascript
const convertData = (data, targetFormat, options) => {
  switch (targetFormat) {
    case 'json':
      const indentString = options.useSpaces 
        ? ' '.repeat(options.indentSize) 
        : '\t';
      const processedData = options.sortKeys 
        ? sortObjectKeys(data) 
        : data;
      return JSON.stringify(processedData, null, indentString);
      
    case 'yaml':
      return yaml.dump(data, {
        indent: options.indentSize,
        sortKeys: options.sortKeys,
        flowLevel: options.minified ? 0 : -1
      });
      
    case 'toml':
      return TOML.stringify(data);
      
    default:
      throw new Error('Unsupported target format');
  }
};
```

### Validation System

#### Enhanced Validation Engine
```javascript
const validateWithDetection = (input) => {
  const detectedFormat = detectFormat(input);
  
  if (!detectedFormat) {
    return {
      success: false,
      errors: [{
        message: 'Unable to detect valid data format',
        suggestions: [
          'Ensure data is valid JSON, YAML, or TOML',
          'Check for syntax errors like missing quotes or brackets',
          'Try pasting a smaller sample first'
        ]
      }]
    };
  }
  
  return validateFormat(input, detectedFormat);
};
```

#### Error Context Generation
```javascript
const formatErrorForDisplay = (error, input) => {
  const lines = input.split('\n');
  const errorLine = error.line || 1;
  const contextStart = Math.max(0, errorLine - 3);
  const contextEnd = Math.min(lines.length, errorLine + 2);
  
  const context = lines
    .slice(contextStart, contextEnd)
    .map((line, index) => {
      const lineNumber = contextStart + index + 1;
      const marker = lineNumber === errorLine ? '>>> ' : '    ';
      return `${marker}${lineNumber}: ${line}`;
    })
    .join('\n');
    
  return {
    message: error.message,
    line: errorLine,
    column: error.column,
    context,
    suggestions: generateSuggestions(error)
  };
};
```

### Schema Validation

#### JSON Schema Integration
```javascript
const validateWithSchema = (data, schema, originalText, format) => {
  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(schema);
  const valid = validate(data);
  
  if (!valid) {
    return {
      success: false,
      errors: validate.errors.map(error => ({
        field: error.instancePath,
        message: error.message,
        value: error.data,
        suggestions: generateSchemaErrorSuggestions(error)
      }))
    };
  }
  
  return {
    success: true,
    validatedFields: analyzeFields(data, schema)
  };
};
```

#### Common Schema Definitions
```javascript
const commonSchemas = {
  user: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1 },
      email: { type: 'string', format: 'email' },
      age: { type: 'integer', minimum: 0, maximum: 150 },
      website: { type: 'string', format: 'uri' },
      isActive: { type: 'boolean' }
    },
    required: ['name', 'email']
  },
  product: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string', minLength: 1 },
      price: { type: 'number', minimum: 0 },
      category: { type: 'string' },
      inStock: { type: 'boolean' }
    },
    required: ['id', 'name', 'price']
  }
};
```

### Data Analysis Engine

#### Structure Analysis
```javascript
const analyzeData = (obj, path = '') => {
  const analysis = {
    totalKeys: 0,
    totalValues: 0,
    dataTypes: {},
    depth: 0,
    arrays: [],
    objects: [],
    nullValues: 0
  };

  const analyze = (value, currentPath, depth = 0) => {
    analysis.depth = Math.max(analysis.depth, depth);
    
    if (value === null) {
      analysis.nullValues++;
      return;
    }

    const type = Array.isArray(value) ? 'array' : typeof value;
    analysis.dataTypes[type] = (analysis.dataTypes[type] || 0) + 1;

    if (type === 'object') {
      analysis.objects.push(currentPath);
      analysis.totalKeys += Object.keys(value).length;
      
      Object.entries(value).forEach(([key, val]) => {
        analyze(val, currentPath ? `${currentPath}.${key}` : key, depth + 1);
      });
    } else if (type === 'array') {
      analysis.arrays.push({ 
        path: currentPath, 
        length: value.length 
      });
      
      value.forEach((item, index) => {
        analyze(item, `${currentPath}[${index}]`, depth + 1);
      });
    } else {
      analysis.totalValues++;
    }
  };

  analyze(obj);
  return analysis;
};
```

## API Integration

### File System Integration
```javascript
// File loading functionality
const loadFromFile = async (file) => {
  const text = await file.text();
  const extension = file.name.split('.').pop().toLowerCase();
  
  const formatMap = {
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml'
  };
  
  return {
    content: text,
    detectedFormat: formatMap[extension] || 'auto'
  };
};

// File export functionality
const exportFile = (content, format) => {
  const mimeTypes = {
    json: 'application/json',
    yaml: 'text/yaml',
    toml: 'text/plain'
  };
  
  const blob = new Blob([content], { type: mimeTypes[format] });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `converted.${format}`;
  link.click();
  
  URL.revokeObjectURL(url);
};
```

### Sample Data Integration
```javascript
// Sample data loading
const loadSampleData = () => ({
  json: require('./samples/sample.json'),
  yaml: require('./samples/sample.yaml'),
  toml: require('./samples/sample.toml')
});
```

## Data Storage and Privacy

### Local Storage
```javascript
const storageKeys = {
  history: 'data-converter-history',
  settings: 'data-converter-settings',
  schemas: 'data-converter-custom-schemas'
};
```

### Data Retention
- **Conversion History**: Last 10 conversions with preview
- **User Settings**: Indentation, sorting, and format preferences
- **Custom Schemas**: User-defined JSON schemas

### Privacy Considerations
- **Client-Side Only**: All processing happens in browser
- **No Data Transmission**: No data sent to external servers
- **Local Storage**: All data stored locally in browser
- **Data Security**: No sensitive data exposure

### Performance Optimization
- **Lazy Loading**: Sample data loaded on demand
- **Debounced Validation**: Prevents excessive validation calls
- **Memory Management**: Efficient handling of large data sets
- **Worker Threads**: Heavy processing in background (planned)

## Advanced Features

### Format-Specific Optimizations

#### JSON Features
- **Minification**: Remove all whitespace for production
- **Pretty Printing**: Human-readable formatting
- **Key Sorting**: Consistent object key ordering
- **Strict Validation**: RFC 7159 compliance checking

#### YAML Features
- **Flow vs Block Style**: Choose between compact and readable formats
- **Custom Indentation**: Configure spacing for organizational standards
- **Comment Preservation**: Maintain comments during conversion (planned)
- **Multi-document Support**: Handle YAML documents with separators

#### TOML Features
- **Section Organization**: Logical grouping of configuration sections
- **Type Optimization**: Optimal representation of different data types
- **Comment Handling**: Preserve configuration comments (planned)
- **Datetime Formatting**: Proper ISO 8601 datetime representation

### Error Recovery

#### Syntax Error Handling
```javascript
const handleSyntaxError = (error, input) => {
  const suggestions = [];
  
  if (error.message.includes('Unexpected token')) {
    suggestions.push('Check for missing commas, quotes, or brackets');
    suggestions.push('Validate JSON syntax with a JSON validator');
  }
  
  if (error.message.includes('Unexpected end of JSON input')) {
    suggestions.push('Data appears to be truncated');
    suggestions.push('Ensure all objects and arrays are properly closed');
  }
  
  return {
    type: 'syntax',
    message: error.message,
    suggestions,
    line: extractLineNumber(error),
    column: extractColumnNumber(error)
  };
};
```

#### TOML Conversion Limitations
```javascript
const handleTOMLLimitations = (error, data) => {
  const suggestions = [];
  
  if (error.message.includes('stringify objects')) {
    suggestions.push('Wrap your data in an object: { data: [your array] }');
    suggestions.push('TOML requires a top-level object structure');
  }
  
  if (error.message.includes('nested')) {
    suggestions.push('Flatten your data structure for TOML compatibility');
    suggestions.push('Consider using JSON or YAML for complex nested data');
  }
  
  return {
    type: 'conversion',
    format: 'TOML',
    message: error.message,
    suggestions
  };
};
```

## Performance Considerations

### Optimization Strategies
- **Incremental Validation**: Validate only changed portions
- **Debounced Processing**: Prevent excessive API calls
- **Memory-Efficient Parsing**: Handle large files without memory issues
- **Background Processing**: Use Web Workers for heavy computations

### Scalability Limits
- **File Size**: Recommended maximum 10MB per file
- **Complexity**: Optimal performance with <1000 nested levels
- **Browser Memory**: Limited by available system memory
- **Validation Speed**: Real-time validation up to medium-sized files

### Browser Compatibility
- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+
- **Required Features**: ES6, Fetch API, File API, Local Storage
- **Progressive Enhancement**: Graceful degradation on older browsers

## Best Practices

### Data Conversion Workflow
1. **Validate First**: Always validate input before conversion
2. **Choose Appropriate Format**: Select format based on use case
3. **Test Conversions**: Verify converted data meets requirements
4. **Backup Original**: Keep original format as backup

### Schema Design
1. **Start Simple**: Begin with basic schema requirements
2. **Iterate Gradually**: Add complexity as needed
3. **Document Schema**: Provide clear schema documentation
4. **Version Control**: Track schema changes over time

### Performance Optimization
1. **Batch Operations**: Process multiple files efficiently
2. **Use Caching**: Leverage browser caching for repeated operations
3. **Optimize Data**: Remove unnecessary data before conversion
4. **Monitor Memory**: Watch memory usage with large files

## Integration Examples

### Development Workflow
```javascript
// Example CI/CD integration
const validateConfigFiles = async (files) => {
  for (const file of files) {
    const content = await readFile(file);
    const validation = validateWithDetection(content);
    
    if (!validation.success) {
      throw new Error(`Invalid config in ${file}: ${validation.errors[0].message}`);
    }
  }
};
```

### Configuration Management
```javascript
// Example configuration conversion
const convertConfig = (yamlConfig, targetFormat) => {
  const data = yaml.load(yamlConfig);
  return convertToFormat(data, targetFormat, {
    sortKeys: true,
    indentSize: 2,
    useSpaces: true
  });
};
```

### Data Migration
```javascript
// Example data migration script
const migrateDataFormat = async (sourceDir, targetDir, targetFormat) => {
  const files = await getFiles(sourceDir);
  
  for (const file of files) {
    const content = await readFile(file);
    const data = parseInput(content, 'auto');
    const converted = convertToFormat(data, targetFormat);
    
    await writeFile(
      path.join(targetDir, `${file.name}.${targetFormat}`),
      converted
    );
  }
};
```

## Troubleshooting

### Common Issues

1. **TOML Conversion Fails**
   - TOML requires top-level object structure
   - Complex nested arrays not supported
   - Wrap arrays in an object container

2. **Large File Performance**
   - Break large files into smaller chunks
   - Use streaming processing for very large files
   - Consider server-side processing for huge datasets

3. **Schema Validation Errors**
   - Check required fields are present
   - Verify data types match schema expectations
   - Ensure format constraints are met (email, URL, etc.)

### Error Resolution Guide
```javascript
const errorResolutionGuide = {
  'JSON_PARSE_ERROR': 'Check JSON syntax, missing commas or quotes',
  'YAML_PARSE_ERROR': 'Verify YAML indentation and structure',
  'TOML_PARSE_ERROR': 'Ensure TOML sections and key-value format',
  'SCHEMA_VALIDATION_ERROR': 'Review required fields and data types',
  'CONVERSION_ERROR': 'Check data structure compatibility with target format'
};
```

## Contributing

### Development Setup
1. Clone repository and install dependencies
2. Study existing validation and conversion logic
3. Test with various data formats and edge cases
4. Ensure proper error handling and user feedback

### Testing Guidelines
- Test with valid and invalid data in all formats
- Verify schema validation with various schema types
- Test performance with large data files
- Validate accessibility and keyboard navigation

For more technical details, see the [existing samples documentation](samples.md) and [Architecture Guide](../../ARCHITECTURE.md).