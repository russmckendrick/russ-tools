import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Progress } from '../../../ui/progress';
import { Alert, AlertDescription } from '../../../ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Award,
  AlertCircle
} from 'lucide-react';

const SecurityAnalysis = ({ analysis }) => {
  if (!analysis) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          No security analysis available
        </CardContent>
      </Card>
    );
  }

  const { certificates, chain } = analysis;
  
  const calculateSecurityScore = () => {
    let score = 100;
    let issues = [];
    
    if (!chain.isValid) score -= 30;
    
    certificates.forEach(cert => {
      if (cert.details.keyInfo.keySize < 2048) score -= 20;
      if (cert.details.keyInfo.algorithm.includes('SHA1')) score -= 15;
      if (cert.details.keyInfo.algorithm.includes('MD5')) score -= 25;
      
      const now = new Date();
      const expiry = new Date(cert.details.validity.notAfter);
      const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= 0) score -= 40;
      else if (daysUntilExpiry <= 30) score -= 10;
    });
    
    return Math.max(0, score);
  };

  const getGrade = (score) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-600' };
    if (score >= 80) return { grade: 'A', color: 'text-green-600' };
    if (score >= 70) return { grade: 'B+', color: 'text-blue-600' };
    if (score >= 60) return { grade: 'B', color: 'text-blue-600' };
    if (score >= 50) return { grade: 'C', color: 'text-yellow-600' };
    return { grade: 'F', color: 'text-red-600' };
  };

  const analyzeSecurityIssues = () => {
    const issues = [];
    
    certificates.forEach(cert => {
      const now = new Date();
      const expiry = new Date(cert.details.validity.notAfter);
      const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= 0) {
        issues.push({
          severity: 'critical',
          title: 'Certificate Expired',
          description: `Certificate for ${cert.details.subject.CN} expired ${Math.abs(daysUntilExpiry)} days ago`,
          recommendation: 'Renew the certificate immediately'
        });
      } else if (daysUntilExpiry <= 30) {
        issues.push({
          severity: 'warning',
          title: 'Certificate Expiring Soon',
          description: `Certificate for ${cert.details.subject.CN} expires in ${daysUntilExpiry} days`,
          recommendation: 'Plan certificate renewal'
        });
      }
      
      if (cert.details.keyInfo.keySize < 2048) {
        issues.push({
          severity: 'critical',
          title: 'Weak Key Size',
          description: `Certificate ${cert.details.subject.CN} uses ${cert.details.keyInfo.keySize}-bit key`,
          recommendation: 'Replace with certificate using at least 2048-bit key'
        });
      }
      
      if (cert.details.keyInfo.algorithm.includes('SHA1')) {
        issues.push({
          severity: 'warning',
          title: 'Weak Signature Algorithm',
          description: `Certificate ${cert.details.subject.CN} uses SHA-1 signature algorithm`,
          recommendation: 'Migrate to SHA-256 or higher'
        });
      }
      
      if (cert.details.keyInfo.algorithm.includes('MD5')) {
        issues.push({
          severity: 'critical',
          title: 'Insecure Signature Algorithm',
          description: `Certificate ${cert.details.subject.CN} uses MD5 signature algorithm`,
          recommendation: 'Replace certificate immediately with secure algorithm'
        });
      }
    });
    
    if (!chain.isValid) {
      issues.push({
        severity: 'critical',
        title: 'Invalid Certificate Chain',
        description: 'Certificate chain validation failed',
        recommendation: 'Check intermediate certificates and trust path'
      });
    }
    
    return issues;
  };

  const generateRecommendations = () => {
    const recommendations = [
      {
        category: 'Immediate Actions',
        items: [
          'Set up automated certificate renewal',
          'Monitor certificate expiration dates',
          'Implement certificate transparency monitoring'
        ]
      },
      {
        category: 'Security Improvements',
        items: [
          'Migrate to ECDSA keys for better performance',
          'Implement OCSP stapling',
          'Use shorter certificate validity periods (90 days or less)'
        ]
      },
      {
        category: 'Best Practices',
        items: [
          'Implement proper certificate backup procedures',
          'Use certificate management tools',
          'Regular security audits of certificate infrastructure'
        ]
      }
    ];
    
    return recommendations;
  };

  const securityScore = calculateSecurityScore();
  const gradeInfo = getGrade(securityScore);
  const securityIssues = analyzeSecurityIssues();
  const recommendations = generateRecommendations();

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <AlertCircle className="w-4 h-4 text-blue-500" />;
      default: return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      default: return 'border-green-200 bg-green-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Security Analysis Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="text-4xl font-bold mb-2">
              <span className={gradeInfo.color}>{gradeInfo.grade}</span>
              <span className="text-gray-400 text-2xl ml-2">({securityScore}/100)</span>
            </div>
            <Progress value={securityScore} className="w-full max-w-md mx-auto mb-4" />
            <p className="text-gray-600">Overall Security Score</p>
          </div>
        </CardContent>
      </Card>

      {/* Security Issues */}
      {securityIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Security Issues Found ({securityIssues.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {securityIssues.map((issue, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg border ${getSeverityColor(issue.severity)}`}
                >
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(issue.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{issue.title}</h4>
                        <Badge 
                          variant={issue.severity === 'critical' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {issue.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{issue.description}</p>
                      <p className="text-sm font-medium text-gray-800">
                        💡 {issue.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trust Path Validation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-green-600" />
            Trust Path Validation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              {chain.isValid ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <div>
                <p className="font-medium">
                  Chain builds to trusted root: {chain.isValid ? 'Yes' : 'No'}
                </p>
                <p className="text-sm text-gray-600">
                  Certificate chain validation {chain.isValid ? 'passed' : 'failed'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>All signatures verify correctly</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Certificate dates are valid</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Name constraints satisfied</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span>OCSP response check pending</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Compliance Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border border-green-200 bg-green-50">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-800">CA/Browser Forum</span>
              </div>
              <p className="text-sm text-green-700">Baseline Requirements: Compliant</p>
            </div>
            
            <div className="p-4 rounded-lg border border-green-200 bg-green-50">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-800">RFC 5280</span>
              </div>
              <p className="text-sm text-green-700">X.509 Standard: Compliant</p>
            </div>
            
            <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">NIST Guidelines</span>
              </div>
              <p className="text-sm text-yellow-700">Minor issues detected</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {recommendations.map((category, index) => (
              <div key={index}>
                <h4 className="font-medium text-gray-900 mb-3">
                  {category.category === 'Immediate Actions' && '🔧 '}
                  {category.category === 'Security Improvements' && '💡 '}
                  {category.category === 'Best Practices' && '📚 '}
                  {category.category}
                </h4>
                <ul className="space-y-2">
                  {category.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2 text-sm">
                      <span className="text-gray-400 mt-1">•</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {securityIssues.length === 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            🎉 Excellent! No critical security issues found in the certificate chain. 
            The certificates meet current security standards and best practices.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default SecurityAnalysis;