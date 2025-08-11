import React, { useEffect, useRef } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';

const LocationMap = ({ 
  latitude, 
  longitude, 
  companyName, 
  address,
  className = 'w-full h-64' 
}) => {
  const mapRef = useRef(null);

  useEffect(() => {
    // Initialize map when coordinates are available
    if (latitude && longitude && mapRef.current) {
      initializeMap();
    }
  }, [latitude, longitude]);

  const initializeMap = () => {
    // For now, we'll use a simple approach with Google Maps embed
    // In production, you might want to use react-leaflet or @googlemaps/react-wrapper
    const mapUrl = `https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=${latitude},${longitude}&zoom=15`;
    
    if (mapRef.current) {
      mapRef.current.innerHTML = `
        <iframe
          width="100%"
          height="100%"
          frameborder="0"
          style="border:0"
          src="${mapUrl}"
          allowfullscreen>
        </iframe>
      `;
    }
  };

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  const openInAppleMaps = () => {
    const url = `http://maps.apple.com/?q=${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  if (!latitude || !longitude) {
    return (
      <div className={`${className} bg-gray-100 rounded-lg flex flex-col items-center justify-center p-6`}>
        <MapPinIcon className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">Location Not Available</h3>
        {address && (
          <p className="text-sm text-gray-500 text-center">{address}</p>
        )}
      </div>
    );
  }

  return (
    <div className={`${className} relative rounded-lg overflow-hidden bg-gray-100`}>
      {/* Fallback for map */}
      <div 
        ref={mapRef}
        className="w-full h-full flex items-center justify-center"
      >
        {/* Static map placeholder using OpenStreetMap tiles */}
        <div className="w-full h-full relative">
          <img
            src={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s-l+000(${longitude},${latitude})/${longitude},${latitude},14/400x300?access_token=pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjazk5OWNuZzAwMDAwM21vNW8xZzNlNGV6In0.example`}
            alt={`Map showing ${companyName || 'location'}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to a simple placeholder if Mapbox fails
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = `
                <div class="w-full h-full bg-blue-100 flex flex-col items-center justify-center p-4">
                  <div class="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                    <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
                    </svg>
                  </div>
                  <p class="text-sm font-medium text-gray-700 text-center">${companyName || 'Location'}</p>
                  <p class="text-xs text-gray-500 text-center mt-1">${address || 'Click to view on map'}</p>
                </div>
              `;
            }}
          />
          
          {/* Overlay with company info */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
            <h4 className="text-white font-medium text-sm">{companyName}</h4>
            {address && (
              <p className="text-white text-xs opacity-90">{address}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="absolute top-2 right-2 flex flex-col space-y-2">
            <button
              onClick={openInGoogleMaps}
              className="bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow"
              title="Open in Google Maps"
            >
              <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </button>
            
            <button
              onClick={openInAppleMaps}
              className="bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow"
              title="Open in Apple Maps"
            >
              <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.364 4.636a9 9 0 0 1 .203 12.519l-.203.21L12 23.72l-6.364-6.355a9 9 0 0 1 12.728 0zM12 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationMap; 