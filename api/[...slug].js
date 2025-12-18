const axios = require('axios');

module.exports = async (req, res) => {
  const target = process.env.REAL_API_URL;
  if (!target) {
    return res.status(500).json({ error: 'Environment variable REAL_API_URL is not set' });
  }

  // Vercel Dynamic Route: req.query.slug is an array of path segments
  // e.g. /api/playlist/detail -> slug: ['playlist', 'detail']
  // We need to separate this from actual query parameters
  const { slug, ...queryParams } = req.query;

  // Reconstruct the path
  const urlPath = '/' + (Array.isArray(slug) ? slug.join('/') : slug);

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
      params: queryParams, // Pass only the real query params
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