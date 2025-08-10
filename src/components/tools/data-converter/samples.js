// Sample data for the Data Converter Tool

export const JSON_SAMPLES = {
  company: {
    name: "Company Data",
    description: "Employee and company information",
    data: `{
  "company": "TechCorp Solutions",
  "employees": [
    {
      "id": "EMP001",
      "name": "Sarah Chen",
      "role": "Senior Developer",
      "email": "sarah.chen@techcorp.com",
      "salary": 95000,
      "skills": ["JavaScript", "React", "Node.js", "Python"],
      "remote": true,
      "startDate": "2021-03-15"
    },
    {
      "id": "EMP002", 
      "name": "Marcus Rodriguez",
      "role": "DevOps Engineer",
      "email": "marcus.r@techcorp.com",
      "salary": 88000,
      "skills": ["Docker", "Kubernetes", "AWS", "Terraform"],
      "remote": false,
      "startDate": "2020-11-08"
    }
  ],
  "headquarters": {
    "address": "456 Innovation Drive",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "94105",
    "coordinates": {
      "lat": 37.7749,
      "lng": -122.4194
    }
  },
  "founded": 2018,
  "publiclyTraded": false,
  "revenue": 12500000
}`
  },
  
  user: {
    name: "User Profile",
    description: "Simple user data structure",
    data: `{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "age": 30,
  "website": "https://johndoe.com",
  "phone": "+1-555-0123",
  "birthDate": "1994-05-15",
  "isActive": true
}`
  },
  
  product: {
    name: "Product Catalog",
    description: "E-commerce product information",
    data: `{
  "id": "PROD-001",
  "name": "Wireless Headphones",
  "price": 99.99,
  "currency": "USD",
  "category": "Electronics",
  "inStock": true,
  "tags": ["wireless", "bluetooth", "audio"],
  "createdAt": "2024-01-15T10:30:00Z"
}`
  },
  
  config: {
    name: "API Configuration",
    description: "Application configuration settings",
    data: `{
  "apiUrl": "https://api.example.com",
  "timeout": 5000,
  "retries": 3,
  "environment": "production",
  "features": {
    "authentication": true,
    "logging": true,
    "caching": false
  },
  "version": "1.2.3"
}`
  }
};

export const YAML_SAMPLES = {
  products: {
    name: "Product Catalog",
    description: "E-commerce product listing",
    data: `# E-commerce Product Catalog
products:
  - id: PROD-2024-001
    name: "Wireless Bluetooth Headphones"
    category: Electronics
    brand: AudioTech
    price: 129.99
    currency: USD
    inStock: true
    quantity: 45
    ratings:
      average: 4.7
      count: 1284
    features:
      - "Active Noise Cancellation"
      - "30-hour battery life"
      - "Quick charge (15min = 3hrs)"
      - "Multipoint connectivity"
    dimensions:
      width: 190
      height: 165
      depth: 85
      weight: 250
    colors:
      - Black
      - Silver
      - Navy Blue
    
  - id: PROD-2024-002
    name: "Smart Fitness Watch"
    category: Wearables
    brand: FitTrack
    price: 249.99
    currency: USD
    inStock: false
    quantity: 0
    ratings:
      average: 4.3
      count: 892
    features:
      - "Heart rate monitoring"
      - "GPS tracking"
      - "Sleep analysis"
      - "Water resistant (50m)"
    dimensions:
      width: 44
      height: 38
      depth: 10.7
      weight: 32
    colors:
      - Space Gray
      - Rose Gold

store_info:
  name: "TechGadgets Plus"
  established: 2019
  locations: 12
  online_only: false`
  },
  
  deployment: {
    name: "Kubernetes Deployment",
    description: "Container deployment configuration",
    data: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  labels:
    app: web-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: web-app
        image: nginx:1.21
        ports:
        - containerPort: 80
        env:
        - name: ENV
          value: "production"
        resources:
          limits:
            memory: "128Mi"
            cpu: "250m"
          requests:
            memory: "64Mi"
            cpu: "125m"`
  },
  
  user: {
    name: "User Data",
    description: "User profile information",
    data: `name: Jane Smith
email: jane.smith@example.com
age: 28
website: https://janesmith.dev
phone: "+1-555-0456"
birthDate: "1996-03-22"
isActive: true
preferences:
  theme: dark
  notifications: true
  language: en-US
address:
  street: "123 Main St"
  city: "New York"
  state: "NY"
  zipCode: "10001"`
  },
  
  cicd: {
    name: "CI/CD Pipeline",
    description: "GitHub Actions workflow",
    data: `name: Build and Deploy
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    - name: Install dependencies
      run: npm ci
    - name: Run tests
      run: npm test
      
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v3
    - name: Deploy to production
      run: |
        echo "Deploying to production..."
        npm run build
        npm run deploy`
  }
};

export const TOML_SAMPLES = {
  server: {
    name: "Server Configuration",
    description: "Production server settings",
    data: `# Server Configuration File
title = "Production Web Server Config"
version = "2.1.0"
last_updated = 2024-01-15T10:30:00Z

[server]
host = "api.mycompany.com"
port = 8443
ssl_enabled = true
max_connections = 1000
timeout_seconds = 30
debug_mode = false

[database]
type = "postgresql"
host = "db-cluster.internal"
port = 5432
name = "production_db"
username = "app_user"
pool_size = 20
ssl_mode = "require"

[redis]
host = "redis-cluster.internal"
port = 6379
password = "secure_redis_password"
db_index = 0
max_connections = 50

[logging]
level = "info"
format = "json"
output = "/var/log/app/server.log"
max_file_size = "100MB"
max_files = 10
compress_old_files = true

[security]
cors_origins = [
  "https://mycompany.com",
  "https://app.mycompany.com",
  "https://admin.mycompany.com"
]
rate_limit_requests = 1000
rate_limit_window = "1h"
jwt_secret_key = "your-super-secret-jwt-key-here"
session_timeout = "24h"

[monitoring]
enabled = true
metrics_endpoint = "/metrics"
health_check_endpoint = "/health"
alert_email = "devops@mycompany.com"

[features]
user_registration = true
email_verification = true
two_factor_auth = false
api_versioning = true
caching = true`
  },
  
  package: {
    name: "Rust Package",
    description: "Cargo.toml package configuration",
    data: `[package]
name = "my-rust-app"
version = "0.1.0"
edition = "2021"
authors = ["developer@example.com"]
description = "A sample Rust application"
license = "MIT"
repository = "https://github.com/user/my-rust-app"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1.0", features = ["full"] }
reqwest = { version = "0.11", features = ["json"] }
clap = "4.0"

[dev-dependencies]
tokio-test = "0.4"

[[bin]]
name = "main"
path = "src/main.rs"

[profile.release]
opt-level = 3
lto = true
codegen-units = 1`
  },
  
  config: {
    name: "Application Config",
    description: "Simple application configuration",
    data: `# Application Configuration
title = "My Application"
version = "1.0.0"

[api]
url = "https://api.example.com"
timeout = 5000
retries = 3
environment = "production"

[features]
authentication = true
logging = true
caching = false
debug = false

[database]
host = "localhost"
port = 5432
name = "app_db"
user = "app_user"`
  },
  
  deployment: {
    name: "Docker Compose",
    description: "Multi-service deployment",
    data: `# Docker Compose Configuration
version = "3.8"

[services.web]
image = "nginx:latest"
ports = ["80:80", "443:443"]
volumes = ["./nginx.conf:/etc/nginx/nginx.conf"]
depends_on = ["api"]

[services.api]
build = "./api"
ports = ["3000:3000"]
environment = [
  "NODE_ENV=production",
  "DATABASE_URL=postgres://user:pass@db:5432/myapp"
]
depends_on = ["db"]

[services.db]
image = "postgres:13"
ports = ["5432:5432"]
environment = [
  "POSTGRES_DB=myapp",
  "POSTGRES_USER=user",
  "POSTGRES_PASSWORD=password"
]
volumes = ["postgres_data:/var/lib/postgresql/data"]

[volumes.postgres_data]
driver = "local"`
  }
};