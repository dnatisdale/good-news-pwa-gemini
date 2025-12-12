const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const { url } = event.queryStringParameters;

  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing "url" query parameter' }),
    };
  }

  // Security: Only allow specific domains
  const allowedDomains = ['globalrecordings.net', '5fish.mobi', 'www.globalrecordings.net', 'www.5fish.mobi'];
  try {
    const parsedUrl = new URL(url);
    if (!allowedDomains.includes(parsedUrl.hostname)) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Domain not allowed' }),
      };
    }
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid URL' }),
    };
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GoodNewsPWA/1.0',
      },
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: `Error fetching URL: ${response.statusText}`,
      };
    }

    const data = await response.text();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'text/html',
        'Access-Control-Allow-Origin': '*', // Enable CORS for our app
      },
      body: data,
    };
  } catch (error) {
    console.error('Proxy Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message }),
    };
  }
};
