import { useState, useEffect, useRef } from 'react';
import { Search, Filter, MapPin, Star, Clock, Scissors, Navigation, Map as MapIcon, List, Locate } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useClient } from '../context/ClientContext';
import type { Service } from '../types';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom pink marker for salons
const salonIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <path fill="#e91e8c" d="M12 0C7.31 0 3.5 3.81 3.5 8.5c0 6.5 8.5 15.5 8.5 15.5s8.5-9 8.5-15.5C20.5 3.81 16.69 0 12 0zm0 12c-1.93 0-3.5-1.57-3.5-3.5S10.07 5 12 5s3.5 1.57 3.5 3.5S13.93 12 12 12z"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// User location marker
const userIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
      <circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Metro Cebu/Cebu City coordinates
const CEBU_CENTER = { lat: 10.3157, lng: 123.8854 };
const CEBU_BOUNDS = {
  north: 10.45,
  south: 10.20,
  east: 124.05,
  west: 123.75,
};

// Component to handle map centering on user location
function LocationMarker({ userLocation }: { userLocation: { lat: number; lng: number } | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 1.5 });
    }
  }, [userLocation, map]);

  return userLocation ? (
    <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
      <Popup>Your Location</Popup>
    </Marker>
  ) : null;
}

interface ServicesExploreProps {
  onSelectService: (service: Service) => void;
  onBack: () => void;
}

export function ServicesExplore({ onSelectService, onBack }: ServicesExploreProps) {
  const { services, loading } = useClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  // Request location permission and get user's location
  const requestLocation = async () => {
    setIsLocating(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Check if user is within Metro Cebu bounds
        if (
          latitude >= CEBU_BOUNDS.south &&
          latitude <= CEBU_BOUNDS.north &&
          longitude >= CEBU_BOUNDS.west &&
          longitude <= CEBU_BOUNDS.east
        ) {
          setUserLocation({ lat: latitude, lng: longitude });
        } else {
          // User is outside Cebu, show their location but notify
          setUserLocation({ lat: latitude, lng: longitude });
          setLocationError('You are outside Metro Cebu. Showing nearby salons in Cebu City.');
        }
        setIsLocating(false);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location permission denied. Please enable location access in your browser/app settings.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out.');
            break;
          default:
            setLocationError('An unknown error occurred.');
        }
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  };

  // Auto-request location when switching to map view
  useEffect(() => {
    if (viewMode === 'map' && !userLocation && !locationError) {
      requestLocation();
    }
  }, [viewMode]);

  // Generate mock salon locations around Cebu City
  const salonLocations = services.slice(0, 10).map((service) => ({
    ...service,
    coordinates: {
      lat: CEBU_CENTER.lat + (Math.random() - 0.5) * 0.08,
      lng: CEBU_CENTER.lng + (Math.random() - 0.5) * 0.08,
    },
  }));

  const categories = [
    { id: 'all', name: 'All Services' },
    { id: 'haircut', name: 'Haircut' },
    { id: 'styling', name: 'Styling' },
    { id: 'coloring', name: 'Coloring' },
    { id: 'treatment', name: 'Treatment' },
    { id: 'manicure', name: 'Manicure' },
    { id: 'pedicure', name: 'Pedicure' },
  ];

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.shop_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || service.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-pink-100 sticky top-0 z-50 safe-area-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-pink-50 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900 flex-1">Explore Services</h1>
            
            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-white shadow-sm text-pink-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="List View"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'map'
                    ? 'bg-white shadow-sm text-pink-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Map View"
              >
                <MapIcon className="w-5 h-5" />
              </button>
            </div>
            
            <button className="p-2 hover:bg-pink-50 rounded-full transition-colors">
              <Filter className="w-6 h-6 text-gray-700" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search services or salons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          {/* Category Tabs */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-pink-300'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="relative" style={{ height: 'calc(100vh - 220px)', minHeight: '400px' }}>
          {/* Location Error Banner */}
          {locationError && (
            <div className="absolute top-4 left-4 right-4 z-[1000] bg-amber-50 border border-amber-200 rounded-lg p-3 shadow-lg">
              <div className="flex items-start gap-2">
                <Navigation className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-amber-800">{locationError}</p>
                  <button
                    onClick={requestLocation}
                    className="text-sm text-pink-600 font-medium mt-1 hover:underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Locate Me Button */}
          <button
            onClick={requestLocation}
            disabled={isLocating}
            className="absolute bottom-6 right-4 z-[1000] bg-white p-3 rounded-full shadow-lg border border-gray-200 hover:bg-pink-50 transition-colors disabled:opacity-50"
            title="Find my location"
          >
            {isLocating ? (
              <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Locate className="w-6 h-6 text-pink-600" />
            )}
          </button>

          {/* Map Container */}
          <MapContainer
            center={[CEBU_CENTER.lat, CEBU_CENTER.lng]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
            maxBounds={[
              [CEBU_BOUNDS.south - 0.1, CEBU_BOUNDS.west - 0.1],
              [CEBU_BOUNDS.north + 0.1, CEBU_BOUNDS.east + 0.1],
            ]}
            minZoom={11}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* User Location Marker */}
            <LocationMarker userLocation={userLocation} />
            
            {/* Salon Markers */}
            {salonLocations.map((salon) => (
              <Marker
                key={salon.id}
                position={[salon.coordinates.lat, salon.coordinates.lng]}
                icon={salonIcon}
              >
                <Popup>
                  <div className="p-1 min-w-[200px]">
                    <h3 className="font-bold text-gray-900 mb-1">{salon.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{salon.shop_name}</p>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-pink-600 font-bold">₱{salon.price}</span>
                      <span className="text-gray-500 text-sm">{salon.duration} min</span>
                    </div>
                    {salon.rating && (
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="font-semibold text-sm text-gray-900">{salon.rating.toFixed(1)}</span>
                      </div>
                    )}
                    <button
                      onClick={() => onSelectService(salon)}
                      className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:from-pink-600 hover:to-pink-700 transition-all"
                    >
                      Book Now
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Metro Cebu Label */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-pink-100">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-pink-600" />
              <span className="font-medium text-gray-700">Metro Cebu</span>
            </div>
          </div>
        </div>
      )}

      {/* Services Grid (List View) */}
      {viewMode === 'list' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-600">
              {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <Scissors className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No services found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden hover:shadow-lg hover:border-pink-300 transition-all cursor-pointer group flex flex-col"
                  onClick={() => onSelectService(service)}
                >
                  {/* Service Image */}
                  <div className="h-56 bg-gradient-to-br from-pink-400 to-purple-500 relative overflow-hidden">
                    {service.image_url ? (
                      <img src={service.image_url} alt={service.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Scissors className="w-24 h-24 text-white opacity-50" />
                      </div>
                    )}
                    
                    {/* Price Tag */}
                    <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded-full shadow-lg">
                      <span className="text-pink-600 font-bold text-lg">₱{service.price}</span>
                    </div>

                    {/* Rating Badge */}
                    {service.rating && (
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="font-semibold text-sm">{service.rating.toFixed(1)}</span>
                      </div>
                    )}

                    {/* Category Badge */}
                    <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span className="text-white text-xs font-medium capitalize">{service.category}</span>
                    </div>
                  </div>

                  {/* Service Info */}
                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-pink-600 transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{service.description}</p>

                    {/* Shop Info */}
                    <div className="flex items-start gap-2 mb-3 pb-3 border-b border-gray-100">
                      <MapPin className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{service.shop_name}</p>
                        <p className="text-xs text-gray-500 truncate">{service.shop_address}</p>
                      </div>
                    </div>

                    {/* Rating Display */}
                    {service.rating && (
                      <div className="flex items-center gap-1 mb-3">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="font-semibold text-sm text-gray-900">{service.rating.toFixed(1)}</span>
                        <span className="text-xs text-gray-500">rating</span>
                      </div>
                    )}

                    {/* Spacer to push button to bottom */}
                    <div className="flex-grow"></div>

                    {/* Duration & Book Button - Always at bottom */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{service.duration} min</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectService(service);
                        }}
                        className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-pink-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

