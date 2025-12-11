
export default async (request, context) => {
  const url = new URL(request.url);
  
  // Extract the path for the API
  // Expected format: /api/proxy-audio/files/track/mp3-low/62808/4
  // Target: https://api.globalrecordings.net/files/track/mp3-low/62808/4
  
  // Remove the prefix
  const path = url.pathname.replace('/api/proxy-audio/', '');
  
  const targetUrl = `https://api.globalrecordings.net/${path}`;
  
  console.log(`Proxying request to: ${targetUrl}`);

  try {
    const upstreamResponse = await fetch(targetUrl);
    
    // Create headers for the response
    const headers = new Headers(upstreamResponse.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');

    // Return the response, streaming the body
    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: headers,
    });
  } catch (error) {
    return new Response(`Proxy Error: ${error.message}`, { status: 500 });
  }
};
