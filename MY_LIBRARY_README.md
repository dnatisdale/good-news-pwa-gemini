# My Library - Offline Downloads Setup

This PWA includes an offline download feature that allows users to save audio messages for offline listening.

## How It Works

The offline download feature uses:
1. **Netlify Functions** - A serverless proxy to fetch audio files from fivefish.org
2. **Cache API** - Browser storage for downloaded audio files
3. **LocalStorage** - Metadata about downloaded tracks

## Deployment Requirements

### Netlify Configuration

The proxy function is located at:
```
netlify/functions/proxy-audio.js
```

When deployed to Netlify, this function will automatically be available at:
```
https://your-app.netlify.app/.netlify/functions/proxy-audio
```

### Local Development

**Note:** Offline downloads will NOT work in local development (`localhost`) due to CORS restrictions. The feature only works when deployed to Netlify.

When testing locally, you'll see a CORS error in the console - this is expected and normal.

## User Instructions

### To Download a Message:
1. Navigate to any message detail page
2. Click the "Download Audio" button
3. Wait for "Downloaded" confirmation
4. The message is now saved for offline use

### To Access Downloaded Messages:
1. Open the sidebar menu
2. Click "My Library"
3. All downloaded messages appear here
4. Click play to listen offline
5. Click trash icon to delete

### To Clear All Downloads:
1. Go to "My Library"
2. Click "Clear All" button
3. Confirm deletion

## Technical Details

### Storage Limits
- Browser Cache API typically allows 50MB - 500MB depending on browser
- Each audio file is approximately 2-5MB
- Users can download 10-100 messages depending on device

### Browser Support
- Chrome/Edge: Full support
- Firefox: Full support  
- Safari: Full support (iOS 11.3+)
- Opera: Full support

### Troubleshooting

**Downloads fail with error:**
- Ensure app is deployed to Netlify (not localhost)
- Check browser console for specific errors
- Verify internet connection

**Library shows empty after download:**
- Check browser's Cache Storage in DevTools
- Verify LocalStorage has `offline_library_metadata` key
- Try clearing cache and re-downloading

**Audio won't play offline:**
- Ensure device is truly offline (airplane mode)
- Check that file was fully downloaded before going offline
- Try deleting and re-downloading the message

## File Structure

```
netlify/
  └── functions/
      └── proxy-audio.js       # Serverless proxy function

src/
  └── hooks/
      └── useOfflineStorage.js # Download/cache logic
  └── pages/
      └── MyLibraryPage.jsx    # Library UI
      └── ContentView.jsx      # Download button
```

## Future Enhancements

- [ ] Download progress indicator
- [ ] Batch download multiple messages
- [ ] Storage usage display
- [ ] Auto-cleanup old downloads
- [ ] Download queue management
