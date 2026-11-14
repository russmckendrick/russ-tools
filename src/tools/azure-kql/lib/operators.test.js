import { describe, expect, it } from 'vitest';
import { OPERATORS, OPERATORS_BY_TYPE, operatorsFor, renderFilter } from './operators.js';
import { findColumn } from './schema.js';

const kql = (table, column, op, value, value2) => renderFilter(findColumn(table, column), { op, value, value2 });

describe('string columns', () => {
  const on = (op, value) => kql('AZFWApplicationRule', 'Fqdn', op, value);

  it.each([
    ['eq', 'www.contoso.com', 'Fqdn == "www.contoso.com"'],
    ['neq', 'www.contoso.com', 'Fqdn != "www.contoso.com"'],
    ['eqi', 'WWW.contoso.com', 'Fqdn =~ "WWW.contoso.com"'],
    ['contains', 'contoso', 'Fqdn contains "contoso"'],
    ['ncontains', 'contoso', 'Fqdn !contains "contoso"'],
    ['has', 'contoso', 'Fqdn has "contoso"'],
    ['startswith', 'www.', 'Fqdn startswith "www."'],
    ['endswith', '.com', 'Fqdn endswith ".com"'],
    ['in', 'a.com, b.com', 'Fqdn in ("a.com", "b.com")'],
    ['nin', 'a.com\nb.com', 'Fqdn !in ("a.com", "b.com")'],
    ['regex', '^(www|api)\\.', 'Fqdn matches regex @"^(www|api)\\."'],
    ['empty', '', 'isempty(Fqdn)'],
    ['nempty', '', 'isnotempty(Fqdn)'],
  ])('%s', (op, value, expected) => {
    expect(on(op, value)).toMatchObject({ ok: true, kql: expected });
  });

  it('escapes every value it writes', () => {
    expect(on('eq', 'a" or 1==1 //').kql).toBe('Fqdn == "a\\" or 1==1 //"');
    expect(on('in', 'a", "b').kql).toBe('Fqdn in ("a\\"", "\\"b")');
    expect(on('regex', 'a"b').kql).toBe('Fqdn matches regex @"a""b"');
  });

  it('waits for a value without calling it an error', () => {
    expect(on('contains', '   ')).toEqual({ ok: false, empty: true });
  });
});

describe('IP columns', () => {
  const on = (op, value) => kql('AZFWNetworkRule', 'SourceIp', op, value);

  it('compares an address and ranges a CIDR', () => {
    expect(on('eq', '10.0.0.4').kql).toBe('SourceIp == "10.0.0.4"');
    expect(on('eq', '10.0.0.0/8').kql).toBe('ipv4_is_in_range(SourceIp, "10.0.0.0/8")');
    expect(on('neq', '10.0.0.4').kql).toBe('SourceIp != "10.0.0.4"');
    expect(on('neq', '10.0.0.0/8').kql).toBe('not(ipv4_is_in_range(SourceIp, "10.0.0.0/8"))');
  });

  it('uses the IPv6 function for IPv6', () => {
    expect(on('eq', '2001:db8::1').kql).toBe('ipv6_is_in_range(SourceIp, "2001:db8::1/128")');
    expect(on('eq', '2001:db8::/32').kql).toBe('ipv6_is_in_range(SourceIp, "2001:db8::/32")');
  });

  it('takes a list of addresses and ranges', () => {
    expect(on('in', '10.0.0.4, 192.168.0.0/16').kql).toBe('ipv4_is_in_any_range(SourceIp, "10.0.0.4", "192.168.0.0/16")');
    expect(on('in', '10.0.0.4, 2001:db8::1').message).toBe('A list takes IPv4 addresses and ranges only.');
  });

  it('tests private and public without a value', () => {
    expect(on('private').kql).toBe('ipv4_is_private(SourceIp)');
    expect(on('public').kql).toBe('not(ipv4_is_private(SourceIp))');
  });

  it('refuses what is not an address, with the reason', () => {
    expect(on('eq', '10.0.0.300')).toEqual({ ok: false, message: '10.0.0.300 is not an IPv4 address: each part must be 0 to 255.' });
    expect(on('eq', '1.1.1.1") or true //').ok).toBe(false);
  });

  it('says "is in" when it reads a range back', () => {
    expect(on('eq', '10.0.0.0/8').phrase).toBe('SourceIp is in 10.0.0.0/8');
    expect(on('eq', '10.0.0.4').phrase).toBe('SourceIp is 10.0.0.4');
  });
});

describe('port and number columns', () => {
  const port = (op, value, value2) => kql('AZFWNetworkRule', 'DestinationPort', op, value, value2);

  it.each([
    ['eq', '443', 'DestinationPort == 443'],
    ['neq', '443', 'DestinationPort != 443'],
    ['gt', '1023', 'DestinationPort > 1023'],
    ['gte', '1024', 'DestinationPort >= 1024'],
    ['lt', '1024', 'DestinationPort < 1024'],
    ['lte', '1023', 'DestinationPort <= 1023'],
    ['in', '80, 443, 8080', 'DestinationPort in (80, 443, 8080)'],
  ])('%s', (op, value, expected) => {
    expect(port(op, value).kql).toBe(expected);
  });

  it('ranges with between', () => {
    expect(port('between', '8000', '8999')).toMatchObject({ kql: 'DestinationPort between (8000 .. 8999)', phrase: 'DestinationPort is between 8000 and 8999' });
    expect(port('between', '8000', '').message).toBe('A range needs both ends.');
  });

  it('keeps a port inside 0 to 65535 and refuses text', () => {
    expect(port('eq', '65536').message).toBe('The port must be from 0 to 65535.');
    expect(port('eq', '443 or true').message).toBe('Use a whole number for the port.');
  });

  it('lets an integer column go past the port range, and a real column take a fraction', () => {
    expect(kql('AppServiceHTTPLogs', 'TimeTaken', 'gt', '120000').kql).toBe('TimeTaken > 120000');
    expect(kql('AGWAccessLogs', 'TimeTaken', 'gte', '0.5').kql).toBe('TimeTaken >= 0.5');
    expect(kql('AppServiceHTTPLogs', 'TimeTaken', 'gt', '0.5').ok).toBe(false);
  });
});

describe('enum, boolean and datetime columns', () => {
  it('compares an enum without regard to case, in its documented spelling', () => {
    expect(kql('SigninLogs', 'ConditionalAccessStatus', 'eq', 'FAILURE').kql).toBe('ConditionalAccessStatus =~ "failure"');
    expect(kql('SigninLogs', 'ConditionalAccessStatus', 'neq', 'success').kql).toBe('ConditionalAccessStatus !~ "success"');
    expect(kql('SigninLogs', 'RiskLevelDuringSignIn', 'in', 'medium, high').kql).toBe('RiskLevelDuringSignIn in~ ("medium", "high")');
    expect(kql('SigninLogs', 'RiskLevelDuringSignIn', 'nin', 'none').kql).toBe('RiskLevelDuringSignIn !in~ ("none")');
  });

  it('refuses a value the column does not take', () => {
    expect(kql('SigninLogs', 'ConditionalAccessStatus', 'eq', 'blocked').message).toBe('blocked is not one of: success, failure, notApplied.');
  });

  it('writes a boolean test', () => {
    expect(kql('SigninLogs', 'IsInteractive', 'true').kql).toBe('IsInteractive == true');
    expect(kql('WVDErrors', 'ServiceError', 'false').kql).toBe('ServiceError == false');
  });

  it('compares a datetime column', () => {
    expect(kql('KubeEvents', 'FirstSeen', 'after', '2026-11-14T09:30').kql).toBe('FirstSeen > datetime(2026-11-14T09:30:00Z)');
    expect(kql('KubeEvents', 'FirstSeen', 'before', '2026-11-14').kql).toBe('FirstSeen < datetime(2026-11-14T00:00:00Z)');
    expect(kql('KubeEvents', 'FirstSeen', 'after', 'now()').ok).toBe(false);
  });
});

describe('the operator table', () => {
  it('has a label and a phrase for every operator a type offers', () => {
    for (const ids of Object.values(OPERATORS_BY_TYPE)) {
      for (const id of ids) expect(OPERATORS[id]).toMatchObject({ label: expect.any(String), phrase: expect.any(String) });
    }
  });

  it('refuses an operator the column type does not have', () => {
    const column = findColumn('AZFWNetworkRule', 'DestinationPort');
    expect(operatorsFor(column)).not.toContain('contains');
    expect(renderFilter(column, { op: 'contains', value: '4' })).toEqual({ ok: false, message: 'DestinationPort cannot be filtered with "contains".' });
    expect(renderFilter(column, { op: 'drop table', value: '4' }).ok).toBe(false);
  });
});
