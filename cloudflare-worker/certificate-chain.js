/**
 * Cloudflare Worker for Certificate Chain Analysis
 * Retrieves and analyzes SSL/TLS certificate chains from domains
 * Provides detailed certificate information, chain validation, and security analysis
 */

import { connect } from 'cloudflare:sockets';

// Configuration
const getCertificateConfig = (env) => {
  console.log('getCertificateConfig called with env:', typeof env);
  
  if (!env) {
    throw new Error('Environment object is undefined');
  }
  
  return {
    timeout: parseInt(env.TIMEOUT || '30000'),
    maxRedirects: parseInt(env.MAX_REDIRECTS || '5'),
    userAgent: env.USER_AGENT || 'RussTools Certificate Analyzer/1.0',
    cacheTtl: parseInt(env.CACHE_TTL || '3600')
  };
};

// Allowed origins for CORS
const getAllowedOrigins = (env) => {
  if (!env || !env.ALLOWED_ORIGINS) {
    console.warn('ALLOWED_ORIGINS not configured, using default');
    return ['http://localhost:5173', 'http://localhost:5174', 'https://russ.tools'];
  }
  
  return env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
};

// CORS headers
const getCorsHeaders = (origin, allowedOrigins) => {
  const isAllowed = allowedOrigins.includes('*') || allowedOrigins.includes(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };
};

// Certificate chain retrieval using TLS connection
const retrieveCertificateChain = async (domain, port = 443) => {
  console.log(`Retrieving certificate chain for ${domain}:${port}`);
  
  try {
    // Use Cloudflare Workers TCP sockets API for TLS connection
    const socket = connect({ 
      hostname: domain, 
      port: port 
    }, { 
      secureTransport: "on" 
    });

    // Wait for TLS connection to be established
    const socketInfo = await socket.opened;
    console.log('TLS connection established:', socketInfo);

    // Get certificate information from the TLS socket
    const certificates = await extractRealCertificates(socket, domain, port);
    
    // Close the socket
    await socket.close();
    
    return certificates;
  } catch (error) {
    console.error(`TLS certificate retrieval failed for ${domain}:${port}:`, error);
    throw new Error(`Failed to retrieve certificates from ${domain}:${port} - ${error.message}`);
  }
};

// Extract real certificates from TLS connection
const extractRealCertificates = async (socket, domain, port) => {
  console.log(`Extracting real certificates for ${domain}:${port}`);
  
  try {
    // Get certificate information from the TLS socket
    // Note: The exact API for getting certificates from Cloudflare Workers sockets
    // may not be available yet, so this is a placeholder implementation
    
    throw new Error('Certificate extraction from Cloudflare Workers TCP sockets not yet implemented in the runtime');
    
  } catch (error) {
    console.error(`Real certificate extraction failed:`, error);
    throw new Error(`Failed to extract certificates: ${error.message}`);
  }
};

// NO SSL LABS API - Workers connect() only!

// Parse real certificate from TLS connection
const parseRealCertificate = (cert) => {
  console.log('Parsing real certificate data');
  
  try {
    // Extract certificate information from the actual certificate object from Cloudflare Workers
    return {
      subject: {
        CN: cert.subject?.CN || cert.subject?.commonName || '',
        O: cert.subject?.O || cert.subject?.organizationName || '',
        OU: cert.subject?.OU || cert.subject?.organizationalUnitName || '',
        C: cert.subject?.C || cert.subject?.countryName || '',
        ST: cert.subject?.ST || cert.subject?.stateOrProvinceName || '',
        L: cert.subject?.L || cert.subject?.localityName || '',
        emailAddress: cert.subject?.emailAddress || '',
        raw: cert.subject?.raw || JSON.stringify(cert.subject)
      },
      issuer: {
        CN: cert.issuer?.CN || cert.issuer?.commonName || '',
        O: cert.issuer?.O || cert.issuer?.organizationName || '',
        OU: cert.issuer?.OU || cert.issuer?.organizationalUnitName || '',
        C: cert.issuer?.C || cert.issuer?.countryName || '',
        ST: cert.issuer?.ST || cert.issuer?.stateOrProvinceName || '',
        L: cert.issuer?.L || cert.issuer?.localityName || '',
        emailAddress: cert.issuer?.emailAddress || '',
        raw: cert.issuer?.raw || JSON.stringify(cert.issuer)
      },
      validity: {
        notBefore: new Date(cert.validFrom || cert.valid_from || cert.notBefore),
        notAfter: new Date(cert.validTo || cert.valid_to || cert.notAfter)
      },
      keyInfo: {
        algorithm: cert.signatureAlgorithm || cert.sigAlg || 'Unknown',
        keySize: cert.publicKey?.keySize || cert.keySize || cert.bits || 2048,
        publicKey: cert.publicKey?.raw || new Uint8Array(256)
      },
      extensions: {
        subjectAltName: extractSANs(cert.subjectaltname || cert.altNames || []),
        keyUsage: cert.ext_key_usage || [],
        extendedKeyUsage: cert.ext_key_usage || [],
        basicConstraints: cert.ca ? { isCA: true, pathLenConstraint: null } : null,
        authorityKeyIdentifier: '',
        subjectKeyIdentifier: '',
        certificatePolicies: []
      },
      serialNumber: cert.serialNumber || cert.serial || '',
      version: cert.version || 3
    };
  } catch (error) {
    console.error('Real certificate parsing failed:', error);
    throw new Error(`Failed to parse real certificate: ${error.message}`);
  }
};

// Generate real fingerprints from certificate data
const generateRealFingerprints = async (cert) => {
  console.log('Generating real certificate fingerprints');
  
  try {
    // Use Web Crypto API to generate real fingerprints
    const certBuffer = cert.raw || cert.der || new ArrayBuffer(0);
    
    if (certBuffer.byteLength === 0) {
      throw new Error('No certificate data available for fingerprint generation');
    }
    
    const sha256Hash = await crypto.subtle.digest('SHA-256', certBuffer);
    const sha1Hash = await crypto.subtle.digest('SHA-1', certBuffer);
    
    return {
      sha256: Array.from(new Uint8Array(sha256Hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(':'),
      sha1: Array.from(new Uint8Array(sha1Hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(':')
    };
  } catch (error) {
    console.error('Real fingerprint generation failed:', error);
    throw new Error(`Failed to generate real fingerprints: ${error.message}`);
  }
};

// Extract subject/issuer information from certificate field
const extractSubjectInfo = (subjectField) => {
  if (typeof subjectField === 'string') {
    // Parse DN string format
    const parts = subjectField.split(',').map(p => p.trim());
    const subject = { raw: subjectField };
    
    parts.forEach(part => {
      const [key, value] = part.split('=').map(p => p.trim());
      if (key && value) {
        subject[key] = value;
      }
    });
    
    return {
      CN: subject.CN || '',
      O: subject.O || '',
      OU: subject.OU || '',
      C: subject.C || '',
      ST: subject.ST || subject.S || '',
      L: subject.L || '',
      emailAddress: subject.emailAddress || subject.E || '',
      raw: subjectField
    };
  }
  
  // Handle object format
  return {
    CN: subjectField?.commonName || subjectField?.CN || '',
    O: subjectField?.organizationName || subjectField?.O || '',
    OU: subjectField?.organizationalUnitName || subjectField?.OU || '',
    C: subjectField?.countryName || subjectField?.C || '',
    ST: subjectField?.stateOrProvinceName || subjectField?.ST || '',
    L: subjectField?.localityName || subjectField?.L || '',
    emailAddress: subjectField?.emailAddress || '',
    raw: subjectField?.raw || JSON.stringify(subjectField)
  };
};

// Extract Subject Alternative Names
const extractSANs = (sanData) => {
  if (Array.isArray(sanData)) {
    return sanData.map(san => {
      if (typeof san === 'string') {
        return { type: 'DNS', value: san };
      }
      return { type: san.type || 'DNS', value: san.value || san.name || san };
    });
  }
  return [];
};

// NO SSL LABS HELPERS - Workers connect() only!

// REMOVED - No mock certificate parsing

// Determine certificate type in chain
const determineCertificateType = (cert, allCerts, index) => {
  console.log(`Determining certificate type for certificate ${index}`);
  
  const isRoot = cert.subject.raw === cert.issuer.raw;
  const isLast = index === allCerts.length - 1;
  const isFirst = index === 0;
  
  if (isRoot) return 'root';
  if (isFirst) return 'leaf';
  if (!isFirst && !isLast) return 'intermediate';
  
  return 'intermediate';
};

// REMOVED - No mock fingerprint generation

// Analyze certificate for security issues
const analyzeCertificateIssues = (cert) => {
  console.log('Analyzing certificate for security issues');
  
  const issues = [];
  const now = new Date();
  
  // Check expiration
  const daysUntilExpiry = Math.ceil((cert.validity.notAfter - now) / (1000 * 60 * 60 * 24));
  if (daysUntilExpiry <= 0) {
    issues.push({
      severity: 'critical',
      type: 'expired',
      description: `Certificate expired ${Math.abs(daysUntilExpiry)} days ago`
    });
  } else if (daysUntilExpiry <= 30) {
    issues.push({
      severity: 'warning',
      type: 'expiring_soon',
      description: `Certificate expires in ${daysUntilExpiry} days`
    });
  }
  
  // Check key strength
  if (cert.keyInfo.keySize < 2048) {
    issues.push({
      severity: 'critical',
      type: 'weak_key',
      description: `Weak key size: ${cert.keyInfo.keySize} bits`
    });
  }
  
  // Check signature algorithm
  if (cert.keyInfo.algorithm.includes('SHA1')) {
    issues.push({
      severity: 'warning',
      type: 'weak_signature',
      description: 'Uses weak SHA-1 signature algorithm'
    });
  }
  
  if (cert.keyInfo.algorithm.includes('MD5')) {
    issues.push({
      severity: 'critical',
      type: 'insecure_signature',
      description: 'Uses insecure MD5 signature algorithm'
    });
  }
  
  return issues;
};

// NO MOCK DATA - Real certificates only!

// Validate certificate chain
const validateCertificateChain = (certificates) => {
  console.log('Validating certificate chain');
  
  const validation = {
    isValid: true,
    trustPath: certificates,
    issues: [],
    metadata: {
      chainLength: certificates.length,
      validFrom: null,
      validTo: null,
      hasRoot: false,
      hasIntermediate: false,
      hasLeaf: false
    }
  };
  
  // Update metadata
  validation.metadata.hasRoot = certificates.some(cert => cert.type === 'root');
  validation.metadata.hasIntermediate = certificates.some(cert => cert.type === 'intermediate');
  validation.metadata.hasLeaf = certificates.some(cert => cert.type === 'leaf');
  
  const leafCert = certificates.find(cert => cert.type === 'leaf');
  if (leafCert) {
    validation.metadata.validFrom = leafCert.details.validity.notBefore;
    validation.metadata.validTo = leafCert.details.validity.notAfter;
  }
  
  // Basic chain validation
  if (!validation.metadata.hasLeaf) {
    validation.issues.push({
      severity: 'error',
      type: 'missing_leaf',
      description: 'No leaf certificate found in chain'
    });
    validation.isValid = false;
  }
  
  if (!validation.metadata.hasRoot) {
    validation.issues.push({
      severity: 'warning',
      type: 'incomplete_chain',
      description: 'No root certificate found in chain'
    });
  }
  
  return validation;
};

// Main request handler
const worker = {
  async fetch(request, env) {
    console.log('Certificate Chain Worker request received:', request.method, request.url);
    
    try {
      const config = getCertificateConfig(env);
      const allowedOrigins = getAllowedOrigins(env);
      const origin = request.headers.get('origin');
      const corsHeaders = getCorsHeaders(origin, allowedOrigins);
      
      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 200,
          headers: corsHeaders
        });
      }
      
      // Handle health check
      if (request.url.endsWith('/health')) {
        return new Response(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          service: 'certificate-chain-analyzer'
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
      
      // Handle certificate analysis
      if (request.method === 'POST' && request.url.endsWith('/analyze')) {
        const requestData = await request.json();
        const { domain, port = 443 } = requestData;
        
        if (!domain) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Domain parameter is required'
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }
        
        console.log(`Analyzing certificate chain for ${domain}:${port}`);
        
        try {
          const certificates = await retrieveCertificateChain(domain, port);
          const chainValidation = validateCertificateChain(certificates);
          
          const response = {
            success: true,
            domain,
            port,
            timestamp: new Date().toISOString(),
            certificates,
            chain: chainValidation,
            metadata: {
              totalCertificates: certificates.length,
              analysisType: 'cloudflare-worker',
              source: `${domain}:${port}`,
              workerVersion: '1.0.0'
            }
          };
          
          return new Response(JSON.stringify(response), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': `public, max-age=${config.cacheTtl}`,
              ...corsHeaders
            }
          });
          
        } catch (error) {
          console.error('Certificate analysis failed:', error);
          
          return new Response(JSON.stringify({
            success: false,
            error: error.message,
            domain,
            port,
            timestamp: new Date().toISOString()
          }), {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }
      }
      
      // Invalid endpoint
      return new Response(JSON.stringify({
        success: false,
        error: 'Not found',
        availableEndpoints: ['/health', '/analyze']
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
      
    } catch (error) {
      console.error('Worker error:', error);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};

export default worker;