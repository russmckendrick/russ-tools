export const validateCertificateChain = (certificates) => {
  const validation = {
    isValid: false,
    trustPath: [],
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

  if (!certificates || certificates.length === 0) {
    validation.issues.push({
      severity: 'error',
      type: 'empty_chain',
      description: 'No certificates provided for validation'
    });
    return validation;
  }

  validation.metadata.chainLength = certificates.length;
  validation.metadata.hasRoot = certificates.some(cert => cert.type === 'root');
  validation.metadata.hasIntermediate = certificates.some(cert => cert.type === 'intermediate');
  validation.metadata.hasLeaf = certificates.some(cert => cert.type === 'leaf');

  const leafCert = certificates.find(cert => cert.type === 'leaf');
  if (leafCert) {
    validation.metadata.validFrom = leafCert.details.validity.notBefore;
    validation.metadata.validTo = leafCert.details.validity.notAfter;
  }

  const chainValidation = validateChainContinuity(certificates);
  validation.issues.push(...chainValidation.issues);
  validation.trustPath = chainValidation.trustPath;

  const temporalValidation = validateTemporalConstraints(certificates);
  validation.issues.push(...temporalValidation.issues);

  const signatureValidation = validateSignatures(certificates);
  validation.issues.push(...signatureValidation.issues);

  const nameValidation = validateNameConstraints(certificates);
  validation.issues.push(...nameValidation.issues);

  const pathValidation = validatePathConstraints(certificates);
  validation.issues.push(...pathValidation.issues);

  validation.isValid = validation.issues.filter(issue => issue.severity === 'error').length === 0;

  return validation;
};

const validateChainContinuity = (certificates) => {
  const result = {
    trustPath: [],
    issues: []
  };

  if (certificates.length === 0) {
    return result;
  }

  const certMap = new Map();
  certificates.forEach(cert => {
    const subjectKey = cert.details.subject.raw || cert.details.subject.CN;
    certMap.set(subjectKey, cert);
  });

  let currentCert = certificates.find(cert => cert.type === 'leaf');
  if (!currentCert) {
    result.issues.push({
      severity: 'error',
      type: 'missing_leaf',
      description: 'No leaf certificate found in chain'
    });
    return result;
  }

  result.trustPath.push(currentCert);
  const visited = new Set();
  visited.add(currentCert.details.subject.raw || currentCert.details.subject.CN);

  while (currentCert && !isSelfSigned(currentCert)) {
    const issuerKey = currentCert.details.issuer.raw || currentCert.details.issuer.CN;
    
    if (visited.has(issuerKey)) {
      result.issues.push({
        severity: 'error',
        type: 'circular_chain',
        description: `Circular reference detected in certificate chain at ${issuerKey}`
      });
      break;
    }

    const issuerCert = findIssuerCertificate(currentCert, certificates);
    
    if (!issuerCert) {
      result.issues.push({
        severity: 'warning',
        type: 'incomplete_chain',
        description: `Missing issuer certificate for ${currentCert.details.subject.CN}`
      });
      break;
    }

    if (!verifyIssuerSubjectMatch(currentCert, issuerCert)) {
      result.issues.push({
        severity: 'error',
        type: 'issuer_mismatch',
        description: `Issuer name mismatch between ${currentCert.details.subject.CN} and ${issuerCert.details.subject.CN}`
      });
    }

    result.trustPath.push(issuerCert);
    visited.add(issuerKey);
    currentCert = issuerCert;
  }

  if (currentCert && isSelfSigned(currentCert) && currentCert.type !== 'root') {
    result.issues.push({
      severity: 'warning',
      type: 'self_signed_non_root',
      description: 'Self-signed certificate found that is not marked as root'
    });
  }

  return result;
};

const validateTemporalConstraints = (certificates) => {
  const result = { issues: [] };
  const now = new Date();

  certificates.forEach(cert => {
    const { validity } = cert.details;
    
    if (!validity.notBefore || !validity.notAfter) {
      result.issues.push({
        severity: 'error',
        type: 'invalid_validity_period',
        description: `Certificate ${cert.details.subject.CN} has invalid validity period`
      });
      return;
    }

    if (now < validity.notBefore) {
      result.issues.push({
        severity: 'error',
        type: 'not_yet_valid',
        description: `Certificate ${cert.details.subject.CN} is not yet valid (valid from ${validity.notBefore.toISOString()})`
      });
    }

    if (now > validity.notAfter) {
      result.issues.push({
        severity: 'error',
        type: 'expired',
        description: `Certificate ${cert.details.subject.CN} has expired (expired on ${validity.notAfter.toISOString()})`
      });
    }

    const daysUntilExpiry = Math.ceil((validity.notAfter - now) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
      result.issues.push({
        severity: 'warning',
        type: 'expiring_soon',
        description: `Certificate ${cert.details.subject.CN} expires in ${daysUntilExpiry} days`
      });
    }

    const validityPeriodDays = Math.ceil((validity.notAfter - validity.notBefore) / (1000 * 60 * 60 * 24));
    if (validityPeriodDays > 825) {
      result.issues.push({
        severity: 'warning',
        type: 'long_validity_period',
        description: `Certificate ${cert.details.subject.CN} has validity period longer than recommended (${validityPeriodDays} days)`
      });
    }
  });

  return result;
};

const validateSignatures = (certificates) => {
  const result = { issues: [] };

  certificates.forEach(cert => {
    const algorithm = cert.details.keyInfo.algorithm;
    
    if (algorithm.includes('SHA1')) {
      result.issues.push({
        severity: 'warning',
        type: 'weak_signature_algorithm',
        description: `Certificate ${cert.details.subject.CN} uses weak SHA-1 signature algorithm`
      });
    }

    if (algorithm.includes('MD5')) {
      result.issues.push({
        severity: 'error',
        type: 'insecure_signature_algorithm',
        description: `Certificate ${cert.details.subject.CN} uses insecure MD5 signature algorithm`
      });
    }

    if (algorithm.includes('RSA')) {
      const keySize = cert.details.keyInfo.keySize;
      if (keySize < 2048) {
        result.issues.push({
          severity: 'error',
          type: 'weak_key_size',
          description: `Certificate ${cert.details.subject.CN} uses weak RSA key size (${keySize} bits)`
        });
      } else if (keySize < 3072) {
        result.issues.push({
          severity: 'warning',
          type: 'deprecated_key_size',
          description: `Certificate ${cert.details.subject.CN} uses deprecated RSA key size (${keySize} bits)`
        });
      }
    }

    if (algorithm.includes('ECDSA') || algorithm.includes('EC')) {
      const keySize = cert.details.keyInfo.keySize;
      if (keySize < 256) {
        result.issues.push({
          severity: 'error',
          type: 'weak_ec_key_size',
          description: `Certificate ${cert.details.subject.CN} uses weak EC key size (${keySize} bits)`
        });
      }
    }
  });

  return result;
};

const validateNameConstraints = (certificates) => {
  const result = { issues: [] };

  certificates.forEach(cert => {
    const { subject, extensions } = cert.details;

    if (!subject.CN && (!extensions.subjectAltName || extensions.subjectAltName.length === 0)) {
      result.issues.push({
        severity: 'error',
        type: 'missing_subject_names',
        description: `Certificate has no Common Name or Subject Alternative Names`
      });
    }

    if (subject.CN && subject.CN.includes('*')) {
      const wildcardParts = subject.CN.split('.');
      if (wildcardParts[0] !== '*' || wildcardParts.length < 3) {
        result.issues.push({
          severity: 'warning',
          type: 'invalid_wildcard',
          description: `Invalid wildcard certificate format: ${subject.CN}`
        });
      }
    }

    if (extensions.subjectAltName) {
      extensions.subjectAltName.forEach(san => {
        if (san.type === 'DNS' && san.value.includes('*')) {
          const wildcardParts = san.value.split('.');
          if (wildcardParts[0] !== '*' || wildcardParts.length < 3) {
            result.issues.push({
              severity: 'warning',
              type: 'invalid_wildcard_san',
              description: `Invalid wildcard in SAN: ${san.value}`
            });
          }
        }
      });
    }
  });

  return result;
};

const validatePathConstraints = (certificates) => {
  const result = { issues: [] };

  const caCerts = certificates.filter(cert => 
    cert.details.extensions.basicConstraints?.isCA === true
  );

  let pathLength = 0;
  for (const cert of certificates) {
    if (cert.type === 'intermediate') {
      pathLength++;
    }

    const basicConstraints = cert.details.extensions.basicConstraints;
    if (basicConstraints?.isCA && basicConstraints.pathLenConstraint !== null) {
      if (pathLength > basicConstraints.pathLenConstraint) {
        result.issues.push({
          severity: 'error',
          type: 'path_length_exceeded',
          description: `Path length constraint violated by ${cert.details.subject.CN} (${pathLength} > ${basicConstraints.pathLenConstraint})`
        });
      }
    }
  }

  certificates.forEach(cert => {
    const { extensions } = cert.details;
    
    if (cert.type === 'leaf' && extensions.basicConstraints?.isCA === true) {
      result.issues.push({
        severity: 'warning',
        type: 'leaf_marked_as_ca',
        description: `Leaf certificate ${cert.details.subject.CN} is marked as a CA`
      });
    }

    if (cert.type === 'root' || cert.type === 'intermediate') {
      if (!extensions.basicConstraints?.isCA) {
        result.issues.push({
          severity: 'error',
          type: 'ca_not_marked',
          description: `CA certificate ${cert.details.subject.CN} is not marked as CA in basic constraints`
        });
      }

      if (!extensions.keyUsage?.includes('Key Cert Sign')) {
        result.issues.push({
          severity: 'error',
          type: 'ca_missing_key_cert_sign',
          description: `CA certificate ${cert.details.subject.CN} missing Key Cert Sign usage`
        });
      }
    }
  });

  return result;
};

const findIssuerCertificate = (cert, certificates) => {
  const issuerName = cert.details.issuer.raw || cert.details.issuer.CN;
  
  return certificates.find(candidate => {
    const subjectName = candidate.details.subject.raw || candidate.details.subject.CN;
    return subjectName === issuerName;
  });
};

const verifyIssuerSubjectMatch = (cert, issuer) => {
  const certIssuerName = cert.details.issuer.raw || cert.details.issuer.CN;
  const issuerSubjectName = issuer.details.subject.raw || issuer.details.subject.CN;
  
  return certIssuerName === issuerSubjectName;
};

const isSelfSigned = (cert) => {
  const subjectName = cert.details.subject.raw || cert.details.subject.CN;
  const issuerName = cert.details.issuer.raw || cert.details.issuer.CN;
  
  return subjectName === issuerName;
};

export const determineCertificateType = (cert, allCertificates) => {
  if (isSelfSigned(cert)) {
    return 'root';
  }

  const isIssuedByAnother = allCertificates.some(other => 
    other !== cert && 
    (other.details.subject.raw || other.details.subject.CN) === (cert.details.issuer.raw || cert.details.issuer.CN)
  );

  const issuesOthers = allCertificates.some(other =>
    other !== cert &&
    (other.details.issuer.raw || other.details.issuer.CN) === (cert.details.subject.raw || cert.details.subject.CN)
  );

  if (isIssuedByAnother && issuesOthers) {
    return 'intermediate';
  }

  if (isIssuedByAnother && !issuesOthers) {
    return 'leaf';
  }

  if (!isIssuedByAnother && issuesOthers) {
    return 'root';
  }

  return 'leaf';
};

export const buildCertificateChain = (certificates) => {
  const typedCertificates = certificates.map(cert => ({
    ...cert,
    type: determineCertificateType(cert, certificates)
  }));

  const sortedCertificates = typedCertificates.sort((a, b) => {
    const typeOrder = { root: 0, intermediate: 1, leaf: 2 };
    return typeOrder[a.type] - typeOrder[b.type];
  });

  return sortedCertificates;
};