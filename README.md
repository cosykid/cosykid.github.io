# cosykid.github.io

Personal site for Langkee Hong.

## Discord visit analytics

The site includes a small privacy-conscious event script in
`assets/site-events.js`. It logs page visits and link clicks only after an
event endpoint is configured in each page's `site-events-endpoint` meta tag.

Do not put a Discord webhook URL directly in `index.html` or browser
JavaScript. Browser code is public, so the webhook would be exposed.

### Setup

1. Delete and recreate the Discord webhook that was shared before configuring
   this, then copy the new webhook URL.
2. Deploy the Cloudflare Worker in `worker/discord-analytics-worker.js`.
3. Set the webhook as a Worker secret:

   ```sh
   wrangler secret put DISCORD_WEBHOOK_URL
   ```

4. Copy `worker/wrangler.toml.example` to `worker/wrangler.toml` if you use
   Wrangler, then deploy:

   ```sh
   cd worker
   wrangler deploy
   ```

5. Put the deployed Worker URL in both HTML meta tags:

   ```html
   <meta name="site-events-endpoint" content="https://YOUR_WORKER_URL" />
   ```

The Worker adds request IP and approximate Cloudflare location data before
forwarding each event to Discord. Set `LOG_IP = "false"` or
`LOG_USER_AGENT = "false"` in the Worker vars if you want to reduce the amount
of personal data logged.

The browser script does not use cookies or fingerprinting and respects Global
Privacy Control and Do Not Track signals.
