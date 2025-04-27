import { MantineProvider } from '@mantine/core';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { NetworkDesign } from './pages/NetworkDesign';

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
            <Route index element={<NetworkDesign />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  );
}
