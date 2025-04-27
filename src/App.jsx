import { MantineProvider, ColorSchemeProvider } from '@mantine/core';
import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { NetworkDesign } from './pages/NetworkDesign';

export default function App() {
  const [colorScheme, setColorScheme] = useState('light');
  const toggleColorScheme = (value) =>
    setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));

  return (
    <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
      <MantineProvider
        withGlobalStyles
        withNormalizeCSS
        theme={{
          colorScheme: colorScheme,
          primaryColor: 'blue',
          globalStyles: (theme) => ({
            body: {
              backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
              color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,
            },
          }),
        }}
      >
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout toggleColorScheme={toggleColorScheme} />}>
              <Route index element={<NetworkDesign />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </MantineProvider>
    </ColorSchemeProvider>
  );
}
