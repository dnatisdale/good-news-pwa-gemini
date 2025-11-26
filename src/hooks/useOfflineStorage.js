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
        setOfflineTracks(JSON.parse(saved));
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
      if (!track || !track.trackDownloadUrl) return;
      if (isTrackOffline(track.id)) return; // Already downloaded

      setDownloadingIds((prev) => [...prev, track.id]);

      try {
        const cache = await caches.open(CACHE_NAME);
        
        // Ensure URL has protocol
        let originalUrl = track.trackDownloadUrl;
        if (!originalUrl.startsWith('http://') && !originalUrl.startsWith('https://')) {
          originalUrl = `https://${originalUrl}`;
        }
        
        // Use Netlify proxy function to avoid CORS issues
        // In production: /.netlify/functions/proxy-audio
        // In development: use direct URL (will fail due to CORS, but good for testing)
        const isProduction = window.location.hostname !== 'localhost';
        const proxyUrl = isProduction 
          ? `/.netlify/functions/proxy-audio?url=${encodeURIComponent(originalUrl)}`
          : originalUrl; // For local dev, try direct (will show CORS error)
        
        console.log(`Downloading track ${track.id} from ${isProduction ? 'proxy' : 'direct'}: ${originalUrl}`);
        
        // Fetch the audio file
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        console.log(`useOfflineStorage: Storing in cache with key: ${originalUrl}`);
        // Store in cache using the original URL as the key
        // This way the audio player can find it later
        await cache.put(originalUrl, response.clone());
        
        console.log(`useOfflineStorage: Successfully cached audio file`);

        // Add to metadata
        setOfflineTracks((prev) => {
            // Avoid duplicates
            if (prev.some(t => t.id === track.id)) {
              console.log(`useOfflineStorage: Track ${track.id} already in library, skipping`);
              return prev;
            }
            
            const newTrack = {
                ...track, // Store full track data first
                id: track.id,
                title_en: track.title_en,
                title_th: track.title_th,
                languageEn: track.languageEn,
                langTh: track.langTh,
                verse_en: track.verse_en,
                verse_th: track.verse_th,
                trackDownloadUrl: originalUrl, // Override with the correct URL (with https)
            };
            
            console.log(`useOfflineStorage: Adding track to library:`, newTrack);
            return [...prev, newTrack];
        });
        
        console.log(`Track ${track.id} downloaded successfully.`);
      } catch (error) {
        console.error(`Failed to download track ${track.id}:`, error);
        alert(`Download failed: ${error.message}\n\nNote: Offline downloads only work when deployed to Netlify.`);
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
