# 📊 Markdown Table Tool

The Markdown Table Tool is a powerful visual editor for creating, formatting, and validating markdown tables with real-time preview and advanced editing features. It provides an intuitive interface for building properly formatted markdown tables with support for column alignment, header rows, and various import/export formats.

## Features

### ✨ Core Features
- **Visual Table Editor** - Interactive spreadsheet-like interface for editing tables
- **Real-time Preview** - Live markdown rendering with syntax highlighting
- **Column Alignment** - Left, center, and right alignment support for each column
- **Header Row Support** - Toggle first row as header with automatic styling
- **Undo/Redo History** - Full action history with keyboard shortcuts (Ctrl/Cmd+Z)
- **Auto-save** - Persistent storage in browser localStorage
- **Validation Engine** - Real-time validation with error and warning messages

### 📥 Import Capabilities
- **Markdown Tables** - Parse existing markdown table syntax
- **CSV/TSV Files** - Import comma or tab-separated value files
- **Excel Files** (.xlsx, .xls) - Direct Excel spreadsheet import
- **JSON Data** - Import from JSON arrays or objects
- **Auto-detection** - Smart delimiter detection for text files

### 📤 Export Options
- **Markdown** - Clean, properly formatted markdown table syntax
- **CSV** - Comma-separated values format
- **TSV** - Tab-separated values format
- **JSON** - Export as JSON array or objects
- **Excel** - Export to Excel spreadsheet format
- **Clipboard Copy** - One-click copy to system clipboard

### 🎛️ Advanced Editing
- **Context Menus** - Right-click for quick actions
- **Keyboard Navigation** - Tab through cells, Enter to confirm edits
- **Row/Column Operations** - Add, remove, duplicate rows and columns
- **Bulk Operations** - Clear table, bulk import/export
- **Cell Selection** - Visual feedback for selected cells
- **Inline Editing** - Direct cell editing with validation

## Getting Started

### Basic Usage

1. **Creating a Table**
   - The tool starts with a basic 2x2 table
   - Click any cell to start editing
   - Use Tab key to navigate between cells
   - Press Enter to confirm cell edits

2. **Adding Rows and Columns**
   - Use the "Add Row" and "Add Column" buttons in the toolbar
   - Click the "+" buttons next to row/column numbers
   - Right-click cells for context menu options

3. **Setting Column Alignment**
   - Use the alignment controls above the table
   - Choose from left, center, or right alignment per column
   - Alignment is preserved in markdown output

4. **Header Configuration**
   - Toggle "First row is header" to enable/disable header row
   - Header rows are visually distinct and create separator lines in markdown

### Import Workflow

1. **From Markdown**
   ```
   Click "Import" → Paste markdown table → Click "Import Table"
   ```

2. **From Files**
   ```
   Click "Import" → "Upload File" → Select CSV/Excel/JSON → Import
   ```

3. **From Text**
   ```
   Click "Import" → Paste CSV/TSV data → Select delimiter → Import
   ```

### Export Workflow

1. **Quick Copy**
   ```
   Switch to "Raw Markdown" tab → Click "Copy" button
   ```

2. **Export Dialog**
   ```
   Click "Export" → Choose format → Download or copy
   ```

## Interface Overview

### Three-Tab Layout

1. **Visual Editor**
   - Interactive table with spreadsheet-like editing
   - Row and column controls for adding/removing
   - Context menus for advanced operations
   - Real-time validation feedback

2. **Live Preview**
   - Rendered markdown table preview
   - Shows exactly how the table will appear
   - Validation warnings and statistics
   - Performance metrics

3. **Raw Markdown**
   - Clean markdown table syntax
   - Copy button for quick clipboard access
   - Validation errors and warnings
   - Format compliance checking

### Toolbar Features

- **Import/Export Buttons** - Quick access to data operations
- **Undo/Redo Controls** - Action history management
- **Add Row/Column** - Quick table expansion
- **Status Indicators** - Validation status and table dimensions

### Validation System

The tool provides comprehensive validation:

- **Structure Validation** - Ensures proper table format
- **Markdown Compliance** - Checks for valid markdown syntax
- **Consistency Checks** - Warns about inconsistent column counts
- **Performance Monitoring** - Tracks table size and complexity

## Technical Features

### Data Processing
- **Smart Parsing** - Handles various input formats gracefully
- **Data Sanitization** - Cleans and normalizes table data
- **Format Detection** - Auto-detects CSV delimiters and file types
- **Error Recovery** - Graceful handling of malformed data

### Performance
- **Lazy Loading** - Efficient handling of large tables
- **Chunked Processing** - Prevents UI freezing during imports
- **Memory Management** - Optimized for browser performance
- **Responsive Design** - Works on desktop, tablet, and mobile

### Browser Compatibility
- **Modern Browsers** - Chrome, Firefox, Safari, Edge
- **Local Storage** - Persistent data across sessions
- **Clipboard API** - System clipboard integration
- **File API** - Native file import/export

## Use Cases

### Documentation
- Creating tables for README files
- API documentation tables
- Feature comparison matrices
- Configuration reference tables

### Data Management
- Converting spreadsheets to markdown
- Formatting data for GitHub/GitLab
- Creating structured content for static sites
- Blog post table formatting

### Development
- Database schema documentation
- Test case matrices
- Configuration tables
- Code example tables

## Best Practices

### Table Design
- Keep headers descriptive but concise
- Use consistent data types within columns
- Consider mobile viewing when designing wide tables
- Use alignment to improve readability

### Data Entry
- Use consistent formatting within columns
- Avoid special characters that might break markdown
- Keep cell content concise for better readability
- Use empty cells sparingly for cleaner tables

### Export Considerations
- Test markdown output in target platform
- Consider table width limitations
- Use appropriate alignment for data types
- Validate output before publishing

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Tab` | Navigate to next cell |
| `Shift+Tab` | Navigate to previous cell |
| `Enter` | Confirm cell edit |
| `Escape` | Cancel cell edit |
| `Ctrl/Cmd+Z` | Undo last action |
| `Ctrl/Cmd+Y` | Redo last action |
| `Ctrl/Cmd+Shift+Z` | Redo (alternative) |

## File Format Support

### Import Formats
- `.md` - Markdown tables
- `.csv` - Comma-separated values
- `.tsv` - Tab-separated values
- `.txt` - Plain text with delimiters
- `.xlsx/.xls` - Excel spreadsheets
- `.json` - JSON data arrays

### Export Formats
- Markdown table syntax
- CSV with configurable delimiters
- TSV (tab-separated)
- JSON arrays or objects
- Excel spreadsheet format

## Limitations

- Maximum file size: 10MB for imports
- Recommended table size: under 1000 rows for optimal performance
- Complex Excel formulas are not preserved
- Binary file types are not supported for import

## Tips and Tricks

1. **Quick Column Alignment** - Set alignment before adding data for consistency
2. **Bulk Import** - Use CSV import for large datasets
3. **Template Creation** - Save common table structures as markdown snippets
4. **Context Menus** - Right-click for quick row/column operations
5. **Validation Feedback** - Pay attention to status indicators for error-free tables
6. **Mobile Editing** - Use landscape orientation for better mobile experience

## Privacy and Security

- **Client-side Processing** - All data processing happens in your browser
- **No Server Uploads** - Files are processed locally, never uploaded
- **Local Storage Only** - Data persists only in your browser's local storage
- **No Tracking** - No analytics or user behavior tracking
- **Secure** - No data transmission to external servers

The Markdown Table Tool provides a complete solution for creating, editing, and managing markdown tables with professional features and an intuitive interface, all while maintaining complete privacy and security.