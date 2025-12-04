import https from 'https';

const url = 'https://globalrecordings.net/en/program/62808';

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Data length:', data.length);
    // Print any line with "youtube"
    const lines = data.split('\n');
    lines.forEach(line => {
      if (line.toLowerCase().includes('youtube')) {
        console.log('Found line:', line.trim());
      }
    });
  });
}).on('error', (err) => console.error(err));
