import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { performSSLCheck } from '../utils/sslApi';
import { validateDomain, cleanDomain, isSSLDataComplete, isCacheValid, CACHE_DURATION } from '../utils/sslUtils';

export const useSSLChecker = () => {
  // State management
  const [domain, setDomain] = useState('');
  const [certificateData, setCertificateData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState('');
  
  // Domain history and caching
  const [domainHistory, setDomainHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('ssl-checker-history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [sslCache, setSslCache] = useState(() => {
    try {
      const saved = localStorage.getItem('ssl-checker-cache');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Persist history to localStorage
  useEffect(() => {
    localStorage.setItem('ssl-checker-history', JSON.stringify(domainHistory));
  }, [domainHistory]);

  // Persist cache to localStorage
  useEffect(() => {
    localStorage.setItem('ssl-checker-cache', JSON.stringify(sslCache));
  }, [sslCache]);

  // Helper function to add domain to history
  const addToHistory = (domainName, sslData) => {
    if (!domainName || !sslData) return;
    
    const historyItem = {
      domain: domainName,
      grade: sslData.endpoints?.[0]?.grade || 'Unknown',
      timestamp: Date.now(),
      hasWarnings: sslData.endpoints?.[0]?.hasWarnings || false
    };
    
    // Remove existing entry for this domain
    const filteredHistory = domainHistory.filter(item => item.domain !== domainName);
    
    // Add new entry at the beginning and limit to 50 items
    const newHistory = [historyItem, ...filteredHistory].slice(0, 50);
    setDomainHistory(newHistory);
  };

  // Helper function to check if SSL data is complete and ready for caching
  const cacheSSLData = (domainName, sslData) => {
    // Only cache complete data
    if (!isSSLDataComplete(sslData)) {
      console.log(`🚫 Not caching incomplete SSL data for ${domainName}`);
      return;
    }
    
    const cacheItem = {
      ...sslData,
      timestamp: Date.now()
    };
    setSslCache(prev => ({
      ...prev,
      [domainName]: cacheItem
    }));
    console.log(`💾 Cached complete SSL data for ${domainName}`);
  };

  // Helper function to remove domain from history
  const removeDomainFromHistory = (domainToRemove) => {
    const updatedHistory = domainHistory.filter(item => item.domain !== domainToRemove);
    setDomainHistory(updatedHistory);
  };

  // Clear all history
  const clearHistory = () => {
    setDomainHistory([]);
    setSslCache({});
    toast.success('History cleared');
  };

  // Main SSL check function
  const handleDomainSubmit = async (domainToCheck) => {
    if (!domainToCheck) domainToCheck = domain;
    if (!domainToCheck) return;

    const cleanedDomain = cleanDomain(domainToCheck);
    const validation = validateDomain(cleanedDomain);
    
    if (validation) {
      setValidationError(validation);
      return;
    }

    setValidationError('');
    
    // Check cache first
    const cachedData = sslCache[cleanedDomain];
    if (cachedData && isCacheValid(cachedData)) {
      console.log(`💾 Using cached data for ${cleanedDomain}`);
      setCertificateData(cachedData);
      setDomain(cleanedDomain);
      toast.success('Loaded from cache', {
        description: `SSL data for ${cleanedDomain} loaded from cache`,
      });
      return;
    }

    setLoading(true);
    setError(null);
    setCertificateData(null);
    setDomain(cleanedDomain);

    try {
      const result = await performSSLCheck(cleanedDomain);
      setCertificateData(result);
      
      if (result) {
        cacheSSLData(cleanedDomain, result);
        addToHistory(cleanedDomain, result);
        toast.success('SSL Check Complete', {
          description: `SSL certificate analysis completed for ${cleanedDomain}`,
        });
      }
      
    } catch (err) {
      console.error('💥 Overall SSL Check Error:', err);
      setError(err.message || 'Failed to check SSL certificate');
      
      toast.error('SSL Check Failed', {
        description: err.message || 'Failed to analyze SSL certificate',
      });
    } finally {
      setLoading(false);
    }
  };

  // Recheck function for history items
  const handleRecheck = async (domainName) => {
    await handleDomainSubmit(domainName);
  };

  return {
    // State
    domain,
    setDomain,
    certificateData,
    loading,
    error,
    validationError,
    domainHistory,
    
    // Actions
    handleDomainSubmit,
    handleRecheck,
    removeDomainFromHistory,
    clearHistory,
    
    // Computed values
    hasHistory: domainHistory.length > 0
  };
};