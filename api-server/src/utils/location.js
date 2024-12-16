// Helper function to find nearest city
function findNearestCity(location) {
  const cities = {
    'Copenhagen': { lat: 55.6761, lng: 12.5683 },
    'Aarhus': { lat: 56.1572, lng: 10.2107 }
  };

  let nearestCity = 'Copenhagen';
  let shortestDistance = Number.MAX_VALUE;

  for (const [city, coords] of Object.entries(cities)) {
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      coords.lat,
      coords.lng
    );
    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearestCity = city;
    }
  }

  return nearestCity;
}

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

function validateLocation(userLocation, travelPreferences) {
  if (!userLocation) {
    const error = new Error('Missing user location');
    error.status = 400;
    throw error;
  }

  if (!travelPreferences) {
    const error = new Error('Missing travel preferences');
    error.status = 400;
    throw error;
  }

  try {
    const location = JSON.parse(userLocation);
    const preferences = JSON.parse(travelPreferences);

    if (!preferences.radius) {
      const error = new Error('Missing radius in travel preferences');
      error.status = 400;
      throw error;
    }
  } catch (error) {
    const parseError = new Error('Invalid JSON in location or preferences');
    parseError.status = 400;
    throw parseError;
  }
}

module.exports = {
  findNearestCity,
  calculateDistance,
  validateLocation
};