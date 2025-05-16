import { MantineProvider } from '@mantine/core';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { NetworkDesign } from './pages/NetworkDesign';
import AzureNamingTool from './components/tools/azure-naming/AzureNamingTool';

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
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Default route - currently points to NetworkDesign */}
            <Route index element={<NetworkDesign />} />
            
            {/* Network Designer route */}
            <Route path="network-designer" element={<NetworkDesign />} />
            
            {/* Azure Naming Tool route */}
            <Route path="azure-naming" element={<AzureNamingTool />} />
            
            {/* Add more routes here as needed */}
          </Route>
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  );
}
