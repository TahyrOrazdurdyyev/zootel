import React, { useState, useEffect, useCallback } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon, MapPinIcon } from '@heroicons/react/24/outline';

const LocationSelect = ({ 
  onSelectionChange,
  initialCountry = '',
  initialState = '',
  initialCity = '',
  className = '',
  showLabels = true,
  required = false
}) => {
  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const [selectedState, setSelectedState] = useState(initialState);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  
  const [countryQuery, setCountryQuery] = useState('');
  const [stateQuery, setStateQuery] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Mock data - in production, you'd fetch from a location API
  const mockCountries = [
    { code: 'RU', name: 'Россия', emoji: '🇷🇺' },
    { code: 'US', name: 'США', emoji: '🇺🇸' },
    { code: 'UK', name: 'Великобритания', emoji: '🇬🇧' },
    { code: 'DE', name: 'Германия', emoji: '🇩🇪' },
    { code: 'FR', name: 'Франция', emoji: '🇫🇷' },
    { code: 'IT', name: 'Италия', emoji: '🇮🇹' },
    { code: 'ES', name: 'Испания', emoji: '🇪🇸' },
    { code: 'CA', name: 'Канада', emoji: '🇨🇦' },
    { code: 'AU', name: 'Австралия', emoji: '🇦🇺' },
    { code: 'JP', name: 'Япония', emoji: '🇯🇵' }
  ];

  const mockStates = {
    'RU': [
      { code: 'MOW', name: 'Москва' },
      { code: 'SPE', name: 'Санкт-Петербург' },
      { code: 'NSO', name: 'Новосибирская область' },
      { code: 'SVE', name: 'Свердловская область' },
      { code: 'KDA', name: 'Краснодарский край' },
      { code: 'ROS', name: 'Ростовская область' },
      { code: 'BA', name: 'Башкортостан' },
      { code: 'TA', name: 'Татарстан' }
    ],
    'US': [
      { code: 'CA', name: 'California' },
      { code: 'NY', name: 'New York' },
      { code: 'TX', name: 'Texas' },
      { code: 'FL', name: 'Florida' },
      { code: 'IL', name: 'Illinois' }
    ],
    'UK': [
      { code: 'ENG', name: 'England' },
      { code: 'SCT', name: 'Scotland' },
      { code: 'WLS', name: 'Wales' },
      { code: 'NIR', name: 'Northern Ireland' }
    ]
  };

  const mockCities = {
    'RU-MOW': [
      { id: 1, name: 'Москва' },
      { id: 2, name: 'Зеленоград' },
      { id: 3, name: 'Троицк' },
      { id: 4, name: 'Московский' }
    ],
    'RU-SPE': [
      { id: 5, name: 'Санкт-Петербург' },
      { id: 6, name: 'Колпино' },
      { id: 7, name: 'Пушкин' },
      { id: 8, name: 'Петергоф' }
    ],
    'US-CA': [
      { id: 9, name: 'Los Angeles' },
      { id: 10, name: 'San Francisco' },
      { id: 11, name: 'San Diego' },
      { id: 12, name: 'Sacramento' }
    ],
    'US-NY': [
      { id: 13, name: 'New York City' },
      { id: 14, name: 'Buffalo' },
      { id: 15, name: 'Rochester' },
      { id: 16, name: 'Syracuse' }
    ]
  };

  // Initialize countries
  useEffect(() => {
    setCountries(mockCountries);
  }, []);

  // Load states when country changes
  useEffect(() => {
    if (selectedCountry) {
      setLoadingStates(true);
      // Simulate API call
      setTimeout(() => {
        const countryStates = mockStates[selectedCountry] || [];
        setStates(countryStates);
        setLoadingStates(false);
        
        // Reset state and city if country changed
        if (selectedState && !countryStates.find(s => s.code === selectedState)) {
          setSelectedState('');
          setSelectedCity('');
        }
      }, 300);
    } else {
      setStates([]);
      setSelectedState('');
      setSelectedCity('');
    }
  }, [selectedCountry]);

  // Load cities when state changes
  useEffect(() => {
    if (selectedCountry && selectedState) {
      setLoadingCities(true);
      // Simulate API call
      setTimeout(() => {
        const stateCities = mockCities[`${selectedCountry}-${selectedState}`] || [];
        setCities(stateCities);
        setLoadingCities(false);
        
        // Reset city if state changed
        if (selectedCity && !stateCities.find(c => c.name === selectedCity)) {
          setSelectedCity('');
        }
      }, 300);
    } else {
      setCities([]);
      setSelectedCity('');
    }
  }, [selectedCountry, selectedState]);

  // Notify parent of changes
  useEffect(() => {
    if (onSelectionChange) {
      const countryData = countries.find(c => c.code === selectedCountry);
      const stateData = states.find(s => s.code === selectedState);
      const cityData = cities.find(c => c.name === selectedCity);
      
      onSelectionChange({
        country: selectedCountry,
        countryName: countryData?.name || '',
        state: selectedState,
        stateName: stateData?.name || '',
        city: selectedCity,
        cityName: cityData?.name || ''
      });
    }
  }, [selectedCountry, selectedState, selectedCity, onSelectionChange, countries, states, cities]);

  // Filter functions
  const filteredCountries = countryQuery === ''
    ? countries
    : countries.filter(country =>
        country.name.toLowerCase().includes(countryQuery.toLowerCase())
      );

  const filteredStates = stateQuery === ''
    ? states
    : states.filter(state =>
        state.name.toLowerCase().includes(stateQuery.toLowerCase())
      );

  const filteredCities = cityQuery === ''
    ? cities
    : cities.filter(city =>
        city.name.toLowerCase().includes(cityQuery.toLowerCase())
      );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Country Selection */}
      <div>
        {showLabels && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Страна {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <Combobox value={selectedCountry} onChange={setSelectedCountry}>
          <div className="relative">
            <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-gray-300 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500">
              <div className="flex items-center pl-3 pr-10">
                <MapPinIcon className="w-4 h-4 text-gray-400 mr-2" />
                <Combobox.Input
                  className="w-full border-none py-2 text-sm leading-5 text-gray-900 focus:ring-0 focus:outline-none"
                  displayValue={(countryCode) => {
                    const country = countries.find(c => c.code === countryCode);
                    return country ? `${country.emoji} ${country.name}` : '';
                  }}
                  onChange={(event) => setCountryQuery(event.target.value)}
                  placeholder="Выберите страну"
                />
              </div>
              <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </Combobox.Button>
            </div>
            <Transition
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {filteredCountries.length === 0 && countryQuery !== '' ? (
                  <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                    Страна не найдена.
                  </div>
                ) : (
                  filteredCountries.map((country) => (
                    <Combobox.Option
                      key={country.code}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active ? 'bg-primary-600 text-white' : 'text-gray-900'
                        }`
                      }
                      value={country.code}
                    >
                      {({ selected, active }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                            {country.emoji} {country.name}
                          </span>
                          {selected ? (
                            <span
                              className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                active ? 'text-white' : 'text-primary-600'
                              }`}
                            >
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Combobox.Option>
                  ))
                )}
              </Combobox.Options>
            </Transition>
          </div>
        </Combobox>
      </div>

      {/* State Selection */}
      {selectedCountry && (
        <div>
          {showLabels && (
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Регион/Штат {required && <span className="text-red-500">*</span>}
            </label>
          )}
          <Combobox value={selectedState} onChange={setSelectedState} disabled={loadingStates}>
            <div className="relative">
              <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-gray-300 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500">
                <div className="flex items-center pl-3 pr-10">
                  {loadingStates ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500 mr-2"></div>
                  ) : (
                    <MapPinIcon className="w-4 h-4 text-gray-400 mr-2" />
                  )}
                  <Combobox.Input
                    className="w-full border-none py-2 text-sm leading-5 text-gray-900 focus:ring-0 focus:outline-none disabled:opacity-50"
                    displayValue={(stateCode) => {
                      const state = states.find(s => s.code === stateCode);
                      return state ? state.name : '';
                    }}
                    onChange={(event) => setStateQuery(event.target.value)}
                    placeholder={loadingStates ? "Загрузка..." : "Выберите регион"}
                    disabled={loadingStates}
                  />
                </div>
                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </Combobox.Button>
              </div>
              <Transition
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {filteredStates.length === 0 && stateQuery !== '' ? (
                    <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                      Регион не найден.
                    </div>
                  ) : (
                    filteredStates.map((state) => (
                      <Combobox.Option
                        key={state.code}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active ? 'bg-primary-600 text-white' : 'text-gray-900'
                          }`
                        }
                        value={state.code}
                      >
                        {({ selected, active }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              {state.name}
                            </span>
                            {selected ? (
                              <span
                                className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                  active ? 'text-white' : 'text-primary-600'
                                }`}
                              >
                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Combobox.Option>
                    ))
                  )}
                </Combobox.Options>
              </Transition>
            </div>
          </Combobox>
        </div>
      )}

      {/* City Selection */}
      {selectedState && (
        <div>
          {showLabels && (
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Город {required && <span className="text-red-500">*</span>}
            </label>
          )}
          <Combobox value={selectedCity} onChange={setSelectedCity} disabled={loadingCities}>
            <div className="relative">
              <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-gray-300 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500">
                <div className="flex items-center pl-3 pr-10">
                  {loadingCities ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500 mr-2"></div>
                  ) : (
                    <MapPinIcon className="w-4 h-4 text-gray-400 mr-2" />
                  )}
                  <Combobox.Input
                    className="w-full border-none py-2 text-sm leading-5 text-gray-900 focus:ring-0 focus:outline-none disabled:opacity-50"
                    displayValue={(cityName) => cityName}
                    onChange={(event) => setCityQuery(event.target.value)}
                    placeholder={loadingCities ? "Загрузка..." : "Выберите город"}
                    disabled={loadingCities}
                  />
                </div>
                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </Combobox.Button>
              </div>
              <Transition
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {filteredCities.length === 0 && cityQuery !== '' ? (
                    <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                      Город не найден.
                    </div>
                  ) : (
                    filteredCities.map((city) => (
                      <Combobox.Option
                        key={city.id}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active ? 'bg-primary-600 text-white' : 'text-gray-900'
                          }`
                        }
                        value={city.name}
                      >
                        {({ selected, active }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              {city.name}
                            </span>
                            {selected ? (
                              <span
                                className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                  active ? 'text-white' : 'text-primary-600'
                                }`}
                              >
                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Combobox.Option>
                    ))
                  )}
                </Combobox.Options>
              </Transition>
            </div>
          </Combobox>
        </div>
      )}
    </div>
  );
};

export default LocationSelect; 