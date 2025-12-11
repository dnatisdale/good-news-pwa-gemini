import { useState, useEffect, useCallback } from "react";

const CACHE_NAME = "offline-audio-v1";
const STORAGE_KEY = "offline_library_metadata";

export const useOfflineStorage = () => {
  const [offlineTracks, setOfflineTracks] = useState([]);
  const [downloadingIds, setDownloadingIds] = useState([]);

  // Load metadata from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const tracks = JSON.parse(saved);
        // Normalize URLs to ensure they have https:// protocol
        const normalizedTracks = tracks.map(track => ({
          ...track,
          trackDownloadUrl: track.trackDownloadUrl && !track.trackDownloadUrl.startsWith('http')
            ? `https://${track.trackDownloadUrl}`
            : track.trackDownloadUrl
        }));
        console.log('useOfflineStorage: Loaded and normalized tracks from localStorage:', normalizedTracks);
        setOfflineTracks(normalizedTracks);
      } catch (e) {
        console.error("Failed to parse offline library metadata", e);
      }
    }
  }, []);

  // Save metadata to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(offlineTracks));
  }, [offlineTracks]);

  // Check if a track is fully downloaded (checked against metadata)
  const isTrackOffline = useCallback(
    (trackId) => {
      return offlineTracks.some((t) => t.id === trackId);
    },
    [offlineTracks]
  );

  const isTrackDownloading = useCallback(
    (trackId) => {
      return downloadingIds.includes(trackId);
    },
    [downloadingIds]
  );

  // Download a track
  const downloadTrack = useCallback(
    async (track) => {
      if (!track || !track.trackDownloadUrl) return false;
      if (isTrackOffline(track.id)) return true; // Already downloaded

      setDownloadingIds((prev) => [...prev, track.id]);

      try {
        const cache = await caches.open(CACHE_NAME);
        
        // Ensure URL has protocol
        let originalUrl = track.trackDownloadUrl;
        if (!originalUrl.startsWith('http://') && !originalUrl.startsWith('https://')) {
          originalUrl = `https://${originalUrl}`;
        }
        
        // Use Netlify redirect proxy to avoid CORS issues
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const isProduction = !isLocal;
        
        // Extract the path after the domain for the proxy
        let proxyUrl = originalUrl;
        if (isProduction && originalUrl.includes('api.globalrecordings.net')) {
          const urlPath = originalUrl.replace('https://api.globalrecordings.net', '');
          proxyUrl = `/api/proxy-audio${urlPath}`;
        }
        
        console.log(`Downloading track ${track.id} from ${isProduction ? 'proxy' : 'direct'}: ${originalUrl}`);
        
        // Fetch the audio file
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        console.log(`useOfflineStorage: Storing in cache with key: ${originalUrl}`);
        await cache.put(originalUrl, response.clone());
        
        // Add to metadata
        setOfflineTracks((prev) => {
            if (prev.some(t => t.id === track.id)) return prev;
            
            const newTrack = {
                ...track,
                trackDownloadUrl: originalUrl, // Store normalized URL
            };
            return [...prev, newTrack];
        });
        
        return { success: true }; // Success
      } catch (error) {
        console.error(`Failed to download track ${track.id}:`, error);
        
        // MOCK SUCCESS FOR LOCALHOST
        if (isLocal) {
            console.warn("Localhost detected: Mocking download success despite error (Audio won't play offline, but UI will update).");
             // Add to metadata anyway so user can test the Library UI
            setOfflineTracks((prev) => {
                if (prev.some(t => t.id === track.id)) return prev;
                const newTrack = {
                    ...track,
                    trackDownloadUrl: track.trackDownloadUrl, 
                    isMock: true
                };
                return [...prev, newTrack];
            });
            return { success: true };
        }

        return { success: false, error: error.message }; // Failed with reason
      } finally {
        setDownloadingIds((prev) => prev.filter((id) => id !== track.id));
      }
    },
    [isTrackOffline]
  );

  // Delete a track
  const deleteTrack = useCallback(
    async (trackId) => {
      const track = offlineTracks.find((t) => t.id === trackId);
      if (!track) return;

      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.delete(track.trackDownloadUrl);

        setOfflineTracks((prev) => prev.filter((t) => t.id !== trackId));
        console.log(`Track ${trackId} removed from offline storage.`);
      } catch (error) {
        console.error(`Failed to delete track ${trackId}:`, error);
      }
    },
    [offlineTracks]
  );

  // Clear all tracks
  const clearLibrary = useCallback(async () => {
      if(!window.confirm("Are you sure you want to delete all downloaded messages?")) return;
      
      try {
          const cache = await caches.open(CACHE_NAME);
          const keys = await cache.keys();
          for (const request of keys) {
              await cache.delete(request);
          }
          setOfflineTracks([]);
          console.log("Offline library cleared.");
      } catch (error) {
          console.error("Failed to clear library:", error);
      }
  }, []);

  return {
    offlineTracks,
    downloadingIds,
    downloadTrack,
    deleteTrack,
    isTrackOffline,
    isTrackDownloading,
    clearLibrary
  };
};
