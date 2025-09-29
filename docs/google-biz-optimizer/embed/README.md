# Google Biz Optimizer Embed Guide

This guide explains how to embed the Google Biz Optimizer experience on marketing sites, configure secure session handling, and connect the flow to downstream services (Google OAuth, MailerLite, Supabase).

## Overview

The embed renders a fully interactive dashboard at `https://app.promptreviews.app/embed/google-business-optimizer`. Visitors can explore example data immediately and convert to their own analysis after completing email capture and Google OAuth. The embed communicates with its host page via `postMessage` for responsive sizing and intent tracking.

## Quick Start

1. **Visit the local test page** at `http://localhost:3002/test-embed.html` (or open `test-embed.html` directly) to confirm the Google Biz Optimizer embed loads with default settings. Update this file whenever the iframe interface changes.
2. **Add the iframe** to your marketing page:
   ```html
   <div class="optimizer-embed-container">
     <iframe
       src="https://app.promptreviews.app/embed/google-business-optimizer"
       style="width: 100%; height: 2400px; border: none;"
       id="gbp-optimizer-frame"
       loading="lazy"
       referrerpolicy="strict-origin-when-cross-origin"
       allow="clipboard-read; clipboard-write">
     </iframe>
   </div>
   <script>
    const optimizerAllowedOrigins = [
      'https://app.promptreviews.app',
      'https://www.promptreviews.app'
    ];

    window.addEventListener('message', function (event) {
      if (!optimizerAllowedOrigins.includes(event.origin)) return;

      const message = event.data || {};

      switch (message.type) {
        case 'google-business-optimizer:ready':
          if (event.source) {
            event.source.postMessage(
              { type: 'google-business-optimizer:request-resize' },
              event.origin
            );
          }
          break;
        case 'google-business-optimizer:resize':
          if (typeof message.height === 'number') {
            document.getElementById('gbp-optimizer-frame').style.height = `${message.height}px`;
          }
          break;
        default:
          break;
      }
    });
    </script>
    ```
3. **Update CSP** on the marketing host to allow the iframe:
   ```http
   Content-Security-Policy: frame-src https://app.promptreviews.app; child-src https://app.promptreviews.app;
   ```
4. **Verify resize messages** in the browser console to ensure the iframe posts height updates correctly. The embed emits `google-business-optimizer:ready` on load and expects a `google-business-optimizer:request-resize` response from the host before it begins streaming height changes.

## Required Environment Variables

Configure these in the Next.js app that serves the embed and API routes:

| Variable | Description |
| --- | --- |
| `EMBED_SESSION_SECRET` | 32+ byte HMAC secret used to sign JWT session tokens. Rotate quarterly. |
| `EMBED_SESSION_KEY_VERSION` | Increment when rotating `EMBED_SESSION_SECRET`; stamped into each session for forced invalidation. |
| `EMBED_ALLOWED_ORIGINS` | Comma-separated list of parent origins permitted to host the iframe (e.g., `https://promptreviews.com,https://www.promptreviews.com`). The embed will only send postMessage updates to origins in this allowlist. |
| `ENCRYPTION_KEY` | Base64-encoded 32-byte key for AES-256-GCM encryption of Google OAuth tokens. Store in KMS/Vault. |
| `ENCRYPTION_KEY_VERSION` | Version label for the active encryption key. Enables rotation with zero downtime. |
| `MAILERLITE_API_KEY` | Server-only key for adding leads to MailerLite groups. |
| `SUPABASE_SERVICE_ROLE_KEY` | Used only inside server routes to upsert leads/sessions under RLS. |

## Server Responsibilities

- **Session creation** (`POST /api/embed/session/create`)
  - Validates email + lead ID
  - Generates a signed JWT (`expiresIn: 45m`, `aud: 'gbp-embed'`)
  - Persists `sha256(token)` and metadata in `optimizer_sessions`
- **Google OAuth callback** (`/api/embed/auth/google`)
  - Exchanges auth code for access/refresh tokens
  - Encrypts tokens via `encryptToken` helper before storage
  - Schedules data fetch job and updates `optimizer_leads`
- **MailerLite sync**
  - Runs server-side using MailerLite SDK; queues retries for resilience
- **Resize event dispatch**
  - Inside the embed page, a `ResizeObserver` posts `{ type: 'google-business-optimizer:resize', height }` to the parent allowlist at most every 200ms

## Database Notes

- `optimizer_sessions.session_token_hash` stores `hex(sha256(jwt))` so raw tokens never reside in the database.
- `optimizer_sessions` rows expire after two hours via cron/trigger.
- Google tokens are persisted as `cipherText + iv + keyVersion`. Without the managed key material, the data is useless.
- Leads and sessions follow Supabase RLS policies that only allow the service role to mutate data.

## Host-Site Responsibilities

- Accept `postMessage` events for `google-business-optimizer:resize`, `cta_clicked`, and `lead_converted` to integrate with onsite analytics.
- Propagate UTM parameters into the iframe URL if attribution is required (e.g., `?utm_source=adwords`).
- Display a modal or inline CTA for "Get My Free Analysis" if you want to reinforce conversion paths outside the iframe.

## Help Modal Behavior

- Every `?` bubble inside the embed opens the shared help modal component that loads content from `https://promptreviews.app/docs`.
- The modal must respect focus trapping and prevent background scroll in the host page while open.
- Analytics events should fire on `help_article_opened` with `articleId` and `source` metadata for marketing attribution.

## Widget-Only UI Differences

- Remove task list arrows and action links that normally navigate deeper into the app; keep the copy but render them as non-interactive text.
- Disable other navigation shortcuts (settings, quick-edit links) or replace them with messaging that prompts users to sign up for full access.
- Feature-flag these changes so the main PromptReviews app retains its original behavior.

## Security Checklist

- [x] Embed route sets `Content-Security-Policy` with explicit `frame-ancestors` allowlist.
- [x] Embed route returns `Permissions-Policy: interest-cohort=()` and legacy `X-Frame-Options` fallback to keep embedding restricted to approved hosts.
- [x] Session tokens are signed + hashed; the iframe never sees Supabase service keys.
- [x] Google OAuth tokens are encrypted at rest; decryption is limited to server-only helpers.
- [x] MailerLite key never ships to the browser.
- [x] GDPR erasure endpoint removes leads, sessions, encrypted tokens, and MailerLite subscribers.

## Troubleshooting

| Symptom | Likely Cause | Fix |
| --- | --- | --- |
| Iframe is blank | CSP or X-Frame-Options blocking | Add host domain to embed allowlist and reload |
| Height not updating | Parent origin not allowlisted | Confirm `allowedOrigins` in host script matches marketing domain |
| Google auth popup blocked | Browser prevented popups | Trigger auth from direct user interaction (button click) |
| Leads missing in Supabase | Session token hash mismatch | Ensure API route hashes the JWT before persisting |
| Need debug payloads locally | Request missing session header | Call `/api/embed/google-business/data` with `Authorization: Bearer <token>` or simpler `x-session-token: <token>`; grab the token with `localStorage.getItem('google-biz-optimizer-token')` in DevTools |

## Resources

- `docs/GOOGLE_BUSINESS_OPTIMIZER_REVISED_PLAN.md` - full implementation plan
- `docs/help/google-biz-optimizer/HELP_ARTICLES_INDEX.md` - marketing content and help articles
- Supabase dashboard - monitor `optimizer_leads` / `optimizer_sessions`
