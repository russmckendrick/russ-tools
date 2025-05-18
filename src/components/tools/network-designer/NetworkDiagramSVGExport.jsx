import { useMantineTheme, useMantineColorScheme, Button, Modal } from '@mantine/core';
import { devError } from '../../../utils/devLog';
import { useRef, useState } from 'react';
import { Netmask } from 'netmask';
import { ipToLong, longToIp, getSubnetBgColorHex } from '../../../utils';
import { processSubnets, calculateFreeSpace, getBaseColorHex } from '../../../utils/networkDiagramUtils';
import networkSvg from '../../../assets/network.svg';
import subnetSvg from '../../../assets/subnet.svg';
import spaceSvg from '../../../assets/space.svg';

// Helper for contrast (copied from SubnetVisualization)
const getContrastColor = (hexColor, theme) => {
  if (!hexColor) return theme.black; // Default
  hexColor = hexColor.replace('#', '');
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance < 0.5 ? theme.white : theme.black;
};

// This component receives all props needed for SVG export
export function NetworkDiagramSVGExport({ parentNetwork, subnets, buttonProps = {} }) {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const [errorModal, setErrorModal] = useState({ opened: false, message: '' });

  // Extracted from NetworkDiagram.jsx
  function generateSVGMarkup() {
    const width = 1220;
    // Visual parity constants (match interactive diagram)
    const fontSizeTitle = 18;
    const fontSizeSubnetName = 15;
    const fontSizeSm = 13;
    const fontSizeXs = 12;
    const subnetPadding = 12; // Mantine p='sm'
    const subnetHeight = 72; // More breathing room for subnets
    const freeSpaceHeight = subnetHeight; // Free space row matches subnet row
    const subnetSpacing = 12;
    const iconSize = 18;
    const iconPadding = 8;
    const textStartX = 75;
    const subnetRadius = 8;
    const parentRadius = 12;
    const outerPad = 24;
    const innerPad = 16;
    const bgColor = colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[0];
    const parentBorderColor = theme.colors.blue[7];
    const parentHeaderBg = colorScheme === 'dark' ? theme.colors.dark[6] : theme.white;
    const defaultTextColor = colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[7];
    const freeSpaceBg = colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0];
    const freeSpaceBorder = colorScheme === 'dark' ? theme.colors.gray[7] : theme.colors.gray[4];
    const freeSpaceTextColor = colorScheme === 'dark' ? theme.colors.gray[4] : theme.colors.gray[7];
    const freeSpaceIconColor = colorScheme === 'dark' ? theme.colors.gray[5] : theme.colors.gray[6];

    // --- DATA PREP SHARED WITH INTERACTIVE DIAGRAM ---
    const parentBlock = new Netmask(parentNetwork.ip + '/' + parentNetwork.cidr);
    const processedSubnets = processSubnets(subnets);
    const freeSpaces = calculateFreeSpace(processedSubnets, parentBlock);
    // -------------------------------------------------

    // Compose items for rendering
    const items = [];
    let subnetIdx = 0, spaceIdx = 0;
    for (let i = 0, s = 0, f = 0; i < processedSubnets.length + freeSpaces.length; ) {
      if (
        f < freeSpaces.length &&
        (s >= processedSubnets.length || freeSpaces[f].start < processedSubnets[s].networkLong)
      ) {
        items.push({ type: 'freeSpace', data: freeSpaces[f++] });
        i++;
      } else if (s < processedSubnets.length) {
        items.push({ type: 'subnet', data: processedSubnets[s++] });
        i++;
      }
    }
    // Calculate header height (icon + text + spacing)
    const headerHeight = 70; // icon (22) + title (24) + 2 lines + padding
    let currentY = outerPad + innerPad + headerHeight;
    // Calculate diagram height: header + all rows + spacing + footer
    let diagramHeight = currentY + items.reduce((acc, item) => acc + (item.type === 'subnet' ? subnetHeight : freeSpaceHeight) + subnetSpacing, 0) + 18 + 32; // 18px footer margin, 32px footer height
    // SVG Markup
    let svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg width="${width}" height="${diagramHeight}" viewBox="0 0 ${width} ${diagramHeight}" xmlns="http://www.w3.org/2000/svg">\n`;
    svg += `<rect x="0" y="0" width="${width}" height="${diagramHeight}" fill="${bgColor}"/>`;
    // Outer parent container (match Paper/Box)
    svg += `<rect x="${outerPad}" y="${outerPad}" width="${width - 2 * outerPad}" height="${diagramHeight - 2 * outerPad}" rx="${parentRadius}" fill="${parentHeaderBg}" stroke="${parentBorderColor}" stroke-width="2.5"/>`;
    // Header icon and title (match Group/Title/Text)
    svg += `<image href="${networkSvg}" x="${outerPad + innerPad}" y="${outerPad + 8}" width="22" height="22"/>`;
    svg += `<text x="${outerPad + innerPad + 32}" y="${outerPad + 24}" font-family="${theme.fontFamily}" font-size="${fontSizeTitle}" font-weight="bold" fill="${defaultTextColor}">${parentNetwork.name || 'Parent Network'}</text>`;
    svg += `<text x="${outerPad + innerPad + 32 + 220}" y="${outerPad + 24}" font-family="${theme.fontFamily}" font-size="${fontSizeXs}" font-weight="500" fill="${defaultTextColor}">(${parentBlock.base}/${parentNetwork.cidr})</text>`;
    svg += `<text x="${outerPad + innerPad + 32}" y="${outerPad + 44}" font-family="${theme.fontFamily}" font-size="${fontSizeXs}" fill="${defaultTextColor}">Range: ${parentBlock.first} - ${parentBlock.last}</text>`;
    svg += `<text x="${outerPad + innerPad + 32}" y="${outerPad + 60}" font-family="${theme.fontFamily}" font-size="${fontSizeXs}" fill="${defaultTextColor}">Total IPs: ${parentBlock.size}</text>`;
    let itemCounter = 0;
    for (const item of items) {
      if (item.type === 'subnet') {
        const subnet = item.data;
        const subnetX = outerPad + innerPad;
        const subnetWidth = width - 2 * outerPad - 2 * innerPad;
        svg += `<g>`;
        // Use theme-aware background and contrast for text
        const subnetBorderColor = getBaseColorHex(subnet.color, theme);
        const subnetBgColor = getSubnetBgColorHex(subnet.color, theme, colorScheme);
        const subnetTextColor = getContrastColor(subnetBgColor, theme);
        svg += `<rect x="${subnetX}" y="${currentY}" width="${subnetWidth}" height="${subnetHeight}" rx="${subnetRadius}" fill="${subnetBgColor}" stroke="${subnetBorderColor}" stroke-width="1.5"/>`;
        // Vertically center icon and text in box
        const iconY = currentY + subnetPadding + 4;
        // Vertically stack text lines with generous spacing
        const textLine1Y = currentY + 32; // Name
        const textLine2Y = currentY + 48; // Range
        const textLine3Y = currentY + 62; // Usable IPs
        svg += `<image href="${subnetSvg}" x="${subnetX + iconPadding}" y="${iconY}" width="${iconSize}" height="${iconSize}"/>`;
        svg += `<text x="${textStartX}" y="${textLine1Y}" font-family="${theme.fontFamily}" font-size="${fontSizeSubnetName}" font-weight="700" fill="${subnetTextColor}">${subnet.name}</text>`;
        svg += `<text x="${textStartX}" y="${textLine2Y}" font-family="${theme.fontFamily}" font-size="${fontSizeSm}" fill="${subnetTextColor}">Range: ${subnet.block.base} - ${subnet.block.broadcast} (${subnet.block.mask})</text>`;
        svg += `<text x="${textStartX}" y="${textLine3Y}" font-family="${theme.fontFamily}" font-size="${fontSizeXs}" fill="${subnetTextColor}">Usable IPs: ${subnet.block.size - 2}</text>`;
        svg += `<text x="${subnetX + subnetWidth - 24}" y="${textLine1Y}" font-family="${theme.fontFamily}" font-size="${fontSizeXs}" font-weight="500" text-anchor="end" fill="${subnetTextColor}">(${subnet.block.base}/${subnet.cidr})</text>`;
        svg += `</g>`;
        currentY += subnetHeight + subnetSpacing;
      } else if (item.type === 'freeSpace') {
        const space = item.data;
        const spaceX = outerPad + innerPad;
        const spaceWidth = width - 2 * outerPad - 2 * innerPad; // Match subnet row width
        svg += `<g>`;
        svg += `<rect x="${spaceX}" y="${currentY}" width="${spaceWidth}" height="${freeSpaceHeight}" rx="${subnetRadius}" fill="${freeSpaceBg}" stroke="${freeSpaceBorder}" stroke-width="1.5" stroke-dasharray="6,4"/>`;
        const spaceIconY = currentY + subnetPadding + 4;
        const spaceText1Y = currentY + 32;
        const spaceText2Y = currentY + 48;
        svg += `<image href="${spaceSvg}" x="${spaceX + iconPadding}" y="${spaceIconY}" width="${iconSize}" height="${iconSize}"/>`;
        svg += `<text x="${textStartX}" y="${spaceText1Y}" font-family="${theme.fontFamily}" font-size="${fontSizeSm}" font-weight="bold" fill="${freeSpaceTextColor}">Free Space</text>`;
        svg += `<text x="${textStartX}" y="${spaceText2Y}" font-family="${theme.fontFamily}" font-size="${fontSizeXs}" fill="${freeSpaceTextColor}">${space.startIp} – ${space.endIp} (${space.size} IPs)</text>`;
        svg += `</g>`;
        currentY += freeSpaceHeight + subnetSpacing;
      }
      itemCounter++;
    }
    // End SVG after last row (no footer)
    svg += `</svg>`;
    return svg;
  }

  // Export as SVG
  function exportSVG() {
    try {
      const svgData = generateSVGMarkup();
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = svgUrl;
      downloadLink.download = `${parentNetwork.name || 'network'}-diagram.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(svgUrl);
    } catch (err) {
      devError('SVG export error:', err);
      setErrorModal({
        opened: true,
        message: 'SVG export failed. Could not generate diagram markup.',
      });
    }
  }

  return (
    <>
      {buttonProps && Object.keys(buttonProps).length > 0 && (
        <Button onClick={exportSVG} {...buttonProps}>
          Export SVG
        </Button>
      )}
      <Modal opened={errorModal.opened} onClose={() => setErrorModal({ opened: false, message: '' })} title="SVG Export Error">
        {errorModal.message}
      </Modal>
    </>
  );
}
