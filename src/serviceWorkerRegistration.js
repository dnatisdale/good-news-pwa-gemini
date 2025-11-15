// This file registers the service worker

export function register() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      const swUrl = "/service-worker.js"; // Path to our worker in the public folder
      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log(
            "Service Worker registered with scope:",
            registration.scope
          );
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    });
  } else {
    console.log("Service Worker not supported in this browser.");
  }
}
