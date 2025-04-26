// Simple IPv4 validation and subnet calculation logic
function isValidIPv4(ip) {
  return /^((25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.|$)){4}$/.test(ip);
}

function parseCIDRorMask(input) {
  if (input.startsWith('/')) {
    const prefix = parseInt(input.slice(1), 10);
    if (prefix >= 0 && prefix <= 32) return prefix;
  } else {
    // Convert mask to prefix
    const parts = input.split('.').map(Number);
    if (parts.length === 4 && parts.every(p => p >= 0 && p <= 255)) {
      let mask = parts.reduce((acc, p) => (acc << 8) | p, 0);
      let bin = mask.toString(2);
      if (/^1*0*$/.test(bin)) return bin.indexOf('0');
    }
  }
  return null;
}

function calculateSubnet(ip, prefix) {
  // Convert IP to integer
  const ipParts = ip.split('.').map(Number);
  const ipInt = ipParts.reduce((acc, p) => (acc << 8) | p, 0);
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const network = ipInt & mask;
  const broadcast = network | (~mask >>> 0);
  const first = prefix < 31 ? network + 1 : network;
  const last = prefix < 31 ? broadcast - 1 : broadcast;
  const totalHosts = 2 ** (32 - prefix);
  const usableHosts = prefix < 31 ? totalHosts - 2 : totalHosts;
  const maskStr = [24,16,8,0].map(s => (mask >>> s) & 255).join('.');
  return {
    network: [24,16,8,0].map(s => (network >>> s) & 255).join('.'),
    broadcast: [24,16,8,0].map(s => (broadcast >>> s) & 255).join('.'),
    first: [24,16,8,0].map(s => (first >>> s) & 255).join('.'),
    last: [24,16,8,0].map(s => (last >>> s) & 255).join('.'),
    totalHosts,
    usableHosts,
    mask: maskStr,
    prefix
  };
}

const ipInput = document.getElementById('ip');
const cidrInput = document.getElementById('cidr');
const results = document.getElementById('results');
const visualization = document.getElementById('visualization');

function showValidation() {
  let ip = ipInput.value.trim();
  let cidr = cidrInput.value.trim();
  let ipValid = isValidIPv4(ip);
  let cidrValid = parseCIDRorMask(cidr) !== null;
  ipInput.style.borderColor = ipValid ? '' : 'red';
  cidrInput.style.borderColor = cidrValid ? '' : 'red';
}

ipInput.addEventListener('input', showValidation);
cidrInput.addEventListener('input', showValidation);

document.getElementById('subnet-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const ip = ipInput.value.trim();
  const cidr = cidrInput.value.trim();
  results.innerHTML = '';
  visualization.innerHTML = '';
  if (!isValidIPv4(ip)) {
    results.innerHTML = '<b>Invalid IPv4 address.</b>';
    ipInput.focus();
    return;
  }
  const prefix = parseCIDRorMask(cidr);
  if (prefix === null) {
    results.innerHTML = '<b>Invalid CIDR or subnet mask.</b>';
    cidrInput.focus();
    return;
  }
  const subnet = calculateSubnet(ip, prefix);
  results.innerHTML = `
    <h2>Results</h2>
    <ul>
      <li><b>Network Address:</b> ${subnet.network}</li>
      <li><b>Broadcast Address:</b> ${subnet.broadcast}</li>
      <li><b>Usable Host Range:</b> ${subnet.first} - ${subnet.last}</li>
      <li><b>Total Hosts:</b> ${subnet.totalHosts}</li>
      <li><b>Usable Hosts:</b> ${subnet.usableHosts}</li>
      <li><b>Subnet Mask:</b> ${subnet.mask}</li>
      <li><b>CIDR Prefix:</b> /${subnet.prefix}</li>
    </ul>
  `;
  // Visualization: simple horizontal bar
  const total = subnet.totalHosts;
  const usable = subnet.usableHosts;
  const unusable = total - usable;
  // For /31 and /32, all addresses are usable
  let leftLabel = 'Network';
  let rightLabel = 'Broadcast';
  let usableLabel = 'Usable Hosts';
  let leftSize = 1, rightSize = 1, usableSize = usable;
  if (subnet.prefix >= 31) {
    leftLabel = 'Usable';
    rightLabel = '';
    usableLabel = '';
    leftSize = total;
    rightSize = 0;
    usableSize = 0;
  }
  const width = 400;
  const height = 32;
  const scale = width / total;
  let svg = `<svg width="${width}" height="${height}" style="border-radius:6px;border:1px solid #eee;background:#f8fafc;">
    <rect x="0" y="0" width="${leftSize*scale}" height="${height}" fill="#c7d2fe" />
    <rect x="${leftSize*scale}" y="0" width="${usableSize*scale}" height="${height}" fill="#60a5fa" />
    <rect x="${(leftSize+usableSize)*scale}" y="0" width="${rightSize*scale}" height="${height}" fill="#c7d2fe" />
    <text x="8" y="20" font-size="13" fill="#222">${leftLabel}</text>
    <text x="${width/2}" y="20" font-size="13" fill="#fff" text-anchor="middle">${usableLabel}</text>
    <text x="${width-8}" y="20" font-size="13" fill="#222" text-anchor="end">${rightLabel}</text>
  </svg>`;
  visualization.innerHTML = svg + '<div style="font-size:13px;margin-top:6px;color:#666;">Visual representation: left = network, blue = usable hosts, right = broadcast.</div>';
});
