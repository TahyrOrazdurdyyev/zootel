import React, { useState, useEffect } from 'react';
import { Country, State, City } from 'country-state-city';

const LocationSelector = ({ 
  selectedCountry, 
  selectedState, 
  selectedCity, 
  onLocationChange,
  className = "",
  disabled = false,
  required = false
}) => {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  // Load countries on component mount
  useEffect(() => {
    const allCountries = Country.getAllCountries();
    setCountries(allCountries);
  }, []);

  // Load states when country changes
  useEffect(() => {
    if (selectedCountry) {
      const countryStates = State.getStatesOfCountry(selectedCountry.isoCode);
      setStates(countryStates);
      setCities([]); // Clear cities when country changes
      
      // Clear state and city if country changed
      if (selectedState && selectedState.countryCode !== selectedCountry.isoCode) {
        onLocationChange({
          country: selectedCountry,
          state: null,
          city: null
        });
      }
    } else {
      setStates([]);
      setCities([]);
    }
  }, [selectedCountry]);

  // Load cities when state changes
  useEffect(() => {
    if (selectedCountry && selectedState) {
      const stateCities = City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode);
      setCities(stateCities);
      
      // Clear city if state changed
      if (selectedCity && selectedCity.stateCode !== selectedState.isoCode) {
        onLocationChange({
          country: selectedCountry,
          state: selectedState,
          city: null
        });
      }
    } else if (selectedCountry && !selectedState) {
      // If country is selected but no state (countries without states)
      const countryCities = City.getCitiesOfCountry(selectedCountry.isoCode);
      setCities(countryCities);
    } else {
      setCities([]);
    }
  }, [selectedCountry, selectedState]);

  const handleCountryChange = (e) => {
    const countryCode = e.target.value;
    const country = countries.find(c => c.isoCode === countryCode);
    
    onLocationChange({
      country: country || null,
      state: null,
      city: null
    });
  };

  const handleStateChange = (e) => {
    const stateCode = e.target.value;
    const state = states.find(s => s.isoCode === stateCode);
    
    onLocationChange({
      country: selectedCountry,
      state: state || null,
      city: null
    });
  };

  const handleCityChange = (e) => {
    const cityName = e.target.value;
    const city = cities.find(c => c.name === cityName);
    
    onLocationChange({
      country: selectedCountry,
      state: selectedState,
      city: city || null
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Country Dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Country {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={selectedCountry?.isoCode || ''}
          onChange={handleCountryChange}
          disabled={disabled}
          required={required}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">Select a country</option>
          {countries.map((country) => (
            <option key={country.isoCode} value={country.isoCode}>
              {country.flag} {country.name}
            </option>
          ))}
        </select>
      </div>

      {/* State/Province Dropdown - Only show if country has states */}
      {selectedCountry && states.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State/Province {required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={selectedState?.isoCode || ''}
            onChange={handleStateChange}
            disabled={disabled}
            required={required}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Select a state/province</option>
            {states.map((state) => (
              <option key={state.isoCode} value={state.isoCode}>
                {state.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* City Dropdown - Show when country is selected */}
      {selectedCountry && cities.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City {required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={selectedCity?.name || ''}
            onChange={handleCityChange}
            disabled={disabled}
            required={required}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Select a city</option>
            {cities.map((city) => (
              <option key={`${city.name}-${city.latitude}-${city.longitude}`} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Manual City Input - Show when country is selected but no cities available */}
      {selectedCountry && cities.length === 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={selectedCity?.name || ''}
            onChange={(e) => {
              onLocationChange({
                country: selectedCountry,
                state: selectedState,
                city: { name: e.target.value }
              });
            }}
            disabled={disabled}
            required={required}
            placeholder="Enter city name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
      )}

      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 mt-2">
          <div>Selected: {selectedCountry?.name || 'None'} → {selectedState?.name || 'None'} → {selectedCity?.name || 'None'}</div>
          <div>States available: {states.length}, Cities available: {cities.length}</div>
        </div>
      )}
    </div>
  );
};

export default LocationSelector; 