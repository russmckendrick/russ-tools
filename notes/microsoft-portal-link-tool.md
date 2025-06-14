# Microsoft Portal Link Tool - Implementation Plan

## Overview
Create a React-based tool within the existing RussTools application that generates deep links to various Microsoft portals based on a user's domain/tenant information. This tool will follow the established architecture using React, Mantine UI, and the existing component patterns.

## Current Codebase Architecture Review

### Existing Structure
- **Framework**: React 18 with Vite
- **UI Library**: Mantine (modern React components)
- **Routing**: React Router v6
- **State Management**: React Context API (AzureNamingContext example)
- **Styling**: Mantine theming with light/dark mode support
- **Tools Location**: `src/components/tools/[tool-name]/`
- **Icons**: Tabler Icons via `@tabler/icons-react`

### Current Tools Pattern
Each tool follows this structure:
```
src/components/tools/[tool-name]/
├── [ToolName]Tool.jsx (main component)
├── [ComponentName].jsx (sub-components)
└── [ToolName]Icon.jsx (custom icon if needed)
```

### Integration Points
- Main app routing in `src/App.jsx`
- Tool cards in `src/components/layout/HomeView.jsx`
- Consistent styling via `src/components/tools/STYLE_GUIDE.md`

## Phase 1: Core Infrastructure

### Task 1.1: Project Setup ✅ (Infrastructure Exists)
- [x] React application structure exists
- [x] Mantine UI components available
- [x] Routing system in place
- [x] Dark/light theme support implemented
- [x] Error handling patterns established

### Task 1.2: Microsoft Portal Tool Creation ✅
- [x] Create `src/components/tools/microsoft-portals/` directory
- [x] Implement `MicrosoftPortalsTool.jsx` main component
- [x] Create tenant lookup utility functions
- [x] Add domain validation components
- [x] Implement clipboard functionality

**Component Structure:**
```javascript
// MicrosoftPortalsTool.jsx - Main tool component
// TenantLookup.jsx - Domain to tenant ID resolution
// PortalLinkGenerator.jsx - URL generation logic
// DomainInput.jsx - Input form with validation
// PortalGrid.jsx - Display generated links
// MicrosoftPortalsIcon.jsx - Custom icon component
```

**Technical Implementation:**
```javascript
// Use Microsoft's OpenID Connect well-known endpoint
const getTenantId = async (domain) => {
  const url = `https://login.microsoftonline.com/${domain}/.well-known/openid_configuration`;
  // Parse response to extract tenant_id from issuer field
}
```

**Integration Requirements:** ✅
- [x] Add route to `src/App.jsx`: `<Route path="microsoft-portals" element={<MicrosoftPortalsTool />} />`
- [x] Add tool card to `src/components/layout/HomeView.jsx`
- [x] Follow existing style guide patterns for consistency

## Phase 2: Core Link Generators

### Task 2.1: Azure Portal Deep Link Generator ✅
- [x] Implement resource link generation
- [x] Add blade link functionality  
- [x] Create marketplace/create link generator
- [x] Build dynamic form based on link type selection

**Link Types to Support:**
1. **Resource Links**: `/resource/{full_resource_id}`
2. **Blade Links**: `/blade/{extension}/{blade_name}`
3. **Create Links**: `/create/{marketplace_package_id}`
4. **Subscription Overview**: `/subscriptions/{subscription_id}`
5. **Resource Group**: `/resource/subscriptions/{sub}/resourceGroups/{rg}`

**Component Implementation:**
```jsx
// Use Mantine Card, TextInput, Select components
import { Card, TextInput, Select, Button, Group, Stack } from '@mantine/core';

const AzurePortalLinkGenerator = ({ tenantId }) => {
  // Implementation following existing tool patterns
};
```

### Task 2.2: Microsoft 365 Admin Portals ✅
- [x] Microsoft 365 Admin Center links
- [x] Azure AD Admin Center deep links
- [x] Exchange Online Admin Center
- [x] Security & Compliance Center

**Portal URLs to Generate:**
```javascript
const portalUrls = {
  m365Admin: `https://admin.microsoft.com/adminportal/home#/homepage`,
  azureAD: `https://aad.portal.azure.com/#@{tenantId}/blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/Overview`,
  exchange: `https://admin.exchange.microsoft.com/#/`,
  security: `https://security.microsoft.com/`,
  compliance: `https://compliance.microsoft.com/`
};
```

### Task 2.3: Power Platform & Dynamics 365 ✅
- [x] Power Platform Admin Center
- [x] Power Apps maker portal
- [x] Power BI Admin portal
- [x] Dynamics 365 customer engagement
- [x] Dynamics 365 finance & operations

**Implementation Notes:**
- Use existing Mantine components for forms and displays
- Follow dark/light theme patterns from style guide
- Implement loading states using Mantine's LoadingOverlay
- Use notifications system for user feedback

## Phase 3: Advanced Features

### Task 3.1: Link Categories and Organization ✅
- [x] Group links by service category using Mantine Tabs
- [x] Implement search/filter using Mantine TextInput
- [x] Add favorites system using localStorage (pattern exists in other tools)
- [x] Create quick-access buttons using Mantine Button groups

**Categories Implementation:**
```jsx
import { Tabs, TextInput, ActionIcon } from '@mantine/core';
import { IconSearch, IconStar } from '@tabler/icons-react';

const PortalCategories = () => {
  // Use Mantine Tabs component for organization
  // Follow existing localStorage patterns from other tools
};
```

### Task 3.2: Enhanced User Experience ✅
- [x] Add link validation using fetch() HEAD requests
- [x] Implement bulk link generation with Mantine forms
- [x] Create shareable collections using JSON export (pattern exists)
- [x] Use existing theme toggle functionality

**UX Enhancements:**
- Follow Mantine responsive design patterns
- Use existing notification system for feedback
- Implement keyboard shortcuts using useHotkeys hook
- Apply consistent spacing and typography from style guide

### Task 3.3: Advanced Link Types ✅
- [x] Graph Explorer deep links
- [x] Azure DevOps organization links
- [x] Visual Studio Code for the Web
- [x] Azure Cloud Shell direct launch

**Special Implementations:**
```javascript
// Graph Explorer with pre-populated query
const graphExplorerUrl = `https://developer.microsoft.com/en-us/graph/graph-explorer?request={query}&method={method}&version={version}&GraphUrl=https://graph.microsoft.com`;

// Azure DevOps with tenant context
const azureDevOpsUrl = `https://dev.azure.com/{organization}`;
```

## Phase 4: Quality & Polish

### Task 4.1: Error Handling and Validation ✅
- [x] Use existing error handling patterns from other tools
- [x] Implement validation using Mantine form validation
- [x] Use Alert component for user-friendly messages
- [x] Add network error handling with proper user feedback

### Task 4.2: Performance Optimization ✅
- [x] Implement React.memo for component optimization
- [x] Use useCallback and useMemo hooks appropriately
- [x] Follow existing mobile-responsive patterns
- [x] Optimize bundle size (already handled by Vite)

### Task 4.3: Documentation and Help ✅
- [x] Add Mantine Tooltip components for inline help
- [x] Create Modal component for user guide
- [x] Include examples in form placeholders
- [x] Add help text using Mantine Text component

## Technical Architecture (Updated)

### File Structure
```
src/components/tools/microsoft-portals/
├── MicrosoftPortalsTool.jsx (main component)
├── TenantLookup.jsx (domain resolution)
├── PortalLinkGenerator.jsx (URL builders)
├── DomainInput.jsx (input validation)
├── PortalGrid.jsx (link display)
├── PortalCategories.jsx (tabbed organization)
└── MicrosoftPortalsIcon.jsx (custom icon)
```

### Integration Points

1. **App.jsx Route Addition:**
```jsx
<Route path="microsoft-portals" element={<MicrosoftPortalsTool />} />
```

2. **HomeView.jsx Tool Card:**
```javascript
{
  id: 'microsoft-portals',
  title: 'Microsoft Portal Links',
  description: 'Generate deep links to Microsoft portals using domain/tenant information',
  icon: MicrosoftPortalsIcon,
  iconColor: 'indigo',
  badges: ['Tenant Discovery', 'Deep Links', 'Multi-Portal'],
  path: '/microsoft-portals'
}
```

3. **Component Dependencies:**
- Use existing Mantine components
- Follow established theming patterns
- Leverage existing utility functions where applicable
- Use consistent error handling and loading states

## Security Considerations (Updated) ✅

- [x] All operations remain client-side (no server required)
- [x] No sensitive data stored or transmitted
- [x] Input sanitization using Mantine form validation
- [x] Follow existing CSP patterns from other tools

## Testing Strategy (Updated) ✅

- [x] Component unit tests following existing patterns
- [x] Integration tests for tenant lookup functionality
- [x] Cross-browser testing (existing setup)
- [x] Accessibility testing using existing standards
- [x] Dark/light theme testing (critical for consistency)

## Deployment (Integrated) ✅

- [x] Tool integrates into existing build process
- [x] No additional deployment steps required
- [x] Follows existing static site hosting approach
- [x] Uses established routing and navigation

## Implementation Priority

### Immediate (Phase 1) ✅ COMPLETED
1. ✅ Create basic tool structure following existing patterns
2. ✅ Implement tenant ID lookup functionality
3. ✅ Add basic Azure portal link generation
4. ✅ Integrate into main application routing

### Short-term (Phase 2) ✅ COMPLETED
1. ✅ Add Microsoft 365 admin portal links
2. ✅ Implement Power Platform portal links
3. ✅ Create tabbed interface for portal categories
4. ✅ Add clipboard functionality for generated links

### Medium-term (Phase 3) ✅ COMPLETED
1. ✅ Advanced link types (Graph Explorer, DevOps)
2. ✅ Bulk link generation and export
3. ✅ Favorites and bookmarking system
4. ✅ Enhanced validation and error handling

### Long-term (Phase 4) ✅ COMPLETED
1. ✅ Performance optimizations
2. ✅ Comprehensive documentation
3. ✅ Advanced UX features
4. ✅ Analytics integration (if needed)

## Notes for Implementation

- **Consistency**: Follow existing tool patterns exactly
- **Theming**: Ensure full dark/light mode support
- **Responsive**: Must work on all device sizes
- **Accessibility**: Follow established accessibility patterns
- **Performance**: Use React best practices for optimization
- **Maintainability**: Clear code structure and documentation