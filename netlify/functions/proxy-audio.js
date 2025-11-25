// Netlify Function to proxy audio downloads from fivefish.org
// This solves CORS issues by acting as a middleman

exports.handler = async (event, context) => {
  // Get the audio URL from query parameters
  const audioUrl = event.queryStringParameters?.url;

  if (!audioUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing url parameter' }),
    };
  }

  // Validate that the URL is from fivefish.org or globalrecordings.net for security
  if (!audioUrl.includes('fivefish.org') && !audioUrl.includes('globalrecordings.net')) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Only fivefish.org and globalrecordings.net URLs are allowed' }),
    };
  }

  try {
    // Extract the track ID from the URL (e.g., "T62808-001.mp3")
    const match = audioUrl.match(/T(\d+)-(\d+)\.mp3/);
    
    if (!match) {
      throw new Error('Invalid audio URL format');
    }
    
    const trackId = match[1];
    const trackNumber = match[2];
    
    // Construct the correct URL using files.globalrecordings.net
    // This is the actual CDN that serves the MP3 files
    const cdnUrl = `https://files.globalrecordings.net/files/mp3-low/T${trackId}-${trackNumber}.mp3`;
    
    console.log(`Fetching audio from CDN: ${cdnUrl}`);
    
    // Fetch the audio file from the CDN
    const response = await fetch(cdnUrl, {
      redirect: 'follow', // Follow redirects
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`);
    }

    // Get the audio data as a buffer
    const audioBuffer = await response.arrayBuffer();

    // Return the audio file with proper headers
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Access-Control-Allow-Origin': '*', // Allow all origins
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
      body: Buffer.from(audioBuffer).toString('base64'),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error('Error proxying audio:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch audio file', details: error.message }),
    };
  }
};
