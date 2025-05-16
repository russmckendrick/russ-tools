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
- [ ] Create comprehensive Azure naming convention rules module
  - [ ] Implement resource-specific validation rules
  - [ ] Create centralized rule configuration file
  - [ ] Build extensible rule framework to easily add new resource types
- [ ] Develop name generator logic
  - [ ] Implement token replacement for variables (environment, region, etc.)
  - [ ] Add automatic abbreviation for common terms
  - [ ] Include character count validation
  - [ ] Apply resource-specific restrictions and transformations
- [ ] Implement input validation for resource types
  - [ ] Create form validation schema using Zod or Yup
  - [ ] Add real-time validation feedback
  - [ ] Implement compound validation rules (dependencies between fields)
- [ ] Add support for common Azure resource types:
  - [ ] Virtual Machines (`vm`)
  - [ ] Storage Accounts (`st`)
  - [ ] Virtual Networks (`vnet`)
  - [ ] Resource Groups (`rg`)
  - [ ] App Services (`app`)
  - [ ] Function Apps (`func`)
  - [ ] Key Vaults (`kv`)
  - [ ] SQL Servers (`sql`)
  - [ ] Azure Kubernetes Service (`aks`)
  - [ ] Logic Apps (`logic`)
  - [ ] Cosmos DB (`cosmos`)
- [ ] Implement character count visualization
  - [ ] Add dynamic progress bar for name length
  - [ ] Show warnings when approaching character limits
- [ ] Create mechanism for custom abbreviations
  - [ ] Allow organization-specific abbreviation dictionary
  - [ ] Support overriding default abbreviations

### 2. UI Components
- [ ] Create a new page component for Azure naming
  - [ ] Design responsive layout for form elements
  - [ ] Implement tabbed interface for different resource categories
  - [ ] Add informational tooltips explaining naming rules
- [ ] Design form with:
  - [ ] Resource type dropdown with icons for visual recognition
  - [ ] Environment selection (dev, test, stage, prod) with color coding
  - [ ] Location/region input with autocomplete from Azure regions list
  - [ ] Project/application name input with auto-abbreviation
  - [ ] Optional custom prefix/suffix with validation
  - [ ] Instance numbering options (padded zeros, etc.)
  - [ ] Workload/application purpose field
  - [ ] Team/department field (optional)
- [ ] Add validation feedback
  - [ ] Inline field validations with error messages
  - [ ] Warning indicators for potential issues
  - [ ] Success indicators for valid entries
  - [ ] "Preview" section showing assembled name components
- [ ] Implement copy-to-clipboard functionality
  - [ ] Add button with confirmation feedback
  - [ ] Provide copy options (name only, with explanation, JSON format)
- [ ] Create results display
  - [ ] Show generated name with highlighting for each component
  - [ ] Display character count and remaining characters
  - [ ] Add validation status indicators
  - [ ] Provide explanation of generated name
- [ ] Implement name generation history
  - [ ] Add local storage for recently generated names
  - [ ] Allow reloading previous configurations

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
