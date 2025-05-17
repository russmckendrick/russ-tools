import { MantineProvider } from '@mantine/core';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { NetworkDesign } from './pages/NetworkDesign';
import { AzureNamingProvider } from './context/AzureNamingContext';
import AzureNamingTool from './components/tools/azure-naming/AzureNamingTool';
import HomeView from './components/layout/HomeView';

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
      <AzureNamingProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              {/* Default route - now points to HomeView */}
              <Route index element={<HomeView />} />
              
              {/* Network Designer route */}
              <Route path="network-designer" element={<NetworkDesign />} />
              
              {/* Azure Naming Tool route */}
              <Route path="azure-naming" element={<AzureNamingTool />} />
              
              {/* Add more routes here as needed */}
            </Route>
          </Routes>
        </BrowserRouter>
      </AzureNamingProvider>
    </MantineProvider>
  );
}
