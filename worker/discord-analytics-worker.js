var DEFAULT_ALLOWED_ORIGIN = "https://cosykid.github.io";
var VALID_TYPES = new Set(["visit", "link_click"]);

function corsHeaders(origin, env) {
  var allowedOrigins = (env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGIN)
    .split(",")
    .map(function (item) {
      return item.trim();
    })
    .filter(Boolean);
  var allowOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function truncate(value, maxLength) {
  var text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? text.slice(0, maxLength - 3) + "..." : text;
}

function field(name, value, inline) {
  var text = truncate(value || "unknown", 1024);
  return { name: name, value: text || "unknown", inline: Boolean(inline) };
}

function locationFromRequest(request) {
  var cf = request.cf || {};
  return [
    cf.city,
    cf.region,
    cf.postalCode,
    cf.country,
    cf.timezone ? "(" + cf.timezone + ")" : "",
  ]
    .filter(Boolean)
    .join(", ");
}

function ipFromRequest(request) {
  var forwarded = request.headers.get("X-Forwarded-For") || "";
  return (
    request.headers.get("CF-Connecting-IP") ||
    forwarded.split(",")[0].trim() ||
    "unknown"
  );
}

async function postToDiscord(payload, request, env) {
  var details = payload.details || {};
  var eventName = payload.type === "link_click" ? "Link click" : "Site visit";
  var ip = env.LOG_IP === "false" ? "disabled" : ipFromRequest(request);
  var userAgent =
    env.LOG_USER_AGENT === "false"
      ? "disabled"
      : request.headers.get("User-Agent") || "";

  var fields = [
    field("Event", eventName, true),
    field("Location", locationFromRequest(request), true),
    field("IP", ip, true),
    field("Page", payload.url || payload.path),
    field("Referrer", payload.referrer || "direct"),
    field("Session", payload.sessionId, true),
    field("Time on page", (payload.secondsOnPage || 0) + "s", true),
    field("Local timezone", payload.timezone, true),
    field("Viewport", payload.viewport + " / " + payload.screen, true),
    field("Language", payload.language, true),
  ];

  if (payload.type === "link_click") {
    fields.splice(
      3,
      0,
      field("Clicked", details.label || details.href),
      field("Destination", details.href),
    );
  }

  fields.push(field("User agent", userAgent));

  var discordPayload = {
    username: env.DISCORD_USERNAME || "Site analytics",
    embeds: [
      {
        title: eventName,
        color: payload.type === "link_click" ? 0x5865f2 : 0x2ecc71,
        timestamp: new Date().toISOString(),
        fields: fields,
      },
    ],
  };

  var response = await fetch(env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(discordPayload),
  });

  if (!response.ok) {
    throw new Error("Discord webhook failed with " + response.status);
  }
}

export default {
  async fetch(request, env, ctx) {
    var origin = request.headers.get("Origin") || "";
    var headers = corsHeaders(origin, env);
    var allowedOrigins = (env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGIN)
      .split(",")
      .map(function (item) {
        return item.trim();
      });

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: headers });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: headers });
    }

    if (origin && !allowedOrigins.includes(origin)) {
      return new Response("Origin not allowed", { status: 403, headers: headers });
    }

    if (!env.DISCORD_WEBHOOK_URL) {
      return new Response("Missing DISCORD_WEBHOOK_URL", {
        status: 500,
        headers: headers,
      });
    }

    var contentLength = Number(request.headers.get("Content-Length") || 0);
    if (contentLength > 8192) {
      return new Response("Payload too large", { status: 413, headers: headers });
    }

    var payload;
    try {
      payload = await request.json();
    } catch (error) {
      return new Response("Invalid JSON", { status: 400, headers: headers });
    }

    if (!VALID_TYPES.has(payload.type)) {
      return new Response("Invalid event type", { status: 400, headers: headers });
    }

    ctx.waitUntil(postToDiscord(payload, request, env));
    return new Response(JSON.stringify({ ok: true }), {
      status: 202,
      headers: Object.assign({ "Content-Type": "application/json" }, headers),
    });
  },
};
