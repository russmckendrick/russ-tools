import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import React, { Suspense, lazy } from 'react';
import { Layout } from './components/layout/Layout';
import { AzureNamingProvider } from './components/tools/azure-naming/context/AzureNamingContext';
import HomeView from './components/layout/HomeView';
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
  import('./components/tools/network-designer/NetworkDesignerTool').catch(() => ({
    default: () => <div>Error loading Network Designer Tool</div>
  }))
);
const AzureNamingTool = lazy(() => 
  import('./components/tools/azure-naming/AzureNamingTool').catch(() => ({
    default: () => <div>Error loading Azure Naming Tool</div>
  }))
);
const CronBuilderTool = lazy(() => 
  import('./components/tools/cron/CronBuilderTool').catch(() => ({
    default: () => <div>Error loading Cron Builder Tool</div>
  }))
);
const SSLCheckerTool = lazy(() => 
  import('./components/tools/ssl-checker/SSLCheckerTool').catch(() => ({
    default: () => <div>Error loading SSL Checker Tool</div>
  }))
);
const DNSLookupTool = lazy(() => 
  import('./components/tools/dns-lookup/DNSLookupTool').catch(() => ({
    default: () => <div>Error loading DNS Lookup Tool</div>
  }))
);
const WHOISLookupTool = lazy(() => 
  import('./components/tools/whois/WHOISLookupTool').catch(() => ({
    default: () => <div>Error loading WHOIS Lookup Tool</div>
  }))
);
const DataConverterTool = lazy(() => 
  import('./components/tools/data-converter/DataConverterTool').catch(() => ({
    default: () => <div>Error loading Data Converter Tool</div>
  }))
);
const Base64Tool = lazy(() => 
  import('./components/tools/base64/Base64Tool').catch(() => ({
    default: () => <div>Error loading Base64 Tool</div>
  }))
);
const JWTTool = lazy(() => 
  import('./components/tools/jwt/JWTTool').catch(() => ({
    default: () => <div>Error loading JWT Tool</div>
  }))
);
const PasswordGeneratorTool = lazy(() => 
  import('./components/tools/password-generator/PasswordGeneratorTool').catch(() => ({
    default: () => <div>Error loading Password Generator Tool</div>
  }))
);
const MicrosoftPortalsTool = lazy(() => 
  import('./components/tools/microsoft-portals/MicrosoftPortalsTool').catch(() => ({
    default: () => <div>Error loading Microsoft Portals Tool</div>
  }))
);
const TenantLookupTool = lazy(() => 
  import('./components/tools/tenant-lookup/TenantLookupTool').catch(() => ({
    default: () => <div>Error loading Tenant Lookup Tool</div>
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
    <MantineProvider
      theme={{
        primaryColor: 'blue',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        headings: {
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          fontWeight: '600',
        },
        defaultRadius: 'md',
        cursorType: 'pointer',
        respectReducedMotion: true,
        focusRing: 'always',
        activeClassName: 'mantine-active',
      }}
    >
      <Notifications />
      <AzureNamingProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Default route - now points to HomeView */}
            <Route index element={<HomeView />} />
            
            {/* Network Designer route */}
            <Route path="network-designer" element={
              <LazyRoute>
                <NetworkDesignerTool />
              </LazyRoute>
            } />
            
            {/* Azure Naming Tool route */}
            <Route path="azure-naming" element={
              <LazyRoute>
                <AzureNamingTool />
              </LazyRoute>
            } />
            
            {/* Hidden route for clearing all local storage */}
            <Route path="delete" element={<ClearAllStorage />} />

            {/* Cron Builder Tool route */}
            <Route path="cron" element={
              <LazyRoute>
                <CronBuilderTool />
              </LazyRoute>
            } />

            {/* SSL Checker Tool route */}
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

            {/* DNS Lookup Tool route */}
            <Route path="dns-lookup" element={
              <LazyRoute>
                <DNSLookupTool />
              </LazyRoute>
            } />

            {/* WHOIS Lookup Tool route */}
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

            {/* JSON Formatter Tool route */}
            <Route path="data-converter" element={
              <LazyRoute>
                <DataConverterTool />
              </LazyRoute>
            } />

            {/* Base64 Encoder/Decoder Tool route */}
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

            {/* JWT Decoder/Validator Tool route */}
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

            {/* Password Generator Tool route */}
            <Route path="password-generator" element={
              <LazyRoute>
                <PasswordGeneratorTool />
              </LazyRoute>
            } />

            {/* Microsoft Portals Tool route */}
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

            {/* Microsoft Tenant Lookup Tool route */}
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

            {/* Azure KQL Query Builder Tool route */}
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

            {/* Add more routes here as needed */}
          </Route>
        </Routes>
        </BrowserRouter>
      </AzureNamingProvider>
    </MantineProvider>
  );
}
