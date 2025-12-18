const axios = require('axios');

module.exports = async (req, res) => {
  const target = process.env.REAL_API_URL;
  if (!target) {
    return res.status(500).json({ error: 'Environment variable REAL_API_URL is not set' });
  }

  // Remove /api prefix
  const url = req.url.replace(/^\/api/, '');

  try {
    const response = await axios({
      url: target + url,
      method: req.method,
      headers: {
        ...req.headers,
        host: new URL(target).host,
        origin: target, // Fake origin
        referer: target // Fake referer
      },
      params: req.query,
      data: req.body,
      validateStatus: () => true, // Accept all status codes
    });

    // Forward headers
    Object.entries(response.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: 'Proxy Request Failed', details: error.message });
  }
};