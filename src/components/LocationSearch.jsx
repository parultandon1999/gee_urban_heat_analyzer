import { useState, useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { searchLocation } from '../services/api.js';

const LocationSearch = ({ onLocationSelect, currentLocation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const debounceTimer = useRef(null);

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (debounceTimer.current === 'SELECTED') {
      debounceTimer.current = null;
      return;
    }

    if (!searchQuery || typeof searchQuery !== 'string' || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceTimer.current = setTimeout(async () => {
      const results = await searchLocation(searchQuery);
      setSuggestions(results);
      setIsLoading(false);
      setShowDropdown(true);
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLocation = (location) => {
    onLocationSelect({
      latitude: location.latitude,
      longitude: location.longitude,
      name: location.name
    });
    debounceTimer.current = 'SELECTED';
    setSearchQuery(location.name);
    setIsLoading(false)
    setShowDropdown(false);
  };

  const handleClear = () => {
    setSearchQuery("");
    setSuggestions([]);
    setShowDropdown(false);
    setIsLoading(false);
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery && setShowDropdown(true)}
          placeholder="Search location (e.g., New York, London)..."
          className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
          ) : searchQuery && (
            <button
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 p-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      {/* Dropdown Results */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {suggestions.map((location, index) => (
            <button
              key={index}
              onClick={() => handleSelectLocation(location)}
              className="w-full text-left px-4 py-3 hover:bg-green-50 border-b border-slate-100 last:border-b-0 transition-colors"
            >
              <p className="text-sm font-medium text-slate-900 truncate">
                {location.name.split(',')[0]}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {location.fullName}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {showDropdown && !isLoading && searchQuery && suggestions.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-4">
          <p className="text-sm text-slate-500 text-center">No locations found</p>
        </div>
      )}
    </div>
  );
};

export default LocationSearch;