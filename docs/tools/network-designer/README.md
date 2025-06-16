# Network Designer & Subnet Calculator

## Overview

The Network Designer & Subnet Calculator is a comprehensive tool for planning, designing, and visualizing IP network architectures. It provides an interactive interface for subnet calculation, IP address allocation, network visualization, and configuration export for cloud environments.

## Purpose

This tool is designed for network engineers, system administrators, cloud architects, and DevOps professionals who need to:
- Plan IP address schemes for cloud deployments
- Design subnet architectures for Azure, AWS, or VMware environments
- Visualize network topologies
- Generate infrastructure-as-code configurations
- Calculate optimal subnet sizes and allocations

## Key Features

### 1. Interactive Network Planning
- **Parent Network Configuration**: Define the main network block (e.g., 10.0.0.0/16)
- **Dynamic Subnet Creation**: Add subnets with automatic IP allocation
- **Drag-and-Drop Reordering**: Reorganize subnets with visual feedback
- **Collision Detection**: Prevents overlapping subnet assignments

### 2. Intelligent Subnet Allocation
- **Automatic IP Assignment**: Smart allocation prevents address conflicts
- **CIDR Validation**: Ensures proper subnet boundaries and alignment
- **Size Optimization**: Calculates optimal subnet sizes based on requirements
- **Address Space Utilization**: Shows available vs. used IP ranges

### 3. Visual Network Diagrams
- **Interactive SVG Diagrams**: Scalable network topology visualizations
- **Color-Coded Subnets**: Visual distinction between different network segments
- **Hierarchical Layout**: Clear parent-child network relationships
- **Responsive Design**: Adapts to different screen sizes

### 4. Infrastructure Export
- **Terraform Generation**: Exports Terraform configurations for:
  - Azure Virtual Networks and Subnets
  - AWS VPCs and Subnets
  - Google Cloud VPCs and Subnets
- **SVG Export**: Download network diagrams as vector graphics
- **JSON Export**: Machine-readable network configurations

### 5. Advanced Subnet Management
- **Multiple Projects**: Manage separate network designs
- **Persistent Storage**: Saves designs locally in browser
- **Import/Export**: Share network designs between devices
- **Validation**: Real-time validation of network configurations

## Usage Instructions

### Getting Started

1. **Create a New Network**
   - Click "New Network" to start a fresh design
   - Or select an existing network from the dropdown

2. **Configure Parent Network**
   - Navigate to the "Network Setup" tab
   - Enter your parent network CIDR (e.g., 10.0.0.0/16)
   - Specify network name and description

3. **Design Subnets**
   - Switch to "Subnet Design" tab
   - Add subnets by specifying:
     - Subnet name (e.g., "Web Tier", "Database Tier")
     - CIDR size (/24, /25, /26, etc.)
     - Color for visualization

4. **Visualize Network**
   - View your design in the "Visualization" tab
   - See subnet layout and IP allocations
   - Export diagrams as needed

5. **Export Configuration**
   - Generate Terraform code in the "Export" tab
   - Download for use in your cloud deployments

### Advanced Usage

#### Custom Subnet Ordering
- Use drag-and-drop in the subnet list to reorder
- System automatically recalculates IP assignments
- Maintains subnet boundaries and prevents conflicts

#### Multi-Network Management
- Create separate networks for different projects
- Switch between networks using the dropdown
- Each network maintains independent configuration

#### Validation and Error Handling
- Real-time validation of CIDR notation
- Prevents invalid subnet configurations
- Clear error messages for resolution guidance

## Technical Implementation

### Architecture

```
NetworkDesignerTool (Main Component)
├── ParentNetworkForm - Network configuration
├── SubnetForm - Individual subnet creation
├── DraggableSubnets - Subnet management interface
├── NetworkDiagram - Visual representation
├── SubnetVisualization - Detailed subnet view
├── TerraformExportSection - Code generation
└── NetworkDiagramSVGExport - Diagram export
```

### Core Technologies
- **React 18**: Modern functional components with hooks
- **Mantine UI**: Comprehensive component library
- **Netmask Library**: IP address calculations and validation
- **UUID**: Unique identifiers for networks and subnets
- **SVG**: Scalable vector graphics for diagrams

### Key Algorithms

#### Subnet Allocation Algorithm
```javascript
// Simplified allocation logic
1. Calculate subnet size from CIDR
2. Find all possible aligned positions in parent network
3. Check for conflicts with existing subnets
4. Assign first available valid position
5. Update network state with new allocation
```

#### Drag-and-Drop Reordering
```javascript
// Reordering process
1. Capture new subnet order from drag operation
2. Clear all IP assignments temporarily
3. Re-allocate IPs in new order using allocation algorithm
4. Update UI with new assignments
5. Provide feedback on success/failure
```

### Data Structure

```javascript
// Network Object Structure
{
  id: "uuid",
  name: "Network Name",
  parentNetwork: {
    ip: "10.0.0.0",
    cidr: 16,
    name: "Main Network"
  },
  subnets: [
    {
      name: "Web Tier",
      cidr: 24,
      base: "10.0.1.0",
      color: "#blue"
    }
  ],
  createdAt: timestamp
}
```

## API Integration

### Internal APIs
- **Network Utilities**: IP calculation and validation functions
- **Local Storage**: Persistent data storage in browser
- **Export Services**: Terraform and SVG generation

### External Dependencies
- **Netmask**: `npm install netmask`
- **UUID**: `npm install uuid`
- **Mantine**: `npm install @mantine/core @mantine/hooks`

## Data Storage and Privacy

### Local Storage
- All network designs stored locally in browser
- No data transmitted to external servers
- Storage key: `networks` and `selectedNetworkId`
- Automatic cleanup of old/unused designs

### Privacy Considerations
- **Zero Server Communication**: All processing happens client-side
- **No Analytics**: No tracking of network designs or user behavior
- **Secure by Default**: Network topologies remain private
- **Data Portability**: Export/import functionality for data migration

### Storage Limitations
- Browser storage limits (typically 5-10MB)
- Cleared when browser data is reset
- Recommend regular exports for important designs

## Performance Considerations

### Optimization Strategies
- **Lazy Loading**: Components loaded as needed
- **Memoization**: Expensive calculations cached
- **Virtual Scrolling**: Large subnet lists handled efficiently
- **Debounced Updates**: Prevents excessive re-calculations

### Scalability Limits
- **Maximum Subnets**: Practical limit ~100 subnets per network
- **Large Networks**: Performance degrades with /8 and larger networks
- **Browser Memory**: Limited by available RAM

## Troubleshooting

### Common Issues

1. **Subnet Won't Add**
   - Check parent network has sufficient space
   - Verify CIDR notation is valid
   - Ensure subnet size is appropriate

2. **Drag-and-Drop Not Working**
   - Refresh page and try again
   - Check browser compatibility
   - Ensure network has multiple subnets

3. **Export Failures**
   - Verify all subnets have valid configurations
   - Check browser allows file downloads
   - Try different export formats

### Browser Compatibility
- **Supported**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Required Features**: ES6, Local Storage, SVG support
- **Mobile**: Limited functionality on small screens

## Best Practices

### Network Design
1. **Start Small**: Begin with larger CIDR blocks, subdivide as needed
2. **Plan Growth**: Leave room for expansion in your address space
3. **Consistent Naming**: Use clear, descriptive subnet names
4. **Document Purpose**: Include subnet descriptions and intended use

### Tool Usage
1. **Regular Exports**: Backup important network designs
2. **Validation**: Always validate before deploying to production
3. **Testing**: Test configurations in development environments first
4. **Version Control**: Track changes to network designs over time

## Examples

### Small Office Network
```
Parent Network: 192.168.1.0/24
├── Management: 192.168.1.0/26 (64 IPs)
├── Users: 192.168.1.64/26 (64 IPs)
├── Servers: 192.168.1.128/27 (32 IPs)
└── DMZ: 192.168.1.160/27 (32 IPs)
```

### Cloud Environment
```
Parent Network: 10.0.0.0/16
├── Public Subnet: 10.0.1.0/24 (256 IPs)
├── Private Subnet: 10.0.2.0/24 (256 IPs)
├── Database Subnet: 10.0.3.0/24 (256 IPs)
└── Management: 10.0.4.0/26 (64 IPs)
```

## Contributing

### Development Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Navigate to Network Designer tool

### Code Style
- Follow existing React patterns
- Use Mantine components consistently
- Implement proper error handling
- Add comprehensive comments

### Testing
- Test with various network sizes
- Validate export functionality
- Check browser compatibility
- Verify localStorage persistence

For more technical details, see the [Architecture Documentation](../../ARCHITECTURE.md) and [Development Guide](../../DEVELOPMENT.md).