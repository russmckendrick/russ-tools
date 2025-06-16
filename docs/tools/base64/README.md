# Base64 Encoder/Decoder

## Overview

The Base64 Encoder/Decoder is a comprehensive tool for encoding and decoding text and files using Base64 encoding with support for multiple encoding variants. It features intelligent image handling, drag-and-drop file upload, real-time validation, and supports various Base64 standards including standard, URL-safe, and MIME encodings.

## Purpose

This tool addresses essential data encoding and decoding needs:
- **Text Encoding**: Convert plain text to Base64 for data transmission
- **File Processing**: Encode images and documents for web applications
- **Data Validation**: Verify Base64 integrity and format compliance
- **Image Handling**: Preview and process Base64-encoded images
- **Development Support**: Integration with web development workflows

## Key Features

### 1. Dual Mode Operation
- **Encode Mode**: Convert text and files to Base64 format
- **Decode Mode**: Convert Base64 back to original format
- **Automatic Detection**: Smart detection of Base64 content
- **Toggle Switch**: Easy switching between encode and decode modes

### 2. Multiple Encoding Standards
- **Standard Base64**: RFC 4648 standard encoding with `+/=` characters
- **URL-Safe Base64**: Web-friendly encoding with `-_` characters (no padding)
- **MIME Base64**: Email-compatible encoding with line breaks every 76 characters
- **Format Validation**: Automatic detection and validation of encoding types

### 3. Advanced File Handling
- **Drag-and-Drop Upload**: Intuitive file upload interface
- **Multiple File Types**: Support for text, images, documents (up to 15MB)
- **Image Preview**: Live preview of uploaded and processed images
- **File Type Detection**: Automatic detection of file types and appropriate handling

### 4. Intelligent Image Processing
- **Format Detection**: Automatic detection of Base64-encoded images
- **Image Preview**: Real-time preview of images during encoding/decoding
- **Multiple Formats**: Support for JPEG, PNG, GIF, WebP, BMP, SVG
- **Data URL Handling**: Proper data URL format generation and parsing

### 5. User Experience Features
- **Real-time Validation**: Instant feedback on Base64 validity
- **Copy/Paste Integration**: Seamless clipboard integration
- **Download Options**: Save results as files or images
- **Responsive Design**: Optimized for all device sizes

## Usage Instructions

### Basic Text Encoding

1. **Select Mode**
   - Toggle to "Encode" mode for text-to-Base64 conversion
   - Choose encoding type (Standard, URL-Safe, or MIME)

2. **Input Text**
   - Type or paste text into the input field
   - Or use clipboard paste functionality
   - Text is validated in real-time

3. **Generate Base64**
   - Click "Encode" button to convert
   - Result appears instantly in output field
   - Copy button available for easy copying

### File Upload and Processing

1. **Upload Files**
   - Drag files onto the drop zone
   - Or click to browse and select files
   - Supports text files, images, documents up to 15MB

2. **Image Handling**
   - Images show preview in input section
   - Encoding preserves image data in Base64 format
   - Output shows both Base64 text and image preview

3. **Download Results**
   - Download encoded text as .txt file
   - Download decoded images in original format
   - Maintain original file extensions and types

### Base64 Decoding

1. **Input Base64**
   - Paste Base64-encoded text into input field
   - Tool automatically detects Base64 format
   - Validation provides immediate feedback

2. **Decode Content**
   - Click "Decode" button to convert back
   - Images show preview when decoded
   - Text content displays in output field

3. **Save Results**
   - Download decoded files in original format
   - Copy decoded text to clipboard
   - Images saved with proper file extensions

## Technical Implementation

### Architecture

```
Base64Tool (Main Component)
├── Mode Selection - Encode/Decode toggle
├── Encoding Type Selection - Standard/URL-Safe/MIME
├── File Upload - Drag-and-drop interface
├── Input Processing - Text and file handling
├── Format Detection - Base64 and image detection
├── Preview System - Image preview functionality
└── Output Generation - Result formatting and download
```

### Base64 Processing

#### Encoding Functions
```javascript
const encodeBase64 = (text, type) => {
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
      // Add line breaks every 76 characters
      encoded = encoded.match(/.{1,76}/g)?.join('\n') || encoded;
      break;
  }
  
  return encoded;
};
```

#### Decoding Functions
```javascript
const decodeBase64 = (text, type) => {
  let cleanText = text.replace(/\s/g, ''); // Remove whitespace
  
  switch (type) {
    case 'urlsafe':
      // Convert URL-safe back to standard
      cleanText = cleanText
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      // Add padding if needed
      while (cleanText.length % 4) {
        cleanText += '=';
      }
      break;
      
    case 'mime':
      // MIME format already cleaned of whitespace
      break;
  }
  
  const decoded = atob(cleanText);
  return decodeURIComponent(escape(decoded));
};
```

### Image Detection and Processing

#### Base64 Image Detection
```javascript
const isBase64Image = (base64String) => {
  if (!base64String) return false;
  
  // Check for data URL prefix
  if (base64String.startsWith('data:image/')) {
    return true;
  }
  
  // Check for image file signatures in base64
  const imageSignatures = [
    '/9j/', // JPEG
    'iVBORw0KGgo', // PNG
    'R0lGODlh', // GIF87a
    'R0lGODdh', // GIF89a
    'UklGR', // WebP
    'PHN2Zw', // SVG
    'Qk0', // BMP
  ];
  
  const cleanBase64 = base64String.replace(/\s/g, '');
  return imageSignatures.some(sig => cleanBase64.startsWith(sig));
};
```

#### Image Preview Generation
```javascript
const createImagePreviewUrl = (base64String, mimeType = null) => {
  try {
    if (base64String.startsWith('data:')) {
      return base64String;
    }
    
    const cleanBase64 = base64String.replace(/\s/g, '');
    
    // Auto-detect MIME type from base64 signature
    let detectedMimeType = mimeType;
    if (!detectedMimeType) {
      if (cleanBase64.startsWith('/9j/')) detectedMimeType = 'image/jpeg';
      else if (cleanBase64.startsWith('iVBORw0KGgo')) detectedMimeType = 'image/png';
      else if (cleanBase64.startsWith('R0lGODlh')) detectedMimeType = 'image/gif';
      else if (cleanBase64.startsWith('UklGR')) detectedMimeType = 'image/webp';
      else if (cleanBase64.startsWith('PHN2Zw')) detectedMimeType = 'image/svg+xml';
      else if (cleanBase64.startsWith('Qk0')) detectedMimeType = 'image/bmp';
    }
    
    return `data:${detectedMimeType};base64,${cleanBase64}`;
  } catch (error) {
    console.error('Error creating image preview:', error);
    return null;
  }
};
```

### File Processing

#### File Type Detection
```javascript
const getFileType = (filename) => {
  if (!filename) return 'other';
  const ext = '.' + filename.split('.').pop().toLowerCase();
  
  const fileTypes = {
    text: ['.txt', '.json', '.xml', '.csv', '.log', '.md'],
    image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'],
    document: ['.pdf', '.doc', '.docx', '.xls', '.xlsx']
  };
  
  for (const [type, extensions] of Object.entries(fileTypes)) {
    if (extensions.includes(ext)) {
      return type;
    }
  }
  return 'other';
};
```

#### File Upload Handling
```javascript
const handleFileSelect = async (file) => {
  const fileType = getFileType(file.name);
  
  if (fileType === 'image') {
    // Create preview and read as base64
    const imageUrl = URL.createObjectURL(file);
    setInputImagePreview(imageUrl);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result.split(',')[1]; // Remove data URL prefix
      setFileContent(base64);
      setInputText(base64);
    };
    reader.readAsDataURL(file);
  } else if (fileType === 'text' || file.size < 1024 * 1024) {
    // Read text files directly
    const text = await file.text();
    setFileContent(text);
    setInputText(text);
  } else {
    // Read binary files as base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result.split(',')[1];
      setFileContent(base64);
      setInputText(base64);
    };
    reader.readAsDataURL(file);
  }
};
```

### Format Validation

#### Base64 Validation
```javascript
const detectBase64 = (text) => {
  if (!text || text.length < 4) return false;
  
  const cleanText = text.replace(/\s/g, '');
  
  // Base64 pattern validation
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  const urlSafeBase64Regex = /^[A-Za-z0-9_-]*={0,2}$/;
  
  // Must be divisible by 4 (with padding)
  const hasValidLength = cleanText.length % 4 === 0;
  
  return hasValidLength && (
    base64Regex.test(cleanText) || 
    urlSafeBase64Regex.test(cleanText)
  );
};
```

## API Integration

### File System APIs
```javascript
// File reading capabilities
const readFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    
    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  });
};

// File download functionality
const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
```

### Clipboard Integration
```javascript
// Copy to clipboard
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    showNotification('Copied to clipboard', 'success');
  } catch (error) {
    showNotification('Failed to copy to clipboard', 'error');
  }
};

// Paste from clipboard
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText();
    setInputText(text);
  } catch (error) {
    showNotification('Failed to paste from clipboard', 'error');
  }
};
```

## Data Storage and Privacy

### Performance Considerations
- **No History Storage**: Large file processing without history tracking
- **Memory Management**: Efficient handling of large files
- **Client-Side Only**: All processing happens in browser
- **No Server Communication**: Complete privacy and security

### File Size Limitations
- **Maximum Size**: 15MB per file for optimal performance
- **Browser Limits**: Constrained by available browser memory
- **Chunked Processing**: Large files processed in chunks (planned)

### Security Features
- **Input Validation**: Comprehensive validation of all inputs
- **File Type Verification**: MIME type validation for uploads
- **Error Handling**: Secure error handling prevents data exposure
- **No External Requests**: All processing happens locally

## Performance Considerations

### Optimization Strategies
- **Lazy Loading**: Components loaded as needed
- **Memory Management**: Efficient handling of large Base64 strings
- **Progressive Processing**: Large files processed incrementally
- **Error Recovery**: Graceful handling of processing failures

### Browser Compatibility
- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+
- **Required APIs**: FileReader, Blob, Canvas (for image processing)
- **Mobile Support**: Full functionality on mobile browsers
- **Fallback Options**: Graceful degradation for older browsers

### Memory Usage
- **Large Files**: Memory usage scales with file size
- **Image Processing**: Additional memory for image previews
- **Garbage Collection**: Automatic cleanup of temporary objects
- **Memory Limits**: Browser-imposed memory constraints

## Use Cases and Examples

### Web Development
```javascript
// Embedding images in CSS or HTML
const imageToDataURL = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataURL = e.target.result;
    console.log(`background-image: url(${dataURL});`);
  };
  reader.readAsDataURL(file);
};
```

### Data Transmission
```javascript
// Encoding data for API transmission
const encodeForAPI = (data) => {
  const jsonString = JSON.stringify(data);
  return btoa(unescape(encodeURIComponent(jsonString)));
};

// Decoding received data
const decodeFromAPI = (base64Data) => {
  const jsonString = decodeURIComponent(escape(atob(base64Data)));
  return JSON.parse(jsonString);
};
```

### Email Attachments
```javascript
// Preparing file for email attachment
const prepareEmailAttachment = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = e.target.result.split(',')[1];
    const mimeType = file.type;
    
    // Format for email attachment
    const attachment = {
      filename: file.name,
      contentType: mimeType,
      data: base64
    };
    
    return attachment;
  };
  reader.readAsDataURL(file);
};
```

## Troubleshooting

### Common Issues

1. **Invalid Base64 Error**
   - Check for proper Base64 format
   - Ensure correct encoding type (standard vs URL-safe)
   - Verify string length is multiple of 4 (for standard Base64)

2. **Large File Processing**
   - Files over 15MB may cause browser memory issues
   - Break large files into smaller chunks
   - Use server-side processing for very large files

3. **Image Display Issues**
   - Verify image is properly Base64 encoded
   - Check MIME type detection accuracy
   - Ensure browser supports image format

### Error Resolution
```javascript
const errorResolutionGuide = {
  'INVALID_BASE64': 'Check Base64 format and encoding type',
  'FILE_TOO_LARGE': 'Reduce file size or use chunked processing',
  'UNSUPPORTED_FORMAT': 'Convert to supported file format',
  'MEMORY_ERROR': 'Close other browser tabs and try again',
  'DECODE_ERROR': 'Verify Base64 string is complete and valid'
};
```

### Browser-Specific Issues
- **Safari**: May have stricter file handling restrictions
- **Firefox**: Different clipboard API behavior
- **Chrome**: Most compatible with all features
- **Mobile**: Limited file system access on some platforms

## Best Practices

### File Handling
1. **Size Limits**: Keep files under 15MB for best performance
2. **Format Validation**: Always validate input formats
3. **Error Handling**: Implement comprehensive error handling
4. **User Feedback**: Provide clear progress indicators

### Base64 Usage
1. **Choose Correct Encoding**: Use URL-safe for web applications
2. **Validate Input**: Always validate Base64 before processing
3. **Handle Line Breaks**: Account for MIME-style line breaks
4. **Performance**: Consider alternatives for very large data

### Security Considerations
1. **Input Sanitization**: Validate all file inputs
2. **Memory Management**: Monitor memory usage with large files
3. **Error Information**: Don't expose sensitive error details
4. **Client-Side Processing**: Never trust client-side validation alone

## Integration Examples

### React Component Integration
```jsx
// Example React component usage
const MyComponent = () => {
  const [base64Data, setBase64Data] = useState('');
  
  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result.split(',')[1];
      setBase64Data(base64);
    };
    reader.readAsDataURL(file);
  };
  
  return (
    <div>
      <input type="file" onChange={handleFileUpload} />
      {base64Data && <img src={`data:image/jpeg;base64,${base64Data}`} />}
    </div>
  );
};
```

### API Integration
```javascript
// Example API usage
const uploadImageAsBase64 = async (file) => {
  const base64 = await fileToBase64(file);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      mimeType: file.type,
      data: base64
    })
  });
  
  return response.json();
};
```

### Progressive Web App
```javascript
// Service worker caching of Base64 data
self.addEventListener('message', (event) => {
  if (event.data.type === 'CACHE_BASE64') {
    const cache = await caches.open('base64-cache');
    const response = new Response(event.data.base64Data);
    await cache.put(event.data.key, response);
  }
});
```

## Contributing

### Development Guidelines
1. Test with various file types and sizes
2. Ensure proper error handling for edge cases
3. Validate memory usage with large files
4. Test accessibility and keyboard navigation

### Testing Scenarios
- Small and large text files
- Various image formats (JPEG, PNG, GIF, SVG)
- Binary files (PDF, Word documents)
- Malformed Base64 strings
- Browser compatibility across platforms

For more information, see the [Architecture Documentation](../../ARCHITECTURE.md) and [Development Guide](../../DEVELOPMENT.md).