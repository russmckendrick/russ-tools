# Subnet.Fit Phase 4: Network Designer Expansion – Task Tracker

## Main Goals
- [x] Parent Network (Supernet) Setup
- [x] Subnets Management
- [x] Persistent State with Local Storage
- [x] Enhanced Visualization for Multiple Subnets
- [ ] Network Diagram View

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
- [ ] Add placeholder for network diagram
- [ ] Implement dynamic diagram generation
- [ ] Support export (SVG/PNG)

---

*Update this file as tasks are started, completed, or refined.*

## Current Sprint Tasks

**Core Features:**
- [x] Define parent network
- [x] Add/edit/delete subnets
- [x] Save state to local storage
- [x] Simplify visualization component (remove dragging)
- [x] Convert CIDR inputs to dropdowns with valid options
- [ ] Add subnet auto-allocation
- [ ] Export/share configuration

**UI Improvements:**
- [~] Add tooltips to explain CIDR notation
- [ ] Create help modal with basic subnetting concepts
- [ ] Improve color scheme for better subnet differentiation
- [ ] Add visual indicator for subnet overlap/errors
- [ ] Add welcome screen for first-time users

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