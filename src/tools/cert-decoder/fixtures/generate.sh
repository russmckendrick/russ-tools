#!/usr/bin/env bash
set -euo pipefail

out="$(cd "$(dirname "$0")" && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

openssl genrsa -out "$tmp/root.key" 2048
openssl req -x509 -new -key "$tmp/root.key" -sha256 -days 10950 \
  -subj "/C=GB/O=Example Trust Services/CN=Example Root CA R1" \
  -addext "basicConstraints=critical,CA:TRUE" \
  -addext "keyUsage=critical,keyCertSign,cRLSign" \
  -out "$out/root.pem"

openssl ecparam -name secp384r1 -genkey -noout -out "$tmp/int.key"
openssl req -new -key "$tmp/int.key" \
  -subj "/C=GB/O=Example Trust Services/CN=Example Issuing CA E1" -out "$tmp/int.csr"
cat > "$tmp/int.ext" <<'EOF'
basicConstraints=critical,CA:TRUE,pathlen:0
keyUsage=critical,digitalSignature,keyCertSign,cRLSign
extendedKeyUsage=serverAuth,clientAuth
subjectKeyIdentifier=hash
authorityKeyIdentifier=keyid
authorityInfoAccess=caIssuers;URI:http://pki.example.com/root-r1.crt
crlDistributionPoints=URI:http://crl.example.com/root-r1.crl
EOF
openssl x509 -req -in "$tmp/int.csr" -CA "$out/root.pem" -CAkey "$tmp/root.key" \
  -set_serial 0x1000A1B2C3D4E5F60718293A4B5C6D7E -sha256 -days 7300 \
  -extfile "$tmp/int.ext" -out "$out/intermediate.pem"

openssl ecparam -name prime256v1 -genkey -noout -out "$tmp/leaf.key"
openssl req -new -key "$tmp/leaf.key" \
  -subj "/C=GB/L=Nottingham/O=Example Ltd/CN=www.example.com" -out "$tmp/leaf.csr"
cat > "$tmp/leaf.ext" <<'EOF'
basicConstraints=critical,CA:FALSE
keyUsage=critical,digitalSignature
extendedKeyUsage=serverAuth,clientAuth
subjectKeyIdentifier=hash
authorityKeyIdentifier=keyid
subjectAltName=DNS:www.example.com,DNS:example.com,DNS:*.api.example.com,IP:192.0.2.10,IP:2001:db8::10,email:hostmaster@example.com,URI:https://example.com/id
authorityInfoAccess=OCSP;URI:http://ocsp.example.com,caIssuers;URI:http://pki.example.com/issuing-e1.crt
crlDistributionPoints=URI:http://crl.example.com/issuing-e1.crl
EOF
openssl x509 -req -in "$tmp/leaf.csr" -CA "$out/intermediate.pem" -CAkey "$tmp/int.key" \
  -set_serial 0x04D2F1A09B3C7E5522186FA0C4E9D713 -sha384 -days 3650 \
  -extfile "$tmp/leaf.ext" -out "$out/leaf.pem"

cat "$out/leaf.pem" "$out/intermediate.pem" "$out/root.pem" > "$out/chain.pem"

openssl genpkey -algorithm ed25519 -out "$tmp/other.key"
openssl req -x509 -new -key "$tmp/other.key" -days 3650 \
  -subj "/O=Somebody Else/CN=Unrelated Root X9" \
  -addext "basicConstraints=critical,CA:TRUE" \
  -out "$out/unrelated-root.pem"

openssl genrsa -out "$tmp/app.key" 2048
openssl req -new -key "$tmp/app.key" -sha256 \
  -subj "/C=GB/ST=England/O=Example Ltd/OU=Platform/CN=app.example.com/emailAddress=ops@example.com" \
  -addext "subjectAltName=DNS:app.example.com,DNS:app.internal.example,IP:10.20.30.40" \
  -addext "keyUsage=critical,digitalSignature,keyEncipherment" \
  -addext "extendedKeyUsage=serverAuth" \
  -out "$out/request.csr.pem"
