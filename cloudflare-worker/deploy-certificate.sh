#!/bin/bash

# Certificate Chain Analyzer Cloudflare Worker Deployment Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKER_FILE="certificate-chain.js"
CONFIG_FILE="configs/wrangler-certificate.toml"

echo "🚀 Deploying Certificate Chain Analyzer Cloudflare Worker"
echo "=================================================="

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Error: Wrangler CLI is not installed"
    echo "📝 Install with: npm install -g wrangler"
    exit 1
fi

# Check if worker file exists
if [ ! -f "$SCRIPT_DIR/$WORKER_FILE" ]; then
    echo "❌ Error: Worker file $WORKER_FILE not found"
    exit 1
fi

# Check if config file exists
if [ ! -f "$SCRIPT_DIR/$CONFIG_FILE" ]; then
    echo "❌ Error: Configuration file $CONFIG_FILE not found"
    exit 1
fi

# Determine environment (default to development)
ENVIRONMENT=${1:-development}

echo "📋 Configuration:"
echo "   Worker File: $WORKER_FILE"
echo "   Config File: $CONFIG_FILE"
echo "   Environment: $ENVIRONMENT"
echo ""

# Deploy the worker
echo "🔧 Deploying to $ENVIRONMENT environment..."
cd "$SCRIPT_DIR"

if [ "$ENVIRONMENT" = "production" ]; then
    echo "⚠️  Deploying to PRODUCTION environment"
    echo "🔒 Ensure secrets are configured:"
    echo "   - ALLOWED_ORIGINS"
    echo ""
    read -p "Continue with production deployment? (y/N): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
    
    wrangler deploy --config "$CONFIG_FILE" --env production
else
    echo "🔧 Deploying to development environment"
    wrangler deploy --config "$CONFIG_FILE" --env development
fi

echo ""
echo "✅ Deployment completed successfully!"

# Show deployment information
echo ""
echo "📝 Deployment Information:"
echo "========================="

if [ "$ENVIRONMENT" = "production" ]; then
    echo "🌐 Production URL: https://certificate.yourdomain.com/"
    echo "🏥 Health Check: https://certificate.yourdomain.com/health"
    echo "🔍 Analyze Endpoint: https://certificate.yourdomain.com/analyze"
else
    echo "🌐 Development URL: https://certificate-chain-russ-tools-dev.yourname.workers.dev/"
    echo "🏥 Health Check: https://certificate-chain-russ-tools-dev.yourname.workers.dev/health"
    echo "🔍 Analyze Endpoint: https://certificate-chain-russ-tools-dev.yourname.workers.dev/analyze"
fi

echo ""
echo "🔧 Required Secrets (if not already set):"
echo "==========================================="
echo "wrangler secret put ALLOWED_ORIGINS --config $CONFIG_FILE --env $ENVIRONMENT"
echo ""
echo "Example ALLOWED_ORIGINS value:"
echo "https://russ.tools,http://localhost:5173,http://localhost:5174"

echo ""
echo "🧪 Test the deployment:"
echo "======================="
echo "curl -X POST https://your-worker-url/health"
echo ""
echo "curl -X POST https://your-worker-url/analyze \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"domain\": \"google.com\", \"port\": 443}'"

echo ""
echo "🎉 Certificate Chain Analyzer Worker is ready!"