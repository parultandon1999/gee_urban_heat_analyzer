import { useState, useRef, useEffect } from 'react';
import {
  Locate,
  Thermometer,
  Cloud,
  Calendar,
  Leaf,
  AlertCircle,
  Loader2,
  MapPinned,
  HelpCircle
} from 'lucide-react';

import { analyzeHeatIsland as callAnalyzeAPI, healthCheck, getLocationName } from '../services/api';
import LocationSearch from './LocationSearch.jsx';

const Tooltip = ({ text, position = 'top' }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef(null);

  const positionClasses = position === 'top' 
    ? 'bottom-full mb-2' 
    : 'top-full mt-2';

  const arrowClasses = position === 'top'
    ? 'top-full'
    : 'bottom-full';

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTooltip]);

  return (
    <div ref={tooltipRef} className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        className="text-slate-400 hover:text-slate-600 ml-1 pointer-events-auto"
      >
        <HelpCircle className="text-gray-500 w-2.5 h-2.5" />
      </button>
      {showTooltip && (
        <div className={`absolute left-0 w-48 bg-slate-900 text-white text-xs rounded-lg p-2 z-10 pointer-events-none ${positionClasses}`}>
          {text}
          <div className={`absolute left-2 w-2 h-2 bg-slate-900 transform rotate-45 ${arrowClasses}`}></div>
        </div>
      )}
    </div>
  );
};

const ConfigurationPanel = ({ 
  formData,
  setFormData, 
  analyzing, 
  setAnalyzing, 
  error, 
  setError, 
  logs, 
  setLogs, 
  setResults,
  locationName,
  setLocationName
}) => {
  
  // Fetch location name when coordinates change
  const fetchLocationName = async (lat, lon) => {
    if (lat && lon) {
      try {
        const location = await getLocationName(parseFloat(lat), parseFloat(lon));
        setLocationName(location.fullName);
      } catch (err) {
        console.error('Error fetching location:', err);
      }
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Fetch location name if coordinates changed
    if (name === 'latitude' || name === 'longitude') {
      const lat = name === 'latitude' ? value : formData.latitude;
      const lon = name === 'longitude' ? value : formData.longitude;
      fetchLocationName(lat, lon);
    }
  };

  const handleLocationSelect = (location) => {
    setFormData(prev => ({
      ...prev,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString()
    }));
  };

  // Analyze heat island
  const analyzeHeatIsland = async () => {
    setAnalyzing(true);
    setError(null);
    setLogs([]);
    setResults(null);
    
    try {
      const isHealthy = await healthCheck();
      if (!isHealthy) {
        throw new Error('Backend server is not running try again later.');
      }
      
      const parameters = {
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        startDate: formData.startDate,
        endDate: formData.endDate,
        cloudCover: parseInt(formData.cloudCover),
        hotThreshold: parseFloat(formData.hotThreshold),
        vegThreshold: parseFloat(formData.vegThreshold),
        geeProjectId: formData.geeProjectId,
        dataset: formData.dataset.trim()
      };
      
      const response = await callAnalyzeAPI(parameters, (log) => {
        setLogs(prev => [...prev, { 
          time: new Date().toLocaleTimeString(), 
          message: log
        }]);
      });
      
      if (response.success) {
        setResults(response);
        
        // Fetch location name before saving
        let locName = 'Unknown Location';
        try {
          const location = await getLocationName(parseFloat(formData.latitude), parseFloat(formData.longitude));
          locName = location.fullName;
        } catch (err) {
          console.error('Error fetching location:', err);
        }
        
        // Track analysis in history with full results
        const analysisRecord = {
          id: Date.now().toString(),
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          location: `${formData.latitude}, ${formData.longitude}`,
          locationName: locName,
          startDate: formData.startDate,
          endDate: formData.endDate,
          cloudCover: parseInt(formData.cloudCover),
          hotThreshold: parseFloat(formData.hotThreshold),
          vegThreshold: parseFloat(formData.vegThreshold),
          dataset: formData.dataset.trim(),
          geeProjectId: formData.geeProjectId,
          timestamp: new Date().toISOString(),
          searchedAt: new Date().toLocaleString(),
          results: response
        };
        
        // Save to localStorage
        const existing = JSON.parse(localStorage.getItem('uhi_analysis_history') || '[]');
        existing.unshift(analysisRecord);
        localStorage.setItem('uhi_analysis_history', JSON.stringify(existing));
      } else {
        throw new Error(response.error || 'Analysis failed');
      }
      
      setAnalyzing(false);
      
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze heat island data.');
      setAnalyzing(false);
      setLogs(prev => [...prev, { 
        time: new Date().toLocaleTimeString(), 
        message: '✗ Analysis failed: ' + err.message
      }]);
    }
  };

  return (
    <div className="lg:col-span-1">
      <div className="bg-white border-slate-200 rounded-xl shadow-sm border p-3 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900">Analysis Configuration</h2>
            {locationName && (
              <div className="flex items-center gap-2 md:hidden">
                <MapPinned className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-blue-600 font-medium truncate max-w-[140px]">
                  {locationName}
                </span>
              </div>
            )}
          </div>
          <div className="space-y-2">
          {/* Location Section */}
          <div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Locate className="w-4 h-4" />
                  <span>Location</span>
                </label>
                <Tooltip
                  position="bottom"
                  text="Enter the city name or coordinates (latitude, longitude) of the area you want to analyze."
                />
              </div>
            </div>
            {/* Search Bar */}
            <LocationSearch onLocationSelect={handleLocationSelect} />
            {/* Manual Coordinate Input */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <input
                type="text"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                placeholder="Latitude"
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-xs"
              />
              <input
                type="text"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                placeholder="Longitude"
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-xs"
              />
            </div>
          </div>
          {/* Dataset */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Cloud className="w-4 h-4" />
              Dataset
              <Tooltip text="Landsat 9: Latest thermal data, 30m resolution (recommended). Landsat 8: Historical thermal data, 30m resolution. Landsat 7: Older data, 30m resolution." />
            </label>
            <select
              name="dataset"
              value={formData.dataset}
              onChange={handleInputChange}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-xs bg-slate-50 hover:bg-white transition-colors appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23475569' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
                paddingRight: '28px'
              }}
            >
              <option value="LANDSAT/LC09/C02/T1_L2">LANDSAT/LC09/C02/T1_L2</option>
              <option value="LANDSAT/LC08/C02/T1_L2">LANDSAT/LC08/C02/T1_L2</option>
              <option value="LANDSAT/LE07/C02/T1_L2">LANDSAT/LE07/C02/T1_L2</option>
            </select>
          </div>
          {/* Date Range */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Calendar className="w-4 h-4" />
              Analysis Period
              <Tooltip text="Select 7-365 days. Summer months (May-August) show clearest heat island patterns." />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-xs bg-slate-50 hover:bg-white transition-colors"
                />
              </div>
              <div className="relative">
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-xs bg-slate-50 hover:bg-white transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Cloud Cover Threshold */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Cloud className="w-4 h-4" />
              Cloud Cover Threshold (%)
              <Tooltip text="Filter out cloudy images (0-100%). Lower = clearer images. Recommended: 10-20%." />
            </label>
            <input
              type="number"
              name="cloudCover"
              value={formData.cloudCover}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-xs"
            />
          </div>

          {/* Hot Threshold */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Thermometer className="w-4 h-4" />
              Hot Threshold (°C)
              <Tooltip text="Temperature above which areas are flagged as needing trees (0-60°C). Recommended: 35-40°C." />
            </label>
            <input
              type="number"
              name="hotThreshold"
              value={formData.hotThreshold}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-xs"
            />
          </div>

          {/* Vegetation Threshold */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Leaf className="w-4 h-4" />
              Vegetation Threshold (NDVI)
              <Tooltip text="NDVI value below which areas lack vegetation (0-1). Lower = less vegetation. Recommended: 0.2-0.3." />
            </label>
            <input
              type="number"
              step="0.1"
              name="vegThreshold"
              value={formData.vegThreshold}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-xs"
            />
          </div>

          {/* Analyze Button */}
          <button
            onClick={analyzeHeatIsland}
            disabled={analyzing}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white font-medium py-2 sm:py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Thermometer className="w-4 h-4" />
                Analyze
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}
        {/* Processing Logs */}
        <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-2 max-h-24 sm:max-h-32 overflow-y-auto">
          <h3 className="text-xs font-semibold text-slate-700 mb-1">Log</h3>
          <div className="space-y-0.5">
            {logs.length === 0 && (
              <div className="text-xs text-slate-400">
                Waiting for logs...
              </div>
            )}
            {logs.length > 0 &&
              logs.map((log, i) => (
                <div key={i} className="text-xs text-slate-600">
                  <span className="text-slate-400 text-xs">{log.time}</span>
                  {" "}–{" "}
                  {log.message}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationPanel;
