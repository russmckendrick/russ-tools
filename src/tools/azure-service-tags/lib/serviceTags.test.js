import { describe, expect, it } from 'vitest';
import { diffServiceTags, searchServiceTags } from './serviceTags.js';

const data = { tags: [
  { name: 'Storage.WestEurope', region: 'westeurope', systemService: 'Storage', prefixes: ['20.0.0.0/24'] },
  { name: 'AzureCloud', region: '', systemService: '', prefixes: ['20.0.0.0/8'] },
] };

describe('Azure service tags', () => {
  it('searches by tag metadata and reverse matches an IP', () => {
    expect(searchServiceTags(data, 'storage').map((tag) => tag.name)).toEqual(['Storage.WestEurope']);
    expect(searchServiceTags(data, '20.0.0.4').map((tag) => tag.name)).toEqual(['Storage.WestEurope', 'AzureCloud']);
  });

  it('diffs normalized and raw Microsoft datasets', () => {
    const result = diffServiceTags(
      { changeNumber: 2, tags: [{ name: 'Storage', prefixes: ['1.1.1.0/24', '2.2.2.0/24'] }] },
      { changeNumber: 1, values: [{ name: 'Storage', properties: { addressPrefixes: ['1.1.1.0/24'] } }] }
    );
    expect(result.changes[0].added).toEqual(['2.2.2.0/24']);
  });
});
