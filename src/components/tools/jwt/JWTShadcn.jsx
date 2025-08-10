import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  TableHead,
  TableHeader,
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
  Shield,
  Clock,
  User,
  Fingerprint,
  Info,
  Key,
  Lock,
  RefreshCw
} from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import { jwtVerify, importJWK, importSPKI, importPKCS8 } from 'jose';
import SEOHead from '../../common/SEOHead';
import { generateToolSEO } from '../../../utils/seoUtils';
import toolsConfig from '../../../utils/toolsConfig.json';

const JWTShadcn = () => {
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

  // Get tool configuration for SEO
  const toolConfig = toolsConfig.find(tool => tool.id === 'jwt');
  const seoData = generateToolSEO(toolConfig);

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
      toast.success(`${label} copied to clipboard`);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJwtToken(text);
      toast.success('JWT token pasted from clipboard');
    } catch (err) {
      toast.error('Failed to paste from clipboard');
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
      <SEOHead {...seoData} />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/20">
              <Key className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">JWT Decoder/Validator</h1>
              <p className="text-muted-foreground">
                Decode JWT tokens and validate signatures without sending to external services
              </p>
              <Badge variant="secondary" className="mt-2">
                🔒 100% Client-Side • No External Requests • Privacy First
              </Badge>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold text-sm mb-1">🔒 Your tokens stay private</div>
            <div className="text-xs">
              All JWT processing happens locally in your browser. No tokens are sent to external servers or services. 
              Perfect for analyzing sensitive authentication tokens safely.
            </div>
          </AlertDescription>
        </Alert>

        {/* Input Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
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
                className="min-h-[100px] font-mono text-sm"
              />

              {isValidFormat !== null && (
                <Alert className={isValidFormat ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'}>
                  {isValidFormat ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <X className="h-4 w-4 text-red-600 dark:text-red-400" />
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
                <span className="text-sm text-muted-foreground">Try examples:</span>
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
            <div className="flex items-center justify-between">
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
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold text-sm mb-1">Browser Limitations & Security</div>
                  <div className="text-xs">
                    HMAC (HS256/HS384/HS512) signature validation requires server-side processing for security reasons. 
                    Only RSA and ECDSA public key validation is supported in the browser. Your secret keys remain secure as they never leave your environment.
                  </div>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="public-key">Public Key (for RSA/ECDSA algorithms)</Label>
                <Textarea
                  id="public-key"
                  placeholder="Enter PEM-formatted public key or JWK..."
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  className="min-h-[120px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Supports PEM format (-----BEGIN PUBLIC KEY-----) or JWK format
                </p>
              </div>

              {validationResult && (
                <Alert className={validationResult.valid ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'}>
                  {validationResult.valid ? (
                    <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  )}
                  <AlertDescription>
                    {validationResult.message || validationResult.error}
                  </AlertDescription>
                </Alert>
              )}
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
              <Tabs defaultValue="decoded" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
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
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Header</CardTitle>
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
                        <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                          {JSON.stringify(decodedHeader, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>

                    {/* Payload */}
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Payload</CardTitle>
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
                        <pre className="bg-muted p-3 rounded text-sm overflow-x-auto max-h-80 overflow-y-auto">
                          {JSON.stringify(decodedPayload, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Signature */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Signature</CardTitle>
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
                      <code className="block bg-muted p-3 rounded text-sm break-all">
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
                            expStatus.color === 'destructive' ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' :
                            expStatus.color === 'warning' ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20' :
                            'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                          }>
                            <Clock className="h-4 w-4" />
                            <AlertDescription>
                              <div className="font-semibold">{expStatus.message}</div>
                              {tokenAnalysis.expiresAt && (
                                <div className="text-sm mt-1">
                                  Expires: {formatTimestamp(tokenAnalysis.expiresAt)}
                                </div>
                              )}
                            </AlertDescription>
                          </Alert>
                        );
                      })()}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Token Information */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Token Information</CardTitle>
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
                            <CardTitle className="text-lg">Timestamps</CardTitle>
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
                        <Alert className={tokenAnalysis.isExpired ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'}>
                          {tokenAnalysis.isExpired ? (
                            <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                          )}
                          <AlertDescription>
                            {tokenAnalysis.isExpired ? 'Token Expired' : 'Token Not Expired'}
                          </AlertDescription>
                        </Alert>

                        <Alert className={tokenAnalysis.isNotYetValid ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20' : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'}>
                          {tokenAnalysis.isNotYetValid ? (
                            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
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
                          <CardTitle className="text-lg">Standard Claims</CardTitle>
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
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">Custom Claims</CardTitle>
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
                            <pre className="bg-muted p-3 rounded text-sm overflow-x-auto max-h-60 overflow-y-auto">
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

export default JWTShadcn;