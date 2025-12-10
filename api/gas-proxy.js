export default async function handler(req, res) {
  // Always set CORS and no-cache headers for all responses
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  try {
    // ...existing code...
    const targetUrl = process.env.GAS_URL;
    if (!targetUrl) {
      return res.status(500).json({ error: "GAS_URL not configured in environment" });
    }
    const urlObj = new URL(targetUrl);
    Object.entries(req.query).forEach(([key, value]) => {
      if (key !== "url") urlObj.searchParams.append(key, value);
    });
    const fetchOptions = { method: req.method };
    if (req.method === "POST") {
      // Forward the incoming Content-Type when possible so the target (GAS)
      // receives the same format (e.g., application/x-www-form-urlencoded).
      const incomingContentType = req.headers["content-type"] || "application/json";
      fetchOptions.headers = { "Content-Type": incomingContentType };

      if (incomingContentType.includes("application/json")) {
        fetchOptions.body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      } else if (incomingContentType.includes("application/x-www-form-urlencoded")) {
        // req.body may be an object when parsed by Vercel; convert to urlencoded string
        fetchOptions.body = typeof req.body === "string" ? req.body : new URLSearchParams(req.body).toString();
      } else {
        // Fallback: try to forward raw body if available, otherwise stringify
        fetchOptions.body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      }
    }
    const response = await fetch(urlObj.toString(), fetchOptions);
    const text = await response.text();
    res.setHeader("Content-Type", "application/json");
    return res.status(response.status).send(text);
  } catch (err) {
    return res.status(500).json({ error: "Proxy failure", details: err.message });
  }
}