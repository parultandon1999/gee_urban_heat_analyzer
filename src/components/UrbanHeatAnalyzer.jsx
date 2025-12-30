import { useState, useRef, useEffect } from 'react';
import { 
  Locate, 
  Thermometer, 
  Cloud, 
  Calendar, 
  Leaf, 
  AlertCircle, 
  Loader2, 
  Download, 
  ExternalLink, 
  Maximize2, 
  BookOpen,
  Database
} from 'lucide-react';

import { analyzeHeatIsland as callAnalyzeAPI, healthCheck, downloadMap } from '../services/api';

const UrbanHeatAnalyzer = () => {
  const [formData, setFormData] = useState({
    latitude: '29.518321',
    longitude: '74.993558',
    cityName: 'Sirsa',
    startDate: '2025-05-29',
    endDate: '2025-08-30',
    cloudCover: '20',
    hotThreshold: '37',
    vegThreshold: '0.2',
    geeProjectId: 'gen-lang-client-0612311786',
    dataset: 'LANDSAT/LC09/C02/T1_L2'
  });
  
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showGuide, setShowGuide] = useState(false);
  const [fullscreenMap, setFullscreenMap] = useState(false);
  const fullscreenMapRef = useRef(null);
  const mapContainerRef = useRef(null);

  useEffect(() => {
    if (results?.mapHtml && mapContainerRef.current) {
      mapContainerRef.current.innerHTML = results.mapHtml;
    }
  }, [results?.mapHtml]);

  useEffect(() => {
    if (results?.mapHtml && fullscreenMap && fullscreenMapRef.current) {
      fullscreenMapRef.current.innerHTML = results.mapHtml;
    }
  }, [results?.mapHtml, fullscreenMap]);

  useEffect(() => {
    if (fullscreenMap || showGuide) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [fullscreenMap, showGuide]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add log message
  const addLog = (message) => {
    setLogs(prev => [...prev, { 
      time: new Date().toLocaleTimeString(), 
      message 
    }]);
  };

  // Analyze heat island
  const analyzeHeatIsland = async () => {
    setAnalyzing(true);
    setError(null);
    setLogs([]);
    setResults(null);
    
    try {
      // Check backend connection
      const isHealthy = await healthCheck();
      if (!isHealthy) {
        throw new Error('Backend server is not running. Start it with: python app.py');
      }
      
      // Prepare parameters
      const parameters = {
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        cityName: formData.cityName,
        startDate: formData.startDate,
        endDate: formData.endDate,
        cloudCover: parseInt(formData.cloudCover),
        hotThreshold: parseFloat(formData.hotThreshold),
        vegThreshold: parseFloat(formData.vegThreshold),
        geeProjectId: formData.geeProjectId,
        dataset: formData.dataset.trim()
      };
      
      // Call backend API with real-time log streaming
      const response = await callAnalyzeAPI(parameters, (log) => {
        // This callback is called for each log message from backend
        setLogs(prev => [...prev, { 
          time: new Date().toLocaleTimeString(), 
          message: log
        }]);
      });
      
      if (response.success) {
        setResults(response);
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

  // Open location in Google Maps
  const openInMaps = (lat, lon) => {
    window.open(`https://www.google.com/maps?q=${lat},${lon}`, '_blank');
  };

  // Download map HTML file
  const handleDownloadMap = async () => {
    try {
      if (!results || !results.mapFileName) {
        setError('Map file not available');
        return;
      }
      await downloadMap(results.mapFileName);
    } catch (err) {
      setError('Failed to download map: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-slate-200 shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="p-1.5 rounded-lg bg-green-400 border-b border-slate-900 flex-shrink-0">
                <Leaf className="w-5 h-5 sm:w-6 sm:h-6 text-gray" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-slate-900 truncate">Urban Heat Island Analyzer</h1>
                <p className="text-xs text-slate-600 truncate">AI-Powered Tree Planting Location Finder</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto flex-wrap">
              <button
                type="button"
                onClick={() =>
                  window.open(
                    "https://developers.google.com/earth-engine/datasets",
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
                className="flex items-center gap-1 px-2 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm font-semibold bg-blue-50 hover:bg-blue-100 text-blue-600 whitespace-nowrap"
              >
                <Database className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Browse datasets</span>
                <span className="sm:hidden">Datasets</span>
              </button>
              <button
                onClick={() => setShowGuide(true)}
                className="flex items-center gap-1 px-2 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm font-semibold bg-blue-50 hover:bg-blue-100 text-blue-600 whitespace-nowrap"
              >
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Guide</span>
                <span className="sm:hidden">Help</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-3">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 sm:gap-3">
          
          {/* Configuration Panel - Left Side */}
          <div className="lg:col-span-1">
            <div className="bg-white border-slate-200 rounded-xl shadow-sm border p-3 sm:p-5">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">Analysis Configuration</h2>
              
              <div className="space-y-2">
                {/* Location Section */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <Locate className="w-4 h-4" />
                    Location
                  </label>
                  <input
                    type="text"
                    name="cityName"
                    value={formData.cityName}
                    onChange={handleInputChange}
                    placeholder="City Name"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-xs mb-2"
                  />
                  <div className="grid grid-cols-2 gap-2">
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

                {/* GEE Project ID */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <Cloud className="w-4 h-4" />
                    GEE Project ID
                  </label>
                  <input
                    type="text"
                    name="geeProjectId"
                    value={formData.geeProjectId}
                    onChange={handleInputChange}
                    placeholder="Google Earth Engine Project ID"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-xs"
                  />
                </div>
                {/* Dataset */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <Cloud className="w-4 h-4" />
                    Dataset
                  </label>
                  <input
                    type="text"
                    name="dataset"
                    value={formData.dataset}
                    onChange={handleInputChange}
                    placeholder="e.g., LANDSAT/LC09/C02/T1_L2"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-xs"
                  />
                </div>

                {/* Date Range */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <Calendar className="w-4 h-4" />
                    Analysis Period
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-xs"
                    />
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-xs"
                    />
                  </div>
                </div>

                {/* Cloud Cover Threshold */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <Cloud className="w-4 h-4" />
                    Cloud Cover Threshold (%)
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

          {/* Results Panel - Right Side */}
          <div className="lg:col-span-3">
            <div className="space-y-2">
              {/* Container 1: Heat Map */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-2 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Heat Map</h3>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setFullscreenMap(true)}
                        disabled={!results?.mapHtml}
                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium disabled:text-slate-400"
                      >
                        <Maximize2 className="w-3 h-3" />
                        Fullscreen
                      </button>
                      <button 
                        onClick={handleDownloadMap}
                        disabled={!results?.mapFileName}
                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium disabled:text-slate-400"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                    </div>
                </div>
                <div className="w-full h-48 sm:h-64 bg-slate-50 flex items-center justify-center overflow-hidden">
                  {results?.mapHtml ? (
                    <div 
                      ref={mapContainerRef}
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="text-center">
                      <Leaf className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">
                        {analyzing ? 'Generating map...' : 'Map will appear here'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Container 2: Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-600">Hotspots</span>
                    <Locate className="w-4 h-4 text-red-500" />
                  </div>
                  <p className="text-lg font-bold text-slate-900">
                    {results?.hotspotsFound || '-'}
                  </p>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-600">Zones</span>
                    <Leaf className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-lg font-bold text-slate-900">
                    {results?.clusters || '-'}
                  </p>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-600">Avg Temp</span>
                    <Thermometer className="w-4 h-4 text-orange-500" />
                  </div>
                  <p className="text-lg font-bold text-slate-900">
                    {results?.avgTemperature ? `${results.avgTemperature}°C` : '-'}
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-600">Max Temp</span>
                    <Thermometer className="w-4 h-4 text-red-500" />
                  </div>
                  <p className="text-lg font-bold text-slate-900">
                    {results?.maxTemperature ? `${results.maxTemperature}°C` : '-'}
                  </p>
                </div>
              </div>

              {/* Container 3: Priority Zones */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Priority Zones</h3>
                <div className="space-y-1 max-h-32 sm:max-h-40 overflow-y-auto">
                  {results?.priorityZones && results.priorityZones.length > 0 ? (
                    results.priorityZones.map((zone) => (
                      <div
                        key={zone.id}
                        className="border border-slate-200 rounded-lg p-2 hover:border-green-500 hover:bg-green-50 transition-all cursor-pointer"
                        onClick={() => openInMaps(zone.lat, zone.lon)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="bg-green-100 text-green-700 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs">
                              {zone.id}
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900 text-xs">Zone {zone.id}</h4>
                              <p className="text-xs text-slate-600">
                                {zone.lat.toFixed(4)}, {zone.lon.toFixed(4)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right flex items-center gap-2">
                            <div>
                              <p className="text-xs text-slate-600">Temp</p>
                              <p className="font-semibold text-orange-600 text-xs">{zone.temp}°C</p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-slate-400" />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-xs text-slate-400">
                        {analyzing ? 'Finding priority zones...' : 'Zones will appear here'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Container 4: Temperature Range */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Temperature Range</h3>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Min</span>
                    <span className="font-semibold text-blue-600">
                      {results?.minTemperature ? `${results.minTemperature}°C` : '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Avg</span>
                    <span className="font-semibold text-orange-600">
                      {results?.avgTemperature ? `${results.avgTemperature}°C` : '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Max</span>
                    <span className="font-semibold text-red-600">
                      {results?.maxTemperature ? `${results.maxTemperature}°C` : '-'}
                    </span>
                  </div>
                  
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <div className="h-2 bg-gradient-to-r from-blue-400 via-yellow-400 via-orange-500 to-red-600 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {fullscreenMap && (
          <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full h-full max-w-6xl max-h-screen flex flex-col">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Heat Map - Fullscreen</h3>
                <button 
                  onClick={() => setFullscreenMap(false)}
                  className="text-slate-500 hover:text-slate-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                {results?.mapHtml && (
                  <div 
                    ref={fullscreenMapRef}
                    className="w-full h-full"
                  />
                )}
              </div>
            </div>
          </div>
        )}
        {showGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-screen overflow-y-auto flex flex-col">
            <div className="sticky top-0 p-4 border-b border-slate-200 flex items-center justify-between bg-white">
              <h2 className="text-xl font-bold text-slate-900">Urban Heat Island Analyzer - Guide</h2>
              <button 
                onClick={() => setShowGuide(false)}
                className="text-slate-500 hover:text-slate-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* What is Urban Heat Island */}
              <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">What is Urban Heat Island?</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  An Urban Heat Island (UHI) is when cities become significantly warmer than surrounding rural areas. This happens because buildings, roads, and concrete absorb and trap heat from the sun. Unlike forests and vegetation that cool the air through shade and evaporation, urban areas lack these natural cooling systems. This temperature difference can be 1-7°C higher in cities, making summers hotter and increasing energy costs for cooling.
                </p>
              </section>

              {/* Why Does It Matter */}
              <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Why Does It Matter?</h3>
                <ul className="text-sm text-slate-700 space-y-2">
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span><strong>Health:</strong> Higher temperatures increase heat-related illnesses and deaths, especially for elderly and vulnerable people.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span><strong>Energy:</strong> Air conditioning usage increases, raising electricity bills and carbon emissions.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span><strong>Environment:</strong> Higher temperatures stress ecosystems and reduce air quality.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span><strong>Solution:</strong> Planting trees and vegetation cools cities naturally through shade and evaporation.</span>
                  </li>
                </ul>
              </section>

              {/* How This Tool Works */}
              <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">How This Tool Works</h3>
                <div className="space-y-3 text-sm text-slate-700">
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Step 1: Satellite Data Collection</p>
                    <p>The tool uses Google Earth Engine to access satellite images. You can choose from multiple datasets (Landsat 9, Landsat 8, Sentinel-2, MODIS). These images show the Earth's surface temperature and vegetation coverage for your chosen location and time period.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Step 2: Cloud Filtering</p>
                    <p>Satellite images often contain clouds. The tool filters out images with too much cloud cover based on your threshold setting. This ensures you get clear, usable data for analysis.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Step 3: Temperature Analysis (LST)</p>
                    <p>Land Surface Temperature (LST) is calculated from satellite data. It shows which areas are hottest. Areas with concrete and buildings have high LST, while areas with trees and water have low LST.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Step 4: Vegetation Mapping (NDVI)</p>
                    <p>NDVI (Normalized Difference Vegetation Index) measures how much vegetation exists. Green areas have high NDVI, while concrete and buildings have low NDVI. This helps identify areas lacking trees.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Step 5: Finding Hotspots</p>
                    <p>The tool identifies areas that are both hot (high LST) and have little vegetation (low NDVI). These are the best places to plant trees for maximum cooling impact.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Step 6: Clustering & Prioritization</p>
                    <p>Using K-Means clustering, similar hotspots are grouped together into priority zones. The zones are ranked by temperature and vegetation deficit, showing where tree planting would have the most impact.</p>
                  </div>
                </div>
              </section>

              {/* Configuration Guide */}
              <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Configuration Guide</h3>
                <div className="space-y-3 text-sm text-slate-700">
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Location</p>
                    <p><strong>City Name:</strong> Name of the city you're analyzing. <strong>Latitude/Longitude:</strong> Geographic coordinates. Find these on Google Maps by right-clicking on a location.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">GEE Project ID</p>
                    <p>Your Google Earth Engine project ID. Get this from your GEE account at console.earthengine.google.com</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Dataset</p>
                    <p>Choose which satellite dataset to use. Examples: <strong>LANDSAT/LC09/C02/T1_L2</strong> (Landsat 9, recommended), <strong>COPERNICUS/S2_SR_HARMONIZED</strong> (Sentinel-2), <strong>MODIS/061/MOD11A2</strong> (MODIS). Different datasets have different resolutions and coverage.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Analysis Period</p>
                    <p>Choose start and end dates (7-365 days apart). Summer months (May-August) are best for seeing heat island effects clearly. Avoid winter months when vegetation is dormant.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Cloud Cover Threshold (%)</p>
                    <p>Maximum cloud cover to accept (0-100%). Lower values = clearer images but fewer options. Recommended: 10-20%. Default: 20%.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Hot Threshold (°C)</p>
                    <p>Temperature above which areas are considered "hot" (0-60°C). Areas hotter than this are flagged as needing trees. Recommended: 35-40°C. Default: 37°C.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Vegetation Threshold (NDVI)</p>
                    <p>NDVI value below which areas lack vegetation (0-1). Areas with NDVI below this are considered bare. Recommended: 0.2-0.3. Default: 0.2.</p>
                  </div>
                </div>
              </section>

              {/* How to Use */}
              <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Step-by-Step Usage</h3>
                <div className="space-y-3 text-sm text-slate-700">
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">1. Enter Location Details</p>
                    <p>Fill in the city name and coordinates. You can find coordinates on Google Maps by right-clicking and selecting the coordinates.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">2. Configure GEE Settings</p>
                    <p>Enter your GEE Project ID and choose a dataset. If unsure, use the default Landsat 9 dataset.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">3. Set Analysis Period</p>
                    <p>Choose start and end dates. For best results, use summer months when heat islands are most pronounced.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">4. Adjust Thresholds (Optional)</p>
                    <p>Modify cloud cover, hot threshold, and vegetation threshold if needed. Default values work well for most cases. Lower hot threshold = more areas flagged as needing trees.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">5. Click Analyze</p>
                    <p>Click the green "Analyze" button. The tool will process satellite data and show real-time progress in the logs panel. Analysis typically takes 2-10 minutes depending on area size.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">6. View Results</p>
                    <p>Once complete, you'll see: a heat map showing temperature distribution, summary statistics, priority zones list, and temperature range visualization.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">7. Explore Priority Zones</p>
                    <p>Click on any priority zone to open it in Google Maps. This shows the exact location where tree planting would have the most impact.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">8. Download Map (Optional)</p>
                    <p>Click "Download" to save the heat map as an HTML file. You can share this with others or use it in presentations.</p>
                  </div>
                </div>
              </section>

              {/* Understanding Results */}
              <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Understanding Your Results</h3>
                <div className="space-y-3 text-sm text-slate-700">
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Summary Cards</p>
                    <p><strong>Hotspots:</strong> Number of pixels identified as needing trees. <strong>Zones:</strong> Number of priority clusters. <strong>Avg Temp:</strong> Average temperature across the area. <strong>Max Temp:</strong> Highest temperature found.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Heat Map Colors</p>
                    <p><strong>Red:</strong> Hottest areas with no vegetation - highest priority for planting. <strong>Orange:</strong> Hot areas - good for planting. <strong>Yellow:</strong> Warm areas with some vegetation. <strong>Green:</strong> Cool areas with good vegetation. <strong>Blue:</strong> Coolest areas (water/forests).</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Priority Zones</p>
                    <p>Each zone shows: Zone ID, center coordinates, average temperature, and number of hotspot pixels. Zones are ranked by impact - top zones have the highest temperature and lowest vegetation.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Temperature Range</p>
                    <p>Shows minimum, average, and maximum temperatures found. The gradient bar visualizes the temperature scale from cool (blue) to hot (red).</p>
                  </div>
                </div>
              </section>

              {/* Real-Time Logs */}
              <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Real-Time Logs</h3>
                <p className="text-sm text-slate-700 mb-2">The logs panel shows real-time progress of your analysis:</p>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>Starting analysis:</strong> Analysis has begun</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>Fetching data:</strong> Downloading satellite imagery</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>Calculating NDVI/LST:</strong> Processing temperature and vegetation data</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>Extracting hotspots:</strong> Finding areas needing trees</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>K-Means clustering:</strong> Grouping similar hotspots</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>Generating map:</strong> Creating interactive visualization</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>Analysis complete:</strong> Results ready to view</span>
                  </li>
                </ul>
              </section>

              {/* Tips for Best Results */}
              <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Tips for Best Results</h3>
                <ul className="text-sm text-slate-700 space-y-2">
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span><strong>Use summer months:</strong> May-August shows clearest heat island patterns when cities are hottest.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span><strong>Lower cloud cover:</strong> Use 10-20% cloud cover threshold for clearer satellite images.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span><strong>Analyze larger areas:</strong> Cities show better patterns than small neighborhoods.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span><strong>Compare datasets:</strong> Try different satellite datasets to see which works best for your area.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span><strong>Adjust thresholds:</strong> If results seem off, try different temperature or vegetation thresholds.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span><strong>Compare over time:</strong> Run analysis for different years to see how urban heat changes.</span>
                  </li>
                </ul>
              </section>

              {/* Supported Datasets */}
              <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Supported Satellite Datasets</h3>
                <div className="space-y-2 text-sm text-slate-700">
                  <p><strong>Landsat 9 (Recommended):</strong> LANDSAT/LC09/C02/T1_L2 - 30m resolution, thermal bands, latest data</p>
                  <p><strong>Landsat 8:</strong> LANDSAT/LC08/C02/T1_L2 - 30m resolution, thermal bands, historical data</p>
                  <p><strong>Sentinel-2:</strong> COPERNICUS/S2_SR_HARMONIZED - 10m resolution, no thermal, high detail</p>
                  <p><strong>MODIS:</strong> MODIS/061/MOD11A2 - 1km resolution, global coverage, daily updates</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
};

export default UrbanHeatAnalyzer;