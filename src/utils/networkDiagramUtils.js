import { Netmask } from 'netmask';
import { ipToLong, longToIp } from './index';

// Process subnets with consistent color assignment and sorting
export function processSubnets(subnets) {
  return subnets.map((subnet) => {
    const block = new Netmask(subnet.base + '/' + subnet.cidr);
    return {
      ...subnet,
      block,
      networkLong: ipToLong(block.base),
      broadcastLong: ipToLong(block.broadcast)
    };
  }).sort((a, b) => a.networkLong - b.networkLong);
}

// Calculate free space between subnets
export function calculateFreeSpace(processedSubnets, parentBlock) {
  if (processedSubnets.length === 0) {
    return [{
      start: ipToLong(parentBlock.base),
      end: ipToLong(parentBlock.broadcast),
      size: parentBlock.size,
      startIp: parentBlock.base,
      endIp: parentBlock.broadcast
    }];
  }
  const parentStartLong = ipToLong(parentBlock.base);
  const parentEndLong = ipToLong(parentBlock.broadcast);
  let freeSpaces = [];
  if (processedSubnets.length > 0 && processedSubnets[0].networkLong > parentStartLong) {
    const firstSubnetStart = processedSubnets[0].networkLong;
    const size = firstSubnetStart - parentStartLong;
    if (size > 0) {
      const endLongIp = firstSubnetStart - 1;
      freeSpaces.push({
        start: parentStartLong,
        end: endLongIp,
        size: size,
        startIp: parentBlock.base,
        endIp: longToIp(endLongIp)
      });
    }
  }
  for (let i = 0; i < processedSubnets.length - 1; i++) {
    const currentBroadcast = processedSubnets[i].broadcastLong;
    const nextNetwork = processedSubnets[i + 1].networkLong;
    if (nextNetwork > currentBroadcast + 1) {
      const startLongIp = currentBroadcast + 1;
      const endLongIp = nextNetwork - 1;
      const size = endLongIp - startLongIp + 1;
      freeSpaces.push({
        start: startLongIp,
        end: endLongIp,
        size: size,
        startIp: longToIp(startLongIp),
        endIp: longToIp(endLongIp)
      });
    }
  }
  if (processedSubnets.length > 0) {
    const lastSubnet = processedSubnets[processedSubnets.length - 1];
    const lastSubnetBroadcast = lastSubnet.broadcastLong;
    if (lastSubnetBroadcast < parentEndLong) {
      const startLongIp = lastSubnetBroadcast + 1;
      const size = parentEndLong - startLongIp + 1;
      freeSpaces.push({
        start: startLongIp,
        end: parentEndLong,
        size: size,
        startIp: longToIp(startLongIp),
        endIp: parentBlock.broadcast
      });
    }
  }
  return freeSpaces;
}

// Derive the base HEX color from the theme using stored name and index
export function getBaseColorHex(colorObj, theme) {
  if (!theme || !theme.colors) {
    console.warn('getBaseColorHex called without a valid theme object');
    return '#cccccc'; // fallback gray
  }
  if (!colorObj || typeof colorObj !== 'object') {
    if (colorObj) console.warn('Invalid color object type, falling back to gray:', colorObj);
    return theme.colors.gray[6] || '#cccccc';
  }
  if (!colorObj.name) {
    console.warn('Color object missing name, falling back to gray:', colorObj);
    return theme.colors.gray[6] || '#cccccc';
  }
  if (colorObj.index === undefined || colorObj.index === null) {
    console.warn('Color object missing index, falling back to gray:', colorObj);
    return theme.colors.gray[6] || '#cccccc';
  }
  const colorHex = theme.colors[colorObj.name]?.[colorObj.index];
  if (!colorHex) {
    console.warn(`Theme color lookup failed for ${colorObj.name}[${colorObj.index}], falling back to gray.`);
    return theme.colors.gray[6] || '#cccccc';
  }
  return colorHex;
}
