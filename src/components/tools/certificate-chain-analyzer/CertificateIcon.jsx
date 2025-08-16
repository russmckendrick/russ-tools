import React from 'react';
import { IconCertificate } from '@tabler/icons-react';

const CertificateIcon = ({ className = "w-6 h-6", ...props }) => {
  return <IconCertificate className={className} {...props} />;
};

export default CertificateIcon;