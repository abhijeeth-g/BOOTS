import { useState, useEffect, useRef } from "react";
import axios from "axios";

const LocationSearch = ({ label, onSelect, selected, placeholder }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFocused, setIsFocused] = useState(false);

  const searchTimeout = useRef(null);
  const searchBoxRef = useRef(null);

  // Set the selected address when coordinates are provided
  useEffect(() => {
    if (selected && selected.length === 2) {
      // Reverse geocode to get address from coordinates
      const fetchAddress = async () => {
        try {
          const res = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${selected[0]}&lon=${selected[1]}`
          );
          if (res.data && res.data.display_name) {
            setQuery(res.data.display_name);
          }
        } catch (err) {
          console.error("Error reverse geocoding:", err);
        }
      };

      fetchAddress();
    }
  }, [selected]);

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

  const searchLocation = async (value) => {
    setQuery(value);
    setError(null);

    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (value.length < 3) {
      setResults([]);
      return;
    }

    // Set a timeout to avoid too many API calls
    searchTimeout.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(
          `https://nominatim.openstreetmap.org/search?format=json&q=${value}&limit=5`
        );
        setResults(res.data);
      } catch (err) {
        console.error("Error searching location:", err);
        setError("Failed to search location. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }, 500); // 500ms delay
  };

  const handleSelect = (place) => {
    setQuery(place.display_name);
    setResults([]);
    setIsFocused(false);
    onSelect([parseFloat(place.lat), parseFloat(place.lon)], place.display_name);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    onSelect(null, "");
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    searchLocation(value);
  };

  return (
    <div className="mb-4" ref={searchBoxRef}>
      <label className="block text-sm font-medium text-white mb-2">{label}</label>
      <div className="relative">
        <div className="flex">
          <div className="relative flex-grow">
            <input
              value={query}
              onChange={handleInputChange}
              onFocus={() => setIsFocused(true)}
              placeholder={placeholder || "Search for a location..."}
              className="w-full px-4 py-3 bg-black bg-opacity-50 border border-gray-700 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-secondary text-white pr-10"
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-secondary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
          <button
            className="bg-secondary text-white px-4 rounded-r-xl hover:bg-pink-700 transition duration-200 flex items-center justify-center"
            onClick={() => setIsFocused(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Search Results Dropdown */}
        {isFocused && (results.length > 0 || isLoading || error) && (
          <div className="absolute z-10 w-full mt-1 bg-black bg-opacity-90 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
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
                    key={idx}
                    onClick={() => handleSelect(place)}
                    className="px-4 py-2 hover:bg-gray-800 cursor-pointer text-sm text-white"
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
          </div>
        )}
      </div>

      {/* Current Location Button */}
      <button
        onClick={() => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const { latitude, longitude } = position.coords;
                onSelect([latitude, longitude]);
              },
              (error) => {
                console.error("Error getting current location:", error);
                setError("Could not get your current location. Please allow location access.");
              }
            );
          } else {
            setError("Geolocation is not supported by your browser.");
          }
        }}
        className="mt-2 text-secondary text-sm flex items-center hover:underline hover:text-white transition-colors duration-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Use my current location
      </button>
    </div>
  );
};

export default LocationSearch;