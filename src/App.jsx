import { MantineProvider } from '@mantine/core';
import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { NetworkDesign } from './pages/NetworkDesign';

export default function App() {
  const [colorScheme, setColorScheme] = useState('light');
  const toggleColorScheme = (value) =>
    setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));

  return (
    <MantineProvider
      withGlobalStyles
      withNormalizeCSS
      theme={{
        colorScheme: colorScheme,
        primaryColor: 'blue',
        globalStyles: (theme) => ({
          body: {
            backgroundColor: theme.colors.gray[0],
          },
        }),
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout colorScheme={colorScheme} toggleColorScheme={toggleColorScheme} />}>
            <Route index element={<NetworkDesign />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  );
}
