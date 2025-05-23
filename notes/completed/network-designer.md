# Russ Tools Phase 4: Network Designer Expansion – Task Tracker

## IMPORTANT: Subnet Allocation Logic

The subnet allocation logic MUST follow these principles:

1. **Unique Network Addresses**: Each subnet MUST have a unique network address
2. **No Overlapping Ranges**: Subnets CANNOT overlap in their address ranges
3. **Proper Address Boundaries**: Each subnet's network address MUST align with its size boundaries

### Implementation Requirements:

- When adding a new subnet to a parent network, calculate the next available network address based on previously allocated subnets
- Ensure each new subnet starts at an address boundary appropriate for its size (aligned to its netmask)
- Track allocated address space and calculate the next available address for each new subnet
- Validate that new subnets fit within remaining space
- Prevent overlapping allocations by checking against existing subnets

### Example (with parent network 10.0.0.0/23):
- First subnet (/27): Should start at 10.0.0.0
- Second subnet (/24): Should start at 10.0.0.32 (after the first /27)
- Third subnet (/26): Should start at 10.0.1.0 (after the /24)

This ensures each subnet has its own unique address range and that the visualization accurately represents how IP address space is divided in a real network environment.

---

# Russ Tools Phase 4: Network Designer Expansion – Task Tracker

## Main Goals
- [x] Parent Network (Supernet) Setup
- [x] Subnets Management
- [x] Persistent State with Local Storage
- [x] Enhanced Visualization for Multiple Subnets
- [x] Network Diagram View

---

## Detailed Tasks

### 1. Parent Network (Supernet) Setup
- [x] Add form for parent network (IPv4 address, CIDR, name)
- [x] Validate parent network input
- [x] Store parent network in React state
- [x] Persist parent network to local storage

### 2. Subnets Management
- [x] UI to add subnets (name, CIDR)
- [x] Validate subnets fit within parent network
- [x] Prevent overlapping subnets
- [x] List all subnets with details
- [x] Edit/remove subnets

### 3. Persistent State
- [x] Save all network/subnet data to local storage
- [x] Restore state on app load
- [x] Add Reset/Clear Design button

### 4. Enhanced Visualization
- [x] Update visualization to show all subnets as proportional segments
- [x] Color blocks, labels, hover details for each subnet
- [x] Show unused space in parent network
- [x] Create a drag and drop reorder tool
- [x] Add resize handles for adjusting subnet sizes
- [x] Visual CIDR slider for subnet resizing

### 5. Network Diagram View
- [x] Add placeholder for network diagram
- [x] Implement dynamic diagram generation
- [x] Support export (SVG/PNG)
- [x] Implement proper vector-based SVG export using SVG.js

---

*Update this file as tasks are started, completed, or refined.*

## Current Sprint Tasks

**Core Features:**
- [x] Define parent network
- [x] Add/edit/delete subnets
- [x] Save state to local storage
- [x] Simplify visualization component (remove dragging)
- [x] Convert CIDR inputs to dropdowns with valid options
- [x] Export/share configuration
- [ ] Add subnet auto-allocation

**UI Improvements:**
- [x] Add tooltips to explain CIDR notation
- [ ] Create help modal with basic subnetting concepts
- [x] Improve color scheme for better subnet differentiation
- [ ] Add visual indicator for subnet overlap/errors

**Testing & Performance:**
- [ ] Add unit tests for calculation functions
- [ ] Add integration tests for core workflows
- [ ] Optimize rendering for many subnets
- [ ] Add error boundary for recovery from calculation errors

## Backlog

- [ ] Support IPv6 networks and subnets 
- [ ] Add diagram view with connections
- [ ] Support cloud provider export templates
- [ ] Multi-layout visualization options
- [ ] Custom subnet coloring/tagging 

---

## 🚀 Feature Idea: Export Network Design as Terraform Code (AWS & Azure)

**Goal:**
Allow users to export their network/subnet design as ready-to-use Terraform code for AWS (VPC, Subnets) and Azure (VNet, Subnets), enabling copy-paste deployment to the cloud.

### Implementation Plan

#### 1. UI/UX Integration
- Add an "Export as Terraform (AWS/Azure)" button or section in the UI
- Modal or tabbed interface to select AWS or Azure code
- Display syntax-highlighted, copyable Terraform code (code block with copy-to-clipboard)

#### 2. Terraform Code Generation Logic
- **Inputs:** Parent network CIDR, name, region, subnets (name, CIDR)
- **Outputs:**
  - AWS: `aws_vpc`, `aws_subnet` resources
  - Azure: `azurerm_virtual_network`, `azurerm_subnet` resources
- **Approach:**
  - Utility functions to generate HCL for each provider
  - Map internal data structure to Terraform resource blocks
  - Allow user to specify (or default) required fields (region, resource group, tags)

#### 3. Provider-Specific Details
- **AWS:**
  - `aws_vpc` with parent CIDR
  - `aws_subnet` for each subnet (with CIDR, map_public_ip, etc.)
  - Optionally generate `aws_internet_gateway`, `aws_route_table`
- **Azure:**
  - `azurerm_virtual_network` with parent CIDR
  - `azurerm_subnet` for each subnet
  - Optionally generate `azurerm_resource_group`

#### 4. Validation & Error Handling
- Ensure all subnet CIDRs are within the parent network
- Validate required fields (names, CIDRs, regions)

#### 5. Testing
- Unit tests for code generation (output matches expected HCL)
- Manual validation with `terraform plan`

#### 6. Documentation
- Add README section describing the feature
- Provide example output for AWS and Azure

#### 7. Future Enhancements
- Support for GCP and other providers
- Allow customization of more fields (tags, NACLs, route tables, etc.)
- Export as `.tf` file directly

**Why This Is Great:**
- Bridges the gap between planning and deployment
- Saves time and reduces manual errors
- Makes russ.tools a unique tool for both design and implementation

---