# 🚦 Russ Tools

**🌐 Live App:** [https://www.russ.tools/](https://www.russ.tools/)

Russ Tools is a suite of modern, web-based tools for network and cloud professionals. It currently includes:

- 🧮 Network Designer & Subnet Calculator
- 🛠 Azure Resource Naming Tool
- 🔒 SSL Certificate Checker

## 🧰 Tools Overview

| Tool | Description |
|------|-------------|
| 🧮 **Network Designer & Subnet Calculator** | Design, calculate, and visualize IPv4 subnets, plan address allocations, and export professional diagrams. |
| 🛠 **Azure Resource Naming Tool** | Generate compliant Azure resource names following Microsoft's conventions and best practices. |
| 🔒 **SSL Certificate Checker** | Analyze and validate SSL certificates for any domain with comprehensive security analysis using SSL Labs API. |

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

---

## 🛠️ Technology Stack

- ⚛️ **React** (SPA framework)
- ⚡ **Vite** (build tool)
- 🎨 **Mantine** (UI framework)
- 🧮 **netmask** (IPv4 subnet calculation)
- 🖱️ **@dnd-kit** (drag-and-drop)
- 🏷️ **Tabler Icons** (SVG icons)

## 📦 Development

Clone the repo and run locally:

```bash
npm install
npm run dev
```

## 🤷‍♂️ Stuff

russ.tools. Built with ❤️ by Russ McKendrick and bunch of AI and other libraries.
