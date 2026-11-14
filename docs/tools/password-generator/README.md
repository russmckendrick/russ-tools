# Password Generator

Generate one or more passwords or word-based passphrases with cryptographically secure browser randomness and inspect the strength implied by the selected settings.

<!-- help:start -->

## Quick start

1. Choose **Password** for a string of random characters or **Passphrase** for a run of random words. The page opens on Password with one result already drawn.
2. For a password, set a length from 4 to 64 characters; 16 or more is a sensible starting point for most new passwords.
3. Enable the uppercase, lowercase, number, and symbol sets required by the destination.
4. Optionally exclude visually similar characters or ambiguous symbols.
5. Choose how many to create, from 1 to 100.
6. Select **Generate Passwords** (or **Generate Passphrases**), then copy an individual value or download the batch.

## Passphrases

A passphrase is several words picked at random from a fixed list. It is easier to read aloud and to type on a phone than a password of the same strength, which makes it a good fit for the few secrets you have to remember: a password manager's main password, a disk-encryption key, a device login.

- **Number of words** runs from 3 to 10 and starts at 5. Six or more is a sound choice for anything that guards other secrets.
- **Separator** goes between the words: hyphen, space, dot, underscore, or none.
- **Capitalise each word** and the separator exist to satisfy sites that insist on a capital or a symbol. They are the same every time, so they add no strength.
- **Append a digit** adds one random digit, 0 to 9, to the end of the last word.
- Changing a setting updates the Security Analysis straight away; select **Generate Passphrases** to draw a new one with it.

The words come from the [EFF large wordlist](https://www.eff.org/deeplinks/2016/07/new-wordlists-random-passphrases): 7,776 words chosen by the Electronic Frontier Foundation to be common, distinct and easy to spell, used here unmodified under a Creative Commons Attribution licence ([details](/licenses/eff-large-wordlist.txt)). No word in the list is the start of another, so a passphrase with no separator still splits into words one way only.

## Strength information

- Every enabled character class is guaranteed to appear when the chosen length can accommodate it.
- For a password, entropy and combination counts are estimates based on the available character pool and length.
- For a passphrase, entropy is the number of words times log2(7,776), about 12.9 bits a word, plus about 3.3 bits if a digit is appended. The character-pool sum is not used: a passphrase is as strong as the number of ways the words could have been drawn, however many letters it has. Five words is about 64.6 bits; six is about 77.5.
- The figures assume the attacker knows exactly how the value was made (the settings and the word list) and not the random choices.
- Crack-time estimates use a fixed guess-rate assumption; real risk depends on password storage, attacker resources, reuse, and service controls.
- Exclusion options improve readability and compatibility but reduce the available character pool slightly.

## Security tips

- Prefer a longer unique password over a short value made complex only to satisfy a policy.
- Use a passphrase where you must remember or type the secret, and a long random password everywhere a password manager fills it in for you.
- Use the words the tool drew. Swapping in words you like better, or rerolling until a phrase is memorable, throws away the randomness the strength figure counts on.
- Store generated credentials in a reputable password manager and never reuse them across services.
- Check the destination's accepted symbols before generating a large batch.
- Downloaded files contain plaintext passwords. Protect them appropriately and delete them as soon as they have been imported into their destination.

## Privacy and saved data

Generation uses `crypto.getRandomValues()` with rejection sampling and a secure shuffle, for passphrase words as much as for password characters. There is no `Math.random()` fallback and no localStorage entry: the chosen mode and settings are forgotten when the page closes. Generated values remain only in this page's memory unless you copy or download them. Nothing you generate is sent anywhere. The word list is a static file that is part of this site; the browser fetches it from russ.tools the first time Passphrase is opened, and that request carries no settings and no results.

## Troubleshooting

- At least one character type must be enabled, and the length must be sufficient for the enabled sets.
- If Passphrase reports that it could not generate, the word list failed to load or arrived damaged. Check the connection and select **Generate Passphrases** again.
- If a site rejects a password, disable symbols it does not accept or use the ambiguous-symbol exclusion.
- Clipboard and download failures usually mean the browser blocked the requested permission or file action.

<!-- help:end -->

The cryptographic generation path and the strength maths live in [`src/tools/password-generator/lib/`](../../../src/tools/password-generator/lib/) (`random.js`, `password.js`, `passphrase.js`, `strength.js`); the word list is [`data/eff_large_wordlist.txt`](../../../src/tools/password-generator/data/eff_large_wordlist.txt), with its source and licence in [`public/licenses/eff-large-wordlist.txt`](../../../public/licenses/eff-large-wordlist.txt). The tool contract is defined in [`src/tools/password-generator/manifest.mjs`](../../../src/tools/password-generator/manifest.mjs).
