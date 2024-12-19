let loadGoogleMapsPromise = null;

export const loadGoogleMapsApi = () => {
  if (loadGoogleMapsPromise) {
    return loadGoogleMapsPromise;
  }

  loadGoogleMapsPromise = new Promise((resolve, reject) => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      resolve(window.google.maps);
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places,geometry&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;

    // Create global callback
    window.initGoogleMaps = () => {
      if (window.google && window.google.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error('Google Maps failed to load'));
      }
      // Cleanup
      delete window.initGoogleMaps;
    };

    // Handle errors
    script.onerror = () => {
      reject(new Error('Failed to load Google Maps script'));
      // Cleanup
      delete window.initGoogleMaps;
    };

    // Append script to document
    document.head.appendChild(script);
  });

  return loadGoogleMapsPromise;
};
