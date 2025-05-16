import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function PageTitle() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let title = 'russ.tools';

    if (path === '/network-designer') {
      title = 'Network Designer - russ.tools';
    } else if (path === '/azure-naming') {
      title = 'Azure Resource Naming Tool - russ.tools';
    }

    document.title = title;
  }, [location]);

  return null;
} 