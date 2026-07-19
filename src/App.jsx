import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { NewLayout } from './components/layout/NewLayout';
import { ThemeProvider } from './components/theme-provider';
import { AzureNamingProviderShadcn } from './components/tools/azure-naming/context/AzureNamingContextShadcn';
import { NewHomeView } from './components/layout/NewHomeView';
import StorageManager from './components/common/StorageManager';
// Ported tools render through SpaToolPage, which supplies the SEO head and
// header from the manifest — the per-tool ritual is gone from the tools.
import SpaToolPage from './components/common/SpaToolPage';

// Error Boundary for lazy loading
class LazyLoadErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '16px', color: '#e03131', marginBottom: '10px' }}>
            Failed to load component
          </div>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#228be6', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Lazy load tool components for code splitting with better error handling
const NetworkDesignerTool = lazy(() => 
  import('./components/tools/network-designer/NetworkDesignerShadcn').catch(() => ({
    default: () => <div>Error loading Network Designer Tool</div>
  }))
);
const AzureNamingTool = lazy(() => 
  import('./components/tools/azure-naming/AzureNamingShadcn').catch(() => ({
    default: () => <div>Error loading Azure Naming Tool</div>
  }))
);
const AzureKQLTool = lazy(() => 
  import('./components/tools/azure-kql/AzureKQLTool').catch(() => ({
    default: () => <div>Error loading Azure KQL Tool</div>
  }))
);

// Loading component for lazy-loaded routes
const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '200px',
    fontSize: '16px',
    color: '#666'
  }}>
    Loading tool...
  </div>
);

// Wrapper component for lazy-loaded routes
const LazyRoute = ({ children }) => (
  <LazyLoadErrorBoundary>
    <Suspense fallback={<LoadingFallback />}>
      {children}
    </Suspense>
  </LazyLoadErrorBoundary>
);

/**
 * Main application component that sets up:
 * - Mantine UI provider with theme configuration
 * - React Router for navigation
 * - Global layout and routes with lazy loading
 */
export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <AzureNamingProviderShadcn>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<NewLayout />}>
              <Route index element={<NewHomeView />} />

              <Route path="network-designer" element={
                <LazyRoute>
                  <NetworkDesignerTool />
                </LazyRoute>
              } />

              <Route path="azure-naming" element={
                <LazyRoute>
                  <AzureNamingTool />
                </LazyRoute>
              } />

              <Route path="delete" element={<StorageManager />} />

              <Route path="cron" element={
                <LazyRoute>
                  <SpaToolPage toolId="cron-builder" />
                </LazyRoute>
              } />

              <Route path="ssl-checker" element={
                <LazyRoute>
                  <SpaToolPage toolId="ssl-checker" />
                </LazyRoute>
              } />
              <Route path="ssl-checker/:domain" element={
                <LazyRoute>
                  <SpaToolPage toolId="ssl-checker" />
                </LazyRoute>
              } />

              <Route path="dns-lookup" element={
                <LazyRoute>
                  <SpaToolPage toolId="dns-lookup" />
                </LazyRoute>
              } />

              <Route path="whois-lookup" element={
                <LazyRoute>
                  <SpaToolPage toolId="whois-lookup" />
                </LazyRoute>
              } />
              <Route path="whois-lookup/:query" element={
                <LazyRoute>
                  <SpaToolPage toolId="whois-lookup" />
                </LazyRoute>
              } />

              <Route path="data-converter" element={
                <LazyRoute>
                  <SpaToolPage toolId="data-converter" />
                </LazyRoute>
              } />

              <Route path="base64" element={
                <LazyRoute>
                  <SpaToolPage toolId="base64" />
                </LazyRoute>
              } />
              <Route path="base64/:input" element={
                <LazyRoute>
                  <SpaToolPage toolId="base64" />
                </LazyRoute>
              } />

              <Route path="jwt" element={
                <LazyRoute>
                  <SpaToolPage toolId="jwt" />
                </LazyRoute>
              } />
              <Route path="jwt/:token" element={
                <LazyRoute>
                  <SpaToolPage toolId="jwt" />
                </LazyRoute>
              } />

              <Route path="password-generator" element={
                <LazyRoute>
                  <SpaToolPage toolId="password-generator" />
                </LazyRoute>
              } />

              <Route path="microsoft-portals" element={
                <LazyRoute>
                  <SpaToolPage toolId="microsoft-portals" />
                </LazyRoute>
              } />
              <Route path="microsoft-portals/:domain" element={
                <LazyRoute>
                  <SpaToolPage toolId="microsoft-portals" />
                </LazyRoute>
              } />

              <Route path="tenant-lookup" element={
                <LazyRoute>
                  <SpaToolPage toolId="tenant-lookup" />
                </LazyRoute>
              } />
              <Route path="tenant-lookup/:domain" element={
                <LazyRoute>
                  <SpaToolPage toolId="tenant-lookup" />
                </LazyRoute>
              } />

              <Route path="azure-kql" element={
                <LazyRoute>
                  <AzureKQLTool />
                </LazyRoute>
              } />
              <Route path="azure-kql/:service" element={
                <LazyRoute>
                  <AzureKQLTool />
                </LazyRoute>
              } />
              <Route path="azure-kql/:service/:template" element={
                <LazyRoute>
                  <AzureKQLTool />
                </LazyRoute>
              } />

              <Route path="buzzword-ipsum" element={
                <LazyRoute>
                  <SpaToolPage toolId="buzzword-ipsum" />
                </LazyRoute>
              } />

              <Route path="markdown-table-tool" element={
                <LazyRoute>
                  <SpaToolPage toolId="markdown-table-tool" />
                </LazyRoute>
              } />

            </Route>
          </Routes>
        </BrowserRouter>
      </AzureNamingProviderShadcn>
    </ThemeProvider>
  );
}
