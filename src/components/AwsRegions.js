// Dynamic loader for AWS regions based on regions-aws.json
// Returns a Promise that resolves to [{ label, value }, ...] for use in dropdowns
export async function loadAwsRegions() {
  // Use relative path for Vite/CRA static assets
  const resp = await fetch('/src/assets/regions-aws.json');
  if (!resp.ok) throw new Error('Failed to load AWS regions JSON');
  const regions = await resp.json();
  return regions.map(region => ({
    label: region.displayName || region.name,
    value: region.name
  }));
}
