# Password Generator

Generate one or more passwords with cryptographically secure browser randomness and inspect the strength implied by the selected character pool.

<!-- help:start -->

## Quick start

1. Set a length from 4 to 64 characters; 16 or more is a sensible starting point for most new passwords.
2. Enable the uppercase, lowercase, number, and symbol sets required by the destination.
3. Optionally exclude visually similar characters or ambiguous symbols.
4. Choose how many passwords to create, from 1 to 100.
5. Select **Generate Passwords**, then copy an individual value or download the batch.

## Strength information

- Every enabled character class is guaranteed to appear when the chosen length can accommodate it.
- Entropy and combination counts are estimates based on the available character pool and length.
- Crack-time estimates use a fixed guess-rate assumption; real risk depends on password storage, attacker resources, reuse, and service controls.
- Exclusion options improve readability and compatibility but reduce the available character pool slightly.

## Security tips

- Prefer a longer unique password over a short value made complex only to satisfy a policy.
- Store generated credentials in a reputable password manager and never reuse them across services.
- Check the destination's accepted symbols before generating a large batch.
- Downloaded files contain plaintext passwords. Protect them appropriately and delete them as soon as they have been imported into their destination.

## Privacy and saved data

Generation uses `crypto.getRandomValues()` with rejection sampling and a secure shuffle. There is no `Math.random()` fallback, no server request, and no localStorage entry. Generated values remain only in this page's memory unless you copy or download them.

## Troubleshooting

- At least one character type must be enabled, and the length must be sufficient for the enabled sets.
- If a site rejects a password, disable symbols it does not accept or use the ambiguous-symbol exclusion.
- Clipboard and download failures usually mean the browser blocked the requested permission or file action.

<!-- help:end -->

The cryptographic generation path and strength display are implemented in [`src/tools/password-generator/island.jsx`](../../../src/tools/password-generator/island.jsx). The tool contract is defined in [`src/tools/password-generator/manifest.mjs`](../../../src/tools/password-generator/manifest.mjs).
