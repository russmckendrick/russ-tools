import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, CircleHelp, Info, KeyRound, Loader2, Shield } from 'lucide-react';
import { discoveryUrl } from '../lib/issuer.js';
import { algorithmFamily } from '../lib/signature.js';

const address = 'font-mono text-data-sm text-on-surface [overflow-wrap:anywhere]';
const link = `${address} text-primary-text underline underline-offset-4`;

const hostOf = (url) => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

function ErrorHelp({ error }) {
  const forKeys = /key set/.test(error.message);
  return (
    <Alert variant="destructive" data-issuer-error={error.code}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="space-y-2">
        <p>{error.message}</p>
        {error.url && (
          <p>
            You can still check the signature by hand. Open{' '}
            <a href={error.url} target="_blank" rel="noreferrer noopener" className={link}>
              {error.url}
            </a>{' '}
            in a new tab
            {forKeys
              ? ', copy the JSON it shows, and paste it into the key box below.'
              : ', find the jwks_uri address in it, open that, and paste the JSON it shows into the key box below.'}
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}

function IssuerKeys({ header, rawIssuer, issuer, issuerKeys, onFetch, onConfirm, onForget }) {
  const family = algorithmFamily(header?.alg);

  let unavailable = null;
  if (!header) {
    unavailable = 'Paste a token above to see whether its issuer publishes keys.';
  } else if (family !== 'asymmetric') {
    unavailable = `This token says "${header.alg ?? 'no algorithm'}". Only RS, PS and ES signatures are checked against published keys.`;
  } else if (rawIssuer === undefined || rawIssuer === null || rawIssuer === '') {
    unavailable = 'This token has no issuer (iss) claim, so there is no one to ask for keys. Paste a key below.';
  } else if (!issuer) {
    unavailable = `The issuer "${String(rawIssuer)}" is not a plain https address, so its keys cannot be fetched. Paste a key below.`;
  }

  return (
    <section className="space-y-3 rounded-md border border-outline p-4" aria-label="Issuer keys" data-issuer-keys>
      <h4 className="flex items-center gap-2 text-title-sm">
        <KeyRound className="h-4 w-4 text-on-surface-faint" />
        Keys the issuer publishes
      </h4>

      {unavailable ? (
        <p className="text-body-sm text-muted-foreground">{unavailable}</p>
      ) : (
        <>
          <div className="space-y-2 text-body-sm text-on-surface-muted" data-privacy-note>
            <p>
              <strong className="font-medium text-on-surface">Nothing is fetched until you press the button.</strong>{' '}
              Pressing it sends two GET requests from this browser and nothing else:
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                to <span className={address}>{discoveryUrl(issuer)}</span>
              </li>
              <li>to the key address that document names (jwks_uri)</li>
            </ol>
            <p>
              <strong className="font-medium text-on-surface">The token is not sent</strong>, to the issuer or to
              russ.tools. The issuer&apos;s server sees your IP address and that the request came from this site, as it
              does for any visit, and it learns that someone here is looking at one of its tokens. If the keys sit on a
              different host from the issuer, you are asked again before the second request.
            </p>
          </div>

          {issuerKeys.status === 'confirm' ? (
            <Alert className="border-warning/40 bg-warning-subtle" data-issuer-confirm>
              <CircleHelp className="h-4 w-4 text-warning" />
              <AlertDescription className="space-y-3">
                <p>
                  The issuer keeps its keys on a different host, <strong>{issuerKeys.jwksHost}</strong>, at{' '}
                  <span className={address}>{issuerKeys.jwksUri}</span>. One GET request would go there. The token
                  still would not.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={onConfirm}>
                    Fetch from {issuerKeys.jwksHost}
                  </Button>
                  <Button size="sm" variant="outline" onClick={onForget}>
                    Cancel
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : issuerKeys.status === 'ready' ? (
            <div className="space-y-2" data-issuer-ready>
              <p className="text-body-sm text-success">
                Fetched {issuerKeys.jwks.keys.length} key{issuerKeys.jwks.keys.length === 1 ? '' : 's'} from{' '}
                {issuerKeys.jwksHost}.
              </p>
              <p className="text-body-sm text-muted-foreground">
                Requests made: <span className={address}>{issuerKeys.discoveryUrl}</span> and{' '}
                <span className={address}>{issuerKeys.jwksUri}</span>. The keys are held in this page only and are
                gone when it closes.
              </p>
              <Button size="sm" variant="outline" onClick={onForget}>
                Forget these keys
              </Button>
            </div>
          ) : (
            <Button onClick={onFetch} disabled={issuerKeys.status === 'loading'} variant="secondary">
              {issuerKeys.status === 'loading' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              {issuerKeys.status === 'loading' ? `Asking ${hostOf(issuer)}…` : 'Fetch issuer keys'}
            </Button>
          )}

          {issuerKeys.status === 'error' && <ErrorHelp error={issuerKeys.error} />}
        </>
      )}
    </section>
  );
}

const RESULT_STYLE = {
  verified: { box: 'border-success/40 bg-success-subtle', Icon: Shield, ink: 'text-success', title: 'Verified' },
  failed: { box: 'border-danger/40 bg-danger-subtle', Icon: AlertTriangle, ink: 'text-danger', title: 'Failed' },
  'not-checked': { box: '', Icon: Info, ink: 'text-on-surface-faint', title: 'Not checked' },
};

export default function SignaturePanel({
  header,
  rawIssuer,
  issuer,
  issuerKeys,
  onFetchIssuerKeys,
  onConfirmOtherHost,
  onForgetIssuerKeys,
  publicKey,
  onPublicKeyChange,
  result,
}) {
  const style = result ? RESULT_STYLE[result.status] : null;

  return (
    <>
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="text-body-sm font-semibold mb-1">What is checked, and where</div>
          <div className="text-body-sm">
            The check runs in this browser. RS, PS and ES signatures are verified against a public key: the
            issuer&apos;s published keys, or one you paste. HMAC (HS256/HS384/HS512) signatures are not checked,
            because that would mean typing the shared secret into a web page.
          </div>
        </AlertDescription>
      </Alert>

      <IssuerKeys
        header={header}
        rawIssuer={rawIssuer}
        issuer={issuer}
        issuerKeys={issuerKeys}
        onFetch={onFetchIssuerKeys}
        onConfirm={onConfirmOtherHost}
        onForget={onForgetIssuerKeys}
      />

      <div className="space-y-2">
        <Label htmlFor="public-key">Or paste a public key, JWK or JWKS</Label>
        <Textarea
          id="public-key"
          placeholder={'-----BEGIN PUBLIC KEY-----  or  {"kty": ...}  or  {"keys": [...]}'}
          value={publicKey}
          onChange={(e) => onPublicKeyChange(e.target.value)}
          className="min-h-[120px] font-mono text-data-md"
        />
        <p className="text-body-sm text-muted-foreground">
          Takes a PEM public key, a single JWK, or a whole JWKS key set (the JSON an issuer serves at its jwks_uri),
          from which the key is picked by the token&apos;s key ID. A pasted key is used in preference to fetched ones.
          Never paste a private key.
        </p>
      </div>

      {result && (
        <Alert className={style.box} data-signature-result={result.status}>
          <style.Icon className={`h-4 w-4 ${style.ink}`} />
          <AlertDescription className="space-y-1">
            <p className="font-semibold">{style.title}</p>
            <p className="[overflow-wrap:anywhere]">{result.message}</p>
            {result.status === 'verified' && (
              <p className="text-body-sm text-on-surface-muted">
                That proves who signed it, not that you should accept it. Check the issuer and audience are the ones
                you expect, and mind the time claims.
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
