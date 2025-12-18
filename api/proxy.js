const axios = require('axios');

module.exports = async (req, res) => {
  const target = process.env.REAL_API_URL;
  if (!target) {
    return res.status(500).json({ error: 'Environment variable REAL_API_URL is not set' });
  }

  // Get path from query parameter (passed via vercel.json rewrite)
  // rewrite: /api/:match* -> /api/proxy?slug=:match*
  let { slug, ...queryParams } = req.query;

  if (Array.isArray(slug)) {
    slug = slug.join('/');
  }
  // Ensure leading slash
  const urlPath = slug ? (slug.startsWith('/') ? slug : '/' + slug) : '';

  // Filter headers
  const headers = { ...req.headers };
  delete headers.host;
  delete headers.connection;
  delete headers['content-length'];
  delete headers['accept-encoding'];

  // Force Host/Origin/Referer to match target
  const targetUrlObj = new URL(target);
  headers.host = targetUrlObj.host;
  headers.origin = target;
  headers.referer = target;

  try {
    const response = await axios({
      url: target + urlPath,
      method: req.method,
      headers: headers,
      params: queryParams,
      data: req.body,
      validateStatus: () => true, // Accept all status codes
      maxRedirects: 5,
    });

    // Forward headers
    Object.entries(response.headers).forEach(([key, value]) => {
      if (key.toLowerCase() === 'content-encoding') return;
      res.setHeader(key, value);
    });

    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('Proxy Error:', error.message);
    if (error.response) {
      res.status(error.response.status).send(error.response.data);
    } else {
      res.status(500).json({ error: 'Proxy Request Failed', details: error.message });
    }
  }
};