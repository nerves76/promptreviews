#!/usr/bin/env node
const fetch = global.fetch || require('node-fetch');

(async () => {
  try {
    const locationId = process.argv[2];
    const sessionToken = process.env.EMBED_SESSION_TOKEN;

    if (!locationId || !sessionToken) {
      console.error('Usage: EMBED_SESSION_TOKEN=... node scripts/get-embed-overview.js locations/123...');
      process.exit(1);
    }

    const res = await fetch(`http://localhost:3002/api/embed/google-business/overview?locationId=${encodeURIComponent(locationId)}`, {
      headers: { 'x-session-token': sessionToken }
    });

    const text = await res.text();
    console.log('Status:', res.status);
    console.log(text);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
