import {
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from 'russ-tools';

export const Closed = () => (
  <div style={{ display: 'grid', gap: 6, maxWidth: 320 }}>
    <Label htmlFor="rtype">Record type</Label>
    <Select defaultValue="A">
      <SelectTrigger id="rtype">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="A">A</SelectItem>
        <SelectItem value="AAAA">AAAA</SelectItem>
        <SelectItem value="MX">MX</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

export const Placeholder = () => (
  <div style={{ display: 'grid', gap: 6, maxWidth: 320 }}>
    <Label htmlFor="resolver">Resolver</Label>
    <Select>
      <SelectTrigger id="resolver">
        <SelectValue placeholder="Choose a resolver" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="cloudflare">1.1.1.1</SelectItem>
        <SelectItem value="google">8.8.8.8</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

// DESIGN.md: a closed Select and a text Input must be indistinguishable apart
// from the chevron, because they are the same kind of thing.
export const Grouped = () => (
  <div style={{ display: 'grid', gap: 6, maxWidth: 320 }}>
    <Label htmlFor="region">Azure region</Label>
    <Select defaultValue="uksouth">
      <SelectTrigger id="region">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Europe</SelectLabel>
          <SelectItem value="uksouth">uksouth</SelectItem>
          <SelectItem value="westeurope">westeurope</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Americas</SelectLabel>
          <SelectItem value="eastus">eastus</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
);

export const Disabled = () => (
  <div style={{ display: 'grid', gap: 6, maxWidth: 320 }}>
    <Label htmlFor="off">Record type</Label>
    <Select disabled defaultValue="A">
      <SelectTrigger id="off">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="A">A</SelectItem>
      </SelectContent>
    </Select>
  </div>
);
