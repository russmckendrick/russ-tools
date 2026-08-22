import React from 'react';
import { Building, Calendar, Network, Server, Shield } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import { formatDate, getTypeBadge, getTypeIcon } from '../lib/present';

/**
 * The WHOIS answer — registration, dates, registrar, nameservers, contacts.
 *
 * Lifted out of `island.jsx`, where it was declared *inside* the tool's own
 * function body. That was a real bug quite apart from where the code lived: a
 * component redeclared on every parent render is a new type each time, so
 * React threw away and rebuilt this entire subtree on every keystroke in the
 * search field.
 *
 * It is presentation only, which is also what lets the empty-state ghost render
 * it (see `ui/ghost.jsx`).
 *
 * The two type helpers are exported alongside it: the lookup history in the
 * island draws the same icon and the same badge for the same record type, and
 * the point of moving them was to have one answer, not two.
 */


export default function WHOISInfoDisplay({ data }) {
  if (!data) return null;

  const formatDateFromISO = (isoString) => {
    if (!isoString) return 'Not available';
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  // Extract data from normalized structure if available
  const normalized = data.normalized || {};
  const rdap = data.data?.rdap || {};

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h3 className="text-title-sm flex items-center gap-2">
              {getTypeIcon(data.type)}
              Basic Information
            </h3>
            {getTypeBadge(data.type)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-body-sm text-muted-foreground">Query</p>
              <p className="text-data-md font-mono">{data.query}</p>
            </div>
            <div>
              <p className="text-body-sm text-muted-foreground">Type</p>
              <p className="font-medium">{data.type || 'Unknown'}</p>
            </div>
            {(normalized.status || rdap.status) && (
              <div>
                <p className="text-body-sm text-muted-foreground">Status</p>
                <div className="space-y-1">
                  {(normalized.status || rdap.status)?.map((status, index) => (
                    <Badge key={index} variant="outline" className="mr-1 mb-1">
                      {status}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {normalized.registrar?.name && (
              <div>
                <p className="text-body-sm text-muted-foreground">Registrar</p>
                <p className="font-medium">{normalized.registrar.name}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Registration Dates */}
      {normalized.events && (
        <Card>
          <CardHeader>
            <h3 className="text-title-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Registration Dates
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {normalized.events.registration && (
                <div>
                  <p className="text-body-sm text-muted-foreground">Registration</p>
                  <p className="text-data-md font-mono">{formatDateFromISO(normalized.events.registration)}</p>
                </div>
              )}
              {normalized.events['last changed'] && (
                <div>
                  <p className="text-body-sm text-muted-foreground">Last Changed</p>
                  <p className="text-data-md font-mono">{formatDateFromISO(normalized.events['last changed'])}</p>
                </div>
              )}
              {normalized.events.expiration && (
                <div>
                  <p className="text-body-sm text-muted-foreground">Expiration</p>
                  <p className="text-data-md font-mono">{formatDateFromISO(normalized.events.expiration)}</p>
                </div>
              )}
              {normalized.events['last update of RDAP database'] && (
                <div className="md:col-span-3">
                  <p className="text-body-sm text-muted-foreground">Last RDAP Update</p>
                  <p className="text-data-md font-mono">{formatDateFromISO(normalized.events['last update of RDAP database'])}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Name Servers */}
      {normalized.nameservers && normalized.nameservers.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-title-sm flex items-center gap-2">
              <Server className="h-4 w-4" />
              Name Servers
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {normalized.nameservers.map((ns, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded border">
                  <p className="text-data-md font-mono">{ns.name}</p>
                  {ns.status && (
                    <div className="mt-1">
                      {ns.status.map((status, statusIndex) => (
                        <Badge key={statusIndex} variant="secondary" className="text-data-sm font-mono mr-1">
                          {status}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* DNSSEC Information */}
      {rdap.secureDNS && (
        <Card>
          <CardHeader>
            <h3 className="text-title-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />
              DNSSEC Information
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <p className="text-body-sm text-muted-foreground">Delegation Signed:</p>
                <Badge variant={rdap.secureDNS.delegationSigned ? "default" : "secondary"}>
                  {rdap.secureDNS.delegationSigned ? "Yes" : "No"}
                </Badge>
              </div>
              {rdap.secureDNS.maxSigLife && (
                <div>
                  <p className="text-body-sm text-muted-foreground">Max Signature Life</p>
                  <p className="text-data-md font-mono">{rdap.secureDNS.maxSigLife} day(s)</p>
                </div>
              )}
              {rdap.secureDNS.dsData && rdap.secureDNS.dsData.length > 0 && (
                <div>
                  <p className="text-body-sm text-muted-foreground mb-2">DS Records</p>
                  <div className="space-y-2">
                    {rdap.secureDNS.dsData.map((ds, index) => (
                      <div key={index} className="p-2 bg-muted/50 rounded font-mono text-data-sm border">
                        <div className="grid grid-cols-2 gap-2">
                          <div>Key Tag: {ds.keyTag}</div>
                          <div>Algorithm: {ds.algorithm}</div>
                          <div>Digest Type: {ds.digestType}</div>
                          <div className="col-span-2">Digest: {ds.digest}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Registrar Information */}
      {normalized.entities?.registrar && normalized.entities.registrar.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-title-sm flex items-center gap-2">
              <Building className="h-4 w-4" />
              Registrar Information
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {normalized.entities.registrar.map((registrar, index) => {
                const vcard = registrar.vcardArray?.[1] || [];
                const name = vcard.find(([prop]) => prop === 'fn')?.[3];
                const email = vcard.find(([prop]) => prop === 'email')?.[3];
                const abuseEntity = registrar.entities?.[0];
                const abuseVcard = abuseEntity?.vcardArray?.[1] || [];
                const abuseEmail = abuseVcard.find(([prop]) => prop === 'email')?.[3];
                
                return (
                  <div key={index} className="border-l-2 border-primary pl-4">
                    <h4 className="font-medium mb-2">{name || 'Registrar'}</h4>
                    <div className="space-y-2 text-body-sm">
                      {registrar.publicIds?.map((id, idIndex) => (
                        <div key={idIndex}>
                          <span className="text-muted-foreground">{id.type}: </span>
                          <span className="font-medium">{id.identifier}</span>
                        </div>
                      ))}
                      {email && (
                        <div>
                          <span className="text-muted-foreground">Contact: </span>
                          <span className="font-medium">{email}</span>
                        </div>
                      )}
                      {abuseEmail && (
                        <div>
                          <span className="text-muted-foreground">Abuse Contact: </span>
                          <span className="font-medium">{abuseEmail}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Sources */}
      {data.sources && data.sources.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-title-sm flex items-center gap-2">
              <Network className="h-4 w-4" />
              Data Sources
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.sources.map((source, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div>
                    <p className="text-data-md font-mono">{source.name.toUpperCase()}</p>
                    <p className="text-data-sm font-mono text-muted-foreground">{source.service}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={source.status === 'success' ? 'default' : 'destructive'}>
                      {source.status}
                    </Badge>
                    <p className="text-data-sm font-mono text-muted-foreground mt-1">
                      {formatDate(source.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
