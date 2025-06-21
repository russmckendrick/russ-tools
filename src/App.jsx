import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import NetworkDesignerTool from './components/tools/network-designer/NetworkDesignerTool';
import { AzureNamingProvider } from './components/tools/azure-naming/context/AzureNamingContext';
import AzureNamingTool from './components/tools/azure-naming/AzureNamingTool';
import CronBuilderTool from './components/tools/cron/CronBuilderTool';
import SSLCheckerTool from './components/tools/ssl-checker/SSLCheckerTool';
import DNSLookupTool from './components/tools/dns-lookup/DNSLookupTool';
import WHOISLookupTool from './components/tools/whois/WHOISLookupTool';
import DataConverterTool from './components/tools/data-converter/DataConverterTool';
import Base64Tool from './components/tools/base64/Base64Tool';
import JWTTool from './components/tools/jwt/JWTTool';
import PasswordGeneratorTool from './components/tools/password-generator/PasswordGeneratorTool';
import MicrosoftPortalsTool from './components/tools/microsoft-portals/MicrosoftPortalsTool';
import TenantLookupTool from './components/tools/tenant-lookup/TenantLookupTool';
import AzureKQLTool from './components/tools/azure-kql/AzureKQLTool';
import HomeView from './components/layout/HomeView';
import ClearAllStorage from './components/common/ClearAllStorage';

/**
 * Main application component that sets up:
 * - Mantine UI provider with theme configuration
 * - React Router for navigation
 * - Global layout and routes
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
            <Route path="network-designer" element={<NetworkDesignerTool />} />
            
            {/* Azure Naming Tool route */}
            <Route path="azure-naming" element={<AzureNamingTool />} />
            
            {/* Hidden route for clearing all local storage */}
            <Route path="delete" element={<ClearAllStorage />} />

            {/* Cron Builder Tool route */}
            <Route path="cron" element={<CronBuilderTool />} />

            {/* SSL Checker Tool route */}
            <Route path="ssl-checker" element={<SSLCheckerTool />} />
            <Route path="ssl-checker/:domain" element={<SSLCheckerTool />} />

            {/* DNS Lookup Tool route */}
            <Route path="dns-lookup" element={<DNSLookupTool />} />

            {/* WHOIS Lookup Tool route */}
            <Route path="whois-lookup" element={<WHOISLookupTool />} />
            <Route path="whois-lookup/:query" element={<WHOISLookupTool />} />

            {/* JSON Formatter Tool route */}
                            <Route path="data-converter" element={<DataConverterTool />} />

            {/* Base64 Encoder/Decoder Tool route */}
            <Route path="base64" element={<Base64Tool />} />
            <Route path="base64/:input" element={<Base64Tool />} />

            {/* JWT Decoder/Validator Tool route */}
            <Route path="jwt" element={<JWTTool />} />
            <Route path="jwt/:token" element={<JWTTool />} />

            {/* Password Generator Tool route */}
            <Route path="password-generator" element={<PasswordGeneratorTool />} />

            {/* Microsoft Portals Tool route */}
            <Route path="microsoft-portals" element={<MicrosoftPortalsTool />} />
            <Route path="microsoft-portals/:domain" element={<MicrosoftPortalsTool />} />

            {/* Microsoft Tenant Lookup Tool route */}
            <Route path="tenant-lookup" element={<TenantLookupTool />} />
            <Route path="tenant-lookup/:domain" element={<TenantLookupTool />} />

            {/* Azure KQL Query Builder Tool route */}
            <Route path="azure-kql" element={<AzureKQLTool />} />
            <Route path="azure-kql/:service" element={<AzureKQLTool />} />
            <Route path="azure-kql/:service/:template" element={<AzureKQLTool />} />

            {/* Add more routes here as needed */}
          </Route>
        </Routes>
        </BrowserRouter>
      </AzureNamingProvider>
    </MantineProvider>
  );
}
