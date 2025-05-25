# Sample Data Files

This directory contains the sample data files used by the Data Format Converter tool.

## Files

- **`sample.json`** - JSON format sample data (Company employee data)
- **`sample.yaml`** - YAML format sample data (E-commerce product catalog)  
- **`sample.toml`** - TOML format sample data (Server configuration)

## Updating Sample Data

You can edit these files directly to change the sample data that appears when users click the format buttons (JSON, YAML, TOML) in the converter tool.

### Guidelines

1. **Keep it realistic** - Use practical examples that users might encounter
2. **Show format strengths** - Each format should demonstrate what it's good for:
   - JSON: APIs, data exchange, nested structures
   - YAML: Configuration files, readable data, comments
   - TOML: Configuration files, simple key-value pairs, sections
3. **Test your changes** - Make sure the data is valid for its format
4. **Keep reasonable size** - Not too large to overwhelm the UI

### Format Requirements

- **JSON**: Must be valid JSON (use double quotes, no trailing commas)
- **YAML**: Must be valid YAML (watch indentation, use spaces not tabs)
- **TOML**: Must be valid TOML (proper sections, key=value format)

The files are loaded automatically when the application starts, so changes will be reflected after a page refresh. 