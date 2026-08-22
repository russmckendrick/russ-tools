import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { copyText, generateShareableURL, parseConfigFromURL } from '@/core';
import { useWebMCPTool, textResult } from '@/lib/useWebMCPTool';
import { parseIPv4, ipv4Details, parseIPv4Cidr } from './lib/ipv4';
import { parseIPv6, ipv6Details, parseIPv6Cidr } from './lib/ipv6';
import { leaves, splitNode, joinNode, pruneSplits } from './lib/divide';
import { FAMILIES, detailRowsFor, formatTotal } from './lib/format';
import SubnetDetails from './components/SubnetDetails';
import SubnetDivide from './components/SubnetDivide';
import { Ghost } from '@/components/ui/ghost';

/** Parse either family from one input. Returns {family, address, prefix|null} | null. */
function parseInput(raw) {
  const v4 = parseIPv4Cidr(raw);
  if (v4) return { family: 4, ...v4 };
  const v6 = parseIPv6Cidr(raw);
  if (v6) return { family: 6, ...v6 };
  return null;
}

const DEFAULT_PREFIX = { 4: 24, 6: 64 };

const CALCULATE_SUBNET_TOOL = {
  name: 'calculate_subnet',
  description:
    'Calculate full IPv4 or IPv6 subnet details — network, broadcast, host range, ' +
    'netmask, wildcard, binary forms and reverse DNS — for an address with an optional /prefix.',
  inputSchema: {
    type: 'object',
    properties: {
      cidr: {
        type: 'string',
        description: 'An IPv4 or IPv6 address, optionally with a prefix, e.g. 192.168.1.0/24 or 2001:db8::/48',
      },
    },
    required: ['cidr'],
  },
  annotations: { readOnlyHint: true },
  execute: ({ cidr }) => {
    const parsed = parseInput(cidr);
    if (!parsed) return textResult({ error: 'Not a valid IPv4 or IPv6 address or CIDR.' });
    const prefix = parsed.prefix ?? DEFAULT_PREFIX[parsed.family];
    const details =
      parsed.family === 4 ? ipv4Details(parsed.address, prefix) : ipv6Details(parsed.address, prefix);
    return textResult({
      ...details,
      totalAddresses: formatTotal(details.totalAddresses, prefix, FAMILIES[parsed.family].bits),
    });
  },
};

/**
 * The sample for the empty-state ghost, computed rather than written down.
 *
 * `ipv4Details` and `leaves` are the same pure functions the tool runs on a
 * real address, so the ghost's fields and rows are the real fields and rows —
 * there is no hand-made copy of the shape to fall out of step. A /24 split
 * once gives the two-row divide table a typical answer produces.
 */
const GHOST_DETAILS = ipv4Details('10.0.0.0', 24);
const GHOST_ROWS = detailRowsFor(4, GHOST_DETAILS);
const GHOST_LEAVES = leaves(FAMILIES[4], { addr: 0n, prefix: 24 }, new Set(['10.0.0.0/24']));

const SubnetCalculatorTool = () => {
  useWebMCPTool(CALCULATE_SUBNET_TOOL);
  const [input, setInput] = useState('');
  const [prefixChoice, setPrefixChoice] = useState('');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // { family, address, prefix }
  const [splits, setSplits] = useState(() => new Set());

  const parsed = useMemo(() => parseInput(input), [input]);
  const family = parsed?.family ?? 4;

  // Everything below derives from the calculated result, not the input box.
  const details = useMemo(() => {
    if (!result) return null;
    return result.family === 4
      ? ipv4Details(result.address, result.prefix)
      : ipv6Details(result.address, result.prefix);
  }, [result]);

  const root = useMemo(() => {
    if (!result || !details) return null;
    const addr =
      result.family === 4
        ? BigInt(parseIPv4(details.networkAddress))
        : parseIPv6(details.networkAddress);
    return { addr, prefix: result.prefix };
  }, [result, details]);

  const rows = useMemo(() => {
    if (!root) return [];
    return leaves(FAMILIES[result.family], root, splits);
  }, [root, splits, result]);

  const calculate = (raw, explicitPrefix = null) => {
    const parsedRaw = parseInput(raw);
    if (!parsedRaw) {
      setError('Enter a valid IPv4 or IPv6 address, e.g. 10.0.0.0/24 or 2001:db8::/48');
      return;
    }

    const prefix =
      parsedRaw.prefix ??
      explicitPrefix ??
      (prefixChoice !== '' ? Number(prefixChoice) : DEFAULT_PREFIX[parsedRaw.family]);

    const max = FAMILIES[parsedRaw.family].bits;
    if (prefix > max) {
      setError(`/${prefix} is not a valid IPv${parsedRaw.family} prefix (max /${max})`);
      return;
    }

    setError(null);
    setResult({ family: parsedRaw.family, address: parsedRaw.address, prefix });
    setPrefixChoice(String(prefix));
    setSplits(new Set());
  };

  // Deep link: /subnet-calculator/:ip/:prefix (and the bare-:ip form).
  const { ip: urlIp, prefix: urlPrefix } = useParams();
  useEffect(() => {
    if (!urlIp) return;
    const address = decodeURIComponent(urlIp);
    const prefix = urlPrefix ? Number(decodeURIComponent(urlPrefix)) : null;
    const raw = prefix === null ? address : `${address}/${prefix}`;
    setInput(raw);
    calculate(raw);
  }, [urlIp, urlPrefix]); // eslint-disable-line react-hooks/exhaustive-deps

  // Share payloads restore the divide tree: { f, cidr, splits }.
  useEffect(() => {
    const config = parseConfigFromURL(new URLSearchParams(window.location.search));
    if (!config?.cidr) return;
    setInput(config.cidr);
    calculate(config.cidr);
    if (Array.isArray(config.splits)) {
      setSplits(new Set(config.splits));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // A restored or edited split set must stay inside the current root.
  useEffect(() => {
    if (!root) return;
    setSplits((prev) => pruneSplits(FAMILIES[result.family], root, prev));
  }, [root, result]);

  const handleShare = async () => {
    if (!details) return;
    const url = generateShareableURL({ f: result.family, cidr: details.cidr, splits: [...splits] });
    if (url && (await copyText(url))) {
      toast.success('Share link copied', { description: details.cidr });
    } else {
      toast.error('Failed to copy share link');
    }
  };

  const handleCopy = async (value, label) => {
    if (await copyText(value)) toast.success(`${label} copied`);
    else toast.error('Failed to copy');
  };

  const prefixOptions = Array.from({ length: FAMILIES[family].bits + 1 }, (_, i) => i);

  const detailsAsText = () => {
    const width = Math.max(...detailRows.map(([label]) => label.length)) + 2;
    return [
      details.cidr,
      ...detailRows.map(([label, value]) => `${label.padEnd(width)}${value}`),
    ].join('\n');
  };

  const detailRows = detailRowsFor(result?.family, details);

  return (
    <div className="space-y-6">
      {/* Input */}
      <Card>
        <CardContent className="pt-6">
          <form
            className="flex flex-col sm:flex-row gap-3 sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              calculate(input);
            }}
          >
            <div className="flex-1 flex flex-col gap-2">
              <Label htmlFor="cidr-input">IPv4 or IPv6 address</Label>
              <Input
                id="cidr-input"
                placeholder="10.0.0.0/24 or 2001:db8::/48"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="prefix-select">Prefix</Label>
              <Select
                value={prefixChoice}
                onValueChange={(value) => {
                  // Radix echoes an empty value through its hidden native
                  // select when the controlled value is set programmatically
                  // (share links, deep links). Only a real choice recalculates
                  // — without this, opening a share URL errored on
                  // "10.0.0.0/" and blanked the prefix.
                  if (value === '') return;
                  setPrefixChoice(value);
                  const p = parseInput(input);
                  if (p) calculate(`${p.address}/${value}`, Number(value));
                }}
              >
                <SelectTrigger id="prefix-select" className="w-28">
                  <SelectValue placeholder={`/${DEFAULT_PREFIX[family]}`} />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {prefixOptions.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      /{n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">
              <Calculator className="mr-2 h-4 w-4" />
              Calculate
            </Button>
          </form>
          {parsed && (
            <p className="mt-2 text-data-sm font-mono text-muted-foreground">
              IPv{parsed.family} detected
            </p>
          )}
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/*
        Nothing calculated yet: the shape of a calculation, drawn from the same
        two components that render a real one and redacted by `.rt-ghosted`.
        The sample is computed rather than hand-written — `ipv4Details` is a
        pure function this tool already owns, so the ghost's fields are the
        real fields and cannot fall out of step. Suppressed while an error is
        showing: the error is the answer, and a ghost under it would promise a
        result that is not coming.
      */}
      {!details && !error && (
        <Ghost>
          <SubnetDetails
            cidr={GHOST_DETAILS.cidr}
            family={4}
            detailRows={GHOST_ROWS}
            onCopyDetails={() => {}}
            onCopyCidr={() => {}}
          />
          <div className="mt-4">
            <SubnetDivide
              family={4}
              rows={GHOST_LEAVES}
              joinable={false}
              onSplit={() => {}}
              onJoin={() => {}}
              onShare={() => {}}
            />
          </div>
        </Ghost>
      )}

      {/* Details */}
      {details && (
        <div className="rt-arrive">
          <SubnetDetails
            cidr={details.cidr}
            family={result.family}
            detailRows={detailRows}
            onCopyDetails={() => handleCopy(detailsAsText(), 'Details')}
            onCopyCidr={() => handleCopy(details.cidr, 'CIDR')}
          />
        </div>
      )}

      {/* Divide */}
      {details && root && (
        <div className="rt-arrive">
          <SubnetDivide
            family={result.family}
            rows={rows}
            joinable={splits.size > 0}
            onSplit={(key) => setSplits(splitNode(splits, key))}
            onJoin={(rowFamily, addr, prefix) => setSplits(joinNode(rowFamily, splits, addr, prefix))}
            onShare={handleShare}
          />
        </div>
      )}
    </div>
  );
};

export default SubnetCalculatorTool;
