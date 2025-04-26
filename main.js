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

// Initialize all DOM elements at the top
const ipInput = document.getElementById('ip');
const cidrInput = document.getElementById('cidr');
const results = document.getElementById('results');
const visualization = document.getElementById('visualization');
const planner = document.getElementById('planner');
const planPrefixSelect = document.getElementById('plan-prefix');
const addSubnetBtn = document.getElementById('add-subnet');
const planTable = document.getElementById('plan-table');
const planRemaining = document.getElementById('plan-remaining');

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
  
  // Reset and hide results sections
  results.innerHTML = '';
  visualization.innerHTML = '';
  results.classList.add('hidden');
  visualization.classList.add('hidden');
  planner.classList.add('hidden');
  
  if (!isValidIPv4(ip)) {
    results.classList.remove('hidden');
    results.innerHTML = '<div class="alert alert-error">Invalid IPv4 address.</div>';
    ipInput.focus();
    return;
  }
  
  const prefix = parseCIDRorMask(cidr);
  if (prefix === null) {
    results.classList.remove('hidden');
    results.innerHTML = '<div class="alert alert-error">Invalid CIDR or subnet mask.</div>';
    cidrInput.focus();
    return;
  }
  
  const subnet = calculateSubnet(ip, prefix);
  
  // Show results section
  results.classList.remove('hidden');
  results.innerHTML = `
    <h2 class="text-xl font-bold mb-3">Network Information</h2>
    <div class="overflow-x-auto">
      <table class="table table-zebra w-full">
        <tbody>
          <tr>
            <td class="font-medium">Network Address</td>
            <td>${subnet.network}</td>
          </tr>
          <tr>
            <td class="font-medium">Broadcast Address</td>
            <td>${subnet.broadcast}</td>
          </tr>
          <tr>
            <td class="font-medium">Usable Host Range</td>
            <td>${subnet.first} - ${subnet.last}</td>
          </tr>
          <tr>
            <td class="font-medium">Total Hosts</td>
            <td>${subnet.totalHosts}</td>
          </tr>
          <tr>
            <td class="font-medium">Usable Hosts</td>
            <td>${subnet.usableHosts}</td>
          </tr>
          <tr>
            <td class="font-medium">Subnet Mask</td>
            <td>${subnet.mask}</td>
          </tr>
          <tr>
            <td class="font-medium">CIDR Prefix</td>
            <td>/${subnet.prefix}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
  // Visualization with DaisyUI styling
  visualization.classList.remove('hidden');
  const total = subnet.totalHosts;
  const usable = subnet.usableHosts;
  
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
  
  // Calculate percentages for the bar
  const leftPercent = (leftSize / total) * 100;
  const usablePercent = (usableSize / total) * 100;
  const rightPercent = (rightSize / total) * 100;
  
  visualization.innerHTML = `
    <h2 class="text-xl font-bold mb-3">Network Visualization</h2>
    <div class="subnet-bar">
      <div class="subnet-bar-network" style="width:${leftPercent}%">${leftLabel}</div>
      <div class="subnet-bar-usable" style="width:${usablePercent}%">${usableLabel}</div>
      <div class="subnet-bar-broadcast" style="width:${rightPercent}%">${rightLabel}</div>
    </div>
    <div class="text-sm text-gray-500 mt-2">Visual representation of your subnet allocation</div>
  `;
  // --- Custom Subnet Planner Logic ---
  // Only allow planning if prefix < 32
  if (subnet.prefix < 32) {
    planner.classList.remove('hidden');
    // Populate dropdown with valid smaller prefixes
    planPrefixSelect.innerHTML = '';
    for (let p = subnet.prefix + 1; p <= 32; ++p) {
      let hosts = Math.max(2 ** (32 - p) - (p < 31 ? 2 : 0), 1);
      let label = `/${p} (${hosts} hosts)`;
      let opt = document.createElement('option');
      opt.value = p;
      opt.textContent = label;
      planPrefixSelect.appendChild(opt);
    }
    // State: planned subnets as array of {prefix, networkInt}
    let plan = [];
    // Helper to convert int to IP
    const toIp = x => [24,16,8,0].map(s => (x >>> s) & 255).join('.');
    // Helper to render plan
    function renderPlan(scrollToLast = false) {
      let baseIpParts = subnet.network.split('.').map(Number);
      let baseIpInt = baseIpParts.reduce((acc, p) => (acc << 8) | p, 0);
      let endIpInt = baseIpInt + subnet.totalHosts - 1;
      let rows = '', nextInt = baseIpInt;
      let used = 0;
      for (let i = 0; i < plan.length; ++i) {
        let p = plan[i].prefix;
        let size = 2 ** (32 - p);
        let net = nextInt;
        let bcast = net + size - 1;
        if (bcast > endIpInt) break; // Over-alloc
        let mask = (~0 << (32 - p)) >>> 0;
        let maskStr = [24,16,8,0].map(s => (mask >>> s) & 255).join('.');
        let totalHosts = 2 ** (32 - p);
        let usableHosts = p < 31 ? totalHosts - 2 : totalHosts;
        let first = p < 31 ? net + 1 : net;
        let last = p < 31 ? bcast - 1 : bcast;
        rows += `
          <tr>
            <td>${toIp(net)}</td>
            <td>${toIp(bcast)}</td>
            <td>${toIp(first)} - ${toIp(last)}</td>
            <td>${maskStr}</td>
            <td>/${p}</td>
            <td>${usableHosts}</td>
            <td>
              <button class="btn btn-xs btn-error" data-index="${i}">Remove</button>
            </td>
          </tr>`;
        nextInt = bcast + 1;
        used += size;
      }
      planTable.innerHTML = `
        <div class="overflow-x-auto">
          <table class="table table-zebra w-full">
            <thead>
              <tr>
                <th>Network</th>
                <th>Broadcast</th>
                <th>Usable Range</th>
                <th>Mask</th>
                <th>CIDR</th>
                <th>Hosts</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
      planTable.querySelectorAll('.btn-error').forEach(btn => {
        btn.addEventListener('click', function() {
          const index = parseInt(this.dataset.index);
          plan.splice(index, 1);
          renderPlan();
        });
      });
      let left = subnet.totalHosts - used;
      let percentUsed = Math.min(100, Math.max(0, 100 * used / subnet.totalHosts));
      document.getElementById('plan-progress').innerHTML = `
        <div class="subnet-progress">
          <div class="subnet-progress-bar" style="width: ${percentUsed}%"></div>
        </div>
        <div class="text-xs text-right mt-1">Used: ${used} / ${subnet.totalHosts} IPs (${percentUsed.toFixed(1)}%)</div>
      `;
      if (left > 0) {
        let leftNet = nextInt;
        let leftLast = endIpInt;
        planRemaining.innerHTML = `<div class="text-info">Unallocated: ${toIp(leftNet)} - ${toIp(leftLast)} (${left} IPs)</div>`;
      } else if (left === 0) {
        planRemaining.innerHTML = `<div class="text-success font-medium">All space allocated</div>`;
      } else {
        planRemaining.innerHTML = `<div class="text-error font-medium">Over-allocated! Remove a subnet.</div>`;
      }
    }
    addSubnetBtn.onclick = () => {
      let prefix = Number(planPrefixSelect.value);
      plan.push({prefix});
      renderPlan(true);
      
      // Highlight the new row with animation
      setTimeout(() => {
        const rows = planTable.querySelectorAll('tbody tr');
        if (rows.length > 0) {
          const lastRow = rows[rows.length - 1];
          lastRow.classList.add('subnet-highlight', 'fade-in');
          setTimeout(() => {
            lastRow.classList.remove('subnet-highlight');
          }, 1500);
        }
      }, 50);
    };
    plan = [];
    renderPlan();
  } else {
    planner.classList.add('hidden');
    planTable.innerHTML = '';
    planRemaining.innerHTML = '';
  }
});
