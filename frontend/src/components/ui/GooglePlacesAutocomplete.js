import React, { useEffect, useRef, useState } from 'react';

const GooglePlacesAutocomplete = ({ 
  value, 
  onChange, 
  placeholder = "Enter address...",
  className = "",
  onPlaceSelect = null,
  disabled = false
}) => {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsGoogleMapsLoaded(true);
      initializeAutocomplete();
    } else {
      // Listen for Google Maps load event
      const handleGoogleMapsLoad = () => {
        setIsGoogleMapsLoaded(true);
        initializeAutocomplete();
      };

      window.addEventListener('google-maps-loaded', handleGoogleMapsLoad);
      return () => window.removeEventListener('google-maps-loaded', handleGoogleMapsLoad);
    }
  }, []);

  const initializeAutocomplete = () => {
    if (!inputRef.current || !window.google || autocompleteRef.current) return;

    try {
      // Create autocomplete instance
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        fields: ['formatted_address', 'address_components', 'geometry', 'place_id']
      });

      // Listen for place selection
      autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
      
      console.log('✅ Google Places Autocomplete initialized');
    } catch (error) {
      console.error('❌ Error initializing Google Places Autocomplete:', error);
    }
  };

  const handlePlaceSelect = () => {
    if (!autocompleteRef.current) return;

    const place = autocompleteRef.current.getPlace();
    console.log('🔍 Place selected:', place);

    if (!place.formatted_address) {
      console.warn('⚠️ No formatted address found');
      return;
    }

    // Update input value
    onChange(place.formatted_address);

    // Extract address components
    const addressComponents = {};
    if (place.address_components) {
      place.address_components.forEach(component => {
        const types = component.types;
        if (types.includes('street_number')) {
          addressComponents.street_number = component.long_name;
        }
        if (types.includes('route')) {
          addressComponents.route = component.long_name;
        }
        if (types.includes('locality')) {
          addressComponents.city = component.long_name;
        }
        if (types.includes('administrative_area_level_1')) {
          addressComponents.state = component.long_name;
        }
        if (types.includes('country')) {
          addressComponents.country = component.long_name;
        }
        if (types.includes('postal_code')) {
          addressComponents.postal_code = component.long_name;
        }
      });
    }

    // Get coordinates
    let coordinates = null;
    if (place.geometry && place.geometry.location) {
      coordinates = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      };
    }

    // Call callback with detailed place information
    if (onPlaceSelect) {
      onPlaceSelect({
        formatted_address: place.formatted_address,
        address_components: addressComponents,
        coordinates: coordinates,
        place_id: place.place_id
      });
    }
  };

  const handleInputChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={className}
        disabled={disabled || !isGoogleMapsLoaded}
      />
      {!isGoogleMapsLoaded && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
        </div>
      )}
    </div>
  );
};

export default GooglePlacesAutocomplete;
