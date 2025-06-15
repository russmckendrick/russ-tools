import React, { useState, useEffect } from 'react';
import {
  Paper,
  Stack,
  Title,
  ThemeIcon,
  Group,
  Text,
  Alert,
  Badge,
  Button,
  Textarea,
  Grid,
  Card,
  ActionIcon,
  JsonInput,
  Tabs,
  Code,
  Switch,
  Tooltip,
  Divider,
  Select
} from '@mantine/core';
import { useParams } from 'react-router-dom';
import {
  IconCopy,
  IconClipboard,
  IconTrash,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconShield,
  IconClock,
  IconUser,
  IconFingerprint,
  IconInfoCircle,
  IconDownload,
  IconUpload,
  IconRefresh,
  IconKey,
  IconLock
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { jwtDecode } from 'jwt-decode';
import { jwtVerify, importJWK, importSPKI, importPKCS8 } from 'jose';
import JWTIcon from './JWTIcon';
import SEOHead from '../../common/SEOHead';
import { generateToolSEO } from '../../../utils/seoUtils';
import toolsConfig from '../../../utils/toolsConfig.json';

const JWTTool = () => {
  const [jwtToken, setJwtToken] = useState('');
  const [decodedHeader, setDecodedHeader] = useState(null);
  const [decodedPayload, setDecodedPayload] = useState(null);
  const [signature, setSignature] = useState('');
  const [isValidFormat, setIsValidFormat] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [publicKey, setPublicKey] = useState('');
  const [validateSignature, setValidateSignature] = useState(false);
  const [error, setError] = useState(null);
  const [tokenAnalysis, setTokenAnalysis] = useState(null);

  // Example JWT tokens for testing
  const exampleTokens = {
    basic: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    expired: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjN9.Jwt249svX2VNvSNwcZGwfEeDCbKmEPOZghye_JvgJpM',
    withClaims: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3Qta2V5In0.eyJpc3MiOiJodHRwczovL2V4YW1wbGUuY29tIiwic3ViIjoidXNlcjEyMyIsImF1ZCI6WyJhcGkxIiwiYXBpMiJdLCJleHAiOjE3MzUwNjgwMDAsIm5iZiI6MTczNTA2NDQwMCwiaWF0IjoxNzM1MDY0NDAwLCJqdGkiOiJ1bmlxdWUtaWQtMTIzIiwicm9sZXMiOlsiYWRtaW4iLCJ1c2VyIl0sInBlcm1pc3Npb25zIjpbInJlYWQiLCJ3cml0ZSJdLCJjdXN0b21fY2xhaW0iOiJjdXN0b21fdmFsdWUifQ.example_signature_here'
  };

  // Get input from URL parameters
  const { token: urlToken } = useParams();

  // Effect to handle URL token parameter
  useEffect(() => {
    if (urlToken && urlToken.trim()) {
      const decodedToken = decodeURIComponent(urlToken);
      setJwtToken(decodedToken);
      processJWT(decodedToken);
    }
  }, [urlToken]);

  // Effect to process JWT when token changes
  useEffect(() => {
    if (jwtToken.trim()) {
      processJWT(jwtToken.trim());
    } else {
      clearResults();
    }
  }, [jwtToken]);

  const clearResults = () => {
    setDecodedHeader(null);
    setDecodedPayload(null);
    setSignature('');
    setIsValidFormat(null);
    setValidationResult(null);
    setError(null);
    setTokenAnalysis(null);
  };

  const processJWT = (token) => {
    try {
      setError(null);
      
      // Check if token has the correct format (3 parts separated by dots)
      const parts = token.split('.');
      if (parts.length !== 3) {
        setIsValidFormat(false);
        setError('Invalid JWT format. JWT must have exactly 3 parts separated by dots.');
        return;
      }

      setIsValidFormat(true);

      // Decode without verification first
      const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
      const payload = jwtDecode(token);
      
      if (!header || !payload) {
        setError('Failed to decode JWT token');
        return;
      }

      setDecodedHeader(header);
      setDecodedPayload(payload);
      setSignature(parts[2]);

      // Analyze the token
      analyzeToken(header, payload);

      // If validation is enabled, validate the signature
      if (validateSignature && publicKey) {
        validateJWTSignature(token, header);
      }

    } catch (err) {
      setError(`Error processing JWT: ${err.message}`);
      setIsValidFormat(false);
    }
  };

  const analyzeToken = (header, payload) => {
    const analysis = {
      algorithm: header.alg,
      type: header.typ,
      keyId: header.kid,
      issuer: payload.iss,
      subject: payload.sub,
      audience: payload.aud,
      issuedAt: payload.iat ? new Date(payload.iat * 1000) : null,
      expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
      notBefore: payload.nbf ? new Date(payload.nbf * 1000) : null,
      isExpired: payload.exp ? Date.now() > payload.exp * 1000 : false,
      isNotYetValid: payload.nbf ? Date.now() < payload.nbf * 1000 : false,
      customClaims: {}
    };

    // Extract custom claims (non-standard claims)
    const standardClaims = ['iss', 'sub', 'aud', 'exp', 'nbf', 'iat', 'jti'];
    Object.keys(payload).forEach(key => {
      if (!standardClaims.includes(key)) {
        analysis.customClaims[key] = payload[key];
      }
    });

    setTokenAnalysis(analysis);
  };

  const validateJWTSignature = async (token, header) => {
    try {
      let result = { valid: false, error: null };

      if (header.alg === 'none') {
        result = { valid: true, message: 'No signature validation required for "none" algorithm' };
      } else if (header.alg.startsWith('HS')) {
        // HMAC algorithms - browser limitation
        result = { valid: false, error: 'HMAC signature validation not supported in browser environment. Use server-side validation for HMAC tokens.' };
      } else if (header.alg.startsWith('RS') || header.alg.startsWith('ES') || header.alg.startsWith('PS')) {
        // RSA/ECDSA algorithms - use public key
        if (!publicKey) {
          result = { valid: false, error: 'Public key required for RSA/ECDSA algorithms' };
        } else {
          try {
            // Try to import and verify with jose library for better support
            let keyLike;
            if (publicKey.includes('BEGIN')) {
              keyLike = await importSPKI(publicKey, header.alg);
            } else {
              // Assume it's a JWK
              keyLike = await importJWK(JSON.parse(publicKey), header.alg);
            }
            
            await jwtVerify(token, keyLike);
            result = { valid: true, message: 'Signature is valid' };
          } catch (err) {
            result = { valid: false, error: `Signature validation failed: ${err.message}` };
          }
        }
      } else {
        result = { valid: false, error: `Unsupported algorithm: ${header.alg}` };
      }

      setValidationResult(result);
    } catch (err) {
      setValidationResult({ valid: false, error: `Validation error: ${err.message}` });
    }
  };

  const copyToClipboard = async (text, label = 'Content') => {
    try {
      await navigator.clipboard.writeText(text);
      notifications.show({
        title: 'Copied!',
        message: `${label} copied to clipboard`,
        color: 'green',
        icon: <IconCheck size={16} />
      });
    } catch (err) {
      notifications.show({
        title: 'Copy Failed',
        message: 'Failed to copy to clipboard',
        color: 'red',
        icon: <IconX size={16} />
      });
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJwtToken(text);
      notifications.show({
        title: 'Pasted!',
        message: 'JWT token pasted from clipboard',
        color: 'blue',
        icon: <IconClipboard size={16} />
      });
    } catch (err) {
      notifications.show({
        title: 'Paste Failed',
        message: 'Failed to paste from clipboard',
        color: 'red',
        icon: <IconX size={16} />
      });
    }
  };

  const loadExampleToken = (tokenKey) => {
    setJwtToken(exampleTokens[tokenKey]);
    notifications.show({
      title: 'Example Loaded',
      message: `${tokenKey} JWT token loaded`,
      color: 'blue',
      icon: <IconCheck size={16} />
    });
  };

  const clearAll = () => {
    setJwtToken('');
    setPublicKey('');
    setValidateSignature(false);
    clearResults();
    notifications.show({
      title: 'Cleared',
      message: 'All fields have been cleared',
      color: 'blue',
      icon: <IconTrash size={16} />
    });
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Not set';
    return timestamp.toLocaleString();
  };

  const getExpirationStatus = () => {
    if (!tokenAnalysis?.expiresAt) return null;
    
    const now = Date.now();
    const expTime = tokenAnalysis.expiresAt.getTime();
    const timeLeft = expTime - now;
    
    if (timeLeft < 0) {
      return { status: 'expired', message: 'Token has expired', color: 'red' };
    } else if (timeLeft < 300000) { // 5 minutes
      return { status: 'expiring', message: 'Token expires soon', color: 'yellow' };
    } else {
      return { status: 'valid', message: 'Token is valid', color: 'green' };
    }
  };

  return (
    <Paper p="xl" radius="lg" withBorder>
      <Stack gap="xl">
        {/* Header */}
        <Group gap="md">
          <ThemeIcon size={48} radius="md" color="red" variant="light">
            <JWTIcon size={28} />
          </ThemeIcon>
          <div>
            <Title order={2} fw={600}>
              JWT Decoder/Validator
            </Title>
            <Text size="sm" c="dimmed">
              Decode JWT tokens and validate signatures without sending to external services
            </Text>
            <Badge variant="light" color="green" size="sm" mt="xs">
              🔒 100% Client-Side • No External Requests • Privacy First
            </Badge>
          </div>
        </Group>

        {/* Security Notice */}
        <Alert color="green" icon={<IconShield size={16} />}>
          <Text fw={500} size="sm">🔒 Your tokens stay private</Text>
          <Text size="xs" mt="xs">
            All JWT processing happens locally in your browser. No tokens are sent to external servers or services. 
            Perfect for analyzing sensitive authentication tokens safely.
          </Text>
        </Alert>

        {/* Input Section */}
        <Card withBorder p="lg">
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={500}>JWT Token Input</Text>
              <Group gap="xs">
                <ActionIcon
                  variant="light"
                  color="blue"
                  onClick={pasteFromClipboard}
                  title="Paste from clipboard"
                >
                  <IconClipboard size={16} />
                </ActionIcon>
                <ActionIcon
                  variant="light"
                  color="red"
                  onClick={clearAll}
                  title="Clear all"
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            </Group>

            <Textarea
              placeholder="Paste your JWT token here..."
              value={jwtToken}
              onChange={(e) => setJwtToken(e.target.value)}
              minRows={3}
              maxRows={6}
              autosize
            />

            {isValidFormat !== null && (
              <Alert
                color={isValidFormat ? 'green' : 'red'}
                icon={isValidFormat ? <IconCheck size={16} /> : <IconX size={16} />}
              >
                {isValidFormat ? 'Valid JWT format detected' : 'Invalid JWT format'}
              </Alert>
            )}

            {error && (
              <Alert color="red" icon={<IconAlertTriangle size={16} />}>
                {error}
              </Alert>
            )}

            {/* Example Tokens */}
            <Group gap="xs">
              <Text size="sm" c="dimmed">Try examples:</Text>
              <Button
                size="xs"
                variant="light"
                onClick={() => loadExampleToken('basic')}
              >
                Basic JWT
              </Button>
              <Button
                size="xs"
                variant="light"
                color="red"
                onClick={() => loadExampleToken('expired')}
              >
                Expired Token
              </Button>
              <Button
                size="xs"
                variant="light"
                color="green"
                onClick={() => loadExampleToken('withClaims')}
              >
                With Claims
              </Button>
            </Group>
          </Stack>
        </Card>

        {/* Signature Validation Section */}
        <Card withBorder p="lg">
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={500}>Signature Validation (Optional)</Text>
              <Switch
                checked={validateSignature}
                onChange={(e) => setValidateSignature(e.currentTarget.checked)}
                label="Enable validation"
              />
            </Group>

            {validateSignature && (
              <Stack gap="md">
                <Alert color="blue" icon={<IconAlertTriangle size={16} />}>
                  <Text size="sm" fw={500}>Browser Limitations & Security</Text>
                  <Text size="xs" mt="xs">
                    HMAC (HS256/HS384/HS512) signature validation requires server-side processing for security reasons. 
                    Only RSA and ECDSA public key validation is supported in the browser. Your secret keys remain secure as they never leave your environment.
                  </Text>
                </Alert>

                <Textarea
                  label="Public Key (for RSA/ECDSA algorithms)"
                  placeholder="Enter PEM-formatted public key or JWK..."
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  minRows={3}
                  maxRows={8}
                  autosize
                  description="Supports PEM format (-----BEGIN PUBLIC KEY-----) or JWK format"
                />

                {validationResult && (
                  <Alert
                    color={validationResult.valid ? 'green' : 'red'}
                    icon={validationResult.valid ? <IconShield size={16} /> : <IconAlertTriangle size={16} />}
                  >
                    {validationResult.message || validationResult.error}
                  </Alert>
                )}
              </Stack>
            )}
          </Stack>
        </Card>

        {/* Results Section */}
        {(decodedHeader || decodedPayload) && (
          <Tabs defaultValue="decoded" variant="outline">
            <Tabs.List>
              <Tabs.Tab value="decoded" leftSection={<IconFingerprint size={16} />}>
                Decoded Token
              </Tabs.Tab>
              <Tabs.Tab value="analysis" leftSection={<IconClock size={16} />}>
                Token Analysis
              </Tabs.Tab>
              <Tabs.Tab value="claims" leftSection={<IconUser size={16} />}>
                Claims
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="decoded" pt="md">
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Card withBorder p="md">
                    <Stack gap="sm">
                      <Group justify="space-between">
                        <Text fw={500} size="sm">Header</Text>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          onClick={() => copyToClipboard(JSON.stringify(decodedHeader, null, 2), 'Header')}
                        >
                          <IconCopy size={14} />
                        </ActionIcon>
                      </Group>
                      <JsonInput
                        value={JSON.stringify(decodedHeader, null, 2)}
                        readOnly
                        minRows={4}
                        maxRows={8}
                        autosize
                      />
                    </Stack>
                  </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Card withBorder p="md">
                    <Stack gap="sm">
                      <Group justify="space-between">
                        <Text fw={500} size="sm">Payload</Text>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          onClick={() => copyToClipboard(JSON.stringify(decodedPayload, null, 2), 'Payload')}
                        >
                          <IconCopy size={14} />
                        </ActionIcon>
                      </Group>
                      <JsonInput
                        value={JSON.stringify(decodedPayload, null, 2)}
                        readOnly
                        minRows={4}
                        maxRows={12}
                        autosize
                      />
                    </Stack>
                  </Card>
                </Grid.Col>

                <Grid.Col span={12}>
                  <Card withBorder p="md">
                    <Stack gap="sm">
                      <Group justify="space-between">
                        <Text fw={500} size="sm">Signature</Text>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          onClick={() => copyToClipboard(signature, 'Signature')}
                        >
                          <IconCopy size={14} />
                        </ActionIcon>
                      </Group>
                      <Code block>{signature}</Code>
                    </Stack>
                  </Card>
                </Grid.Col>
              </Grid>
            </Tabs.Panel>

            <Tabs.Panel value="analysis" pt="md">
              {tokenAnalysis && (
                <Stack gap="md">
                  {/* Expiration Status */}
                  {(() => {
                    const expStatus = getExpirationStatus();
                    return expStatus && (
                      <Alert color={expStatus.color} icon={<IconClock size={16} />}>
                        {expStatus.message}
                        {tokenAnalysis.expiresAt && (
                          <Text size="sm" mt="xs">
                            Expires: {formatTimestamp(tokenAnalysis.expiresAt)}
                          </Text>
                        )}
                      </Alert>
                    );
                  })()}

                  <Grid>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Card withBorder p="md">
                        <Stack gap="xs">
                          <Text fw={500} size="sm">Token Information</Text>
                          <Table size="sm">
                            <Table.Tbody>
                              <Table.Tr>
                                <Table.Td fw={500}>Algorithm</Table.Td>
                                <Table.Td>
                                  <Badge variant="light" color="blue">
                                    {tokenAnalysis.algorithm}
                                  </Badge>
                                </Table.Td>
                              </Table.Tr>
                              <Table.Tr>
                                <Table.Td fw={500}>Type</Table.Td>
                                <Table.Td>{tokenAnalysis.type || 'Not specified'}</Table.Td>
                              </Table.Tr>
                              <Table.Tr>
                                <Table.Td fw={500}>Key ID</Table.Td>
                                <Table.Td>{tokenAnalysis.keyId || 'Not specified'}</Table.Td>
                              </Table.Tr>
                            </Table.Tbody>
                          </Table>
                        </Stack>
                      </Card>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Card withBorder p="md">
                        <Stack gap="xs">
                          <Text fw={500} size="sm">Timestamps</Text>
                          <Table size="sm">
                            <Table.Tbody>
                              <Table.Tr>
                                <Table.Td fw={500}>Issued At</Table.Td>
                                <Table.Td>{formatTimestamp(tokenAnalysis.issuedAt)}</Table.Td>
                              </Table.Tr>
                              <Table.Tr>
                                <Table.Td fw={500}>Expires At</Table.Td>
                                <Table.Td>{formatTimestamp(tokenAnalysis.expiresAt)}</Table.Td>
                              </Table.Tr>
                              <Table.Tr>
                                <Table.Td fw={500}>Not Before</Table.Td>
                                <Table.Td>{formatTimestamp(tokenAnalysis.notBefore)}</Table.Td>
                              </Table.Tr>
                            </Table.Tbody>
                          </Table>
                        </Stack>
                      </Card>
                    </Grid.Col>
                  </Grid>

                  {/* Status Indicators */}
                  <Grid>
                    <Grid.Col span={{ base: 12, md: 4 }}>
                      <Alert
                        color={tokenAnalysis.isExpired ? 'red' : 'green'}
                        icon={tokenAnalysis.isExpired ? <IconX size={16} /> : <IconCheck size={16} />}
                      >
                        {tokenAnalysis.isExpired ? 'Token Expired' : 'Token Not Expired'}
                      </Alert>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 4 }}>
                      <Alert
                        color={tokenAnalysis.isNotYetValid ? 'yellow' : 'green'}
                        icon={tokenAnalysis.isNotYetValid ? <IconAlertTriangle size={16} /> : <IconCheck size={16} />}
                      >
                        {tokenAnalysis.isNotYetValid ? 'Not Yet Valid' : 'Currently Valid'}
                      </Alert>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 4 }}>
                      <Alert
                        color="blue"
                        icon={<IconFingerprint size={16} />}
                      >
                        Algorithm: {tokenAnalysis.algorithm}
                      </Alert>
                    </Grid.Col>
                  </Grid>
                </Stack>
              )}
            </Tabs.Panel>

            <Tabs.Panel value="claims" pt="md">
              {tokenAnalysis && (
                <Stack gap="md">
                  {/* Standard Claims */}
                  <Card withBorder p="md">
                    <Stack gap="sm">
                      <Text fw={500}>Standard Claims</Text>
                      <Table>
                        <Table.Tbody>
                          {tokenAnalysis.issuer && (
                            <Table.Tr>
                              <Table.Td fw={500}>Issuer (iss)</Table.Td>
                              <Table.Td>{tokenAnalysis.issuer}</Table.Td>
                            </Table.Tr>
                          )}
                          {tokenAnalysis.subject && (
                            <Table.Tr>
                              <Table.Td fw={500}>Subject (sub)</Table.Td>
                              <Table.Td>{tokenAnalysis.subject}</Table.Td>
                            </Table.Tr>
                          )}
                          {tokenAnalysis.audience && (
                            <Table.Tr>
                              <Table.Td fw={500}>Audience (aud)</Table.Td>
                              <Table.Td>
                                {Array.isArray(tokenAnalysis.audience) 
                                  ? tokenAnalysis.audience.join(', ') 
                                  : tokenAnalysis.audience}
                              </Table.Td>
                            </Table.Tr>
                          )}
                        </Table.Tbody>
                      </Table>
                    </Stack>
                  </Card>

                  {/* Custom Claims */}
                  {Object.keys(tokenAnalysis.customClaims).length > 0 && (
                    <Card withBorder p="md">
                      <Stack gap="sm">
                        <Group justify="space-between">
                          <Text fw={500}>Custom Claims</Text>
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            onClick={() => copyToClipboard(JSON.stringify(tokenAnalysis.customClaims, null, 2), 'Custom Claims')}
                          >
                            <IconCopy size={14} />
                          </ActionIcon>
                        </Group>
                        <JsonInput
                          value={JSON.stringify(tokenAnalysis.customClaims, null, 2)}
                          readOnly
                          minRows={3}
                          maxRows={10}
                          autosize
                        />
                      </Stack>
                    </Card>
                  )}
                </Stack>
              )}
            </Tabs.Panel>
          </Tabs>
        )}
      </Stack>
    </Paper>
  );
};

export default JWTTool; 