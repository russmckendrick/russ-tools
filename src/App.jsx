import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Layout } from './components/layout/Layout';
import { AzureNamingProvider } from './components/tools/azure-naming/context/AzureNamingContext';
import HomeView from './components/layout/HomeView';
import ClearAllStorage from './components/common/ClearAllStorage';

// Lazy load tool components for code splitting
const NetworkDesignerTool = lazy(() => import('./components/tools/network-designer/NetworkDesignerTool'));
const AzureNamingTool = lazy(() => import('./components/tools/azure-naming/AzureNamingTool'));
const CronBuilderTool = lazy(() => import('./components/tools/cron/CronBuilderTool'));
const SSLCheckerTool = lazy(() => import('./components/tools/ssl-checker/SSLCheckerTool'));
const DNSLookupTool = lazy(() => import('./components/tools/dns-lookup/DNSLookupTool'));
const WHOISLookupTool = lazy(() => import('./components/tools/whois/WHOISLookupTool'));
const DataConverterTool = lazy(() => import('./components/tools/data-converter/DataConverterTool'));
const Base64Tool = lazy(() => import('./components/tools/base64/Base64Tool'));
const JWTTool = lazy(() => import('./components/tools/jwt/JWTTool'));
const PasswordGeneratorTool = lazy(() => import('./components/tools/password-generator/PasswordGeneratorTool'));
const MicrosoftPortalsTool = lazy(() => import('./components/tools/microsoft-portals/MicrosoftPortalsTool'));
const TenantLookupTool = lazy(() => import('./components/tools/tenant-lookup/TenantLookupTool'));
const AzureKQLTool = lazy(() => import('./components/tools/azure-kql/AzureKQLTool'));

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
              <Suspense fallback={<LoadingFallback />}>
                <NetworkDesignerTool />
              </Suspense>
            } />
            
            {/* Azure Naming Tool route */}
            <Route path="azure-naming" element={
              <Suspense fallback={<LoadingFallback />}>
                <AzureNamingTool />
              </Suspense>
            } />
            
            {/* Hidden route for clearing all local storage */}
            <Route path="delete" element={<ClearAllStorage />} />

            {/* Cron Builder Tool route */}
            <Route path="cron" element={
              <Suspense fallback={<LoadingFallback />}>
                <CronBuilderTool />
              </Suspense>
            } />

            {/* SSL Checker Tool route */}
            <Route path="ssl-checker" element={
              <Suspense fallback={<LoadingFallback />}>
                <SSLCheckerTool />
              </Suspense>
            } />
            <Route path="ssl-checker/:domain" element={
              <Suspense fallback={<LoadingFallback />}>
                <SSLCheckerTool />
              </Suspense>
            } />

            {/* DNS Lookup Tool route */}
            <Route path="dns-lookup" element={
              <Suspense fallback={<LoadingFallback />}>
                <DNSLookupTool />
              </Suspense>
            } />

            {/* WHOIS Lookup Tool route */}
            <Route path="whois-lookup" element={
              <Suspense fallback={<LoadingFallback />}>
                <WHOISLookupTool />
              </Suspense>
            } />
            <Route path="whois-lookup/:query" element={
              <Suspense fallback={<LoadingFallback />}>
                <WHOISLookupTool />
              </Suspense>
            } />

            {/* JSON Formatter Tool route */}
            <Route path="data-converter" element={
              <Suspense fallback={<LoadingFallback />}>
                <DataConverterTool />
              </Suspense>
            } />

            {/* Base64 Encoder/Decoder Tool route */}
            <Route path="base64" element={
              <Suspense fallback={<LoadingFallback />}>
                <Base64Tool />
              </Suspense>
            } />
            <Route path="base64/:input" element={
              <Suspense fallback={<LoadingFallback />}>
                <Base64Tool />
              </Suspense>
            } />

            {/* JWT Decoder/Validator Tool route */}
            <Route path="jwt" element={
              <Suspense fallback={<LoadingFallback />}>
                <JWTTool />
              </Suspense>
            } />
            <Route path="jwt/:token" element={
              <Suspense fallback={<LoadingFallback />}>
                <JWTTool />
              </Suspense>
            } />

            {/* Password Generator Tool route */}
            <Route path="password-generator" element={
              <Suspense fallback={<LoadingFallback />}>
                <PasswordGeneratorTool />
              </Suspense>
            } />

            {/* Microsoft Portals Tool route */}
            <Route path="microsoft-portals" element={
              <Suspense fallback={<LoadingFallback />}>
                <MicrosoftPortalsTool />
              </Suspense>
            } />
            <Route path="microsoft-portals/:domain" element={
              <Suspense fallback={<LoadingFallback />}>
                <MicrosoftPortalsTool />
              </Suspense>
            } />

            {/* Microsoft Tenant Lookup Tool route */}
            <Route path="tenant-lookup" element={
              <Suspense fallback={<LoadingFallback />}>
                <TenantLookupTool />
              </Suspense>
            } />
            <Route path="tenant-lookup/:domain" element={
              <Suspense fallback={<LoadingFallback />}>
                <TenantLookupTool />
              </Suspense>
            } />

            {/* Azure KQL Query Builder Tool route */}
            <Route path="azure-kql" element={
              <Suspense fallback={<LoadingFallback />}>
                <AzureKQLTool />
              </Suspense>
            } />
            <Route path="azure-kql/:service" element={
              <Suspense fallback={<LoadingFallback />}>
                <AzureKQLTool />
              </Suspense>
            } />
            <Route path="azure-kql/:service/:template" element={
              <Suspense fallback={<LoadingFallback />}>
                <AzureKQLTool />
              </Suspense>
            } />

            {/* Add more routes here as needed */}
          </Route>
        </Routes>
        </BrowserRouter>
      </AzureNamingProvider>
    </MantineProvider>
  );
}
