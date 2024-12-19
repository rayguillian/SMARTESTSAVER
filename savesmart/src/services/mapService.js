import { Loader } from '@googlemaps/js-api-loader';

const loader = new Loader({
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  version: "weekly",
  libraries: ["places"]
});

class MapService {
  constructor() {
    this.googleMaps = null;
    this.placesService = null;
    this.map = null;
    this.markers = [];
    this.userMarker = null;
    this.directionsRenderer = null;
    this.directionsService = null;
    this.infoWindow = null;
  }

  async initialize() {
    if (!this.googleMaps) {
      this.googleMaps = await loader.load();
    }
    return this.googleMaps;
  }

  async initializeMap(element) {
    await this.initialize();
    
    this.map = new this.googleMaps.Map(element, {
      zoom: 13,
      center: { lat: 55.6761, lng: 12.5683 }, // Copenhagen
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false
    });

    this.directionsRenderer = new this.googleMaps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#4F46E5',
        strokeWeight: 4
      }
    });
    this.directionsRenderer.setMap(this.map);

    this.infoWindow = new this.googleMaps.InfoWindow();
  }

  async searchNearbyStores(location, radius) {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      if (!this.placesService) {
        // Create a temporary div for PlacesService (required by Google Maps)
        const tempDiv = document.createElement('div');
        this.placesService = new this.googleMaps.places.PlacesService(tempDiv);
      }

      const request = {
        location: new this.googleMaps.LatLng(location.lat, location.lng),
        radius: radius,
        type: ['supermarket', 'grocery_or_supermarket']
      };

      this.placesService.nearbySearch(request, (results, status) => {
        if (status === this.googleMaps.places.PlacesServiceStatus.OK) {
          const stores = results.map(place => ({
            id: place.place_id,
            name: place.name,
            location: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            },
            address: place.vicinity,
            rating: place.rating,
            userRatingsTotal: place.user_ratings_total
          }));
          resolve(stores);
        } else {
          reject(new Error(`Places search failed: ${status}`));
        }
      });
    });
  }

  async getDirections(origin, destination, mode = 'DRIVING') {
    await this.initialize();
    
    const directionsService = new this.googleMaps.DirectionsService();
    
    return new Promise((resolve, reject) => {
      directionsService.route(
        {
          origin: origin,
          destination: destination,
          travelMode: this.googleMaps.TravelMode[mode]
        },
        (result, status) => {
          if (status === 'OK') {
            resolve(result);
          } else {
            reject(new Error(`Directions request failed: ${status}`));
          }
        }
      );
    });
  }

  async optimizeRoute(origin, destinations, mode = 'DRIVING') {
    await this.initialize();
    
    // Use Google Maps Distance Matrix Service to get optimal route
    const service = new this.googleMaps.DistanceMatrixService();
    
    return new Promise((resolve, reject) => {
      service.getDistanceMatrix(
        {
          origins: [origin],
          destinations: destinations,
          travelMode: this.googleMaps.TravelMode[mode]
        },
        (response, status) => {
          if (status === 'OK') {
            // Process and sort destinations by duration/distance
            const routes = destinations.map((dest, index) => ({
              destination: dest,
              duration: response.rows[0].elements[index].duration.value,
              distance: response.rows[0].elements[index].distance.value
            }));
            
            // Sort by duration
            routes.sort((a, b) => a.duration - b.duration);
            
            resolve(routes);
          } else {
            reject(new Error(`Distance Matrix request failed: ${status}`));
          }
        }
      );
    });
  }

  async setUserLocation(location) {
    if (!this.map || !location) return;

    if (this.userMarker) {
      this.userMarker.setMap(null);
    }

    this.userMarker = new this.googleMaps.Marker({
      position: location,
      map: this.map,
      icon: {
        path: this.googleMaps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#4F46E5',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
      title: 'Your Location'
    });

    this.map.setCenter(location);
  }

  async updateMapCenter(location) {
    if (this.map && location) {
      this.map.setCenter(new this.googleMaps.LatLng(location.lat, location.lng));
    }
  }

  async calculateRoutes(origin, stores, ingredients) {
    if (!stores || stores.length === 0) return [];

    const routes = [];
    for (const store of stores) {
      try {
        const directions = await this.getDirections(
          new this.googleMaps.LatLng(origin.lat, origin.lng),
          new this.googleMaps.LatLng(store.location.lat, store.location.lng)
        );

        if (directions) {
          routes.push({
            stores: [store],
            directions: directions,
            totalDistance: directions.routes[0].legs[0].distance.value,
            totalTime: directions.routes[0].legs[0].duration.value
          });
        }
      } catch (err) {
        console.error(`Error calculating route to ${store.name}:`, err);
      }
    }

    // Sort routes by total distance
    return routes.sort((a, b) => a.totalDistance - b.totalDistance);
  }

  async displayRoute(route) {
    if (!route?.directions) return;
    
    try {
      // Clear existing markers
      this.clearMarkers();
      
      // Add store markers
      route.stores.forEach(store => {
        this.addMarker(store.location, {
          title: store.name,
          icon: {
            url: '/store-marker.png',
            scaledSize: new this.googleMaps.Size(32, 32)
          }
        });
      });

      // Display the route
      this.directionsRenderer.setDirections(route.directions);
    } catch (err) {
      console.error('Error displaying route:', err);
    }
  }

  async displayRouteOld(route) {
    if (!this.map || !route || !route.stores || route.stores.length === 0) return;

    // Clear existing markers
    this.clearMarkers();

    // Create markers for each store
    route.stores.forEach((store, index) => {
      const marker = new this.googleMaps.Marker({
        position: store.location,
        map: this.map,
        label: {
          text: (index + 1).toString(),
          color: '#ffffff'
        },
        icon: {
          path: this.googleMaps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: this.getMarkerColor(store.coverage),
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        title: store.name
      });

      // Add click listener for store info
      marker.addListener('click', () => {
        const content = this.createInfoWindowContent(store);
        this.infoWindow.setContent(content);
        this.infoWindow.open(this.map, marker);
      });

      this.markers.push(marker);
    });

    // Calculate and display the route
    const request = {
      origin: route.origin || this.userMarker.getPosition(),
      destination: route.origin || this.userMarker.getPosition(),
      waypoints: route.stores.map(store => ({
        location: store.location,
        stopover: true
      })),
      optimizeWaypoints: true,
      travelMode: this.googleMaps.TravelMode.DRIVING
    };

    try {
      const result = await this.getDirections(request.origin, request.destination, 'DRIVING');
      this.directionsRenderer.setDirections(result);
      
      // Fit bounds to include all points
      const bounds = new this.googleMaps.LatLngBounds();
      bounds.extend(this.userMarker.getPosition());
      this.markers.forEach(marker => bounds.extend(marker.getPosition()));
      this.map.fitBounds(bounds);
    } catch (error) {
      console.error('Error displaying route:', error);
      throw error;
    }
  }

  getMarkerColor(coverage) {
    if (coverage >= 0.8) return '#22C55E'; // Green
    if (coverage >= 0.5) return '#EAB308'; // Yellow
    return '#EF4444'; // Red
  }

  createInfoWindowContent(store) {
    return `
      <div class="p-2">
        <h3 class="font-semibold mb-2">${store.name}</h3>
        <p class="text-sm text-gray-600 mb-2">Coverage: ${(store.coverage * 100).toFixed(0)}%</p>
        <div class="text-sm">
          <strong>Items:</strong>
          <ul class="list-disc list-inside mt-1">
            ${store.items.map(item => `
              <li>${item.amount} ${item.name}</li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  clearMarkers() {
    this.markers.forEach(marker => marker.setMap(null));
    this.markers = [];
    if (this.directionsRenderer) {
      this.directionsRenderer.setDirections({ routes: [] });
    }
  }

  addMarker(position, options = {}) {
    const marker = new this.googleMaps.Marker({
      position: new this.googleMaps.LatLng(position.lat, position.lng),
      map: this.map,
      ...options
    });
    this.markers.push(marker);
    return marker;
  }

  cleanup() {
    this.clearMarkers();
    if (this.userMarker) {
      this.userMarker.setMap(null);
    }
    if (this.map) {
      this.map = null;
    }
  }
}

export const mapService = new MapService();
