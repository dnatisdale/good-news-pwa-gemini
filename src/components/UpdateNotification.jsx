import React, { useEffect, useState } from 'react';

const UpdateNotification = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  useEffect(() => {
    // Check for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available!
              setUpdateAvailable(true);
              setWaitingWorker(newWorker);
            }
          });
        });

        // Also check for waiting worker on load (in case update happened while page was open)
        if (registration.waiting) {
          setUpdateAvailable(true);
          setWaitingWorker(registration.waiting);
        }
      });
    }
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 text-center z-[100] shadow-lg">
      <div className="flex items-center justify-center gap-4 max-w-4xl mx-auto">
        <span className="text-sm md:text-base">
          ✨ New version available!
        </span>
        <button 
          onClick={handleUpdate}
          className="bg-white text-blue-600 px-4 py-1.5 rounded-lg font-bold hover:bg-gray-100 transition-all text-sm md:text-base shadow-md"
        >
          Update Now
        </button>
      </div>
    </div>
  );
};

export default UpdateNotification;
