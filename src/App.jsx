import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import NetworkDesignerTool from './components/tools/network-designer/NetworkDesignerTool';
import { AzureNamingProvider } from './context/AzureNamingContext';
import AzureNamingTool from './components/tools/azure-naming/AzureNamingTool';
import CronBuilderTool from './components/tools/cron/CronBuilderTool';
import SSLCheckerTool from './components/tools/ssl-checker/SSLCheckerTool';
import DNSLookupTool from './components/tools/dns-lookup/DNSLookupTool';
import WHOISLookupTool from './components/tools/whois/WHOISLookupTool';
import DataConverterTool from './components/tools/data-converter/DataConverterTool';
import Base64Tool from './components/tools/base64/Base64Tool';
import HomeView from './components/layout/HomeView';
import ClearAllStorage from './components/ClearAllStorage';

/**
 * Main application component that sets up:
 * - Mantine UI provider with theme configuration
 * - React Router for navigation
 * - Global layout and routes
 */
export default function App() {
  return (
    <MantineProvider
      withGlobalStyles
      withNormalizeCSS
      theme={{
        primaryColor: 'blue',
        globalStyles: (theme) => ({
          body: {
            backgroundColor: theme.colors.gray[9],
            color: theme.black,
          },
        }),
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

              {/* Add more routes here as needed */}
            </Route>
          </Routes>
        </BrowserRouter>
      </AzureNamingProvider>
    </MantineProvider>
  );
}
