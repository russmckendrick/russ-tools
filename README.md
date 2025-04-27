# Russ Tools

**Live App:** [https://www.russ.tools/](https://www.russ.tools/)

Russ Tools is a modern, responsive web application for IPv4 subnet calculation and network planning. It helps network engineers, students, and IT professionals design and visualize subnets, plan address allocations, and export professional diagrams.

---

## ✨ Features

- **Subnet Calculator:**
  - Enter IPv4 address and subnet mask or CIDR (e.g., 10.0.0.0/24 or 255.255.255.0)
  - Displays network address, broadcast address, usable host range, subnet mask (dot-decimal & slash), and total hosts
  - Robust input validation with instant feedback

- **Network Designer & Subnet Planner:**
  - Define a parent network (supernet) and add multiple subnets of varying sizes
  - Subnet allocation logic ensures:
    - Unique, non-overlapping subnets
    - Proper boundary alignment for each subnet
    - Subnets placed at the first available valid position
  - Visualize allocated and free space within the parent network
  - Drag-and-drop subnet reordering with automatic recalculation
  - Prevents over-allocation and overlapping subnets

- **Interactive Visualization:**
  - Modern, responsive diagram showing all subnets and free space
  - Distinct color segments for subnets, free space, network, and broadcast addresses
  - Tooltips and icons for contextual info (uses Tabler icons)
  - Animated updates and full support for dark/light mode

- **Exportable Diagrams:**
  - Export network diagrams as SVG or PNG
  - Export includes all subnets, free space, and legend
  - SVG export uses proper icons and color schemes for documentation-quality output

- **State Persistence:**
  - All network designs and subnets are saved to localStorage and restored automatically

- **Modern UI:**
  - Built with [Mantine](https://mantine.dev/) for a clean, professional look
  - Fully responsive and accessible

---

## 🛠️ Technology Stack

- **React** (SPA framework)
- **Vite** (build tool)
- **Mantine** (UI framework)
- **netmask** (IPv4 subnet calculation)
- **@dnd-kit** (drag-and-drop)
- **Tabler Icons** (SVG icons)

---

## 🚀 Usage

Visit [https://www.russ.tools/](https://www.russ.tools/) and:

1. **Set a Parent Network:**
   - Enter a network address (e.g., 10.0.0.0) and CIDR (e.g., /16)
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

---

## 📦 Development

Clone the repo and run locally:

```bash
npm install
npm run dev
```

---

## 📄 License

MIT License. See [LICENSE](./LICENSE).

---

© {year} russ.tools. Built with ❤️ by Russ McKendrick.
