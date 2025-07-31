import React, { useState, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const LocationSelect = ({ 
  selectedCountry = '', 
  selectedState = '', 
  selectedCity = '', 
  onCountryChange, 
  onStateChange, 
  onCityChange,
  disabled = false,
  className = ''
}) => {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState({
    countries: false,
    states: false,
    cities: false
  });

  // Fetch countries on component mount
  useEffect(() => {
    fetchCountries();
  }, []);

  // Fetch states when country changes
  useEffect(() => {
    if (selectedCountry) {
      fetchStates(selectedCountry);
    } else {
      setStates([]);
      setCities([]);
    }
  }, [selectedCountry]);

  // Fetch cities when state changes
  useEffect(() => {
    if (selectedCountry && selectedState) {
      fetchCities(selectedCountry, selectedState);
    } else {
      setCities([]);
    }
  }, [selectedCountry, selectedState]);

  const fetchCountries = async () => {
    setLoading(prev => ({ ...prev, countries: true }));
    try {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries');
      const data = await response.json();
      
      if (data.error === false) {
        // Sort countries alphabetically
        const sortedCountries = data.data.sort((a, b) => a.country.localeCompare(b.country));
        setCountries(sortedCountries);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
      // Fallback data
      setCountries([
        { country: 'Russia', states: [] },
        { country: 'Ukraine', states: [] },
        { country: 'Belarus', states: [] },
        { country: 'Kazakhstan', states: [] }
      ]);
    } finally {
      setLoading(prev => ({ ...prev, countries: false }));
    }
  };

  const fetchStates = async (countryName) => {
    setLoading(prev => ({ ...prev, states: true }));
    try {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          country: countryName
        })
      });
      
      const data = await response.json();
      
      if (data.error === false) {
        // Sort states alphabetically
        const sortedStates = data.data.states.sort((a, b) => a.name.localeCompare(b.name));
        setStates(sortedStates);
      } else {
        setStates([]);
      }
    } catch (error) {
      console.error('Error fetching states:', error);
      setStates([]);
    } finally {
      setLoading(prev => ({ ...prev, states: false }));
    }
  };

  const fetchCities = async (countryName, stateName) => {
    setLoading(prev => ({ ...prev, cities: true }));
    try {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          country: countryName,
          state: stateName
        })
      });
      
      const data = await response.json();
      
      if (data.error === false) {
        // Sort cities alphabetically
        const sortedCities = data.data.sort((a, b) => a.localeCompare(b));
        setCities(sortedCities);
      } else {
        setCities([]);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      setCities([]);
    } finally {
      setLoading(prev => ({ ...prev, cities: false }));
    }
  };

  const handleCountryChange = (e) => {
    const country = e.target.value;
    onCountryChange?.(country);
    onStateChange?.(''); // Reset state
    onCityChange?.(''); // Reset city
  };

  const handleStateChange = (e) => {
    const state = e.target.value;
    onStateChange?.(state);
    onCityChange?.(''); // Reset city
  };

  const handleCityChange = (e) => {
    const city = e.target.value;
    onCityChange?.(city);
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      {/* Country Select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Страна
        </label>
        <div className="relative">
          <select
            value={selectedCountry}
            onChange={handleCountryChange}
            disabled={disabled || loading.countries}
            className="input-field appearance-none pr-10"
          >
            <option value="">
              {loading.countries ? 'Загружается...' : 'Выберите страну'}
            </option>
            {countries.map((country) => (
              <option key={country.country} value={country.country}>
                {country.country}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* State Select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Регион/Область
        </label>
        <div className="relative">
          <select
            value={selectedState}
            onChange={handleStateChange}
            disabled={disabled || loading.states || !selectedCountry}
            className="input-field appearance-none pr-10"
          >
            <option value="">
              {loading.states ? 'Загружается...' : 
               !selectedCountry ? 'Сначала выберите страну' : 
               'Выберите регион'}
            </option>
            {states.map((state) => (
              <option key={state.name} value={state.name}>
                {state.name}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* City Select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Город
        </label>
        <div className="relative">
          <select
            value={selectedCity}
            onChange={handleCityChange}
            disabled={disabled || loading.cities || !selectedState}
            className="input-field appearance-none pr-10"
          >
            <option value="">
              {loading.cities ? 'Загружается...' : 
               !selectedState ? 'Сначала выберите регион' : 
               'Выберите город'}
            </option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default LocationSelect; 