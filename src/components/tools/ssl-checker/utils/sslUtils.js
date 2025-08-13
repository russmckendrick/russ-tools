// SSL Checker Utility Functions

// Format date for display
export const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown';
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Get SSL grade information
export const getGradeInfo = (grade) => {
  const grades = {
    'A+': { color: 'bg-green-500', description: 'Exceptional - Best possible SSL configuration' },
    'A': { color: 'bg-green-500', description: 'Excellent - Strong SSL configuration' },
    'A-': { color: 'bg-green-400', description: 'Very Good - Minor issues present' },
    'B': { color: 'bg-blue-500', description: 'Good - Some weaknesses present' },
    'C': { color: 'bg-yellow-500', description: 'Fair - Significant weaknesses' },
    'D': { color: 'bg-orange-500', description: 'Poor - Serious security issues' },
    'E': { color: 'bg-red-500', description: 'Failed - Critical security failures' },
    'F': { color: 'bg-red-600', description: 'Failed - Severe security vulnerabilities' },
    'T': { color: 'bg-gray-500', description: 'Certificate not trusted' },
    'M': { color: 'bg-purple-500', description: 'Certificate name mismatch' }
  };
  
  return grades[grade] || { color: 'bg-gray-400', description: 'Unknown grade' };
};

// Domain validation
export const validateDomain = (domain) => {
  if (!domain || !domain.trim()) {
    return 'Domain name is required';
  }
  
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
  if (!domainRegex.test(domain.trim())) {
    return 'Please enter a valid domain name (e.g., example.com)';
  }
  
  return null;
};

// Clean domain input
export const cleanDomain = (domain) => {
  if (!domain) return '';
  return domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
};

// Check if SSL data is complete
export const isSSLDataComplete = (sslData) => {
  if (!sslData) return false;
  
  // Browser-based checks are always complete
  if (sslData.browserCheck) return true;
  
  // For API checks, ensure we have complete data
  if (sslData.status === 'READY') return true;
  
  // Check if all endpoints are complete
  const allEndpointsComplete = sslData.endpoints?.every(endpoint => endpoint.isComplete === true);
  return sslData.endpoints?.length > 0 && allEndpointsComplete;
};

// Cache duration (5 minutes)
export const CACHE_DURATION = 5 * 60 * 1000;

// Check if cached data is still valid
export const isCacheValid = (cachedData) => {
  if (!cachedData || !cachedData.timestamp) return false;
  return (Date.now() - cachedData.timestamp) < CACHE_DURATION;
};