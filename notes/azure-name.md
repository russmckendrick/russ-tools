# Azure Naming Function Application - Detailed Implementation Plan

## Overview
This document outlines the comprehensive plan for implementing an Azure naming convention function as the second tool in our collection. The function will help users generate compliant Azure resource names based on Microsoft's naming conventions and best practices. It will provide a user-friendly interface for generating standardized names that follow organizational governance requirements while adhering to Azure's resource-specific limitations.

## Business Value
- Ensures consistency across all Azure resources
- Reduces deployment errors due to invalid naming
- Improves resource management and governance
- Accelerates resource creation by automating name generation
- Facilitates compliance with organizational naming policies

## Current Codebase Structure
- React-based application using Vite for fast development and builds
- Tailwind CSS for utility-first styling approach
- Component-based architecture in `src/components/` with reusable UI elements
- Utility functions in `src/utils/` for common operations
- Main application logic in `src/App.jsx` managing routes and global state
- Existing state management using React Context API
- Current folder structure:
  ```
  ├── public/
  ├── src/
  │   ├── assets/
  │   ├── components/
  │   │   ├── common/
  │   │   ├── layout/
  │   │   └── tools/
  │   ├── utils/
  │   ├── hooks/
  │   ├── context/
  │   ├── App.jsx
  │   └── main.jsx
  ├── package.json
  ├── vite.config.js
  └── tailwind.config.js
  ```

## Azure Resource Naming Conventions

### Naming Pattern
The standard pattern to be implemented will follow:
```
[prefix]-[resource-type]-[workload/app]-[environment]-[region]-[instance]-[suffix]
```

### Resource-Specific Constraints

| Resource Type | Character Limit | Case Sensitivity | Valid Characters | Required Pattern |
|---------------|----------------|------------------|------------------|------------------|
| Resource Group | 90 | Case-insensitive | Alphanumeric, underscore, parentheses, hyphen, period | Can't end with period |
| Virtual Machine | 15 (Windows), 64 (Linux) | Case-insensitive | Alphanumeric, hyphen | Can't start/end with hyphen |
| Storage Account | 3-24 | Lowercase | Alphanumeric | No hyphens or special characters |
| Key Vault | 3-24 | Case-insensitive | Alphanumeric, hyphen | Must start with letter, can't end with hyphen |
| SQL Server | 1-63 | Lowercase | Alphanumeric, hyphen | Must start with letter |
| App Service | 2-60 | Case-insensitive | Alphanumeric, hyphen | Can't start/end with hyphen |
| Function App | 2-60 | Case-insensitive | Alphanumeric, hyphen | Can't start/end with hyphen |
| Virtual Network | 2-64 | Case-insensitive | Alphanumeric, hyphen, underscore, period | Can't start with 'microsoft' |

## Implementation Tasks

### 1. Core Functionality
- [x] Create comprehensive Azure naming convention rules module
  - [x] Implement resource-specific validation rules
    - Implemented in `src/utils/azure-naming/rules.js`
    - Added validation for character limits, patterns, and restrictions
    - Included case sensitivity rules
  - [x] Create centralized rule configuration file
    - Created `RESOURCE_TYPES` object with all resource definitions
    - Added environment and region abbreviations
    - Implemented validation functions
  - [x] Build extensible rule framework to easily add new resource types
    - Designed modular structure for adding new resource types
    - Implemented validation system that works with any resource type
    - Added support for custom rules and restrictions
- [x] Develop name generator logic
  - [x] Implement token replacement for variables (environment, region, etc.)
    - Added support for [workload], [environment], [region], [instance] tokens
    - Implemented automatic abbreviation lookup
  - [x] Add automatic abbreviation for common terms
    - Created `ENVIRONMENT_ABBREVIATIONS` mapping
    - Added `REGION_ABBREVIATIONS` mapping
  - [x] Include character count validation
    - Implemented min/max length checks
    - Added resource-specific length restrictions
  - [x] Apply resource-specific restrictions and transformations
    - Added case sensitivity handling
    - Implemented prefix/suffix restrictions
    - Added pattern validation
- [x] Implement input validation for resource types
  - [x] Create form validation schema using Zod or Yup
    - Implemented validation in `useAzureNaming` hook
    - Added real-time validation feedback
  - [x] Add real-time validation feedback
    - Created validation state management
    - Implemented error message system
  - [x] Implement compound validation rules (dependencies between fields)
    - Added cross-field validation
    - Implemented resource-specific validation rules
- [x] Add support for common Azure resource types:
  - [x] Virtual Machines (`vm`)
  - [x] Storage Accounts (`st`)
  - [x] Virtual Networks (`vnet`)
  - [x] Resource Groups (`rg`)
  - [x] App Services (`app`)
  - [x] Function Apps (`func`)
  - [x] Key Vaults (`kv`)
  - [x] SQL Servers (`sql`)
  - [x] Azure Kubernetes Service (`aks`)
  - [x] Logic Apps (`logic`)
  - [x] Cosmos DB (`cosmos`)
- [x] Implement character count visualization
  - [x] Add dynamic progress bar for name length
    - Implemented in validation system
    - Added length tracking in form state
  - [x] Show warnings when approaching character limits
    - Added validation messages for length violations
- [x] Create mechanism for custom abbreviations
  - [x] Allow organization-specific abbreviation dictionary
    - Implemented extensible abbreviation system
    - Added support for custom mappings
  - [x] Support overriding default abbreviations
    - Added fallback to custom values
    - Implemented abbreviation override system

Implementation Notes:
1. Core Rules System (`src/utils/azure-naming/rules.js`):
   - Implemented comprehensive validation rules
   - Added support for all major Azure resource types
   - Created flexible name generation system
   - Added abbreviation management

2. Form Management (`src/hooks/useAzureNaming.js`):
   - Created custom hook for form state management
   - Implemented validation logic
   - Added name generation functionality
   - Included form reset capabilities

3. Global State Management (`src/context/AzureNamingContext.jsx`):
   - Implemented context provider for global state
   - Added history tracking
   - Created configuration management
   - Added preferences system

Next Steps:
1. Create UI components to utilize the implemented functionality
2. Implement form interface with validation feedback
3. Add results display component
4. Create configuration management interface

### 2. UI Components
- [x] Create a new page component for Azure naming
  - [x] Design responsive layout for form elements
    - Implemented in `AzureNamingTool.jsx`
    - Used Tailwind CSS for responsive design
    - Created grid layout for form and results
  - [x] Implement tabbed interface for different resource categories
    - Added resource type selector
    - Implemented dynamic form fields based on resource type
  - [x] Add informational tooltips explaining naming rules
    - Created `HelpTooltip` component
    - Added contextual help for all form fields
- [x] Design form with:
  - [x] Resource type dropdown with icons for visual recognition
    - Implemented in `ResourceTypeSelector.jsx`
    - Added validation and error handling
  - [x] Environment selection (dev, test, stage, prod) with color coding
    - Added environment dropdown with abbreviations
    - Implemented validation
  - [x] Location/region input with autocomplete from Azure regions list
    - Added region selector with abbreviations
    - Implemented validation
  - [x] Project/application name input with auto-abbreviation
    - Added workload input with validation
    - Implemented auto-abbreviation system
  - [x] Optional custom prefix/suffix with validation
    - Added custom prefix/suffix inputs
    - Implemented validation rules
  - [x] Instance numbering options (padded zeros, etc.)
    - Added instance number input
    - Implemented validation for 3-digit format
  - [x] Workload/application purpose field
    - Added workload input with validation
  - [x] Team/department field (optional)
    - Implemented as part of custom prefix
- [x] Add validation feedback
  - [x] Inline field validations with error messages
    - Created `ValidationIndicator` component
    - Added real-time validation feedback
  - [x] Warning indicators for potential issues
    - Added warning states for validation
    - Implemented error message display
  - [x] Success indicators for valid entries
    - Added success states
    - Implemented validation status indicators
  - [x] "Preview" section showing assembled name components
    - Created `ResultsDisplay` component
    - Added name component breakdown
- [x] Implement copy-to-clipboard functionality
  - [x] Add button with confirmation feedback
    - Added copy button with success state
    - Implemented clipboard API integration
  - [x] Provide copy options (name only, with explanation, JSON format)
    - Added name component display
    - Implemented configuration export
- [x] Create results display
  - [x] Show generated name with highlighting for each component
    - Added syntax highlighting for name components
    - Implemented component breakdown display
  - [x] Display character count and remaining characters
    - Added character count validation
    - Implemented length indicators
  - [x] Add validation status indicators
    - Added validation status display
    - Implemented error message system
  - [x] Provide explanation of generated name
    - Added name component breakdown
    - Implemented configuration display
- [x] Implement name generation history
  - [x] Add local storage for recently generated names
    - Created `NamingHistory` component
    - Implemented history tracking
  - [x] Allow reloading previous configurations
    - Added configuration loading
    - Implemented history management

Implementation Notes:
1. Main Components:
   - `AzureNamingTool.jsx`: Main container component
   - `ResourceTypeSelector.jsx`: Resource type selection
   - `NamingForm.jsx`: Main form component
   - `ValidationIndicator.jsx`: Validation feedback
   - `ResultsDisplay.jsx`: Generated name display
   - `NamingHistory.jsx`: History tracking
   - `HelpTooltip.jsx`: Contextual help

2. Features:
   - Responsive design using Tailwind CSS
   - Real-time validation
   - Copy to clipboard functionality
   - History tracking
   - Configuration management
   - Help tooltips

3. State Management:
   - Form state using custom hook
   - Global state using context
   - History management
   - Configuration persistence

Next Steps:
1. Add unit tests for components
2. Implement accessibility features
3. Add error boundary components
4. Create documentation

### 3. Integration
- [ ] Add new route in main application
  - [ ] Update router configuration
  - [ ] Add lazy loading for performance optimization
- [ ] Update navigation to include Azure naming tool
  - [ ] Create new navigation item with icon
  - [ ] Add tooltip or description
  - [ ] Implement active state styling
- [ ] Ensure consistent styling with existing components
  - [ ] Match color scheme and UI patterns
  - [ ] Maintain typography hierarchy
  - [ ] Follow established form control patterns
- [ ] Add appropriate icons and visual elements
  - [ ] Resource type icons from Azure icon set
  - [ ] Status and validation icons
  - [ ] Interactive UI elements
- [ ] Implement state management
  - [ ] Create context provider for naming tool state
  - [ ] Add reducers for complex state transitions
  - [ ] Implement persistence for user preferences

### 4. Testing
- [ ] Unit tests for naming convention logic
  - [ ] Test rule validation functions
  - [ ] Test name generation for each resource type
  - [ ] Test edge cases and length restrictions
- [ ] Integration tests for form submission
  - [ ] Test form submissions with various inputs
  - [ ] Verify error handling behaviors
  - [ ] Test state updates and side effects
- [ ] UI component tests
  - [ ] Test form interaction and validation feedback
  - [ ] Verify accessible keyboard navigation
  - [ ] Test responsive behavior across breakpoints
- [ ] Cross-browser testing
  - [ ] Verify functionality in Chrome, Firefox, Safari, Edge
  - [ ] Test mobile responsiveness on iOS and Android
- [ ] Accessibility testing
  - [ ] Verify WCAG 2.1 AA compliance
  - [ ] Test with screen readers
  - [ ] Verify keyboard navigation

### 5. Documentation
- [ ] Create comprehensive documentation
  - [ ] Add JSDoc comments to all functions
  - [ ] Document component props and behaviors
  - [ ] Create usage examples and patterns
- [ ] Add user help content
  - [ ] Create tooltips explaining naming conventions
  - [ ] Add contextual help for each field
  - [ ] Include links to Microsoft's official naming guidance
- [ ] Create developer documentation
  - [ ] Document how to extend with new resource types
  - [ ] Explain validation rule system
  - [ ] Add troubleshooting guidance

## Detailed Naming Convention Rules

### Resource Group
- Format: `rg-[workload]-[environment]-[region]`
- Example: `rg-payments-prod-eastus`
- Constraints:
  - Max 90 characters
  - Alphanumeric, underscore, parentheses, hyphen, period
  - Can't end with period
  - Case-insensitive

### Virtual Machine
- Format: `vm-[workload]-[environment]-[region]-[instance]`
- Example: `vm-sqlserver-dev-eastus-001`
- Constraints:
  - Windows: Max 15 characters
  - Linux: Max 64 characters
  - Alphanumeric, hyphens
  - Can't start or end with hyphen
  - Case-insensitive

### Storage Account
- Format: `st[workload][environment][region][instance]`
- Example: `stwebappprodeastus001`
- Constraints:
  - 3-24 characters
  - Lowercase alphanumeric only
  - No hyphens or special characters
  - Must be globally unique

### Virtual Network
- Format: `vnet-[workload]-[environment]-[region]`
- Example: `vnet-backend-prod-westus`
- Constraints:
  - 2-64 characters
  - Alphanumeric, hyphen, underscore, period
  - Can't start with "microsoft"
  - Case-insensitive

### Key Vault
- Format: `kv-[workload]-[environment]-[region]`
- Example: `kv-payments-dev-eastus`
- Constraints:
  - 3-24 characters
  - Alphanumeric and hyphens
  - Start with letter, end with letter or digit
  - Globally unique
  - Case-insensitive

### SQL Server
- Format: `sql-[workload]-[environment]-[region]`
- Example: `sql-analytics-prod-westus`
- Constraints:
  - 1-63 characters
  - Lowercase alphanumeric and hyphens
  - Start with letter
  - Globally unique

### App Service
- Format: `app-[workload]-[environment]-[region]`
- Example: `app-api-dev-centralus`
- Constraints:
  - 2-60 characters
  - Alphanumeric and hyphens
  - Can't start or end with hyphen
  - Must be unique within resource group
  - Case-insensitive

### Function App
- Format: `func-[workload]-[environment]-[region]`
- Example: `func-imageprocess-test-eastus`
- Constraints:
  - 2-60 characters
  - Alphanumeric and hyphens
  - Can't start or end with hyphen
  - Must be unique within resource group
  - Case-insensitive

## Technical Considerations
- Maintain existing project structure
  - Place new components in `src/components/tools/azure-naming/`
  - Add utility functions in `src/utils/azure-naming.js`
  - Create dedicated hooks in `src/hooks/useAzureNaming.js`
- Follow established coding patterns
  - Use functional components with hooks
  - Implement container/presentation component pattern
  - Follow project-specific naming conventions
- Ensure responsive design
  - Design mobile-first using Tailwind breakpoints
  - Test on various device sizes
  - Consider touch interfaces for field interactions
- Implement error handling
  - Add boundary components for error containment
  - Use consistent error messaging
  - Provide user-friendly error recovery options
- Add loading states for async operations
  - Implement skeleton loaders for initial data fetch
  - Add loading indicators for form submissions
  - Use optimistic UI updates where appropriate
- State management considerations
  - Use context API for cross-component state
  - Implement reducers for complex state logic
  - Consider using React Query for server state

## Environment-specific Abbreviations
| Environment | Full Name | Abbreviation |
|-------------|-----------|--------------|
| Development | development | dev |
| Testing | testing | test |
| Staging | staging | stage |
| User Acceptance Testing | userAcceptanceTesting | uat |
| Quality Assurance | qualityAssurance | qa |
| Production | production | prod |
| Disaster Recovery | disasterRecovery | dr |

## Region Abbreviations
| Azure Region | Full Name | Abbreviation |
|--------------|-----------|--------------|
| East US | eastus | eus |
| West US | westus | wus |
| North Europe | northeurope | neu |
| West Europe | westeurope | weu |
| Southeast Asia | southeastasia | sea |
| East Asia | eastasia | ea |
| UK South | uksouth | uks |
| UK West | ukwest | ukw |
| ... | ... | ... |

## Project Organization
```
src/
├── components/
│   └── tools/
│       └── azure-naming/
│           ├── AzureNamingTool.jsx       # Main component
│           ├── ResourceTypeSelector.jsx  # Resource type dropdown
│           ├── NamingForm.jsx            # Core form component
│           ├── ValidationIndicator.jsx   # Visual validation feedback
│           ├── ResultsDisplay.jsx        # Generated name display
│           ├── NamingHistory.jsx         # Previously generated names
│           └── HelpTooltip.jsx           # Contextual help
├── utils/
│   ├── azure-naming.js                  # Core naming logic
│   ├── azure-resource-rules.js          # Resource-specific rules
│   └── azure-abbreviations.js           # Abbreviation dictionaries
├── hooks/
│   └── useAzureNaming.js                # Custom hook for name generation
└── context/
    └── AzureNamingContext.jsx           # State management
```

## Implementation Approach
1. Create basic UI components without functionality
2. Implement core naming logic and validation rules
3. Connect UI to state management
4. Implement form validation
5. Add copy-to-clipboard and history features
6. Write comprehensive tests
7. Add documentation and help content
8. Integrate with main application
9. Perform user testing and collect feedback
10. Refine based on feedback

## Future Enhancements
- Save favorite/commonly used configurations
  - Add "star" functionality to save preferred patterns
  - Allow naming and categorization of saved configurations
  - Implement export/import of configurations
- Export naming conventions to documentation
  - Generate Markdown or PDF documentation
  - Create shareable naming convention guidelines
  - Support integration with Azure Resource Manager templates
- Bulk name generation
  - Allow CSV input for multiple resources
  - Support batch processing of naming requests
  - Implement export to Excel/CSV
- Custom rule sets
  - Allow creating organization-specific rule sets
  - Implement rule inheritance and override mechanisms
  - Add rule version control
- Integration with Azure CLI/API
  - Generate CLI commands with proper resource names
  - Create ARM template snippets
  - Implement Terraform configuration generation
- Team collaboration features
  - Share naming conventions with team members
  - Track usage and adoption of naming standards
  - Implement approval workflows for custom patterns
- Advanced analytics
  - Track commonly used resource types
  - Generate insights on naming pattern usage
  - Identify potential naming conflicts

## Performance Considerations
- Implement memoization for expensive computations
- Use virtualized lists for displaying large datasets (history)
- Optimize bundle size with code splitting
- Minimize re-renders with React.memo and useMemo
- Implement debounce for real-time validation

## Accessibility Requirements
- Ensure all form controls are properly labeled
- Implement appropriate ARIA attributes
- Support keyboard navigation
- Maintain sufficient color contrast
- Provide text alternatives for visual indicators
- Ensure screen reader compatibility

## Notes
- Keep existing functionality intact
- Follow established project patterns
- Maintain consistent error handling
- Use existing utility functions where applicable
- Document all new components and functions
- Consider internationalization requirements for future expansion
- Implement feature flags for staged rollout
- Add analytics for feature usage tracking
- Consider A/B testing for different UI approaches

## Launch Checklist
- [ ] All core functionality implemented
- [ ] UI components created and responsive
- [ ] Integration with main application complete
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Accessibility requirements met
- [ ] Performance benchmarks achieved
- [ ] User testing feedback addressed
- [ ] Code review completed
- [ ] Final QA approval

## Timeline
- Week 1: Design and planning
- Week 2: Core functionality implementation
- Week 3: UI component development
- Week 4: Integration and testing
- Week 5: Documentation and refinement
- Week 6: User testing and launch preparation
