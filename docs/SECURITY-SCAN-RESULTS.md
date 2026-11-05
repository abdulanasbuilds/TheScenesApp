# The Scenes — Local Secret Scan Results

**Scan date:** 5 November 2026  
**Status:** WORKING TREE CLEAN; HISTORICAL CREDENTIAL ROTATION/REVOCATION REQUIRED  
**Production/remote actions taken:** none

## Scanner provenance

- Tool: Gitleaks `8.30.1`, official GitHub release from `gitleaks/gitleaks`.
- Asset: `gitleaks_8.30.1_windows_x64.zip`.
- Expected and observed SHA-256:
  `d29144deff3a68aa93ced33dddf84b7fdc26070add4aa0f4513094c8332afc4e`.
- Execution location: approved local temporary directory outside the repository.
- Secret redaction: 100%; no credential value is reproduced in this document or console report.

## Results

| Scope | Evidence | Result |
|---|---|---|
| Full Git history | 278 commits; approximately 5.20 MB scanned | **13 redacted findings** |
| Current working tree | approximately 10.94 MB scanned | **0 findings** |
| Tracked secret-like files (`.env*`, key/certificate patterns) | `git ls-files` check | none currently tracked |

Historical finding classes:

- 6 JWT-pattern findings in a legacy `.replit` file;
- 4 generic Supabase publishable/key-pattern findings in legacy `.replit` revisions;
- 3 generic key-pattern findings in a legacy `.env.example` revision, including one variable explicitly
  named as a Supabase service key.

The findings span multiple historical commits from July/August 2026. Publishable/anonymous keys are
not privileged secrets by themselves under the Supabase model, but JWT-pattern and service-key
material in public history cannot be assumed harmless. Gitleaks cannot prove whether a historical key
is expired, revoked, or still active.

## Required response

1. Treat every historical hosted Supabase key in those commits as compromised.
2. In the owning Supabase account, revoke/rotate the affected project's secret/service-role signing
   material and any related credentials. If the legacy project is unused, pause/delete it only through
   an explicitly authorized account-owner action.
3. Review hosted Auth/database logs for unexpected privileged access from the exposure window.
4. Confirm completion in this document without recording the old or replacement values.
5. Enable GitHub secret scanning and push protection separately when the repository/account plan
   supports it; this is a remote settings action and was not performed here.
6. Consider a coordinated history rewrite only after rotation, backups, collaborator notice and
   explicit authorization. Rewriting history is disruptive and does **not** replace rotation.

## Gate impact

- The current tree is safe to continue reviewing and to run a credential-free local fixture build.
- No hosted key may be copied, reused, tested, or introduced into the Phase 3 local proof.
- On 5 November 2026 the founder permanently retired every legacy account/project/credential and
  authorized a new, credential-free, loopback-isolated local proof using no hosted account. Therefore
  legacy cleanup no longer blocks isolated local implementation. It remains an urgent incident action
  and a hard blocker for any reuse, hosted/staging/production provider work or promotion.
- Every future hosted environment uses a new business-controlled account and fresh credentials only
  after its phase-specific review and approval.

## Owner confirmation

```text
Historical hosted Supabase credentials revoked/rotated: NOT YET CONFIRMED
Confirmed by:
Confirmation date:
Hosted audit reviewed: NOT YET CONFIRMED
Notes (never include a credential value):
```
