# Health Monitoring

Use the built-in health endpoints to watch the PromptReviews app and docs site.

## Endpoints

- App: `https://YOUR_APP_DOMAIN/api/health`
- Docs: `https://YOUR_DOCS_DOMAIN/api/health`

Each endpoint returns JSON with a `status` (`ok` or `error`) and individual check results.

## Cron-Based Alerts

1. In the app’s environment configure `HEALTH_ALERT_EMAILS` with a comma-separated list of recipients.
2. Ensure `RESEND_API_KEY` is set so alert emails can send.
3. In Vercel, add a [Cron Job](https://vercel.com/docs/cron-jobs) that hits `https://YOUR_APP_DOMAIN/api/cron/health-monitor` every 5–10 minutes.
4. The route reuses the same health checks and sends an email whenever a check fails.

### Optional Headers

If you want to restrict access, add a shared secret header in the Vercel cron job configuration and verify it inside `api/cron/health-monitor/route.ts`.

## Manual Smoke Test

You can trigger the cron endpoint manually after a deploy:

```bash
curl https://YOUR_APP_DOMAIN/api/cron/health-monitor
```

A 200 response with `status: "ok"` indicates everything passed.
