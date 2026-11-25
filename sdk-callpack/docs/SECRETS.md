# Secret Inventory (`sdk-callpack`)

This file **contains no secret values**. It documents only secret names, locations, purposes, sensitivity levels, and rotation procedures.

Where real values are stored:

1. **Company Password Manager** (vault `"Gcalls Web SDK"` / `"Omnibox"`). This is the single source of truth for both the files below and the GPG passphrase.
2. **Encrypted Bundle `1config.tar.gpg`** (GPG AES-256 symmetric encryption, committed in the repo). Decrypt into `1config/`, then run `bash 1config/cp.sh` to copy files into place. Plaintext `1config/` and copied files are gitignored.
3. **GitHub Actions** (repository secrets): `ONECONFIG_GPG_PASSPHRASE`.

## GitHub Actions Secrets

| Name | Purpose | Scope | Last Rotated |
| --- | --- | --- | --- |
| `ONECONFIG_GPG_PASSPHRASE` | Decrypt `sdk-callpack/1config.tar.gpg` | repository | — |

## Contents of `1config/` Bundle

| File in `1config/` | Used By | Contains | Sensitivity |
| --- | --- | --- | --- |
| `env/internal.env`, `env/production.env` | `cp.sh` $\rightarrow$ `.env` | `GCALLS_SIP_*`, `GCALLS_COUCHDB_*`, `GCALLS_RECORD_HOST` | **High** (SIP & CouchDB creds) |
| `npm/.npmrc` | `cp.sh` $\rightarrow$ `.npmrc` (release) | npm publish auth token (`//registry.npmjs.org/:_authToken`) | **High** |

## Rotation Schedule

- Annually, and **immediately** when a team member leaves the project or a compromise is suspected.
- Note on git history: Because a public repository retains every historical version of `1config.tar.gpg`, leaking an old passphrase exposes every secret ever encrypted with it. Always rotate **both the passphrase and all secrets inside the bundle** if exposed.
- After rotating:
  1. Update the company password manager vault and the plaintext files inside `1config/`.
  2. Re-encrypt `1config.tar.gpg` and commit it.
  3. Update the `Last Rotated` column in this file.
- When rotating `ONECONFIG_GPG_PASSPHRASE`: update the GitHub Actions repository secret and distribute the new passphrase via the password manager to active maintainers.
