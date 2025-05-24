import React, { useState } from 'react';
import { 
  Paper, 
  Stack, 
  Title, 
  ThemeIcon, 
  Group,
  Text,
  Tabs,
  Alert,
  Badge
} from '@mantine/core';
import { IconShield, IconShieldCheck, IconWorldWww, IconInfoCircle, IconCertificate } from '@tabler/icons-react';
import DomainInput from './DomainInput';
import SSLCertificateDisplay from './SSLCertificateDisplay';
import SSLValidationInfo from './SSLValidationInfo';
import SSLInfoPanel from './SSLInfoPanel';

const SSLCheckerTool = () => {
  const [domain, setDomain] = useState('');
  const [certificateData, setCertificateData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDomainSubmit = async (domainToCheck) => {
    setLoading(true);
    setError(null);
    setCertificateData(null);
    
    try {
      // Clean the domain (remove protocol, paths, etc.)
      const cleanDomain = domainToCheck
        .replace(/^https?:\/\//, '')
        .replace(/\/.*$/, '')
        .trim()
        .toLowerCase();
      
      setDomain(cleanDomain);
      
      console.log(`🔍 Starting SSL check for: ${cleanDomain}`);
      
      // Try multiple approaches for SSL checking
      let result = null;
      
      // First try: Use SSL Labs and other APIs
      try {
        console.log('🌟 Attempting API-based SSL check...');
        result = await checkWithSSLAPI(cleanDomain);
        console.log('✅ API check succeeded:', result);
        
        // If SSL Labs returned polling info, handle the polling
        if (result.pollInfo && result.pollInfo.shouldPoll) {
          console.log(`⏳ SSL Labs assessment in progress, will poll in ${result.pollInfo.recommendedInterval} seconds`);
          setCertificateData(result); // Show partial results immediately
          
          // Start polling for completion
          await pollForCompletion(cleanDomain, result.pollInfo.recommendedInterval);
          return;
        }
        
      } catch (apiError) {
        console.error('❌ API check failed:', apiError.message);
        console.log('🔄 Falling back to browser-based check...');
        
        // Fallback: Browser-based SSL connectivity check
        result = await performBrowserSSLCheck(cleanDomain);
        console.log('✅ Browser check completed:', result);
      }
      
      setCertificateData(result);
      
    } catch (err) {
      console.error('💥 Overall SSL Check Error:', err);
      setError(err.message || 'Failed to check SSL certificate');
    } finally {
      setLoading(false);
    }
  };

  // Try using a public SSL checking service (when available)
  const checkWithSSLAPI = async (domainToCheck) => {
    // Primary: Use Cloudflare Worker (when deployed)
    const WORKER_URL = 'https://ssl-checker.russ-mckendricks-account.workers.dev'; // Update this with your actual worker URL
    
    try {
      console.log(`🚀 Trying Cloudflare Worker for ${domainToCheck}`);
      
      const response = await fetch(`${WORKER_URL}?domain=${encodeURIComponent(domainToCheck)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Worker request failed: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`✅ Cloudflare Worker succeeded for ${domainToCheck}:`, result);
      return result;
      
    } catch (workerError) {
      console.log(`❌ Cloudflare Worker failed: ${workerError.message}`);
      console.log(`🔄 Falling back to direct API calls...`);
      
      // Fallback to direct client-side APIs
      return await checkWithDirectAPIs(domainToCheck);
    }
  };

  // Fallback: Direct client-side API calls
  const checkWithDirectAPIs = async (domainToCheck) => {
    // Client-side SSL checking services (as fallback)
    const clientSideAPIs = [
      {
        name: 'HackerTarget SSL Check',
        url: `https://api.hackertarget.com/sslcheck/?q=${domainToCheck}`,
        transform: (data) => {
          const lines = data.split('\n').filter(line => line.trim());
          const certInfo = {};
          
          lines.forEach(line => {
            if (line.includes('Subject:')) certInfo.subject = line.split('Subject:')[1]?.trim();
            if (line.includes('Issuer:')) certInfo.issuer = line.split('Issuer:')[1]?.trim();
            if (line.includes('Valid from:')) certInfo.validFrom = line.split('Valid from:')[1]?.trim();
            if (line.includes('Valid until:')) certInfo.validUntil = line.split('Valid until:')[1]?.trim();
            if (line.includes('Serial:')) certInfo.serial = line.split('Serial:')[1]?.trim();
          });

          const hasValidCert = !data.toLowerCase().includes('error') && !data.toLowerCase().includes('failed');
          const now = new Date();
          const expiryDate = certInfo.validUntil ? new Date(certInfo.validUntil) : null;
          const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24)) : null;
          
          // Determine grade based on certificate status
          let grade = 'T';
          if (hasValidCert) {
            if (daysUntilExpiry > 90) grade = 'A+';
            else if (daysUntilExpiry > 30) grade = 'A';
            else if (daysUntilExpiry > 7) grade = 'B';
            else if (daysUntilExpiry > 0) grade = 'C';
            else grade = 'F';
          } else {
            grade = 'F';
          }
          
          return {
            host: domainToCheck,
            status: 'READY',
            endpoints: [{
              statusMessage: hasValidCert ? 
                `Certificate valid - expires in ${daysUntilExpiry} days` : 
                'Certificate validation failed',
              grade: grade,
              hasWarnings: daysUntilExpiry < 30,
              isExceptional: hasValidCert && daysUntilExpiry > 90,
              progress: 100,
              eta: 0,
              delegation: 1,
              details: {
                cert: hasValidCert && certInfo.subject ? {
                  subject: certInfo.subject,
                  issuerSubject: certInfo.issuer,
                  notBefore: certInfo.validFrom ? new Date(certInfo.validFrom).getTime() : null,
                  notAfter: certInfo.validUntil ? new Date(certInfo.validUntil).getTime() : null,
                  sigAlg: 'Unknown',
                  serialNumber: certInfo.serial
                } : null
              }
            }],
            apiCheck: true,
            apiSource: 'HackerTarget SSL Check (Direct)',
            timestamp: Date.now()
          };
        }
      }
    ];

    let lastError = null;
    
    // Try each client-side API
    for (const api of clientSideAPIs) {
      try {
        console.log(`🌐 Trying ${api.name} for ${domainToCheck}`);
        
        const response = await fetch(api.url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json, text/plain',
            'User-Agent': 'RussTools-SSL-Checker/1.0'
          }
        });
        
        if (!response.ok) {
          throw new Error(`${api.name} request failed: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }
        
        if (typeof data === 'string' && data.toLowerCase().includes('rate limit')) {
          throw new Error(`${api.name} rate limited`);
        }
        
        const result = api.transform(data);
        console.log(`✅ ${api.name} succeeded for ${domainToCheck}:`, result);
        return result;
        
      } catch (error) {
        console.log(`❌ ${api.name} failed:`, error.message);
        lastError = error;
        continue;
      }
    }
    
    // If all APIs failed, throw the last error
    throw lastError || new Error('All SSL checking services failed');
  };

  // Browser-based SSL check using fetch API
  const performBrowserSSLCheck = async (domainToCheck) => {
    try {
      // Try to fetch the domain to see if SSL works
      const testUrl = `https://${domainToCheck}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(testUrl, { 
        mode: 'no-cors',
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // If we get here without errors, SSL is working
      const now = Date.now();
      
      return {
        host: domainToCheck,
        status: 'READY',
        endpoints: [{
          statusMessage: 'SSL connection successful',
          grade: 'T', // T for "Trust" - basic validation
          hasWarnings: false,
          isExceptional: false,
          progress: 100,
          eta: 0,
          delegation: 1,
          details: {
            cert: null // Browser security prevents accessing cert details
          }
        }],
        basicCheck: true,
        timestamp: now
      };
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Connection timeout - domain may be unreachable');
      }
      
      // Try to determine if it's an SSL issue or connectivity issue
      try {
        // Try HTTP to see if the domain exists
        const httpUrl = `http://${domainToCheck}`;
        const httpController = new AbortController();
        const httpTimeoutId = setTimeout(() => httpController.abort(), 5000);
        
        await fetch(httpUrl, { 
          mode: 'no-cors',
          method: 'HEAD',
          signal: httpController.signal
        });
        
        clearTimeout(httpTimeoutId);
        
        // If HTTP works but HTTPS doesn't, it's likely an SSL issue
        throw new Error('HTTPS connection failed - SSL certificate may be invalid or missing');
      } catch (httpErr) {
        // Both HTTP and HTTPS failed
        throw new Error('Domain appears to be unreachable or does not exist');
      }
    }
  };

  // New function to handle SSL Labs polling
  const pollForCompletion = async (domain, initialInterval) => {
    let pollCount = 0;
    const maxPolls = 20; // Max 20 polls to prevent infinite polling
    let currentInterval = initialInterval;

    while (pollCount < maxPolls) {
      await new Promise(resolve => setTimeout(resolve, currentInterval * 1000));
      pollCount++;

      try {
        console.log(`🔄 Polling SSL Labs (attempt ${pollCount}/${maxPolls}) for ${domain}...`);
        
        const result = await checkWithSSLAPI(domain);
        
        // Update the display with current results
        setCertificateData(result);
        
        // Check if polling should continue
        if (!result.pollInfo || !result.pollInfo.shouldPoll) {
          console.log('✅ SSL Labs assessment completed!');
          setLoading(false);
          break;
        }
        
        // Update polling interval based on SSL Labs recommendation
        currentInterval = result.pollInfo.recommendedInterval;
        console.log(`⏳ Assessment still in progress, next poll in ${currentInterval} seconds`);
        
        // Update progress in UI
        if (result.assessmentProgress) {
          console.log(`📊 Progress: ${result.assessmentProgress.completionPercentage}% (${result.assessmentProgress.readyEndpoints}/${result.assessmentProgress.totalEndpoints} endpoints)`);
        }
        
      } catch (pollError) {
        console.error(`❌ Polling error: ${pollError.message}`);
        setLoading(false);
        break;
      }
    }
    
    if (pollCount >= maxPolls) {
      console.log('⚠️ Reached maximum polling attempts, assessment may still be in progress');
      setLoading(false);
    }
  };

  return (
    <Paper
      shadow="md"
      radius="md"
      p="xl"
      withBorder
      style={{
        maxWidth: 1000,
        width: '100%',
        margin: '20px auto',
      }}
    >
      <Stack gap="xl">
        {/* Header */}
        <Group justify="center" gap="md">
          <ThemeIcon size={42} radius="md" color="green" variant="gradient" gradient={{ from: 'green', to: 'teal', deg: 90 }}>
            <IconShield size={24} />
          </ThemeIcon>
          <div>
            <Title order={2} style={{ fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>
              SSL Certificate Checker
            </Title>
            <Text size="sm" c="dimmed" mt={2}>
              Analyze and validate SSL certificates for any domain
            </Text>
          </div>
        </Group>

        <Tabs defaultValue="checker" variant="pills" orientation="horizontal">
          <Tabs.List grow>
            <Tabs.Tab value="checker" leftSection={<IconShieldCheck size={16} />}>
              Certificate Checker
            </Tabs.Tab>
            <Tabs.Tab value="info" leftSection={<IconWorldWww size={16} />}>
              About SSL
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="checker" pt="lg">
            <Stack gap="lg">
              {/* Domain Input */}
              <DomainInput 
                onSubmit={handleDomainSubmit}
                loading={loading}
                error={error}
              />

              {/* Certificate Display */}
              {(certificateData || error) && (
                <SSLCertificateDisplay 
                  data={certificateData}
                  domain={domain}
                  error={error}
                />
              )}

              {/* Validation Info */}
              {certificateData && (
                <SSLValidationInfo 
                  data={certificateData}
                  domain={domain}
                />
              )}

              {/* Progress Message for Incomplete Analysis */}
              {certificateData && certificateData.pollInfo?.shouldPoll && (
                <Alert icon={<IconInfoCircle size={16} />} title="Security Analysis in Progress" color="blue" variant="light">
                  <Text size="sm">
                    SSL Labs is analyzing the security configuration. Security analysis results will appear when the assessment is complete.
                  </Text>
                  {certificateData.assessmentProgress && (
                    <Text size="sm" mt="xs">
                      Progress: {certificateData.assessmentProgress.readyEndpoints}/{certificateData.assessmentProgress.totalEndpoints} endpoints complete 
                      ({certificateData.assessmentProgress.completionPercentage}%)
                    </Text>
                  )}
                </Alert>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="info" pt="lg">
            <SSLInfoPanel />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Paper>
  );
};

export default SSLCheckerTool; 