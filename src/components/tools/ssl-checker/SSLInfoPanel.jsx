import React from 'react';
import { 
  Stack,
  Alert,
  Text,
  Group,
  Badge
} from '@mantine/core';
import { IconInfoCircle, IconShieldCheck, IconCertificate, IconWorldWww, IconShield } from '@tabler/icons-react';

const SSLInfoPanel = () => {
  return (
    <Stack gap="lg">
      <Alert icon={<IconInfoCircle size={16} />} title="About SSL/TLS Certificates" color="blue" variant="light">
        <Text size="sm">
          SSL/TLS certificates create encrypted connections between browsers and websites, protecting sensitive data like passwords, 
          payment information, and personal details from hackers. They're essential for modern web security and user trust.
        </Text>
      </Alert>
      
      <Alert icon={<IconShieldCheck size={16} />} title="How This Tool Works" color="teal" variant="light">
        <Text size="sm" mb="xs">
          Our SSL checker provides enterprise-grade analysis using industry-leading services:
        </Text>
        <Text size="sm" mb="xs">
          • <strong>SSL Labs API v4</strong> - The gold standard for SSL testing, providing detailed security analysis with comprehensive vulnerability testing
        </Text>
        <Text size="sm" mb="xs">
          • <strong>Cloudflare Worker</strong> - Securely handles API access and CORS restrictions while maintaining your privacy
        </Text>
        <Text size="sm">
          • <strong>Smart Fallbacks</strong> - Multiple backup services ensure reliable results even when primary services are unavailable
        </Text>
      </Alert>

      <Alert icon={<IconCertificate size={16} />} title="SSL Labs Grading System" color="green" variant="light">
        <Text size="sm" mb="xs">Our tool uses the industry-standard SSL Labs grading system:</Text>
        <Group gap="xs" mb="xs">
          <Badge variant="filled" color="green" size="sm">A+</Badge>
          <Text size="xs">Exceptional security - Perfect configuration with advanced security features</Text>
        </Group>
        <Group gap="xs" mb="xs">
          <Badge variant="filled" color="green" size="sm">A</Badge>
          <Text size="xs">Excellent security - Strong encryption with no significant issues</Text>
        </Group>
        <Group gap="xs" mb="xs">
          <Badge variant="filled" color="lime" size="sm">B</Badge>
          <Text size="xs">Good security - Minor issues but generally secure</Text>
        </Group>
        <Group gap="xs" mb="xs">
          <Badge variant="filled" color="yellow" size="sm">C</Badge>
          <Text size="xs">Fair security - Some security concerns need attention</Text>
        </Group>
        <Group gap="xs" mb="xs">
          <Badge variant="filled" color="orange" size="sm">D/E</Badge>
          <Text size="xs">Poor security - Significant vulnerabilities present</Text>
        </Group>
        <Group gap="xs" mb="xs">
          <Badge variant="filled" color="red" size="sm">F</Badge>
          <Text size="xs">Failed - Major security flaws or certificate issues</Text>
        </Group>
        <Group gap="xs">
          <Badge variant="filled" color="blue" size="sm">T</Badge>
          <Text size="xs">Trust issues - Certificate not trusted by browsers</Text>
        </Group>
      </Alert>

      <Alert icon={<IconInfoCircle size={16} />} title="What We Analyze" color="violet" variant="light">
        <Text size="sm" mb="xs">Our comprehensive SSL analysis includes:</Text>
        <Text size="sm" mb="xs">
          • <strong>Certificate Validity</strong> - Expiration dates, issuer trust, and domain matching
        </Text>
        <Text size="sm" mb="xs">
          • <strong>Security Protocols</strong> - TLS versions, cipher suites, and encryption strength
        </Text>
        <Text size="sm" mb="xs">
          • <strong>Vulnerability Testing</strong> - Heartbleed, POODLE, BEAST, and other security flaws
        </Text>
        <Text size="sm" mb="xs">
          • <strong>Configuration Analysis</strong> - HSTS, certificate chains, and security headers
        </Text>
        <Text size="sm">
          • <strong>Browser Compatibility</strong> - Testing across different browsers and devices
        </Text>
      </Alert>

      <Alert icon={<IconWorldWww size={16} />} title="Privacy & Security" color="orange" variant="light">
        <Text size="sm">
          Your privacy matters. No domain information is logged or stored server-side. The tool is restricted to authorized origins and uses 
          encrypted connections throughout the analysis process.
        </Text>
      </Alert>

      <Alert icon={<IconShield size={16} />} title="Why SSL Matters" color="red" variant="light">
        <Text size="sm" mb="xs">
          Without proper SSL/TLS encryption, your website visitors face serious risks:
        </Text>
        <Text size="sm" mb="xs">• Data interception by malicious actors</Text>
        <Text size="sm" mb="xs">• Browser security warnings driving users away</Text>
        <Text size="sm" mb="xs">• Search engine ranking penalties</Text>
        <Text size="sm">• Loss of customer trust and credibility</Text>
      </Alert>
    </Stack>
  );
};

export default SSLInfoPanel; 