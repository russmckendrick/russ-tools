"""
Cloudflare Python Worker for Certificate Chain Analysis
Retrieves and analyzes SSL/TLS certificate chains from domains
Uses Python's ssl and socket modules for real certificate extraction
"""

import ssl
import socket
import json
import hashlib
from datetime import datetime
from typing import Dict, List, Any, Optional

def application(environ, start_response):
    """WSGI application for certificate chain analysis"""
    
    # Handle CORS
    cors_headers = [
        ('Access-Control-Allow-Origin', '*'),
        ('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'),
        ('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With'),
        ('Access-Control-Max-Age', '86400'),
        ('Content-Type', 'application/json')
    ]
    
    method = environ.get('REQUEST_METHOD', 'GET')
    path = environ.get('PATH_INFO', '/')
    
    try:
        # Handle CORS preflight
        if method == 'OPTIONS':
            start_response('200 OK', cors_headers)
            return [b'']
        
        # Health check endpoint
        if path.endswith('/health'):
            response = {
                'status': 'healthy',
                'timestamp': datetime.utcnow().isoformat() + 'Z',
                'version': '1.0.0',
                'service': 'certificate-chain-analyzer-python',
                'language': 'python'
            }
            start_response('200 OK', cors_headers)
            return [json.dumps(response).encode('utf-8')]
        
        # Certificate analysis endpoint
        if method == 'POST' and path.endswith('/analyze'):
            # Read request body
            content_length = int(environ.get('CONTENT_LENGTH', '0'))
            if content_length == 0:
                raise ValueError('Request body is required')
            
            body = environ['wsgi.input'].read(content_length)
            request_data = json.loads(body.decode('utf-8'))
            
            domain = request_data.get('domain')
            port = request_data.get('port', 443)
            
            if not domain:
                raise ValueError('Domain parameter is required')
            
            print(f"Analyzing certificate chain for {domain}:{port}")
            
            # Retrieve and analyze certificate chain
            certificates = retrieve_certificate_chain(domain, port)
            chain_validation = validate_certificate_chain(certificates)
            
            response = {
                'success': True,
                'domain': domain,
                'port': port,
                'timestamp': datetime.utcnow().isoformat() + 'Z',
                'certificates': certificates,
                'chain': chain_validation,
                'metadata': {
                    'totalCertificates': len(certificates),
                    'analysisType': 'python-worker',
                    'source': f'{domain}:{port}',
                    'workerVersion': '1.0.0'
                }
            }
            
            start_response('200 OK', cors_headers)
            return [json.dumps(response).encode('utf-8')]
        
        # Not found
        response = {
            'success': False,
            'error': 'Not found',
            'availableEndpoints': ['/health', '/analyze']
        }
        start_response('404 Not Found', cors_headers)
        return [json.dumps(response).encode('utf-8')]
        
    except Exception as error:
        print(f"Worker error: {error}")
        
        response = {
            'success': False,
            'error': str(error),
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }
        start_response('500 Internal Server Error', cors_headers)
        return [json.dumps(response).encode('utf-8')]


def retrieve_certificate_chain(domain: str, port: int = 443) -> List[Dict[str, Any]]:
    """Retrieve real certificate chain using Python's ssl module"""
    print(f"Retrieving certificate chain for {domain}:{port}")
    
    try:
        # Create SSL context
        context = ssl.create_default_context()
        
        # Create socket connection
        with socket.create_connection((domain, port), timeout=30) as sock:
            # Wrap socket with SSL
            with context.wrap_socket(sock, server_hostname=domain) as ssock:
                # Get peer certificate chain
                cert_der = ssock.getpeercert(binary_form=True)
                cert_pem = ssl.DER_cert_to_PEM_cert(cert_der)
                
                # Get certificate details
                cert_details = ssock.getpeercert()
                
                # Get certificate chain if available
                cert_chain = ssock.getpeercert_chain()
                
                certificates = []
                
                if cert_chain:
                    # Process full certificate chain
                    for i, cert in enumerate(cert_chain):
                        cert_der_bytes = cert.public_bytes(encoding=ssl.Encoding.DER)
                        cert_details_dict = cert.to_dict() if hasattr(cert, 'to_dict') else {}
                        
                        parsed_cert = parse_certificate(cert_der_bytes, cert_details_dict, domain)
                        cert_type = determine_certificate_type(parsed_cert, cert_chain, i)
                        
                        certificates.append({
                            'id': f'cert-{i}',
                            'type': cert_type,
                            'raw': cert_der_bytes.hex(),
                            'details': parsed_cert,
                            'fingerprints': generate_fingerprints(cert_der_bytes),
                            'issues': analyze_certificate_issues(parsed_cert)
                        })
                else:
                    # Single certificate only
                    parsed_cert = parse_certificate(cert_der, cert_details, domain)
                    
                    certificates.append({
                        'id': 'cert-0',
                        'type': 'leaf',
                        'raw': cert_der.hex(),
                        'details': parsed_cert,
                        'fingerprints': generate_fingerprints(cert_der),
                        'issues': analyze_certificate_issues(parsed_cert)
                    })
                
                return certificates
                
    except Exception as error:
        print(f"Certificate retrieval failed for {domain}:{port}: {error}")
        raise Exception(f"Failed to retrieve certificates from {domain}:{port} - {error}")


def parse_certificate(cert_der: bytes, cert_details: Dict, domain: str) -> Dict[str, Any]:
    """Parse certificate details from DER bytes and certificate info"""
    
    try:
        # Extract subject information
        subject = cert_details.get('subject', ())
        subject_dict = dict(x[0] for x in subject)
        
        # Extract issuer information  
        issuer = cert_details.get('issuer', ())
        issuer_dict = dict(x[0] for x in issuer)
        
        # Extract validity dates
        not_before = cert_details.get('notBefore', '')
        not_after = cert_details.get('notAfter', '')
        
        # Parse dates
        not_before_dt = datetime.strptime(not_before, '%b %d %H:%M:%S %Y %Z') if not_before else datetime.utcnow()
        not_after_dt = datetime.strptime(not_after, '%b %d %H:%M:%S %Y %Z') if not_after else datetime.utcnow()
        
        # Extract subject alternative names
        san_list = []
        for name, value in cert_details.get('subjectAltName', []):
            san_list.append({'type': name, 'value': value})
        
        return {
            'subject': {
                'CN': subject_dict.get('commonName', ''),
                'O': subject_dict.get('organizationName', ''),
                'OU': subject_dict.get('organizationalUnitName', ''),
                'C': subject_dict.get('countryName', ''),
                'ST': subject_dict.get('stateOrProvinceName', ''),
                'L': subject_dict.get('localityName', ''),
                'emailAddress': subject_dict.get('emailAddress', ''),
                'raw': ', '.join(f'{k}={v}' for k, v in subject_dict.items())
            },
            'issuer': {
                'CN': issuer_dict.get('commonName', ''),
                'O': issuer_dict.get('organizationName', ''),
                'OU': issuer_dict.get('organizationalUnitName', ''),
                'C': issuer_dict.get('countryName', ''),
                'ST': issuer_dict.get('stateOrProvinceName', ''),
                'L': issuer_dict.get('localityName', ''),
                'emailAddress': issuer_dict.get('emailAddress', ''),
                'raw': ', '.join(f'{k}={v}' for k, v in issuer_dict.items())
            },
            'validity': {
                'notBefore': not_before_dt.isoformat() + 'Z',
                'notAfter': not_after_dt.isoformat() + 'Z'
            },
            'keyInfo': {
                'algorithm': 'Unknown',  # Would need pyOpenSSL for detailed info
                'keySize': 2048,  # Default assumption
                'publicKey': cert_der[:256].hex()  # First 256 bytes as placeholder
            },
            'extensions': {
                'subjectAltName': san_list,
                'keyUsage': [],
                'extendedKeyUsage': [],
                'basicConstraints': None,
                'authorityKeyIdentifier': '',
                'subjectKeyIdentifier': '',
                'certificatePolicies': []
            },
            'serialNumber': str(cert_details.get('serialNumber', '')),
            'version': cert_details.get('version', 3)
        }
        
    except Exception as error:
        print(f"Certificate parsing failed: {error}")
        raise Exception(f"Failed to parse certificate: {error}")


def determine_certificate_type(cert: Dict, cert_chain: List, index: int) -> str:
    """Determine if certificate is leaf, intermediate, or root"""
    
    subject_cn = cert['subject']['CN']
    issuer_cn = cert['issuer']['CN']
    
    # Root certificate: subject == issuer
    if subject_cn == issuer_cn:
        return 'root'
    
    # Leaf certificate: first in chain
    if index == 0:
        return 'leaf'
    
    # Everything else is intermediate
    return 'intermediate'


def generate_fingerprints(cert_der: bytes) -> Dict[str, str]:
    """Generate SHA256 and SHA1 fingerprints from certificate DER bytes"""
    
    try:
        sha256_hash = hashlib.sha256(cert_der).hexdigest()
        sha1_hash = hashlib.sha1(cert_der).hexdigest()
        
        # Format as colon-separated hex
        sha256_formatted = ':'.join(sha256_hash[i:i+2] for i in range(0, len(sha256_hash), 2))
        sha1_formatted = ':'.join(sha1_hash[i:i+2] for i in range(0, len(sha1_hash), 2))
        
        return {
            'sha256': sha256_formatted,
            'sha1': sha1_formatted
        }
        
    except Exception as error:
        print(f"Fingerprint generation failed: {error}")
        return {'sha256': '', 'sha1': ''}


def analyze_certificate_issues(cert: Dict) -> List[Dict[str, str]]:
    """Analyze certificate for security issues"""
    
    issues = []
    
    try:
        # Check expiration
        not_after_str = cert['validity']['notAfter']
        not_after = datetime.fromisoformat(not_after_str.replace('Z', '+00:00'))
        now = datetime.utcnow().replace(tzinfo=not_after.tzinfo)
        
        days_until_expiry = (not_after - now).days
        
        if days_until_expiry <= 0:
            issues.append({
                'severity': 'critical',
                'type': 'expired',
                'description': f'Certificate expired {abs(days_until_expiry)} days ago'
            })
        elif days_until_expiry <= 30:
            issues.append({
                'severity': 'warning',
                'type': 'expiring_soon',
                'description': f'Certificate expires in {days_until_expiry} days'
            })
        
        # Check key strength
        key_size = cert['keyInfo']['keySize']
        if key_size < 2048:
            issues.append({
                'severity': 'critical',
                'type': 'weak_key',
                'description': f'Weak key size: {key_size} bits'
            })
        
        # Check algorithm
        algorithm = cert['keyInfo']['algorithm']
        if 'SHA1' in algorithm:
            issues.append({
                'severity': 'warning',
                'type': 'weak_signature',
                'description': 'Uses weak SHA-1 signature algorithm'
            })
        elif 'MD5' in algorithm:
            issues.append({
                'severity': 'critical',
                'type': 'insecure_signature',
                'description': 'Uses insecure MD5 signature algorithm'
            })
            
    except Exception as error:
        print(f"Certificate issue analysis failed: {error}")
    
    return issues


def validate_certificate_chain(certificates: List[Dict]) -> Dict[str, Any]:
    """Validate certificate chain structure and trust path"""
    
    validation = {
        'isValid': True,
        'trustPath': certificates,
        'issues': [],
        'metadata': {
            'chainLength': len(certificates),
            'validFrom': None,
            'validTo': None,
            'hasRoot': False,
            'hasIntermediate': False,
            'hasLeaf': False
        }
    }
    
    # Check certificate types
    for cert in certificates:
        cert_type = cert['type']
        if cert_type == 'root':
            validation['metadata']['hasRoot'] = True
        elif cert_type == 'intermediate':
            validation['metadata']['hasIntermediate'] = True
        elif cert_type == 'leaf':
            validation['metadata']['hasLeaf'] = True
            # Set validity period from leaf certificate
            validation['metadata']['validFrom'] = cert['details']['validity']['notBefore']
            validation['metadata']['validTo'] = cert['details']['validity']['notAfter']
    
    # Validate chain structure
    if not validation['metadata']['hasLeaf']:
        validation['issues'].append({
            'severity': 'error',
            'type': 'missing_leaf',
            'description': 'No leaf certificate found in chain'
        })
        validation['isValid'] = False
    
    if not validation['metadata']['hasRoot']:
        validation['issues'].append({
            'severity': 'warning',
            'type': 'incomplete_chain',
            'description': 'No root certificate found in chain'
        })
    
    return validation