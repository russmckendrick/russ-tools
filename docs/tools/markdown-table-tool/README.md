# Markdown Table Tool

Create, import, edit, validate, preview, and export Markdown tables with spreadsheet-style controls.

<!-- help:start -->

## Quick start

1. Edit cells in **Visual Editor**, or select **Import** to paste or upload existing tabular data.
2. Add or remove rows and columns, choose whether the first row is a header, and set each column's alignment.
3. Use **Live Preview** to inspect the rendered result and validation messages.
4. Open **Raw Markdown** to copy the generated table directly.
5. Select **Export** to copy or download another supported format.

## Import and export

- Paste Markdown, CSV, TSV, or JSON, with automatic delimiter detection available for delimited text.
- Upload CSV, TSV, TXT, XLSX, XLS, or JSON files up to 10 MB. Excel formulas are imported as their available cell values, not preserved as formulas.
- Export Markdown, CSV, TSV, JSON, HTML, or LaTeX and choose whether to include the header row.
- Import shows a preview before replacing the current table.

## Editing tips

- Keep headers concise and use right alignment for comparable numbers.
- The status badge reports structural errors or warnings; resolve those before publishing the Markdown.
- Undo and redo cover table edits and are also available with the usual Ctrl/Cmd keyboard shortcuts.
- Use the preview in the target documentation system too, because Markdown renderers can differ around wide cells and line breaks.

## Privacy and saved data

Parsing, editing, Excel handling, and export happen in the browser; imported files are not uploaded. Current table state and undo history are saved locally so work can survive a reload. Clear the table and Saved Data entries when working with sensitive content.

## Troubleshooting

- If delimited text produces one wide column, choose the correct comma, semicolon, pipe, or tab delimiter before importing.
- JSON imports should be arrays of similarly shaped rows or objects.
- Very large tables can be slow to edit even below the file-size limit; reduce the row count or split the source when possible.

<!-- help:end -->

Spreadsheet imports use `read-excel-file`; exports use browser-native downloads rather than preserving a workbook. The tool contract is defined in [`src/tools/markdown-table-tool/manifest.mjs`](../../../src/tools/markdown-table-tool/manifest.mjs).
