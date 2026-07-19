import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calculator, Copy, Scissors, Combine, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { copyText, generateShareableURL, parseConfigFromURL } from '@/core';
import { parseIPv4, formatIPv4, ipv4Details, parseIPv4Cidr, maskFromPrefix } from './lib/ipv4';
import { parseIPv6, compressIPv6, ipv6Details, parseIPv6Cidr } from './lib/ipv6';
import { leaves, splitNode, joinNode, pruneSplits } from './lib/divide';

const FAMILIES = {
  4: { bits: 32, format: (addr) => formatIPv4(Number(addr)) },
  6: { bits: 128, format: compressIPv6 },
};

const number = new Intl.NumberFormat();

/** "count (2^n)" for the enormous IPv6 totals; plain for IPv4. */
function formatTotal(total, prefix, bits) {
  const exponent = bits - prefix;
  const exact = number.format(total);
  return exponent > 20 ? `2^${exponent} (${exact})` : exact;
}

/** Parse either family from one input. Returns {family, address, prefix|null} | null. */
function parseInput(raw) {
  const v4 = parseIPv4Cidr(raw);
  if (v4) return { family: 4, ...v4 };
  const v6 = parseIPv6Cidr(raw);
  if (v6) return { family: 6, ...v6 };
  return null;
}

const DEFAULT_PREFIX = { 4: 24, 6: 64 };

const SubnetCalculatorTool = () => {
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

  const detailRows = details
    ? result.family === 4
      ? [
          ['Network address', details.networkAddress],
          ['Usable host range', `${details.firstHost} – ${details.lastHost}`],
          ['Broadcast address', details.broadcastAddress ?? '—'],
          ['Total addresses', number.format(details.totalAddresses)],
          ['Usable hosts', number.format(details.usableHosts)],
          ['Netmask', details.netmask],
          ['Wildcard mask', details.wildcardMask],
          ['Binary netmask', details.binaryNetmask],
          ['Binary address', details.binaryAddress],
          ['Hex / integer', `${details.hexAddress} / ${number.format(details.integerAddress)}`],
          ['Class', details.ipClass],
          ['Type', details.addressType],
          ['Reverse DNS (PTR)', details.ptr],
        ]
      : [
          ['Network address', details.networkAddress],
          ['Address range', `${details.firstAddress} – ${details.lastAddress}`],
          ['Total addresses', formatTotal(details.totalAddresses, details.prefix, 128)],
          ['Expanded address', details.expandedAddress],
          ['Expanded network', details.expandedNetwork],
          ['Type', details.addressType],
          ['Reverse DNS (PTR)', details.ptr],
        ]
    : [];

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
            <div className="flex-1 space-y-2">
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
            <div className="space-y-2">
              <Label htmlFor="prefix-select">Prefix</Label>
              <Select
                value={prefixChoice}
                onValueChange={(value) => {
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

      {/* Details */}
      {details && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-data-lg truncate">{details.cidr}</span>
                <Badge>IPv{result.family}</Badge>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(details.cidr, 'CIDR')}
                aria-label="Copy CIDR"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {detailRows.map(([label, value]) => (
                  <TableRow key={label}>
                    <TableCell className="text-body-sm text-muted-foreground whitespace-nowrap">
                      {label}
                    </TableCell>
                    <TableCell className="font-mono text-data-md break-all select-all">
                      {value}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Divide */}
      {details && root && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-title-sm">Divide</h3>
                <p className="text-body-sm text-muted-foreground mt-1">
                  Split any subnet in two, or join halves back together
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Copy share link
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subnet</TableHead>
                    {result.family === 4 && <TableHead>Netmask</TableHead>}
                    <TableHead>{result.family === 4 ? 'Usable range' : 'Range'}</TableHead>
                    <TableHead className="text-right">
                      {result.family === 4 ? 'Usable hosts' : 'Addresses'}
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const rowFamily = FAMILIES[result.family];
                    const rowDetails =
                      result.family === 4
                        ? ipv4Details(formatIPv4(Number(row.addr)), row.prefix)
                        : ipv6Details(compressIPv6(row.addr), row.prefix);
                    const joinable = splits.size > 0 && row.depth > 0;

                    return (
                      <TableRow key={row.key}>
                        <TableCell
                          className="font-mono text-data-md whitespace-nowrap"
                          style={{ paddingLeft: `${row.depth * 16 + 13}px` }}
                        >
                          {row.key}
                        </TableCell>
                        {result.family === 4 && (
                          <TableCell className="font-mono text-data-md whitespace-nowrap">
                            {formatIPv4(maskFromPrefix(row.prefix))}
                          </TableCell>
                        )}
                        <TableCell className="font-mono text-data-md whitespace-nowrap">
                          {result.family === 4
                            ? `${rowDetails.firstHost} – ${rowDetails.lastHost}`
                            : `${rowDetails.firstAddress} – ${rowDetails.lastAddress}`}
                        </TableCell>
                        <TableCell className="font-mono text-data-md text-right whitespace-nowrap">
                          {result.family === 4
                            ? number.format(rowDetails.usableHosts)
                            : formatTotal(rowDetails.totalAddresses, row.prefix, 128)}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="inline-flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!row.splittable}
                              onClick={() => setSplits(splitNode(splits, row.key))}
                              aria-label={`Split ${row.key}`}
                            >
                              <Scissors className="h-4 w-4 mr-1" />
                              Split
                            </Button>
                            {joinable && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // Joining a leaf collapses its parent: the
                                  // parent's key leaves the split set.
                                  const parentPrefix = row.prefix - 1;
                                  const parentSize = 1n << BigInt(rowFamily.bits - parentPrefix);
                                  const parentAddr = (row.addr / parentSize) * parentSize;
                                  setSplits(joinNode(rowFamily, splits, parentAddr, parentPrefix));
                                }}
                                aria-label={`Join ${row.key} with its sibling`}
                              >
                                <Combine className="h-4 w-4 mr-1" />
                                Join
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <p className="mt-3 text-data-sm font-mono text-muted-foreground">
              {rows.length} subnet{rows.length === 1 ? '' : 's'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubnetCalculatorTool;
