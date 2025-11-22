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
        // We fetch the file and put it in the cache
        // Note: We use the full URL or relative path as the key
        const requestUrl = track.trackDownloadUrl;
        
        await cache.add(requestUrl);

        // Add to metadata
        setOfflineTracks((prev) => {
            // Avoid duplicates
            if (prev.some(t => t.id === track.id)) return prev;
            return [...prev, {
                id: track.id,
                title: track.title_en || track.title_th, // Fallback title
                lang: track.languageEn || track.langTh,
                ...track // Store full track data for offline playback
            }];
        });
        
        console.log(`Track ${track.id} downloaded successfully.`);
      } catch (error) {
        console.error(`Failed to download track ${track.id}:`, error);
        alert("Download failed. Please check your connection.");
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
