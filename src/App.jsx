import { MantineProvider } from '@mantine/core';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { NetworkDesign } from './pages/NetworkDesign';

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
            
            {/* Add more routes here as needed */}
          </Route>
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  );
}
