import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function PageTitle() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    // Normalize path by removing trailing slashes and converting to lowercase
    const normalizedPath = path.replace(/\/+$/, '').toLowerCase() || '/';
    let title = 'russ.tools';

    if (normalizedPath === '/network-designer') {
      title = 'Network Designer - russ.tools';
    } else if (normalizedPath === '/azure-naming') {
      title = 'Azure Resource Naming Tool - russ.tools';
    } else if (normalizedPath === '/ssl-checker') {
      title = 'SSL Certificate Checker - russ.tools';
    } else if (normalizedPath === '/dns-lookup') {
      title = 'DNS Lookup Tool - russ.tools';
    } else if (normalizedPath === '/whois-lookup') {
      title = 'WHOIS Lookup Tool - russ.tools';
    } else if (normalizedPath === '/data-converter') {
              title = 'Data Converter - russ.tools';
    } else if (normalizedPath === '/cron') {
      title = 'Cron Builder Tool - russ.tools';
    }

    document.title = title;
  }, [location]);

  return null;
} 