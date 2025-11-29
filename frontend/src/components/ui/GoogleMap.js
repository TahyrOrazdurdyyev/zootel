import React, { useEffect, useRef, useState } from 'react';

const GoogleMap = ({ 
  address,
  coordinates,
  height = "300px",
  width = "100%",
  zoom = 15,
  className = "",
  showMarker = true,
  markerTitle = ""
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setIsGoogleMapsLoaded(true);
      initializeMap();
    } else {
      // Listen for Google Maps load event
      const handleGoogleMapsLoad = () => {
        setIsGoogleMapsLoaded(true);
        initializeMap();
      };

      window.addEventListener('google-maps-loaded', handleGoogleMapsLoad);
      return () => window.removeEventListener('google-maps-loaded', handleGoogleMapsLoad);
    }
  }, []);

  useEffect(() => {
    if (isGoogleMapsLoaded && (coordinates || address)) {
      updateMapLocation();
    }
  }, [coordinates, address, isGoogleMapsLoaded]);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    try {
      // Default location (center of map if no coordinates provided)
      const defaultLocation = { lat: 40.7128, lng: -74.0060 }; // New York

      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        zoom: zoom,
        center: coordinates || defaultLocation,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      });

      console.log('✅ Google Map initialized');
      updateMapLocation();
    } catch (error) {
      console.error('❌ Error initializing Google Map:', error);
      setError('Failed to load map');
    }
  };

  const updateMapLocation = () => {
    if (!mapInstanceRef.current || !window.google) return;

    // Clear existing marker
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    if (coordinates) {
      // Use provided coordinates
      setMapCenter(coordinates);
      if (showMarker) {
        addMarker(coordinates, markerTitle || address || 'Location');
      }
    } else if (address) {
      // Geocode address to get coordinates
      geocodeAddress(address);
    }
  };

  const geocodeAddress = (address) => {
    if (!window.google) return;

    const geocoder = new window.google.maps.Geocoder();
    
    geocoder.geocode({ address: address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        const coords = {
          lat: location.lat(),
          lng: location.lng()
        };
        
        setMapCenter(coords);
        if (showMarker) {
          addMarker(coords, markerTitle || address);
        }
        
        console.log('✅ Address geocoded:', address, coords);
      } else {
        console.error('❌ Geocoding failed:', status);
        setError('Could not find location');
      }
    });
  };

  const setMapCenter = (coords) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(coords);
      mapInstanceRef.current.setZoom(zoom);
    }
  };

  const addMarker = (coords, title) => {
    if (!mapInstanceRef.current || !window.google) return;

    markerRef.current = new window.google.maps.Marker({
      position: coords,
      map: mapInstanceRef.current,
      title: title,
      animation: window.google.maps.Animation.DROP
    });
  };

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg ${className}`}
        style={{ height, width }}
      >
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">🗺️</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height, width }}>
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg"
        style={{ minHeight: height }}
      />
      {!isGoogleMapsLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
            <div className="text-sm text-gray-500">Loading map...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMap;
