import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  Copy,
  Clipboard, 
  Trash2, 
  CheckCircle, 
  X, 
  AlertTriangle,
  Clock,
  User,
  Fingerprint
} from 'lucide-react';
import { decodeJwt } from 'jose';
import { copyText, readText } from '@/core';
import { ValidityBar } from '@/components/ui/validity-bar';
import TokenAnatomy from './components/TokenAnatomy';
import ValidationFlow from './components/ValidationFlow.jsx';
import SignaturePanel from './components/SignaturePanel.jsx';
import { discoverJwksUri, fetchJwks, httpsIssuer } from './lib/issuer.js';
import { verifySignature } from './lib/signature.js';

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
  const [issuerKeys, setIssuerKeys] = useState({ status: 'idle' });
  const issuerRun = useRef(0);

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
      const payload = decodeJwt(token);
      
      if (!header || !payload) {
        setError('Failed to decode JWT token');
        return;
      }

      setDecodedHeader(header);
      setDecodedPayload(payload);
      setSignature(parts[2]);

      // Analyze the token
      analyzeToken(header, payload);

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

  const issuer = useMemo(() => httpsIssuer(decodedPayload), [decodedPayload]);

  useEffect(() => {
    issuerRun.current += 1;
    setIssuerKeys({ status: 'idle' });
  }, [issuer]);

  const loadIssuerKeys = async (found, run) => {
    const jwks = await fetchJwks(found.jwksUri);
    if (issuerRun.current !== run) return;
    setIssuerKeys({ ...found, status: 'ready', jwks });
  };

  const handleFetchIssuerKeys = async () => {
    if (!issuer) return;
    const run = ++issuerRun.current;
    setIssuerKeys({ status: 'loading' });
    try {
      const found = await discoverJwksUri(issuer);
      if (issuerRun.current !== run) return;
      if (!found.sameHost) {
        setIssuerKeys({ ...found, status: 'confirm' });
        return;
      }
      await loadIssuerKeys(found, run);
    } catch (err) {
      if (issuerRun.current === run) setIssuerKeys({ status: 'error', error: err });
    }
  };

  const handleConfirmOtherHost = async () => {
    const { discoveryUrl, jwksUri, jwksHost, sameHost } = issuerKeys;
    const run = ++issuerRun.current;
    setIssuerKeys({ status: 'loading' });
    try {
      await loadIssuerKeys({ discoveryUrl, jwksUri, jwksHost, sameHost }, run);
    } catch (err) {
      if (issuerRun.current === run) setIssuerKeys({ status: 'error', error: err });
    }
  };

  const handleForgetIssuerKeys = () => {
    issuerRun.current += 1;
    setIssuerKeys({ status: 'idle' });
  };

  const fetchedJwks = issuerKeys.status === 'ready' ? issuerKeys.jwks : null;
  const fetchedFrom = issuerKeys.status === 'ready' ? issuerKeys.jwksHost : null;

  useEffect(() => {
    if (!validateSignature || !isValidFormat || !decodedHeader) {
      setValidationResult(null);
      return undefined;
    }
    let cancelled = false;
    verifySignature({
      token: jwtToken.trim(),
      header: decodedHeader,
      keyText: publicKey,
      jwks: fetchedJwks,
      jwksSource: `the key set published at ${fetchedFrom}`,
    })
      .then((result) => {
        if (!cancelled) setValidationResult(result);
      })
      .catch((err) => {
        if (!cancelled) setValidationResult({ status: 'not-checked', message: `The check could not run: ${err.message}` });
      });
    return () => {
      cancelled = true;
    };
  }, [validateSignature, isValidFormat, decodedHeader, jwtToken, publicKey, fetchedJwks, fetchedFrom]);

  const copyToClipboard = async (text, label = 'Content') => {
    if (await copyText(text)) {
      toast.success(`${label} copied to clipboard`);
    } else {
      toast.error('Failed to copy to clipboard');
    }
  };

  const pasteFromClipboard = async () => {
    const text = await readText();
    if (text === null) {
      toast.error('Failed to paste from clipboard');
    } else {
      setJwtToken(text);
      toast.success('JWT token pasted from clipboard');
    }
  };

  const loadExampleToken = (tokenKey) => {
    setJwtToken(exampleTokens[tokenKey]);
    toast.success(`${tokenKey} JWT token loaded`);
  };

  const clearAll = () => {
    setJwtToken('');
    setPublicKey('');
    setValidateSignature(false);
    clearResults();
    toast.success('All fields have been cleared');
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
      return { status: 'expired', message: 'Token has expired', color: 'destructive' };
    } else if (timeLeft < 300000) { // 5 minutes
      return { status: 'expiring', message: 'Token expires soon', color: 'warning' };
    } else {
      return { status: 'valid', message: 'Token is valid', color: 'success' };
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Input Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <CardTitle>JWT Token Input</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={pasteFromClipboard}
                >
                  <Clipboard className="h-4 w-4 mr-2" />
                  Paste
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                placeholder="Paste your JWT token here..."
                value={jwtToken}
                onChange={(e) => setJwtToken(e.target.value)}
                className="min-h-[100px] font-mono text-data-md"
              />

              {isValidFormat !== null && (
                <Alert className={isValidFormat ? 'border-success/40 bg-success-subtle' : 'border-danger/40 bg-danger-subtle'}>
                  {isValidFormat ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <X className="h-4 w-4 text-danger" />
                  )}
                  <AlertDescription>
                    {isValidFormat ? 'Valid JWT format detected' : 'Invalid JWT format'}
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Example Tokens */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-body-sm text-muted-foreground">Try examples:</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loadExampleToken('basic')}
                >
                  Basic JWT
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loadExampleToken('expired')}
                >
                  Expired Token
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loadExampleToken('withClaims')}
                >
                  With Claims
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signature Validation Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <CardTitle>Signature Validation (Optional)</CardTitle>
              <div className="flex items-center space-x-2">
                <Switch
                  id="validation-switch"
                  checked={validateSignature}
                  onCheckedChange={setValidateSignature}
                />
                <Label htmlFor="validation-switch">Enable validation</Label>
              </div>
            </div>
          </CardHeader>
          {validateSignature && (
            <CardContent className="space-y-4">
              <SignaturePanel
                header={isValidFormat ? decodedHeader : null}
                rawIssuer={decodedPayload?.iss}
                issuer={issuer}
                issuerKeys={issuerKeys}
                onFetchIssuerKeys={handleFetchIssuerKeys}
                onConfirmOtherHost={handleConfirmOtherHost}
                onForgetIssuerKeys={handleForgetIssuerKeys}
                publicKey={publicKey}
                onPublicKeyChange={setPublicKey}
                result={validationResult}
              />
            </CardContent>
          )}
        </Card>

        {/* Results Section */}
        {(decodedHeader || decodedPayload) && (
          <Card>
            <CardHeader>
              <CardTitle>Decoded JWT Token</CardTitle>
            </CardHeader>
            <CardContent>
              <TokenAnatomy token={jwtToken} />
              <ValidationFlow analysis={tokenAnalysis} signature={validationResult} />
              <Tabs defaultValue="decoded" className="w-full">
                <TabsList>
                  <TabsTrigger value="decoded" className="flex items-center gap-2">
                    <Fingerprint className="h-4 w-4" />
                    Decoded Token
                  </TabsTrigger>
                  <TabsTrigger value="analysis" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Token Analysis
                  </TabsTrigger>
                  <TabsTrigger value="claims" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Claims
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="decoded" className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Header */}
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                          <CardTitle className="text-title-sm">Header</CardTitle>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(JSON.stringify(decodedHeader, null, 2), 'Header')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-muted p-3 rounded font-mono text-data-md overflow-x-auto">
                          {JSON.stringify(decodedHeader, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>

                    {/* Payload */}
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                          <CardTitle className="text-title-sm">Payload</CardTitle>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(JSON.stringify(decodedPayload, null, 2), 'Payload')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-muted p-3 rounded font-mono text-data-md overflow-x-auto max-h-80 overflow-y-auto">
                          {JSON.stringify(decodedPayload, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Signature */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                        <CardTitle className="text-title-sm">Signature</CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(signature, 'Signature')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <code className="block bg-muted p-3 rounded font-mono text-data-md break-all">
                        {signature}
                      </code>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="analysis" className="space-y-4">
                  {tokenAnalysis && (
                    <>
                      {/* Expiration Status */}
                      {(() => {
                        const expStatus = getExpirationStatus();
                        return expStatus && (
                          <Alert className={
                            expStatus.color === 'destructive' ? 'border-danger/40 bg-danger-subtle' :
                            expStatus.color === 'warning' ? 'border-warning/40 bg-warning-subtle' :
                            'border-success/40 bg-success-subtle'
                          }>
                            <Clock className="h-4 w-4" />
                            <AlertDescription>
                              <div className="font-semibold">{expStatus.message}</div>
                              {tokenAnalysis.expiresAt && (
                                <div className="text-body-sm mt-1">
                                  Expires: {formatTimestamp(tokenAnalysis.expiresAt)}
                                </div>
                              )}
                            </AlertDescription>
                          </Alert>
                        );
                      })()}

                      {tokenAnalysis.expiresAt && (tokenAnalysis.issuedAt || tokenAnalysis.notBefore) && (
                        <ValidityBar
                          start={tokenAnalysis.notBefore ?? tokenAnalysis.issuedAt}
                          end={tokenAnalysis.expiresAt}
                          startLabel={tokenAnalysis.notBefore ? 'Not before' : 'Issued'}
                          endLabel="Expires"
                          format={(d) => d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        />
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Token Information */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-title-sm">Token Information</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Table>
                              <TableBody>
                                <TableRow>
                                  <TableCell className="font-semibold">Algorithm</TableCell>
                                  <TableCell>
                                    <Badge variant="secondary">
                                      {tokenAnalysis.algorithm}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-semibold">Type</TableCell>
                                  <TableCell>{tokenAnalysis.type || 'Not specified'}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-semibold">Key ID</TableCell>
                                  <TableCell>{tokenAnalysis.keyId || 'Not specified'}</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>

                        {/* Timestamps */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-title-sm">Timestamps</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Table>
                              <TableBody>
                                <TableRow>
                                  <TableCell className="font-semibold">Issued At</TableCell>
                                  <TableCell>{formatTimestamp(tokenAnalysis.issuedAt)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-semibold">Expires At</TableCell>
                                  <TableCell>{formatTimestamp(tokenAnalysis.expiresAt)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-semibold">Not Before</TableCell>
                                  <TableCell>{formatTimestamp(tokenAnalysis.notBefore)}</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Status Indicators */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Alert className={tokenAnalysis.isExpired ? 'border-danger/40 bg-danger-subtle' : 'border-success/40 bg-success-subtle'}>
                          {tokenAnalysis.isExpired ? (
                            <X className="h-4 w-4 text-danger" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-success" />
                          )}
                          <AlertDescription>
                            {tokenAnalysis.isExpired ? 'Token Expired' : 'Token Not Expired'}
                          </AlertDescription>
                        </Alert>

                        <Alert className={tokenAnalysis.isNotYetValid ? 'border-warning/40 bg-warning-subtle' : 'border-success/40 bg-success-subtle'}>
                          {tokenAnalysis.isNotYetValid ? (
                            <AlertTriangle className="h-4 w-4 text-warning" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-success" />
                          )}
                          <AlertDescription>
                            {tokenAnalysis.isNotYetValid ? 'Not Yet Valid' : 'Currently Valid'}
                          </AlertDescription>
                        </Alert>

                        <Alert>
                          <Fingerprint className="h-4 w-4" />
                          <AlertDescription>
                            Algorithm: {tokenAnalysis.algorithm}
                          </AlertDescription>
                        </Alert>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="claims" className="space-y-4">
                  {tokenAnalysis && (
                    <>
                      {/* Standard Claims */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-title-sm">Standard Claims</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableBody>
                              {tokenAnalysis.issuer && (
                                <TableRow>
                                  <TableCell className="font-semibold">Issuer (iss)</TableCell>
                                  <TableCell>{tokenAnalysis.issuer}</TableCell>
                                </TableRow>
                              )}
                              {tokenAnalysis.subject && (
                                <TableRow>
                                  <TableCell className="font-semibold">Subject (sub)</TableCell>
                                  <TableCell>{tokenAnalysis.subject}</TableCell>
                                </TableRow>
                              )}
                              {tokenAnalysis.audience && (
                                <TableRow>
                                  <TableCell className="font-semibold">Audience (aud)</TableCell>
                                  <TableCell>
                                    {Array.isArray(tokenAnalysis.audience) 
                                      ? tokenAnalysis.audience.join(', ') 
                                      : tokenAnalysis.audience}
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>

                      {/* Custom Claims */}
                      {Object.keys(tokenAnalysis.customClaims).length > 0 && (
                        <Card>
                          <CardHeader className="pb-3">
                            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                              <CardTitle className="text-title-sm">Custom Claims</CardTitle>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(JSON.stringify(tokenAnalysis.customClaims, null, 2), 'Custom Claims')}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <pre className="bg-muted p-3 rounded font-mono text-data-md overflow-x-auto max-h-60 overflow-y-auto">
                              {JSON.stringify(tokenAnalysis.customClaims, null, 2)}
                            </pre>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default JWTTool;