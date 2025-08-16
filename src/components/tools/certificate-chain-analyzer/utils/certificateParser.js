export const parsePEMCertificate = (pemData) => {
  try {
    const base64Data = pemData
      .replace(/-----BEGIN CERTIFICATE-----/g, '')
      .replace(/-----END CERTIFICATE-----/g, '')
      .replace(/\r?\n/g, '');
    
    const binaryData = atob(base64Data);
    const bytes = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
      bytes[i] = binaryData.charCodeAt(i);
    }
    
    return parseX509Certificate(bytes);
  } catch (error) {
    throw new Error(`Failed to parse PEM certificate: ${error.message}`);
  }
};

export const parseX509Certificate = (certBytes) => {
  try {
    const cert = {
      raw: certBytes,
      fingerprints: {
        sha256: '',
        sha1: ''
      },
      subject: {},
      issuer: {},
      validity: {},
      keyInfo: {},
      extensions: {},
      serialNumber: '',
      version: 3
    };

    const asn1 = parseASN1(certBytes);
    if (!asn1 || asn1.tag !== 0x30) {
      throw new Error('Invalid certificate structure');
    }

    const tbsCertificate = asn1.children[0];
    if (!tbsCertificate) {
      throw new Error('Missing TBS certificate');
    }

    let childIndex = 0;

    if (tbsCertificate.children[childIndex] && 
        tbsCertificate.children[childIndex].tag === 0xA0) {
      const versionWrapper = tbsCertificate.children[childIndex];
      if (versionWrapper.children && versionWrapper.children[0]) {
        cert.version = new DataView(versionWrapper.children[0].value.buffer).getUint8(0) + 1;
      }
      childIndex++;
    }

    if (tbsCertificate.children[childIndex]) {
      cert.serialNumber = Array.from(tbsCertificate.children[childIndex].value)
        .map(b => b.toString(16).padStart(2, '0'))
        .join(':');
      childIndex++;
    }

    childIndex++;

    if (tbsCertificate.children[childIndex]) {
      cert.issuer = parseDN(tbsCertificate.children[childIndex]);
      childIndex++;
    }

    if (tbsCertificate.children[childIndex]) {
      cert.validity = parseValidity(tbsCertificate.children[childIndex]);
      childIndex++;
    }

    if (tbsCertificate.children[childIndex]) {
      cert.subject = parseDN(tbsCertificate.children[childIndex]);
      childIndex++;
    }

    if (tbsCertificate.children[childIndex]) {
      cert.keyInfo = parsePublicKeyInfo(tbsCertificate.children[childIndex]);
      childIndex++;
    }

    while (childIndex < tbsCertificate.children.length) {
      const child = tbsCertificate.children[childIndex];
      if (child.tag === 0xA3) {
        cert.extensions = parseExtensions(child);
        break;
      }
      childIndex++;
    }

    cert.fingerprints = generateFingerprints(certBytes);

    return cert;
  } catch (error) {
    throw new Error(`Failed to parse X.509 certificate: ${error.message}`);
  }
};

const parseASN1 = (data, offset = 0) => {
  if (offset >= data.length) return null;

  const tag = data[offset];
  let length = data[offset + 1];
  let headerLength = 2;

  if (length & 0x80) {
    const lengthBytes = length & 0x7F;
    if (lengthBytes === 0) {
      throw new Error('Indefinite length not supported');
    }
    
    length = 0;
    for (let i = 0; i < lengthBytes; i++) {
      length = (length << 8) | data[offset + 2 + i];
    }
    headerLength = 2 + lengthBytes;
  }

  const value = data.slice(offset + headerLength, offset + headerLength + length);
  
  const node = {
    tag,
    length,
    value,
    children: []
  };

  if (tag === 0x30 || tag === 0x31 || (tag & 0xA0) === 0xA0) {
    let childOffset = 0;
    while (childOffset < value.length) {
      const child = parseASN1(value, childOffset);
      if (!child) break;
      
      node.children.push(child);
      childOffset += child.length + (child.tag === 0x30 || child.tag === 0x31 || (child.tag & 0xA0) === 0xA0 ? 
        getHeaderLength(value, childOffset) : getHeaderLength(value, childOffset));
    }
  }

  return node;
};

const getHeaderLength = (data, offset) => {
  if (offset + 1 >= data.length) return 2;
  
  const length = data[offset + 1];
  if (length & 0x80) {
    return 2 + (length & 0x7F);
  }
  return 2;
};

const parseDN = (dnNode) => {
  const dn = {
    CN: '',
    O: '',
    OU: '',
    C: '',
    ST: '',
    L: '',
    emailAddress: '',
    raw: ''
  };

  if (!dnNode || !dnNode.children) return dn;

  const oidMap = {
    '2.5.4.3': 'CN',
    '2.5.4.10': 'O', 
    '2.5.4.11': 'OU',
    '2.5.4.6': 'C',
    '2.5.4.8': 'ST',
    '2.5.4.7': 'L',
    '1.2.840.113549.1.9.1': 'emailAddress'
  };

  const parts = [];

  for (const rdn of dnNode.children) {
    if (rdn.children && rdn.children.length > 0) {
      for (const attr of rdn.children) {
        if (attr.children && attr.children.length >= 2) {
          const oidBytes = attr.children[0].value;
          const oid = parseOID(oidBytes);
          const valueNode = attr.children[1];
          const value = parseStringValue(valueNode);
          
          const field = oidMap[oid];
          if (field && value) {
            dn[field] = value;
            parts.push(`${field}=${value}`);
          }
        }
      }
    }
  }

  dn.raw = parts.join(', ');
  return dn;
};

const parseValidity = (validityNode) => {
  const validity = {
    notBefore: null,
    notAfter: null
  };

  if (!validityNode || !validityNode.children || validityNode.children.length < 2) {
    return validity;
  }

  try {
    validity.notBefore = parseASN1Time(validityNode.children[0]);
    validity.notAfter = parseASN1Time(validityNode.children[1]);
  } catch (error) {
    console.warn('Failed to parse validity dates:', error);
  }

  return validity;
};

const parseASN1Time = (timeNode) => {
  if (!timeNode || !timeNode.value) return null;
  
  const timeStr = new TextDecoder().decode(timeNode.value);
  
  if (timeNode.tag === 0x17) {
    const year = parseInt(timeStr.substr(0, 2));
    const fullYear = year < 50 ? 2000 + year : 1900 + year;
    const month = parseInt(timeStr.substr(2, 2)) - 1;
    const day = parseInt(timeStr.substr(4, 2));
    const hour = parseInt(timeStr.substr(6, 2));
    const minute = parseInt(timeStr.substr(8, 2));
    const second = parseInt(timeStr.substr(10, 2));
    
    return new Date(fullYear, month, day, hour, minute, second);
  } else if (timeNode.tag === 0x18) {
    const year = parseInt(timeStr.substr(0, 4));
    const month = parseInt(timeStr.substr(4, 2)) - 1;
    const day = parseInt(timeStr.substr(6, 2));
    const hour = parseInt(timeStr.substr(8, 2));
    const minute = parseInt(timeStr.substr(10, 2));
    const second = parseInt(timeStr.substr(12, 2));
    
    return new Date(year, month, day, hour, minute, second);
  }
  
  return null;
};

const parsePublicKeyInfo = (pkiNode) => {
  const keyInfo = {
    algorithm: 'Unknown',
    keySize: 0,
    publicKey: null
  };

  if (!pkiNode || !pkiNode.children || pkiNode.children.length < 2) {
    return keyInfo;
  }

  try {
    const algorithmNode = pkiNode.children[0];
    if (algorithmNode && algorithmNode.children && algorithmNode.children[0]) {
      const oid = parseOID(algorithmNode.children[0].value);
      keyInfo.algorithm = getAlgorithmName(oid);
    }

    const publicKeyNode = pkiNode.children[1];
    if (publicKeyNode && publicKeyNode.value) {
      keyInfo.publicKey = publicKeyNode.value;
      keyInfo.keySize = estimateKeySize(keyInfo.algorithm, publicKeyNode.value);
    }
  } catch (error) {
    console.warn('Failed to parse public key info:', error);
  }

  return keyInfo;
};

const parseExtensions = (extensionsNode) => {
  const extensions = {
    subjectAltName: [],
    keyUsage: [],
    extendedKeyUsage: [],
    basicConstraints: null,
    authorityKeyIdentifier: '',
    subjectKeyIdentifier: '',
    certificatePolicies: []
  };

  if (!extensionsNode || !extensionsNode.children || extensionsNode.children.length === 0) {
    return extensions;
  }

  const extensionSequence = extensionsNode.children[0];
  if (!extensionSequence || !extensionSequence.children) {
    return extensions;
  }

  const oidMap = {
    '2.5.29.17': 'subjectAltName',
    '2.5.29.15': 'keyUsage',
    '2.5.29.37': 'extendedKeyUsage',
    '2.5.29.19': 'basicConstraints',
    '2.5.29.35': 'authorityKeyIdentifier',
    '2.5.29.14': 'subjectKeyIdentifier',
    '2.5.29.32': 'certificatePolicies'
  };

  for (const ext of extensionSequence.children) {
    if (ext.children && ext.children.length >= 2) {
      try {
        const oid = parseOID(ext.children[0].value);
        const extName = oidMap[oid];
        
        let valueIndex = 1;
        let critical = false;
        
        if (ext.children[1].tag === 0x01) {
          critical = ext.children[1].value[0] !== 0;
          valueIndex = 2;
        }
        
        if (extName && ext.children[valueIndex]) {
          const extValue = ext.children[valueIndex].value;
          extensions[extName] = parseExtensionValue(extName, extValue);
        }
      } catch (error) {
        console.warn('Failed to parse extension:', error);
      }
    }
  }

  return extensions;
};

const parseExtensionValue = (extName, value) => {
  try {
    const asn1Value = parseASN1(value);
    
    switch (extName) {
      case 'subjectAltName':
        return parseSubjectAltName(asn1Value);
      case 'keyUsage':
        return parseKeyUsage(value);
      case 'basicConstraints':
        return parseBasicConstraints(asn1Value);
      default:
        return value;
    }
  } catch (error) {
    console.warn(`Failed to parse ${extName} extension:`, error);
    return null;
  }
};

const parseSubjectAltName = (sanNode) => {
  const names = [];
  
  if (!sanNode || !sanNode.children) return names;
  
  for (const child of sanNode.children) {
    try {
      const name = new TextDecoder().decode(child.value);
      names.push({
        type: getSanType(child.tag),
        value: name
      });
    } catch (error) {
      console.warn('Failed to parse SAN entry:', error);
    }
  }
  
  return names;
};

const getSanType = (tag) => {
  const types = {
    0x82: 'DNS',
    0x87: 'IP',
    0x81: 'email',
    0x86: 'URI'
  };
  return types[tag] || 'unknown';
};

const parseKeyUsage = (value) => {
  if (!value || value.length === 0) return [];
  
  const usages = [];
  const bits = value[0];
  
  const keyUsageNames = [
    'Digital Signature',
    'Non Repudiation', 
    'Key Encipherment',
    'Data Encipherment',
    'Key Agreement',
    'Key Cert Sign',
    'CRL Sign',
    'Encipher Only'
  ];
  
  for (let i = 0; i < 8; i++) {
    if (bits & (0x80 >> i)) {
      usages.push(keyUsageNames[i]);
    }
  }
  
  return usages;
};

const parseBasicConstraints = (bcNode) => {
  if (!bcNode || !bcNode.children) return null;
  
  const constraints = {
    isCA: false,
    pathLenConstraint: null
  };
  
  for (const child of bcNode.children) {
    if (child.tag === 0x01) {
      constraints.isCA = child.value[0] !== 0;
    } else if (child.tag === 0x02) {
      constraints.pathLenConstraint = new DataView(child.value.buffer).getUint8(0);
    }
  }
  
  return constraints;
};

const parseOID = (oidBytes) => {
  if (!oidBytes || oidBytes.length === 0) return '';
  
  const oid = [];
  let value = oidBytes[0];
  oid.push(Math.floor(value / 40));
  oid.push(value % 40);
  
  let current = 0;
  for (let i = 1; i < oidBytes.length; i++) {
    const byte = oidBytes[i];
    current = (current << 7) | (byte & 0x7F);
    
    if ((byte & 0x80) === 0) {
      oid.push(current);
      current = 0;
    }
  }
  
  return oid.join('.');
};

const parseStringValue = (valueNode) => {
  if (!valueNode || !valueNode.value) return '';
  
  try {
    return new TextDecoder('utf-8').decode(valueNode.value);
  } catch (error) {
    return Array.from(valueNode.value)
      .map(b => String.fromCharCode(b))
      .join('');
  }
};

const getAlgorithmName = (oid) => {
  const algorithms = {
    '1.2.840.113549.1.1.1': 'RSA',
    '1.2.840.113549.1.1.5': 'SHA1withRSA',
    '1.2.840.113549.1.1.11': 'SHA256withRSA',
    '1.2.840.113549.1.1.12': 'SHA384withRSA',
    '1.2.840.113549.1.1.13': 'SHA512withRSA',
    '1.2.840.10045.2.1': 'ECDSA',
    '1.2.840.10045.4.3.2': 'SHA256withECDSA',
    '1.2.840.10045.4.3.3': 'SHA384withECDSA',
    '1.2.840.10045.4.3.4': 'SHA512withECDSA'
  };
  
  return algorithms[oid] || oid;
};

const estimateKeySize = (algorithm, publicKeyBytes) => {
  if (!publicKeyBytes || publicKeyBytes.length === 0) return 0;
  
  if (algorithm.includes('RSA')) {
    return (publicKeyBytes.length - 1) * 8;
  } else if (algorithm.includes('ECDSA') || algorithm.includes('EC')) {
    const size = publicKeyBytes.length * 4;
    if (size <= 256) return 256;
    if (size <= 384) return 384;
    return 521;
  }
  
  return publicKeyBytes.length * 8;
};

const generateFingerprints = async (certBytes) => {
  try {
    const sha256Hash = await crypto.subtle.digest('SHA-256', certBytes);
    const sha1Hash = await crypto.subtle.digest('SHA-1', certBytes);
    
    return {
      sha256: Array.from(new Uint8Array(sha256Hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(':'),
      sha1: Array.from(new Uint8Array(sha1Hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(':')
    };
  } catch (error) {
    console.warn('Failed to generate fingerprints:', error);
    return { sha256: '', sha1: '' };
  }
};

export const extractCertificatesFromPEM = (pemData) => {
  const certRegex = /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g;
  const matches = pemData.match(certRegex);
  
  if (!matches) {
    throw new Error('No certificates found in PEM data');
  }
  
  return matches.map(cert => cert.trim());
};

export const detectCertificateFormat = (data) => {
  if (typeof data === 'string') {
    if (data.includes('-----BEGIN CERTIFICATE-----')) {
      return 'PEM';
    }
    if (data.includes('-----BEGIN PKCS7-----')) {
      return 'PKCS7_PEM';
    }
  }
  
  if (data instanceof Uint8Array || data instanceof ArrayBuffer) {
    const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
    
    if (bytes[0] === 0x30 && bytes[1] === 0x82) {
      return 'DER';
    }
    
    if (bytes[0] === 0x30 && bytes[1] === 0x80) {
      return 'PKCS7_DER';
    }
  }
  
  return 'UNKNOWN';
};