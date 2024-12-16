const express = require('express');
const router = express.Router();
const axios = require('axios');
const cache = require('../middleware/cache');
const config = require('../config');
const { findNearestCity, validateLocation } = require('../utils/location');

router.get('/', cache(config.cache.stores), async (req, res, next) => {
  try {
    const { userLocation, travelPreferences } = req.query;
    
    validateLocation(userLocation, travelPreferences);
    
    const location = JSON.parse(userLocation);
    const preferences = JSON.parse(travelPreferences);

    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
      {
        params: {
          location: `${location.latitude},${location.longitude}`,
          radius: preferences.radius,
          type: 'grocery_or_supermarket',
          language: 'da',
          key: process.env.GOOGLE_MAPS_API_KEY
        }
      }
    );

    if (!response.data.results?.length) {
      const fallbackCity = findNearestCity(location);
      return res.json({
        stores: fallbackStores[fallbackCity],
        total: fallbackStores[fallbackCity].length,
        fallback: true
      });
    }

    res.json({
      stores: response.data.results,
      total: response.data.results.length,
      fallback: false
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;