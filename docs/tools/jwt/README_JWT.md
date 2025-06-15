# 🔐 JWT Decoder/Validator Tool

A comprehensive JWT (JSON Web Token) decoder and validator that works entirely in your browser without sending tokens to external services.

## Features

### 🔍 Token Decoding
- **Format Validation**: Automatically validates JWT structure (3 parts separated by dots)
- **Header Decoding**: Extracts and displays algorithm, type, and key ID information
- **Payload Decoding**: Decodes and displays all claims in a readable format
- **Signature Display**: Shows the raw signature for inspection

### 📊 Token Analysis
- **Expiration Checking**: Real-time validation of token expiration status
- **Timestamp Analysis**: Human-readable display of issued at, expires at, and not before times
- **Algorithm Detection**: Identifies the signing algorithm used
- **Status Indicators**: Visual alerts for expired, expiring soon, or valid tokens

### 🔐 Claims Inspector
- **Standard Claims**: Displays issuer (iss), subject (sub), audience (aud), and other RFC 7519 claims
- **Custom Claims**: Automatically identifies and displays non-standard claims
- **Structured Display**: Organized presentation of all token data

### ✅ Signature Validation (Limited)
- **RSA/ECDSA Support**: Validates tokens signed with RSA or ECDSA algorithms using public keys
- **PEM Format**: Supports standard PEM-formatted public keys
- **JWK Support**: Can validate using JSON Web Key (JWK) format
- **Browser Limitation**: HMAC (HS256/HS384/HS512) validation not supported due to browser security constraints

## Usage

### Basic Decoding
1. Paste your JWT token into the input field
2. The tool automatically validates format and decodes the token
3. View decoded header, payload, and signature in separate tabs

### Token Analysis
1. Switch to the "Token Analysis" tab to see:
   - Token expiration status
   - Algorithm and type information
   - Timestamp breakdown
   - Validity indicators

### Claims Inspection
1. Use the "Claims" tab to examine:
   - Standard JWT claims
   - Custom application-specific claims
   - Structured data presentation

### Signature Validation
1. Enable signature validation with the toggle switch
2. For RSA/ECDSA tokens:
   - Paste your public key in PEM format or JWK format
   - The tool will attempt to validate the signature
3. Note: HMAC validation requires server-side processing

## Example Tokens

The tool includes example tokens for testing:
- **Basic JWT**: Simple token with standard claims
- **Expired Token**: Token that has already expired
- **With Claims**: Token containing various standard and custom claims

## Security Features

- **Client-Side Only**: All processing happens in your browser
- **No External Calls**: Tokens are never sent to external services
- **Privacy Focused**: Your sensitive tokens remain on your device
- **Open Source**: Full transparency of the decoding process

## Browser Limitations

Due to browser security constraints:
- HMAC signature validation (HS256, HS384, HS512) is not supported
- For HMAC tokens, use server-side validation tools
- Only public key algorithms (RS256, RS384, RS512, ES256, ES384, ES512, PS256, PS384, PS512) can be validated

## Use Cases

- **API Debugging**: Quickly inspect JWT tokens during development
- **Authentication Troubleshooting**: Analyze token claims and expiration
- **Security Analysis**: Examine token structure and algorithms
- **Integration Testing**: Validate token format and content
- **Learning**: Understand JWT structure and claims

## Supported Algorithms

### Decoding (All Supported)
- HS256, HS384, HS512 (HMAC)
- RS256, RS384, RS512 (RSA)
- ES256, ES384, ES512 (ECDSA)
- PS256, PS384, PS512 (RSA-PSS)
- none (Unsecured)

### Signature Validation (Limited)
- ✅ RS256, RS384, RS512 (RSA with public key)
- ✅ ES256, ES384, ES512 (ECDSA with public key)
- ✅ PS256, PS384, PS512 (RSA-PSS with public key)
- ❌ HS256, HS384, HS512 (HMAC - browser limitation)
- ✅ none (No validation required)

## Tips

1. **Copy Individual Parts**: Use the copy buttons to extract specific parts of the token
2. **URL Parameters**: You can link directly to the tool with a token: `/jwt/your-token-here`
3. **Clipboard Integration**: Use paste button for quick token input
4. **Real-time Analysis**: Token analysis updates automatically as you type
5. **Mobile Friendly**: Responsive design works on all devices 