# RussTools - Development Guide

## Getting Started

### Prerequisites
- Node.js 18+ (recommended: use nvm or volta)
- npm or yarn package manager
- Git for version control

### Quick Setup
```bash
# Clone the repository
git clone <repository-url>
cd russ-tools

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173 in your browser
```

### Available Scripts
```bash
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm run preview  # Preview production build locally
npm run lint     # Run ESLint for code quality
```

## Project Structure

```
russ-tools/
├── src/
│   ├── components/        # React components
│   │   ├── common/        # Shared components
│   │   ├── layout/        # Layout components
│   │   └── tools/         # Individual tool components
│   ├── data/              # Static data files
│   ├── pages/             # Page components
│   ├── styles/            # Global styles
│   ├── utils/             # Utility functions
│   ├── App.jsx            # Main app component
│   └── main.jsx           # Entry point
├── public/                # Static assets
├── docs/                  # Documentation
├── cloudflare-worker/     # Backend API workers
├── package.json           # Dependencies and scripts
├── vite.config.js         # Build configuration
└── eslint.config.js       # Linting rules
```

## Development Workflow

### 1. Creating a New Tool

#### Step 1: Add Tool Configuration
Add your tool to `src/utils/toolsConfig.json`:

```json
{
  "id": "my-new-tool",
  "title": "My New Tool",
  "description": "Description of what the tool does",
  "shortDescription": "Brief description for cards",
  "icon": "IconName",
  "iconColor": "blue",
  "badges": ["Feature1", "Feature2"],
  "path": "/my-new-tool"
}
```

#### Step 2: Create Tool Components
Create a new directory: `src/components/tools/my-new-tool/`

```
my-new-tool/
├── MyNewToolTool.jsx      # Main component (note the Tool suffix)
├── MyNewToolIcon.jsx      # Custom icon (optional)
├── SubComponent.jsx       # Additional components as needed
└── data/                  # Tool-specific data files
```

#### Step 3: Implement the Main Component
Follow the standard tool pattern:

```jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Paper, Stack, Group, Title, Text, ThemeIcon } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { SEOHead } from '../../common/SEOHead';
import { generateToolSEO } from '../../../utils/seoUtils';
import { toolsConfig } from '../../../utils/toolsConfig.json';
import { IconName } from '@tabler/icons-react';

export function MyNewToolTool() {
  // SEO Configuration
  const toolConfig = toolsConfig.find(tool => tool.id === 'my-new-tool');
  const seoData = generateToolSEO(toolConfig);

  // State Management
  const [state, setState] = useState(initialState);
  const [settings, setSettings] = useLocalStorage({
    key: 'my-new-tool-settings',
    defaultValue: {}
  });

  // URL Parameter Handling
  const { param } = useParams();
  useEffect(() => {
    if (param) {
      // Handle URL parameter
    }
  }, [param]);

  // Business Logic
  const handleOperation = () => {
    // Tool-specific logic
  };

  return (
    <>
      <SEOHead {...seoData} />
      <Paper withBorder p="xl" radius="lg">
        <Stack gap="lg">
          <Group gap="md">
            <ThemeIcon size={48} color="blue" radius="md" variant="light">
              <IconName size={24} />
            </ThemeIcon>
            <div>
              <Title order={2} fw={600}>
                {toolConfig.title}
              </Title>
              <Text size="sm" c="dimmed">
                {toolConfig.description}
              </Text>
            </div>
          </Group>
          
          {/* Tool content */}
        </Stack>
      </Paper>
    </>
  );
}
```

#### Step 4: Add Routing
Add the route to `src/App.jsx`:

```jsx
import { MyNewToolTool } from './components/tools/my-new-tool/MyNewToolTool';

// Inside the Routes component:
<Route path="/my-new-tool" element={<MyNewToolTool />} />
<Route path="/my-new-tool/:param" element={<MyNewToolTool />} />
```

#### Step 5: Register Icon (if custom)
Add to `src/utils/_iconImports.js`:

```javascript
import MyNewToolIcon from '../components/tools/my-new-tool/MyNewToolIcon';

export const iconMap = {
  // ... existing icons
  MyNewToolIcon,
};
```

### 2. State Management Patterns

#### Local Component State
```jsx
const [inputValue, setInputValue] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
```

#### Persistent State
```jsx
const [settings, setSettings] = useLocalStorage({
  key: 'tool-settings',
  defaultValue: {
    option1: true,
    option2: 'default'
  }
});
```

#### Complex State with Context
```jsx
// For tools with shared state across components
const MyToolContext = createContext();

export function MyToolProvider({ children }) {
  const [state, setState] = useState(initialState);
  
  return (
    <MyToolContext.Provider value={{ state, setState }}>
      {children}
    </MyToolContext.Provider>
  );
}
```

### 3. API Integration Patterns

#### Using Centralized API Configuration
```jsx
import { getApiEndpoint, apiFetch } from '../../../utils/apiUtils';

const handleApiCall = async () => {
  try {
    const endpoint = getApiEndpoint('service-name');
    const response = await apiFetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    // Handle response
  } catch (error) {
    console.error('API call failed:', error);
    // Handle error
  }
};
```

#### Adding New API Endpoints
Update `src/utils/api/apiConfig.json`:

```json
{
  "endpoints": {
    "new-service": {
      "url": "https://api.example.com/",
      "description": "New service API",
      "timeout": 10000,
      "retries": 2
    }
  }
}
```

### 4. Styling Guidelines

#### Using Mantine Components
```jsx
import { Paper, Stack, Group, Button, TextInput } from '@mantine/core';

// Follow consistent spacing patterns
<Paper withBorder p="xl" radius="lg">
  <Stack gap="lg">
    <Group gap="md">
      {/* Content */}
    </Group>
  </Stack>
</Paper>
```

#### Dark Mode Support
```jsx
import { useMantineColorScheme } from '@mantine/core';

const { colorScheme } = useMantineColorScheme();

// Use conditional styling for custom backgrounds
const customStyle = {
  backgroundColor: colorScheme === 'dark' 
    ? 'var(--mantine-color-dark-6)' 
    : 'var(--mantine-color-gray-0)'
};
```

#### CSS Modules (when needed)
```jsx
import styles from './MyComponent.module.css';

<div className={styles.customClass}>
  Content
</div>
```

### 5. SEO and Meta Tags

#### Tool-Specific SEO
```jsx
import { generateToolSEO } from '../../../utils/seoUtils';

const toolConfig = toolsConfig.find(tool => tool.id === 'tool-id');
const seoData = generateToolSEO(toolConfig, {
  // Optional custom data
  dynamicTitle: `Custom title for ${parameter}`,
  customDescription: `Processed ${parameter}`,
});

return (
  <>
    <SEOHead {...seoData} />
    {/* Component content */}
  </>
);
```

## Testing Guidelines

### Manual Testing Checklist
- [ ] Tool works in both light and dark themes
- [ ] Responsive design works on mobile devices
- [ ] URL parameters work correctly
- [ ] State persistence works across browser sessions
- [ ] All interactive elements are accessible
- [ ] Error states are handled gracefully
- [ ] Loading states provide feedback
- [ ] Export/download functionality works

### Cross-Browser Testing
Test in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Guidelines

### Code Splitting
```jsx
// Lazy load components for better performance
const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<LoadingOverlay visible />}>
  <HeavyComponent />
</Suspense>
```

### Optimization Best Practices
1. **Use React.memo** for expensive components
2. **Debounce user input** for search/filter operations
3. **Implement virtual scrolling** for large lists
4. **Optimize images** (use appropriate formats and sizes)
5. **Minimize bundle size** (analyze with `npm run build`)

## Build and Deployment

### Production Build
```bash
npm run build
```

### Build Analysis
```bash
# Add to package.json scripts:
"analyze": "vite build --mode analyze"
```

### Environment Variables
Create `.env.local` for local development:
```
VITE_API_BASE_URL=http://localhost:3000
VITE_FEATURE_FLAG_NEW_TOOL=true
```

## Contributing Guidelines

### Code Style
- Use ESLint configuration provided
- Follow existing naming conventions
- Add JSDoc comments for complex functions
- Use TypeScript where beneficial

### Git Workflow
1. Create feature branch from `main`
2. Make commits with descriptive messages
3. Test thoroughly before submitting PR
4. Update documentation as needed

### Pull Request Template
- [ ] Tool works in both themes
- [ ] Mobile responsive
- [ ] SEO meta tags configured
- [ ] Documentation updated
- [ ] No console errors
- [ ] Follows design system patterns

## Troubleshooting

### Common Issues

#### Mantine Theme Issues
```jsx
// Always use Mantine's color system
<Text c="dimmed">Text</Text> // ✅ Correct
<Text color="dimmed">Text</Text> // ❌ Deprecated
```

#### State Not Persisting
```jsx
// Ensure localStorage key is unique
const [state, setState] = useLocalStorage({
  key: 'unique-tool-name-state', // ✅ Specific key
  defaultValue: {}
});
```

#### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Debug Tools
- React Developer Tools browser extension
- Vite's built-in HMR error overlay
- Browser DevTools Network tab for API issues

## Resources

- [Mantine Documentation](https://mantine.dev/)
- [React Router Documentation](https://reactrouter.com/)
- [Vite Documentation](https://vitejs.dev/)
- [ESLint Configuration](https://eslint.org/)

## Support

For development questions or issues:
1. Check existing documentation
2. Search through codebase for similar patterns
3. Review component implementations in other tools
4. Test with different browsers and screen sizes