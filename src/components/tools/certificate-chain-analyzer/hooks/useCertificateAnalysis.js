import { useState, useCallback, useEffect } from 'react';
import { 
  parsePEMCertificate, 
  extractCertificatesFromPEM, 
  detectCertificateFormat 
} from '../utils/certificateParser';
import { 
  validateCertificateChain, 
  buildCertificateChain 
} from '../utils/chainValidator';
// API Configuration
const apiConfig = {
  endpoints: {
    certificate: {
      url: 'https://certificate-chain-russ-tools-dev.russ-mckendricks-account.workers.dev/',
      timeout: 30000,
      retries: 2
    }
  }
};

export const useCertificateAnalysis = () => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setError(null);
  }, []);

  const analyzeUrl = useCallback(async (domain, port = 443) => {
    setLoading(true);
    setError(null);
    
    try {
      const certificates = await retrieveCertificatesFromDomain(domain, port);
      
      if (!certificates || certificates.length === 0) {
        throw new Error('No certificates found for the specified domain');
      }

      const typedCertificates = buildCertificateChain(certificates);
      const chainValidation = validateCertificateChain(typedCertificates);
      
      const analysisResult = {
        domain,
        port,
        timestamp: new Date().toISOString(),
        certificates: typedCertificates,
        chain: chainValidation,
        metadata: {
          totalCertificates: typedCertificates.length,
          analysisType: 'domain',
          source: `${domain}:${port}`
        }
      };

      setAnalysis(analysisResult);
      
      saveToHistory(domain, 'success');
      
    } catch (err) {
      const errorMessage = err.message || 'Failed to analyze certificate chain';
      setError(errorMessage);
      saveToHistory(domain, 'error');
      console.error('Certificate analysis failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzeFile = useCallback(async (files) => {
    setLoading(true);
    setError(null);

    try {
      if (!files || files.length === 0) {
        throw new Error('No files provided for analysis');
      }

      const allCertificates = [];
      
      for (const file of files) {
        const certificates = await processCertificateFile(file);
        allCertificates.push(...certificates);
      }

      if (allCertificates.length === 0) {
        throw new Error('No valid certificates found in the uploaded files');
      }

      const typedCertificates = buildCertificateChain(allCertificates);
      const chainValidation = validateCertificateChain(typedCertificates);
      
      const analysisResult = {
        files: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
        timestamp: new Date().toISOString(),
        certificates: typedCertificates,
        chain: chainValidation,
        metadata: {
          totalCertificates: typedCertificates.length,
          analysisType: 'file',
          source: files.length === 1 ? files[0].name : `${files.length} files`
        }
      };

      setAnalysis(analysisResult);
      
    } catch (err) {
      const errorMessage = err.message || 'Failed to analyze certificate files';
      setError(errorMessage);
      console.error('File analysis failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveToHistory = useCallback((domain, status) => {
    try {
      const history = JSON.parse(localStorage.getItem('cert-analyzer-history') || '[]');
      const newEntry = {
        domain,
        status,
        timestamp: Date.now()
      };
      
      const filteredHistory = history.filter(entry => entry.domain !== domain);
      const updatedHistory = [newEntry, ...filteredHistory].slice(0, 10);
      
      localStorage.setItem('cert-analyzer-history', JSON.stringify(updatedHistory));
    } catch (err) {
      console.warn('Failed to save to history:', err);
    }
  }, []);

  return {
    analysis,
    loading,
    error,
    analyzeUrl,
    analyzeFile,
    clearAnalysis,
    clearError
  };
};

const retrieveCertificatesFromDomain = async (domain, port) => {
  try {
    console.log(`Analyzing certificate chain for ${domain}:${port} using Cloudflare Worker`);
    
    // Try to use the real Cloudflare Worker API first
    const certificateApiUrl = apiConfig.endpoints.certificate.url;
    const timeout = apiConfig.endpoints.certificate.timeout || 30000;
    
    const response = await fetch(`${certificateApiUrl}analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        domain,
        port: parseInt(port)
      }),
      signal: AbortSignal.timeout(timeout)
    });
    
    if (!response.ok) {
      throw new Error(`Certificate API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Certificate analysis failed');
    }
    
    console.log(`Successfully retrieved certificate data from Cloudflare Worker for ${domain}:${port}`);
    return data.certificates;
    
  } catch (error) {
    console.error(`Certificate API failed for ${domain}:${port}:`, error.message);
    throw new Error(`Failed to retrieve certificates: ${error.message}`);
  }
};

// NO MOCK DATA - Real certificates only!

const processCertificateFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = e.target.result;
        const format = detectCertificateFormat(data);
        
        let certificates = [];
        
        switch (format) {
          case 'PEM':
            certificates = await processPEMData(data);
            break;
          case 'DER':
            certificates = await processDERData(new Uint8Array(data));
            break;
          case 'PKCS7_PEM':
          case 'PKCS7_DER':
            certificates = await processPKCS7Data(data);
            break;
          default:
            throw new Error(`Unsupported certificate format: ${format}`);
        }
        
        resolve(certificates);
      } catch (error) {
        reject(new Error(`Failed to process ${file.name}: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error(`Failed to read ${file.name}`));
    };
    
    if (file.name.toLowerCase().includes('.der') || 
        file.name.toLowerCase().includes('.p7b') ||
        file.name.toLowerCase().includes('.pfx') ||
        file.name.toLowerCase().includes('.p12')) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  });
};

const processPEMData = async (pemData) => {
  try {
    const certPEMs = extractCertificatesFromPEM(pemData);
    const certificates = [];
    
    for (let i = 0; i < certPEMs.length; i++) {
      try {
        const cert = parsePEMCertificate(certPEMs[i]);
        cert.id = `cert-${i}`;
        certificates.push(cert);
      } catch (error) {
        console.warn(`Failed to parse certificate ${i + 1}:`, error);
      }
    }
    
    return certificates;
  } catch (error) {
    throw new Error(`Failed to process PEM data: ${error.message}`);
  }
};

const processDERData = async (derData) => {
  try {
    const { parseX509Certificate } = await import('../utils/certificateParser');
    const cert = parseX509Certificate(derData);
    cert.id = 'cert-0';
    return [cert];
  } catch (error) {
    throw new Error(`Failed to process DER data: ${error.message}`);
  }
};

const processPKCS7Data = async (data) => {
  throw new Error('PKCS#7 format support not yet implemented');
};