/**
 * The base64 codec, extracted verbatim from `Base64ToolShadcn.jsx` so it can
 * be tested (Deferred test coverage §B — this code had no Phase 0 cover).
 *
 * Pure: no React, no DOM beyond `btoa`/`atob`, which Node ≥20 also provides.
 *
 * ⚠️ The UTF-8 mechanism is `btoa(unescape(encodeURIComponent(text)))` and its
 * mirror. `escape`/`unescape` are deprecated, and the obvious modernisation is
 * `TextEncoder` — which is NOT byte-identical: a lone surrogate makes
 * `encodeURIComponent` throw today, where `TextEncoder` would silently emit
 * U+FFFD. The suite pins the current behaviour; do not swap the mechanism
 * without updating the fixtures and logging it in BEHAVIOR_CHANGES.md.
 */

export const FILE_EXTENSIONS = {
  text: ['.txt', '.json', '.xml', '.csv', '.log'],
  image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'],
  document: ['.pdf', '.doc', '.docx', '.xls', '.xlsx'],
  other: [],
};

export function getFileType(filename) {
  if (!filename) return 'other';
  const ext = '.' + filename.split('.').pop().toLowerCase();

  for (const [type, extensions] of Object.entries(FILE_EXTENSIONS)) {
    if (extensions.includes(ext)) {
      return type;
    }
  }
  return 'other';
}

export function detectBase64(text) {
  if (!text || text.length < 4) return false;

  const cleanText = text.replace(/\s/g, '');
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  const urlSafeBase64Regex = /^[A-Za-z0-9_-]*={0,2}$/;
  const hasValidLength = cleanText.length % 4 === 0;

  return hasValidLength && (base64Regex.test(cleanText) || urlSafeBase64Regex.test(cleanText));
}

export function isBase64Image(base64String) {
  if (!base64String) return false;

  if (base64String.startsWith('data:image/')) {
    return true;
  }

  try {
    const cleanBase64 = base64String.replace(/\s/g, '');

    if (cleanBase64.length > 100 && /^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
      const imageSignatures = [
        '/9j/', '/9k/', '/+0/',     // JPEG
        'iVBORw0KGgo',             // PNG
        'R0lGODlh', 'R0lGODdh',    // GIF
        'UklGR',                    // WebP
        'PHN2Zw', 'PD94bWw',       // SVG
        'Qk0',                      // BMP
        'SUkq', 'TU0A'             // TIFF
      ];

      const isImageSignature = imageSignatures.some(sig => cleanBase64.startsWith(sig));

      let isSvgContent = false;
      try {
        const decoded = atob(cleanBase64);
        isSvgContent = decoded.includes('<svg') || decoded.includes('xmlns="http://www.w3.org/2000/svg"');
      } catch {
        // Ignore decode errors
      }

      const isLikelyImage = cleanBase64.length > 1000 && cleanBase64.length % 4 === 0;

      return isImageSignature || isSvgContent || isLikelyImage;
    }
  } catch (error) {
    console.log('Base64 image detection error:', error);
    return false;
  }

  return false;
}

export function createImagePreviewUrl(base64String, mimeType = null) {
  try {
    if (base64String.startsWith('data:')) {
      return base64String;
    }

    const cleanBase64 = base64String.replace(/\s/g, '');

    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
      return null;
    }

    try {
      atob(cleanBase64);
    } catch {
      return null;
    }

    let detectedMimeType = mimeType;
    if (!detectedMimeType) {
      if (cleanBase64.startsWith('/9j/') || cleanBase64.startsWith('/9k/') || cleanBase64.startsWith('/+0/')) detectedMimeType = 'image/jpeg';
      else if (cleanBase64.startsWith('iVBORw0KGgo')) detectedMimeType = 'image/png';
      else if (cleanBase64.startsWith('R0lGODlh') || cleanBase64.startsWith('R0lGODdh')) detectedMimeType = 'image/gif';
      else if (cleanBase64.startsWith('UklGR')) detectedMimeType = 'image/webp';
      else if (cleanBase64.startsWith('PHN2Zw') || cleanBase64.startsWith('PD94bWw')) detectedMimeType = 'image/svg+xml';
      else if (cleanBase64.startsWith('Qk0')) detectedMimeType = 'image/bmp';
      else {
        try {
          const decoded = atob(cleanBase64);
          if (decoded.includes('<svg') || decoded.includes('xmlns="http://www.w3.org/2000/svg"')) {
            detectedMimeType = 'image/svg+xml';
          } else {
            return null;
          }
        } catch {
          return null;
        }
      }
    }

    return `data:${detectedMimeType};base64,${cleanBase64}`;

  } catch (error) {
    console.log('Error creating image preview URL:', error);
    return null;
  }
}

export function encodeBase64(text, type) {
  try {
    let encoded;

    switch (type) {
      case 'standard':
        encoded = btoa(unescape(encodeURIComponent(text)));
        break;
      case 'urlsafe':
        encoded = btoa(unescape(encodeURIComponent(text)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');
        break;
      case 'mime':
        encoded = btoa(unescape(encodeURIComponent(text)));
        encoded = encoded.match(/.{1,76}/g)?.join('\n') || encoded;
        break;
      default:
        encoded = btoa(unescape(encodeURIComponent(text)));
    }

    return encoded;
  } catch (error) {
    throw new Error(`Encoding failed: ${error.message}`);
  }
}

export function decodeBase64(text, type) {
  try {
    let cleanText = text.replace(/\s/g, '');

    switch (type) {
      case 'urlsafe':
        cleanText = cleanText
          .replace(/-/g, '+')
          .replace(/_/g, '/');
        while (cleanText.length % 4) {
          cleanText += '=';
        }
        break;
      case 'mime':
        break;
    }

    const decoded = atob(cleanText);

    if (isBase64Image(decoded)) {
      return decodeURIComponent(escape(atob(decoded)));
    }

    return decodeURIComponent(escape(decoded));
  } catch (error) {
    throw new Error(`Decoding failed: ${error.message}`);
  }
}
