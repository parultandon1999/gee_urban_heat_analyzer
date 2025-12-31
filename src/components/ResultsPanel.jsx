import { useState, useRef, useEffect } from 'react';
import FullScreenMap from './FullScreenMap.jsx'
import { Locate, Thermometer, Leaf, Download, ExternalLink } from 'lucide-react';
import { downloadMap, getLocationName } from '../services/api.js';

const ResultsPanel = ({results, analyzing, mapContainerRef, formData}) => {
  const [fullscreenMap, setFullscreenMap] = useState(false);
  const [error, setError] = useState(null);
  const [locationName, setLocationName] = useState('');

  // Fetch location name when coordinates change
  useEffect(() => {
    if (formData?.latitude && formData?.longitude) {
      const fetchLocation = async () => {
        let locName = 'Unknown Location';
        try {
          const location = await getLocationName(parseFloat(formData.latitude), parseFloat(formData.longitude));
          locName = location.fullName;
        } catch (err) {
          console.error('Error fetching location:', err);
        }
        setLocationName(locName)
      };
      fetchLocation();
    }
  }, [formData?.latitude, formData?.longitude]);

  // Open location in Google Maps
  const openInMaps = (lat, lon) => {
    window.open(`https://www.google.com/maps?q=${lat},${lon}`, '_blank');
  };

  const handleDownloadMap = async () => {
    try {
      if (!results || !results.mapFileName) {
        setError('Map file not available');
        return;
      }
      
      // Download the map
      await downloadMap(results.mapFileName);
      
      // Create download record
      const downloadRecord = {
        id: Date.now().toString(),
        filename: results.mapFileName,
        location: `${formData.latitude}, ${formData.longitude}`,
        dataset: formData.dataset,
        timestamp: new Date().toISOString(),
        downloadedAt: new Date().toLocaleString(),
        analysisDate: `${results.analysisPeriod.start} - ${results.analysisPeriod.end}`
      };
      
      // Save to localStorage
      const existing = JSON.parse(localStorage.getItem('uhi_download_history') || '[]');
      existing.unshift(downloadRecord);
      localStorage.setItem('uhi_download_history', JSON.stringify(existing));
      
    } catch (err) {
      setError('Failed to download map: ' + err.message);
    }
  };

  useEffect(() => {
    if (results?.mapHtml && mapContainerRef.current) {
      mapContainerRef.current.innerHTML = results.mapHtml;
    }
  }, [results?.mapHtml]);

  return(
    <>
      {/* Results Panel - Right Side */}
      <div className="lg:col-span-3">
        <div className="space-y-2">
          {/* Container 1: Heat Map */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-2 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Heat Map</h3>
                {locationName && (
                  <span className="text-xs text-blue-600 px-2 py-1">
                    {locationName}
                  </span>
                )}
              <div className="flex items-center gap-3">
                <FullScreenMap results={results} fullscreenMap={fullscreenMap} setFullscreenMap={setFullscreenMap} />
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
    </>
  )
}

export default ResultsPanel;