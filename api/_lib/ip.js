/* ═══════════════════════════════════════════
   IP / GEO — trustworthy client identification
   Woli Farm · serverless layer
   ═══════════════════════════════════════════
   The client cannot be trusted to report its own
   IP, so we read it server-side from the proxy
   headers Vercel injects. Geo headers are provided
   free by Vercel's edge network.
═══════════════════════════════════════════ */
'use strict';

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) {
    // x-forwarded-for: "client, proxy1, proxy2" → first entry is the client
    return String(xff).split(',')[0].trim();
  }
  return (
    req.headers['x-real-ip'] ||
    (req.socket && req.socket.remoteAddress) ||
    'unknown'
  );
}

function getGeo(req) {
  const city = req.headers['x-vercel-ip-city'];
  return {
    country: req.headers['x-vercel-ip-country'] || null,
    region:  req.headers['x-vercel-ip-country-region'] || null,
    city:    city ? decodeURIComponent(city) : null,
  };
}

module.exports = { getClientIp, getGeo };
