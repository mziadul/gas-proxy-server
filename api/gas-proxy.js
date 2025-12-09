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

  try {
    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    // Use GAS_URL from environment
    const targetUrl = process.env.GAS_URL;
    if (!targetUrl) {
      return res.status(500).json({ error: "GAS_URL not configured in environment" });
    }

    // Append query params from request
    const urlObj = new URL(targetUrl);
    Object.entries(req.query).forEach(([key, value]) => {
      if (key !== "url") urlObj.searchParams.append(key, value);
    });

    const fetchOptions = { method: req.method };

    if (req.method === "POST") {
      fetchOptions.headers = { "Content-Type": "application/json" };
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(urlObj.toString(), fetchOptions);
    const text = await response.text();

    res.setHeader("Content-Type", "application/json");
    return res.status(response.status).send(text);

  } catch (err) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Vary", "Origin");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    return res.status(500).json({ error: "Proxy failure", details: err.message });
  }
}
