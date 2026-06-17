(function () {
  var endpointMeta = document.querySelector('meta[name="analytics-endpoint"]');
  var endpoint =
    window.LANGKEE_ANALYTICS_ENDPOINT ||
    (endpointMeta ? endpointMeta.getAttribute("content") : "");

  if (!endpoint || /YOUR_WORKER_URL/.test(endpoint)) return;
  if (navigator.globalPrivacyControl) return;
  if (navigator.doNotTrack === "1" || window.doNotTrack === "1") return;

  var sessionKey = "langkee_visit_session";
  var sessionId = "";

  try {
    sessionId = sessionStorage.getItem(sessionKey);
    if (!sessionId) {
      sessionId =
        window.crypto && window.crypto.randomUUID
          ? window.crypto.randomUUID()
          : String(Date.now()) + "-" + Math.random().toString(36).slice(2);
      sessionStorage.setItem(sessionKey, sessionId);
    }
  } catch (error) {
    sessionId = String(Date.now()) + "-" + Math.random().toString(36).slice(2);
  }

  var loadedAt = Date.now();
  var pagePayload = basePayload();

  function basePayload() {
    return {
      sessionId: sessionId,
      timestamp: new Date().toISOString(),
      url: location.href,
      path: location.pathname + location.search + location.hash,
      title: document.title,
      referrer: document.referrer || "",
      language: navigator.language || "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      viewport: window.innerWidth + "x" + window.innerHeight,
      screen: screen.width + "x" + screen.height,
    };
  }

  function trimmed(value, maxLength) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxLength);
  }

  function send(type, details) {
    var payload = Object.assign(basePayload(), {
      type: type,
      secondsOnPage: Math.round((Date.now() - loadedAt) / 1000),
      details: details || {},
    });

    var body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      var blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(endpoint, blob)) return;
    }

    fetch(endpoint, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: body,
      keepalive: true,
    }).catch(function () {});
  }

  send("visit", {
    initialUrl: pagePayload.url,
    initialTitle: pagePayload.title,
  });

  document.addEventListener(
    "click",
    function (event) {
      var link = event.target.closest && event.target.closest("a[href]");
      if (!link) return;

      send("link_click", {
        href: link.href,
        label: trimmed(
          link.getAttribute("aria-label") ||
            link.getAttribute("title") ||
            link.textContent,
          140
        ),
        target: link.getAttribute("target") || "",
        download: link.hasAttribute("download"),
      });
    },
    { capture: true },
  );
})();
