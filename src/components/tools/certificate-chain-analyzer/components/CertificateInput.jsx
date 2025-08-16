import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';
import { Alert, AlertDescription } from '../../../ui/alert';
import { Badge } from '../../../ui/badge';
import { 
  Upload, 
  Globe, 
  Loader2, 
  AlertCircle, 
  FileText,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';

const CertificateInput = ({ 
  onDomainAnalysis, 
  onFileAnalysis, 
  loading, 
  error,
  initialDomain 
}) => {
  const [inputMethod, setInputMethod] = useState('domain');
  const [domain, setDomain] = useState(initialDomain || '');
  const [port, setPort] = useState('443');
  const [recentAnalyses, setRecentAnalyses] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('cert-analyzer-recent');
    if (saved) {
      try {
        setRecentAnalyses(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent analyses:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (initialDomain) {
      setDomain(initialDomain);
      setInputMethod('domain');
    }
  }, [initialDomain]);

  const addToRecent = useCallback((domain, status) => {
    const newEntry = {
      domain,
      timestamp: Date.now(),
      status
    };
    
    setRecentAnalyses(prev => {
      const filtered = prev.filter(entry => entry.domain !== domain);
      const updated = [newEntry, ...filtered].slice(0, 5);
      localStorage.setItem('cert-analyzer-recent', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleDomainSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!domain.trim()) return;
    
    try {
      await onDomainAnalysis(domain.trim(), parseInt(port));
      addToRecent(domain.trim(), 'success');
    } catch (err) {
      addToRecent(domain.trim(), 'error');
      throw err;
    }
  }, [domain, port, onDomainAnalysis, addToRecent]);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onFileAnalysis(acceptedFiles);
    }
  }, [onFileAnalysis]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/x-pem-file': ['.pem', '.crt', '.cer'],
      'application/pkix-cert': ['.der'],
      'application/pkcs7-mime': ['.p7b', '.p7c'],
      'application/x-pkcs12': ['.pfx', '.p12']
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return `${Math.floor(diff / 86400000)} days ago`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            Analyze Certificate Chain
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <Button
              variant={inputMethod === 'domain' ? 'default' : 'outline'}
              onClick={() => setInputMethod('domain')}
              className="flex-1"
            >
              <Globe className="w-4 h-4 mr-2" />
              Domain Analysis
            </Button>
            <Button
              variant={inputMethod === 'file' ? 'default' : 'outline'}
              onClick={() => setInputMethod('file')}
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              File Upload
            </Button>
          </div>

          {inputMethod === 'domain' && (
            <form onSubmit={handleDomainSubmit} className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3">
                  <Label htmlFor="domain">Domain Name</Label>
                  <Input
                    id="domain"
                    type="text"
                    placeholder="example.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="port">Port</Label>
                  <Select value={port} onValueChange={setPort}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="443">443 (HTTPS)</SelectItem>
                      <SelectItem value="993">993 (IMAPS)</SelectItem>
                      <SelectItem value="995">995 (POP3S)</SelectItem>
                      <SelectItem value="465">465 (SMTPS)</SelectItem>
                      <SelectItem value="587">587 (SMTP TLS)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button 
                type="submit" 
                disabled={loading || !domain.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Certificate Chain'
                )}
              </Button>
            </form>
          )}

          {inputMethod === 'file' && (
            <div className="space-y-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">
                  {isDragActive 
                    ? 'Drop certificate files here...' 
                    : 'Drop certificate files here or click to browse'
                  }
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Supports: PEM, DER, P7B, PFX formats (max 10MB per file)
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge variant="secondary">.pem</Badge>
                  <Badge variant="secondary">.crt</Badge>
                  <Badge variant="secondary">.cer</Badge>
                  <Badge variant="secondary">.der</Badge>
                  <Badge variant="secondary">.p7b</Badge>
                  <Badge variant="secondary">.pfx</Badge>
                  <Badge variant="secondary">.p12</Badge>
                </div>
              </div>

              {loading && (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    Processing certificate files...
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>API Integration:</strong> This tool attempts to retrieve real certificate data via Cloudflare Worker API. 
              If the API is unavailable, it will fall back to realistic mock data to demonstrate functionality.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {recentAnalyses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              Recent Analyses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAnalyses.map((entry, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setDomain(entry.domain);
                    setInputMethod('domain');
                  }}
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(entry.status)}
                    <div>
                      <p className="font-medium">{entry.domain}</p>
                      <p className="text-sm text-gray-500">{formatTimestamp(entry.timestamp)}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDomainAnalysis(entry.domain, 443);
                    }}
                  >
                    Re-analyze
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CertificateInput;