# TLD Utilities

This module provides utilities for working with Top Level Domains (TLDs), including domain autocomplete functionality and validation.

## Features

- **Automatic TLD Loading**: Fetches the latest TLD list from IANA RDAP registry with fallback to a comprehensive static list
- **Domain Autocomplete**: Generates domain suggestions based on partial input
- **TLD Validation**: Validates if a TLD is in the known TLD list
- **Domain Utilities**: Extract TLD from domain, check if input looks like a domain
- **React Hook**: Easy-to-use React hook for components
- **Caching**: Intelligent caching to avoid repeated API calls

## Usage

### React Hook (Recommended)

```jsx
import React, { useState } from 'react';
import { Autocomplete } from '@mantine/core';
import { useTLDs } from '../utils';

const DomainInput = () => {
  const [domain, setDomain] = useState('');
  const { generateSuggestions, validateTLD, isReady } = useTLDs();
  
  const suggestions = generateSuggestions(domain, 10);
  
  return (
    <Autocomplete
      label="Domain Name"
      placeholder="example.com"
      value={domain}
      onChange={setDomain}
      data={suggestions}
      disabled={!isReady}
    />
  );
};
```

### Standalone Functions

```javascript
import { loadTLDs, generateDomainSuggestions, generateSubdomainSuggestions, isValidTLD, extractTLD, extractRootDomain, isDomainLike } from '../utils';

// Load TLD list
const tlds = await loadTLDs();

// Generate domain suggestions
const suggestions = generateDomainSuggestions('example.c', tlds, 5);
// Returns: ['example.com', 'example.ca', 'example.cc', 'example.ch', 'example.cl']

// Generate subdomain suggestions
const subdomainSuggestions = generateSubdomainSuggestions('mail.example.c', tlds, 5);
// Returns: ['mail.example.com', 'mail.example.ca', 'mail.example.cc', 'mail.example.ch', 'mail.example.cl']

// Validate TLD
const isValid = isValidTLD('com', tlds); // true

// Extract TLD from domain
const tld = extractTLD('example.com'); // 'com'

// Extract root domain from subdomain
const rootDomain = extractRootDomain('mail.example.com'); // 'example.com'

// Check if input looks like a domain
const isDomain = isDomainLike('example.com'); // true
```

### Non-React Environments

```javascript
import { tldUtils } from '../utils';

// Use the utility object for non-React environments
const tlds = await tldUtils.loadTLDs();
const suggestions = tldUtils.generateDomainSuggestions('test.c', tlds);
```

## API Reference

### `useTLDs()` Hook

Returns an object with:
- `tldList`: Array of available TLDs
- `loading`: Boolean indicating if TLDs are being loaded
- `error`: Error message if loading failed
- `generateSuggestions(query, maxSuggestions)`: Function to generate domain suggestions
- `generateSubdomainSuggestions(query, maxSuggestions)`: Function to generate subdomain suggestions
- `validateTLD(tld)`: Function to validate a TLD
- `isReady`: Boolean indicating if the hook is ready to use

### `loadTLDs()`

Loads TLD list from IANA RDAP registry with fallback to static list.

**Returns**: `Promise<string[]>` - Array of TLD strings

### `generateDomainSuggestions(query, tldList, maxSuggestions)`

Generates domain autocomplete suggestions.

**Parameters**:
- `query` (string): Partial domain input
- `tldList` (string[]): Array of available TLDs
- `maxSuggestions` (number): Maximum suggestions to return (default: 10)

**Returns**: `string[]` - Array of domain suggestions

### `generateSubdomainSuggestions(query, tldList, maxSuggestions)`

Generates domain suggestions for subdomains and full domains. More flexible than `generateDomainSuggestions` and handles subdomain cases better.

**Parameters**:
- `query` (string): Partial domain/subdomain input (e.g., "mail.example.c")
- `tldList` (string[]): Array of available TLDs
- `maxSuggestions` (number): Maximum suggestions to return (default: 10)

**Returns**: `string[]` - Array of domain/subdomain suggestions

### `isValidTLD(tld, tldList)`

Validates if a TLD is in the known TLD list.

**Parameters**:
- `tld` (string): TLD to validate
- `tldList` (string[]): Array of valid TLDs

**Returns**: `boolean` - True if TLD is valid

### `extractTLD(domain)`

Extracts the TLD from a domain name.

**Parameters**:
- `domain` (string): Domain name

**Returns**: `string|null` - The TLD or null if invalid

### `extractRootDomain(domain)`

Extracts the root domain from a subdomain (e.g., "mail.example.com" → "example.com").

**Parameters**:
- `domain` (string): Domain or subdomain name

**Returns**: `string|null` - The root domain or null if invalid

### `isDomainLike(input)`

Checks if a string looks like a domain name.

**Parameters**:
- `input` (string): Input to check

**Returns**: `boolean` - True if it looks like a domain

## Caching

The TLD list is cached for 24 hours to avoid repeated API calls. The cache is automatically managed and will refresh when expired.

## Error Handling

If the IANA RDAP endpoint is unavailable, the utilities automatically fall back to a comprehensive static list of TLDs including:
- Generic TLDs (com, org, net, etc.)
- New gTLDs (app, dev, tech, etc.)
- Country code TLDs (major ones)

## Examples in the Codebase

- **WHOIS Lookup Tool**: Uses `useTLDs()` hook for domain autocomplete
- **DNS Lookup Tool**: Uses `useTLDs()` hook with `generateSubdomainSuggestions` for subdomain autocomplete
- See `src/components/tools/whois/WHOISLookupTool.jsx` and `src/components/tools/dns-lookup/DNSLookupTool.jsx` for complete implementation examples

## Subdomain Support

The utilities now include enhanced support for subdomains:

```jsx
// For DNS lookups that often involve subdomains
const { generateSubdomainSuggestions } = useTLDs();

// This will suggest completions for subdomains like:
// "mail.example.c" → ["mail.example.com", "mail.example.ca", ...]
// "www.subdomain.example.c" → ["www.subdomain.example.com", ...]
const suggestions = generateSubdomainSuggestions(userInput, 10);
``` 