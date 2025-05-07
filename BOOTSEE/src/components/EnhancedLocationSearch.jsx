import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { debounce } from "lodash";
import { gsap } from "gsap";

// API providers for geocoding
const GEOCODING_PROVIDERS = {
  nominatim: {
    search: (query) => `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5`,
    reverse: (lat, lon) => `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
    headers: {
      "User-Agent": "BOOTS App"
    }
  },
  mapbox: {
    search: (query) => `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${process.env.REACT_APP_MAPBOX_TOKEN || "pk.eyJ1IjoiYm9vdHNlZSIsImEiOiJjbHRxcWVxbGUwMGRqMmtvNXB1cXRvZnRrIn0.Jst9gj-AK5bxKQyV_0q0Ug"}&limit=5`,
    reverse: (lat, lon) => `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${process.env.REACT_APP_MAPBOX_TOKEN || "pk.eyJ1IjoiYm9vdHNlZSIsImEiOiJjbHRxcWVxbGUwMGRqMmtvNXB1cXRvZnRrIn0.Jst9gj-AK5bxKQyV_0q0Ug"}`,
    headers: {}
  }
};

// Default provider
const DEFAULT_PROVIDER = "nominatim";

const EnhancedLocationSearch = ({
  label,
  onSelect,
  selected,
  placeholder,
  provider = DEFAULT_PROVIDER,
  showCurrentLocationButton = true,
  showClearButton = true,
  showSearchButton = true,
  animateResults = true,
  className = "",
  inputClassName = "",
  resultsClassName = "",
  buttonClassName = "",
  onError = null
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isGettingCurrentLocation, setIsGettingCurrentLocation] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  const searchBoxRef = useRef(null);
  const resultsRef = useRef(null);
  const inputRef = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("bootsee_recent_locations");
      if (saved) {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      }
    } catch (err) {
      console.error("Error loading recent searches:", err);
    }
  }, []);

  // Save a location to recent searches
  const saveToRecentSearches = useCallback((location) => {
    try {
      const newRecent = [
        location,
        ...recentSearches.filter(item => 
          item.display_name !== location.display_name
        )
      ].slice(0, 5);
      
      setRecentSearches(newRecent);
      localStorage.setItem("bootsee_recent_locations", JSON.stringify(newRecent));
    } catch (err) {
      console.error("Error saving recent search:", err);
    }
  }, [recentSearches]);

  // Set the selected address when coordinates are provided
  useEffect(() => {
    if (selected && selected.length === 2) {
      // Reverse geocode to get address from coordinates
      const fetchAddress = async () => {
        try {
          setIsLoading(true);
          const providerConfig = GEOCODING_PROVIDERS[provider] || GEOCODING_PROVIDERS.nominatim;
          const url = providerConfig.reverse(selected[0], selected[1]);
          
          const res = await axios.get(url, {
            headers: providerConfig.headers
          });
          
          if (provider === "nominatim" && res.data && res.data.display_name) {
            setQuery(res.data.display_name);
          } else if (provider === "mapbox" && res.data && res.data.features && res.data.features.length > 0) {
            setQuery(res.data.features[0].place_name);
          }
        } catch (err) {
          console.error("Error reverse geocoding:", err);
          setError("Could not get address for selected location");
          if (onError) onError("Could not get address for selected location");
        } finally {
          setIsLoading(false);
        }
      };

      fetchAddress();
    }
  }, [selected, provider, onError]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Animate results when they appear
  useEffect(() => {
    if (animateResults && resultsRef.current && isFocused && results.length > 0) {
      gsap.fromTo(
        resultsRef.current.children,
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.05, duration: 0.2, ease: "power2.out" }
      );
    }
  }, [results, isFocused, animateResults]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (value) => {
      if (value.length < 3) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      try {
        const providerConfig = GEOCODING_PROVIDERS[provider] || GEOCODING_PROVIDERS.nominatim;
        const url = providerConfig.search(value);
        
        const res = await axios.get(url, {
          headers: providerConfig.headers
        });
        
        if (provider === "nominatim") {
          setResults(res.data);
        } else if (provider === "mapbox" && res.data && res.data.features) {
          // Transform Mapbox results to match Nominatim format
          const transformedResults = res.data.features.map(feature => ({
            place_id: feature.id,
            lat: feature.center[1],
            lon: feature.center[0],
            display_name: feature.place_name,
            name: feature.text,
            type: feature.place_type[0]
          }));
          setResults(transformedResults);
        }
      } catch (err) {
        console.error("Error searching location:", err);
        setError("Failed to search location. Please try again.");
        if (onError) onError("Failed to search location");
      } finally {
        setIsLoading(false);
      }
    }, 500),
    [provider, onError]
  );

  const searchLocation = (value) => {
    setQuery(value);
    setError(null);
    setIsLoading(value.length >= 3);
    debouncedSearch(value);
  };

  const handleSelect = (place) => {
    setQuery(place.display_name);
    setResults([]);
    setIsFocused(false);
    
    // Save to recent searches
    saveToRecentSearches(place);
    
    // Call the onSelect callback
    onSelect([parseFloat(place.lat), parseFloat(place.lon)], place.display_name);
    
    // Animate the input on selection
    if (inputRef.current) {
      gsap.fromTo(
        inputRef.current,
        { borderColor: "#FF1493" },
        { borderColor: "#4B5563", duration: 1, ease: "power2.out" }
      );
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    onSelect(null, "");
    
    // Focus the input after clearing
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      if (onError) onError("Geolocation not supported");
      return;
    }
    
    setIsGettingCurrentLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onSelect([latitude, longitude]);
        setIsGettingCurrentLocation(false);
        toast.success("Current location detected");
      },
      (error) => {
        console.error("Error getting current location:", error);
        setError("Could not get your location. Please allow location access.");
        if (onError) onError("Location access denied");
        setIsGettingCurrentLocation(false);
        toast.error("Could not get your location");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <div className={`mb-4 ${className}`} ref={searchBoxRef}>
      <label className="block text-sm font-medium text-white mb-2">{label}</label>
      <div className="relative">
        <div className="flex">
          <div className="relative flex-grow">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => searchLocation(e.target.value)}
              onFocus={() => setIsFocused(true)}
              placeholder={placeholder || "Search for a location..."}
              className={`w-full px-4 py-3 bg-black bg-opacity-50 border border-gray-700 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-secondary text-white pr-10 ${inputClassName}`}
              disabled={isLoading || isGettingCurrentLocation}
            />
            {showClearButton && query && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-secondary transition-colors duration-200"
                aria-label="Clear search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
          {showSearchButton && (
            <button
              className={`bg-secondary text-white px-4 rounded-r-xl hover:bg-pink-700 transition duration-200 flex items-center justify-center ${buttonClassName}`}
              onClick={() => setIsFocused(true)}
              disabled={isLoading || isGettingCurrentLocation}
              aria-label="Search"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isFocused && (
          <div 
            ref={resultsRef}
            className={`absolute z-10 w-full mt-1 bg-black bg-opacity-90 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto ${resultsClassName}`}
          >
            {isLoading && (
              <div className="p-3 text-center text-gray-400">
                <svg className="animate-spin h-5 w-5 mx-auto mb-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </div>
            )}

            {error && <div className="p-3 text-center text-red-500">{error}</div>}

            {!isLoading && !error && results.length > 0 && (
              <ul className="py-1">
                {results.map((place, idx) => (
                  <li
                    key={`search-${idx}`}
                    onClick={() => handleSelect(place)}
                    className="px-4 py-2 hover:bg-gray-800 cursor-pointer text-sm text-white transition-colors duration-200"
                  >
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <div className="font-medium">{place.name || place.display_name.split(",")[0]}</div>
                        <div className="text-gray-400 text-xs truncate">{place.display_name}</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {!isLoading && !error && results.length === 0 && query.length >= 3 && (
              <div className="p-3 text-center text-gray-400">
                No locations found. Try a different search term.
              </div>
            )}

            {!isLoading && !error && query.length < 3 && recentSearches.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wider">Recent Searches</div>
                <ul className="py-1">
                  {recentSearches.map((place, idx) => (
                    <li
                      key={`recent-${idx}`}
                      onClick={() => handleSelect(place)}
                      className="px-4 py-2 hover:bg-gray-800 cursor-pointer text-sm text-white transition-colors duration-200"
                    >
                      <div className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <div className="font-medium">{place.name || place.display_name.split(",")[0]}</div>
                          <div className="text-gray-400 text-xs truncate">{place.display_name}</div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Current Location Button */}
      {showCurrentLocationButton && (
        <button
          onClick={getCurrentLocation}
          disabled={isGettingCurrentLocation}
          className="mt-2 text-secondary text-sm flex items-center hover:text-pink-400 transition-colors duration-200"
        >
          {isGettingCurrentLocation ? (
            <>
              <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Getting your location...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Use my current location
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default EnhancedLocationSearch;
