import { readFileSync } from 'node:fs';

export const fixture = (name) =>
  readFileSync(new URL(`../fixtures/${name}`, import.meta.url), 'utf8');

export const LEAF = fixture('leaf.pem');
export const INTERMEDIATE = fixture('intermediate.pem');
export const ROOT = fixture('root.pem');
export const CHAIN = fixture('chain.pem');
export const UNRELATED_ROOT = fixture('unrelated-root.pem');
export const REQUEST = fixture('request.csr.pem');

export const ISSUED = Date.parse('2026-11-14T10:16:57Z');
export const DAY = 86_400_000;
