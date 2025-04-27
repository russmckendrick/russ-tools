// List of Azure public cloud regions (2024)
// Each region has a display name and value (Terraform/location string)

// Dynamic loader for Azure regions based on regions-azure.json
// Returns a Promise that resolves to [{ label, value }, ...] for use in dropdowns
export async function loadAzureRegions() {
  // Use relative path for Vite/CRA static assets
  const resp = await fetch('/src/assets/regions-azure.json');
  if (!resp.ok) throw new Error('Failed to load Azure regions JSON');
  const regions = await resp.json();
  return regions.map(region => ({
    label: region.displayName || region.regionalDisplayName || region.name,
    value: region.name
  }));
}
