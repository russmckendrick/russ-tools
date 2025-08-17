import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { NewLayout } from './components/layout/NewLayout';
import { ThemeProvider } from './components/theme-provider';
import { AzureNamingProviderShadcn } from './components/tools/azure-naming/context/AzureNamingContextShadcn';
import { NewHomeView } from './components/layout/NewHomeView';
import ClearAllStorage from './components/common/ClearAllStorage';

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
const CronBuilderTool = lazy(() => 
  import('./components/tools/cron/CronBuilderShadcn').catch(() => ({
    default: () => <div>Error loading Cron Builder Tool</div>
  }))
);
const SSLCheckerTool = lazy(() => 
  import('./components/tools/ssl-checker/SSLCheckerShadcn').catch(() => ({
    default: () => <div>Error loading SSL Checker Tool</div>
  }))
);
const DNSLookupTool = lazy(() => 
  import('./components/tools/dns-lookup/DNSLookupShadcn').catch(() => ({
    default: () => <div>Error loading DNS Lookup Tool</div>
  }))
);
const WHOISLookupTool = lazy(() => 
  import('./components/tools/whois/WHOISLookupShadcn').catch(() => ({
    default: () => <div>Error loading WHOIS Lookup Tool</div>
  }))
);
const DataConverterTool = lazy(() => 
  import('./components/tools/data-converter/DataConverterShadcn').catch(() => ({
    default: () => <div>Error loading Data Converter Tool</div>
  }))
);
const Base64Tool = lazy(() => 
  import('./components/tools/base64/Base64ToolShadcn').catch(() => ({
    default: () => <div>Error loading Base64 Tool</div>
  }))
);
const JWTTool = lazy(() => 
  import('./components/tools/jwt/JWTShadcn').catch(() => ({
    default: () => <div>Error loading JWT Tool</div>
  }))
);
const PasswordGeneratorTool = lazy(() => 
  import('./components/tools/password-generator/PasswordGeneratorShadcn').catch(() => ({
    default: () => <div>Error loading Password Generator Tool</div>
  }))
);
const MicrosoftPortalsTool = lazy(() => 
  import('./components/tools/microsoft-portals/MicrosoftPortalsShadcn').catch(() => ({
    default: () => <div>Error loading Microsoft Portals Tool</div>
  }))
);
const TenantLookupTool = lazy(() => 
  import('./components/tools/tenant-lookup/TenantLookupShadcn').catch(() => ({
    default: () => <div>Error loading Tenant Lookup Tool</div>
  }))
);
const AzureKQLTool = lazy(() => 
  import('./components/tools/azure-kql/AzureKQLTool').catch(() => ({
    default: () => <div>Error loading Azure KQL Tool</div>
  }))
);
const BuzzwordIpsumTool = lazy(() => 
  import('./components/tools/buzzword-ipsum/BuzzwordIpsumShadcn').catch(() => ({
    default: () => <div>Error loading Buzzword Ipsum Tool</div>
  }))
);
const MarkdownTableTool = lazy(() => 
  import('./components/tools/markdown-table-tool/MarkdownTableTool').catch(() => ({
    default: () => <div>Error loading Markdown Table Tool</div>
  }))
);
const UIDemo = lazy(() => 
  import('./components/ui/demo').catch(() => ({
    default: () => <div>Failed to load UI Demo</div>
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

              <Route path="delete" element={<ClearAllStorage />} />

              <Route path="cron" element={
                <LazyRoute>
                  <CronBuilderTool />
                </LazyRoute>
              } />

              <Route path="ssl-checker" element={
                <LazyRoute>
                  <SSLCheckerTool />
                </LazyRoute>
              } />
              <Route path="ssl-checker/:domain" element={
                <LazyRoute>
                  <SSLCheckerTool />
                </LazyRoute>
              } />

              <Route path="dns-lookup" element={
                <LazyRoute>
                  <DNSLookupTool />
                </LazyRoute>
              } />

              <Route path="whois-lookup" element={
                <LazyRoute>
                  <WHOISLookupTool />
                </LazyRoute>
              } />
              <Route path="whois-lookup/:query" element={
                <LazyRoute>
                  <WHOISLookupTool />
                </LazyRoute>
              } />

              <Route path="data-converter" element={
                <LazyRoute>
                  <DataConverterTool />
                </LazyRoute>
              } />

              <Route path="base64" element={
                <LazyRoute>
                  <Base64Tool />
                </LazyRoute>
              } />
              <Route path="base64/:input" element={
                <LazyRoute>
                  <Base64Tool />
                </LazyRoute>
              } />

              <Route path="jwt" element={
                <LazyRoute>
                  <JWTTool />
                </LazyRoute>
              } />
              <Route path="jwt/:token" element={
                <LazyRoute>
                  <JWTTool />
                </LazyRoute>
              } />

              <Route path="password-generator" element={
                <LazyRoute>
                  <PasswordGeneratorTool />
                </LazyRoute>
              } />

              <Route path="microsoft-portals" element={
                <LazyRoute>
                  <MicrosoftPortalsTool />
                </LazyRoute>
              } />
              <Route path="microsoft-portals/:domain" element={
                <LazyRoute>
                  <MicrosoftPortalsTool />
                </LazyRoute>
              } />

              <Route path="tenant-lookup" element={
                <LazyRoute>
                  <TenantLookupTool />
                </LazyRoute>
              } />
              <Route path="tenant-lookup/:domain" element={
                <LazyRoute>
                  <TenantLookupTool />
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
                  <BuzzwordIpsumTool />
                </LazyRoute>
              } />

              <Route path="markdown-table-tool" element={
                <LazyRoute>
                  <MarkdownTableTool />
                </LazyRoute>
              } />

              <Route path="ui-demo" element={
                <LazyRoute>
                  <UIDemo />
                </LazyRoute>
              } />

            </Route>
          </Routes>
        </BrowserRouter>
      </AzureNamingProviderShadcn>
    </ThemeProvider>
  );
}
