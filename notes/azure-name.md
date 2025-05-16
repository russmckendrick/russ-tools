# Azure Naming Function Application

## Overview
This document outlines the plan for implementing an Azure naming convention function as the second tool in our collection. The function will help users generate compliant Azure resource names based on Microsoft's naming conventions.

## Current Codebase Structure
- React-based application using Vite
- Tailwind CSS for styling
- Component-based architecture in `src/components/`
- Utility functions in `src/utils/`
- Main application logic in `src/App.jsx`

## Implementation Tasks

### 1. Core Functionality
- [ ] Create Azure naming convention rules based on Microsoft's documentation
- [ ] Implement input validation for resource types
- [ ] Add support for common Azure resource types:
  - Virtual Machines
  - Storage Accounts
  - Virtual Networks
  - Resource Groups
  - App Services
  - Function Apps
  - Key Vaults
  - SQL Servers

### 2. UI Components
- [ ] Create a new page component for Azure naming
- [ ] Design form with:
  - Resource type dropdown
  - Environment selection (dev, test, prod)
  - Location/region input
  - Project/application name input
  - Optional custom prefix/suffix
- [ ] Add validation feedback
- [ ] Implement copy-to-clipboard functionality

### 3. Integration
- [ ] Add new route in main application
- [ ] Update navigation to include Azure naming tool
- [ ] Ensure consistent styling with existing components
- [ ] Add appropriate icons and visual elements

### 4. Testing
- [ ] Unit tests for naming convention logic
- [ ] Integration tests for form submission
- [ ] UI component tests
- [ ] Cross-browser testing

## Naming Convention Rules
- Resource names must be unique within their scope
- Maximum length varies by resource type
- Allowed characters: alphanumeric and hyphens
- Case sensitivity varies by resource type
- Some resources require specific prefixes/suffixes

## Technical Considerations
- Maintain existing project structure
- Follow established coding patterns
- Ensure responsive design
- Implement error handling
- Add loading states for async operations

## Future Enhancements
- Save favorite/commonly used configurations
- Export naming conventions to documentation
- Bulk name generation
- Custom rule sets
- Integration with Azure CLI/API

## Notes
- Keep existing functionality intact
- Follow established project patterns
- Maintain consistent error handling
- Use existing utility functions where applicable
- Document all new components and functions 