# 🚦 Russ Tools

**🌐 Live App:** [https://www.russ.tools/](https://www.russ.tools/)

Russ Tools is a suite of modern, web-based tools for network and cloud professionals. It currently includes:

- 🧮 Network Designer & Subnet Calculator
- 🛠 Azure Resource Naming Tool
- 🔒 SSL Certificate Checker
- 🕵️ DNS Lookup Tool
- 🌐 WHOIS Lookup Tool
- 🔄 Base64 Encoder/Decoder
- 📜 Data Converter

## 🧰 Tools Overview

| Tool | Description |
|------|-------------|
| 🧮 **Network Designer & Subnet Calculator** | Design, calculate, and visualize IPv4 subnets, plan address allocations, and export professional diagrams. |
| 🛠 **Azure Resource Naming Tool** | Generate compliant Azure resource names following Microsoft's conventions and best practices. |
| 🔒 **SSL Certificate Checker** | Analyze and validate SSL certificates for any domain with comprehensive security analysis using SSL Labs API. |
| 🕵️ **DNS Lookup Tool** | Perform comprehensive DNS queries across multiple providers with support for all record types and caching. |
| 🌐 **WHOIS Lookup Tool** | Get detailed domain registration and IP geolocation information with modern RDAP protocol integration. |
| 🔄 **Base64 Encoder/Decoder** | Encode and decode text and files using Base64 encoding with support for standard, URL-safe, and MIME variants. Handles large files and image previews. |
| 📜 **Data Converter** | Convert data between JSON, YAML, and TOML formats. Features auto-detection, validation, formatting options (indentation, sorting), and schema validation. |

---

## 🧮 Network Designer & Subnet Calculator

### ✨ Features

- 🔢 **Subnet Calculator:**
  - Enter IPv4 address and subnet mask or CIDR (e.g., 10.0.0.0/24 or 255.255.255.0)
  - Displays network address, broadcast address, usable host range, subnet mask (dot-decimal & slash), and total hosts
  - Robust input validation with instant feedback

- 🗺️ **Network Designer & Subnet Planner:**
  - Define a parent network (supernet) and add multiple subnets of varying sizes
  - Subnet allocation logic ensures:
    - Unique, non-overlapping subnets
    - Proper boundary alignment for each subnet
    - Subnets placed at the first available valid position
  - Visualize allocated and free space within the parent network
  - Drag-and-drop subnet reordering with automatic recalculation
  - Prevents over-allocation and overlapping subnets

- 🎨 **Interactive Visualization:**
  - Modern, responsive diagram showing all subnets and free space
  - Distinct color segments for subnets, free space, network, and broadcast addresses
  - Tooltips and icons for contextual info (uses Tabler icons)
  - Animated updates and full support for dark/light mode

- 📤 **Exportable Diagrams:**
  - Export network diagrams as SVG or PNG
  - Export includes all subnets, free space, and legend
  - SVG export uses proper icons and color schemes for documentation-quality output

- 🏗️ **Terraform Export:**
  - Easily export your network/subnet design as ready-to-use Terraform code for AWS or Azure.
  - Select your preferred cloud provider (AWS or Azure) using tabs.
  - Dynamically choose a region from a dropdown list (region data loaded live from cloud provider lists).
  - Copy the generated HCL code to your clipboard with a single click.
  - Region selections are saved for convenience.
  - Powered by the `TerraformExportSection.jsx` component.
  - Supports both AWS and Azure native region lists.

- 💾 **State Persistence:**
  - All network designs and subnets are saved to localStorage and restored automatically

- 🖥️ **Modern UI:**
  - Built with [Mantine](https://mantine.dev/) for a clean, professional look
  - Fully responsive and accessible

#### 👨‍💻 Example

You can find an example of an SVG export below:

![Example Diagram](example.svg)

---

## 🛠 Azure Resource Naming Tool

The Azure Resource Naming Tool helps users generate compliant Azure resource names based on Microsoft's naming conventions and best practices. It provides a user-friendly interface for generating standardized names that follow organizational governance requirements and Azure's resource-specific limitations.

### ✨ Why Use This Tool?
- 🏷️ Ensures consistent naming across all Azure resources
- ❌ Reduces deployment errors due to invalid naming
- 🗂️ Improves resource management and governance
- ⚡ Accelerates resource creation by automating name generation
- 🛡️ Facilitates compliance with organizational naming policies

### 🔑 Key Features
- ⚛️ React-based, fast, and modern UI
- ✅ Supports Microsoft's recommended naming patterns and abbreviations
- ✅ Validates names in real time and provides feedback
- 🏗️ Lets users select resource type, environment, region, and other variables
- 🔤 Automatically abbreviates common terms
- 👀 Visual indicators for validation and compliance
- 🧩 Designed for extensibility and organizational policy integration

---

## 🔒 SSL Certificate Checker

The SSL Certificate Checker provides enterprise-grade SSL/TLS certificate analysis for any domain. It leverages industry-standard tools like SSL Labs API v4 to deliver comprehensive security assessments and certificate validation.

### ✨ Why Use This Tool?
- 🛡️ **Enterprise-grade analysis** using SSL Labs API v4 - the gold standard for SSL testing
- ⚡ **Instant results** with real-time certificate validation and security grading
- 🔍 **Comprehensive scanning** including vulnerability testing (Heartbleed, POODLE, BEAST, etc.)
- 🌐 **Privacy-focused** - no domain information is logged or stored
- 📊 **Industry-standard grading** using the SSL Labs A+ to F rating system
- 🔄 **Smart fallbacks** ensure reliable results even when primary services are unavailable

### 🔑 Key Features

- 🏆 **SSL Labs Integration:**
  - Powered by SSL Labs API v4 for authoritative SSL analysis
  - Comprehensive security testing and vulnerability scanning
  - Industry-standard grading system (A+ to F ratings)
  - Real-time assessment with polling for complete results

- 🛡️ **Security Analysis:**
  - Certificate validity and trust chain verification
  - TLS protocol and cipher suite analysis
  - Vulnerability testing (Heartbleed, POODLE, BEAST, etc.)
  - HSTS and security header validation
  - Browser compatibility testing

- 📋 **Certificate Information:**
  - Detailed certificate details (issuer, validity dates, serial number)
  - Subject Alternative Names (SAN) and domain matching
  - Certificate chain analysis and trust validation
  - Expiration warnings and renewal recommendations

- 🔒 **Privacy & Security:**
  - Cloudflare Worker backend for secure API access
  - No domain information logged or stored
  - Restricted to authorized origins only
  - Encrypted connections throughout the analysis process

- 📱 **Modern Interface:**
  - Clean, intuitive design with real-time results
  - Tabbed interface with comprehensive information panels
  - Visual grading system with color-coded security ratings
  - Responsive design for desktop and mobile devices

#### 🎯 Example Use Cases
- **Website Security Audits:** Validate SSL configuration for production websites
- **Certificate Monitoring:** Check certificate expiration dates and renewal needs
- **Security Compliance:** Ensure SSL configuration meets security standards
- **Troubleshooting:** Diagnose SSL/TLS connection issues and misconfigurations
- **Education:** Learn about SSL/TLS security and best practices

---

## 🕵️ DNS Lookup Tool

The DNS Lookup Tool provides comprehensive DNS query capabilities with support for multiple record types and DNS providers. It offers professional-grade DNS analysis with intelligent caching and fallback mechanisms for reliable results.

### ✨ Why Use This Tool?
- 🌐 **Multi-provider redundancy** - Query multiple DNS providers for reliable results
- ⚡ **Comprehensive record support** - All standard DNS record types in one place
- 🔒 **DNS over HTTPS** - Secure DNS queries using modern DoH protocol
- 🎯 **Smart caching** - 5-minute intelligent caching to reduce query time
- 📊 **Professional analysis** - Detailed record parsing and validation
- 🔄 **Automatic fallbacks** - Ensures results even when providers fail

### 🔑 Key Features

- 🗂️ **Complete Record Type Support:**
  - A, AAAA, MX, TXT, CNAME, NS, SOA records
  - PTR (reverse DNS), SRV, CAA records
  - Real-time validation and formatting
  - Priority and weight information for applicable records

- 🌍 **Multiple DNS Providers:**
  - Google DNS (8.8.8.8) - Primary provider
  - Cloudflare DNS (1.1.1.1) - High performance
  - OpenDNS (208.67.222.222) - Security-focused
  - Automatic fallback system for reliability

- ⚡ **Performance & Reliability:**
  - DNS over HTTPS (DoH) implementation
  - 5-minute intelligent caching system
  - Query history tracking and management
  - Export functionality for documentation

- 📱 **Modern Interface:**
  - Clean tabbed interface with organized results
  - Real-time query status and provider information
  - Copy-to-clipboard functionality
  - URL parameter support for direct queries

#### 🎯 Example Use Cases
- **DNS Troubleshooting:** Diagnose DNS resolution issues across providers
- **Domain Migration:** Verify DNS propagation during domain transfers
- **Security Analysis:** Check for suspicious DNS records or misconfigurations
- **Performance Testing:** Compare DNS response times across providers
- **Documentation:** Export DNS configurations for network documentation

### DNS Lookup Tool

Visit [https://www.russ.tools/dns-lookup](https://www.russ.tools/dns-lookup) and:

1. 🌐 **Enter Domain or IP:**
   - Type any domain name (e.g., example.com, www.github.com)
   - Or enter an IP address for reverse DNS lookup (PTR records)

2. 🔍 **Select Record Type:**
   - Choose from A, AAAA, MX, TXT, CNAME, NS, SOA, PTR, SRV, or CAA
   - Each record type provides specific DNS information

3. 📊 **Review Results:**
   - **DNS Records:** Detailed record information with formatting
   - **Query Info:** Provider used, response time, and cache status
   - **History:** Previous queries with timestamps and quick repeat options

4. 🔄 **Advanced Features:**
   - Export results as JSON for documentation
   - Copy individual records to clipboard
   - Automatic fallback if primary DNS provider fails

---

## 🌐 WHOIS Lookup Tool

The WHOIS Lookup Tool provides enterprise-grade domain registration and IP geolocation information using modern RDAP (Registration Data Access Protocol) and industry-leading IP databases. It delivers comprehensive analysis for both domains and IP addresses with intelligent caching and calendar integration.

### ✨ Why Use This Tool?
- 🔄 **Modern RDAP Protocol** - Uses official IANA registry data instead of legacy WHOIS
- 🌍 **Dual Functionality** - Both domain registration and IP geolocation in one tool
- 🎯 **Smart Auto-completion** - TLD suggestions from official IANA database
- 📅 **Calendar Integration** - Download domain expiration reminders as iCal files
- 🎨 **Beautiful JSON Display** - Syntax-highlighted raw data with Prism
- 🔒 **Privacy-Focused** - Cloudflare Worker backend with secure API access

### 🔑 Key Features

- 🏢 **Domain Registration Analysis:**
  - Complete registration information (created, expires, updated dates)
  - Registrar details and contact information
  - Domain status codes and validation
  - Nameserver configuration and DNS setup
  - Real-time RDAP queries to authoritative registries

- 🌍 **IP Geolocation Intelligence:**
  - Precise location data (city, region, country with flags)
  - Network information (ISP, ASN, organization)
  - Security analysis (proxy/VPN detection, hosting provider identification)
  - Reverse DNS and hostname resolution

- 🎯 **Smart Input & Auto-completion:**
  - Auto-complete TLD suggestions from IANA database (600+ TLDs)
  - Automatic IP vs domain detection
  - Input validation and cleaning
  - URL parameter support for direct queries

- 📊 **Advanced Features:**
  - 30-minute intelligent caching system
  - Lookup history tracking and management
  - iCal download for domain expiration reminders
  - JSON export with syntax highlighting
  - Multiple data source tracking and validation

- 🎨 **Professional Interface:**
  - Tabbed interface (Results, Data Sources, Raw Data)
  - Syntax-highlighted JSON using Prism
  - Modern card-based layout with icons
  - Dark/light theme support

#### 🎯 Example Use Cases
- **Domain Research:** Investigate domain ownership and registration details
- **IP Investigation:** Analyze IP addresses for geolocation and network information
- **Security Analysis:** Identify suspicious domains or IP addresses
- **Domain Management:** Track domain expiration dates with calendar reminders
- **Network Documentation:** Export WHOIS data for network inventories

### WHOIS Lookup Tool

Visit [https://www.russ.tools/whois-lookup](https://www.russ.tools/whois-lookup) and:

1. 🌐 **Enter Domain or IP:**
   - Type any domain name with auto-complete TLD suggestions
   - Or enter an IP address for geolocation information
   - Tool automatically detects input type

2. 🔍 **Analyze Information:**
   - Click "Lookup" to start RDAP/geolocation query
   - Real-time progress updates during data retrieval

3. 📊 **Review Results:**
   - **Domain Info:** Registration dates, registrar, nameservers, status
   - **IP Info:** Location, ISP, ASN, security analysis with country flags
   - **Data Sources:** See which registries and APIs provided the data
   - **Raw Data:** Syntax-highlighted JSON for technical analysis

4. 📅 **Additional Features:**
   - Download domain expiration reminders as iCal files
   - Export complete results as JSON
   - View lookup history with repeat functionality

## 🚀 Usage

### Network Designer & Subnet Calculator

Visit [https://www.russ.tools/network-designer](https://www.russ.tools/network-designer) and:

1. 🏁 **Set a Parent Network:**
   - 📝 Enter a network address (e.g., 10.0.0.0) and CIDR (e.g., /16)
2. **Add Subnets:**
   - Specify subnet name and size (CIDR)
   - Subnets are placed automatically with no overlaps
3. **Visualize:**
   - See a live diagram of all subnets and free space
   - Hover for details, drag to reorder, or remove subnets
4. **Export:**
   - Download your diagram as SVG or PNG for documentation
5. **Persistence:**
   - All changes are saved locally and restored on reload

### Azure Resource Naming Tool

Visit [https://www.russ.tools/azure-naming/](https://www.russ.tools/azure-naming/) and:

1. 🏷️ **Enter Workload/Application Name:**  
   - e.g., payments, webapp, database
2. 🏢 **Select Resource Type:**  
   - Choose one or more Azure resource types from the dropdown
3. 🌎 **Select Environment and Region:**  
   - Pick the environment (e.g., dev, test, prod) and Azure region
4. 🔢 **(Optional) Customize:**  
   - Instance number (e.g., 001)  
   - Add a custom prefix or suffix  
   - Add random characters for uniqueness if needed
5. ⚡ **Generate Name:**  
   - Click **Generate Name** to create a compliant resource name
6. 💾 **Save or Load Names:**  
   - Save generated names for reuse, or load previously saved names from the list

### SSL Certificate Checker

Visit [https://www.russ.tools/ssl-checker](https://www.russ.tools/ssl-checker) and:

1. 🌐 **Enter Domain:**
   - Type any domain name (e.g., example.com, www.github.com)
   - The tool automatically handles protocol removal and domain cleaning

2. 🔍 **Analyze Certificate:**
   - Click "Check SSL Certificate" to start the analysis
   - Real-time progress updates during SSL Labs assessment

3. 📊 **Review Results:**
   - **Certificate Details:** Validity dates, issuer information, and trust status
   - **Security Grade:** Industry-standard A+ to F rating with explanation
   - **Validation Info:** Comprehensive security analysis and recommendations

4. 📚 **Learn More:**
   - Switch to the "About SSL" tab for educational content
   - Understand SSL/TLS concepts, grading system, and security best practices

### DNS Lookup Tool

Visit [https://www.russ.tools/dns-lookup](https://www.russ.tools/dns-lookup) and:

1. 🌐 **Enter Domain or IP:**
   - Type any domain name (e.g., example.com, www.github.com)
   - Or enter an IP address for reverse DNS lookup (PTR records)

2. 🔍 **Select Record Type:**
   - Choose from A, AAAA, MX, TXT, CNAME, NS, SOA, PTR, SRV, or CAA
   - Each record type provides specific DNS information

3. 📊 **Review Results:**
   - **DNS Records:** Detailed record information with formatting
   - **Query Info:** Provider used, response time, and cache status
   - **History:** Previous queries with timestamps and quick repeat options

4. 🔄 **Advanced Features:**
   - Export results as JSON for documentation
   - Copy individual records to clipboard
   - Automatic fallback if primary DNS provider fails

### WHOIS Lookup Tool

Visit [https://www.russ.tools/whois-lookup](https://www.russ.tools/whois-lookup) and:

1. 🌐 **Enter Domain or IP:**
   - Type any domain name with auto-complete TLD suggestions
   - Or enter an IP address for geolocation information
   - Tool automatically detects input type

2. 🔍 **Analyze Information:**
   - Click "Lookup" to start RDAP/geolocation query
   - Real-time progress updates during data retrieval

3. 📊 **Review Results:**
   - **Domain Info:** Registration dates, registrar, nameservers, status
   - **IP Info:** Location, ISP, ASN, security analysis with country flags
   - **Data Sources:** See which registries and APIs provided the data
   - **Raw Data:** Syntax-highlighted JSON for technical analysis

4. 📅 **Additional Features:**
   - Download domain expiration reminders as iCal files
   - Export complete results as JSON
   - View lookup history with repeat functionality

### Base64 Encoder/Decoder

Visit [https://www.russ.tools/base64](https://www.russ.tools/base64) and:

1. Toggle **Encode** or **Decode** mode.
2. **For Encoding:**
   - Paste text into the input area OR drag & drop/browse for a file (text or binary like an image).
   - Select the desired **Encoding Type** (Standard, URL-Safe, MIME).
   - Click **Encode**. The Base64 output will appear. Image previews are shown for image files.
3. **For Decoding:**
   - Paste a Base64 string into the input area OR upload a text file containing Base64 data.
   - Select the **Encoding Type** if known (usually Standard for decoding).
   - Click **Decode**. The original content will appear. Image previews are shown for decoded images (including SVGs).
4. **Manage Output:**
   - Use the copy icon to copy the output text.
   - Use the download icon to save the decoded file (e.g., as an image or text file).

### Data Converter

Visit [https://www.russ.tools/data-converter](https://www.russ.tools/data-converter) and:

1. 📝 **Input Data:**
   - Paste your data (JSON, YAML, or TOML) into the input text area.
   - OR click "Upload File" to load data from a local file.
2. 🔄 **Select Formats:**
   - Choose the **Input Format** (or leave as "Auto-detect").
   - Choose the desired **Output Format** (JSON, YAML, or TOML).
3. ⚙️ **(Optional) Configure Settings:**
   - Click the settings icon (cog) to adjust indentation, character (spaces/tabs), and key sorting preferences.
   - For JSON, enable Schema Validation if needed, select a common schema or provide a custom one.
4. ⚡ **Convert:**
   - The conversion happens automatically as you type or change settings.
   - View validation status and any errors below the input area.
5. 📋 **Use Output:**
   - Copy the converted data using the copy icon.
   - Download the output as a file using the download icon.
   - Use the "Minify" or "Reformat" buttons for quick output adjustments.

---

## 🛠️ Technology Stack

- ⚛️ **React** (SPA framework)
- ⚡ **Vite** (build tool)
- 🎨 **Mantine** (UI framework)
- 🧮 **netmask** (IPv4 subnet calculation)
- 🖱️ **@dnd-kit/core**, **@dnd-kit/sortable** (drag-and-drop)
- 🏷️ **Tabler Icons** (SVG icons)

Key libraries used in specific tools:
- **Network Designer & Subnet Calculator:**
  - 🧮 `netmask` (IPv4 subnet calculation)
  - 🖱️ `@dnd-kit/core`, `@dnd-kit/sortable` (drag-and-drop)
- **Data Converter:**
  - 📜 `js-yaml` (YAML parsing & stringifying)
  - 📄 `@iarna/toml` (TOML parsing & stringifying)
  - ✨ `prismjs` (Syntax highlighting for JSON, YAML, TOML)
  - ✅ `ajv`, `ajv-formats` (JSON Schema validation)
- **Base64 Encoder/Decoder:**
  - Primarily uses built-in browser APIs (`btoa`, `atob`, `FileReader`) for core operations.

## 📦 Development

Clone the repo and run locally:

```bash
npm install
npm run dev
```

## 🤷‍♂️ Stuff

russ.tools. Built with ❤️ by Russ McKendrick and bunch of AI and other libraries.