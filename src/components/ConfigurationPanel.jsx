import {
  Locate,
  Thermometer,
  Cloud,
  Calendar,
  Leaf,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import { analyzeHeatIsland as callAnalyzeAPI, healthCheck } from '../services/api';

const ConfigurationPanel = ({ 
  formData,
  setFormData, 
  analyzing, 
  setAnalyzing, 
  error, 
  setError, 
  logs, 
  setLogs, 
  setResults 
}) => {
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
        throw new Error('Backend server is not running. Start it with: python app.py');
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
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">Analysis Configuration</h2>
        
        <div className="space-y-2">
          {/* Location Section */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Locate className="w-4 h-4" />
              Location Coordinates
            </label>
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
  );
};

export default ConfigurationPanel;
