import { useState, useEffect } from 'react';
import { History, Trash2, Copy, RotateCcw } from 'lucide-react';
import { deleteMapFile } from '../services/api.js';

const AnalysisHistory = ({ onLoadAnalysis }) => {
  const [showHistory, setShowHistory] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [analyses, setAnalyses] = useState([]);

  // Load from localStorage on mount and when modal opens
  useEffect(() => {
    loadHistory();
  }, []);

  // Reload history when modal opens
  useEffect(() => {
    if (showHistory) {
      loadHistory();
    }
  }, [showHistory]);

  const loadHistory = () => {
    const saved = localStorage.getItem('uhi_analysis_history');
    if (saved) {
      setAnalyses(JSON.parse(saved));
    }
  };

  // Prevent body scroll when modal open
  useEffect(() => {
    if (showHistory) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showHistory]);

  // Save to localStorage
  const saveToLocalStorage = (items) => {
    localStorage.setItem('uhi_analysis_history', JSON.stringify(items));
  };

  // Remove analysis
  const removeAnalysis = async (id) => {
    const analysis = analyses.find(a => a.id === id);
    
    // Delete map file if it exists
    if (analysis?.results?.mapFileName) {
      await deleteMapFile(analysis.results.mapFileName);
    }
    
    const updated = analyses.filter(a => a.id !== id);
    setAnalyses(updated);
    saveToLocalStorage(updated);
  };

  // Clear all
  const clearHistory = async () => {
    // Delete all map files
    for (const analysis of analyses) {
      if (analysis?.results?.mapFileName) {
        await deleteMapFile(analysis.results.mapFileName);
      }
    }
    
    setAnalyses([]);
    localStorage.removeItem('uhi_analysis_history');
    setShowClearConfirm(false);
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  // Load analysis
  const loadAnalysis = (analysis) => {
    onLoadAnalysis(analysis);
    setShowHistory(false);
  };

  return (
    <>
      {/* History Button */}
      <button
        onClick={() => setShowHistory(true)}
        className="flex items-center gap-1 px-2 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm font-semibold bg-blue-50 hover:bg-blue-100 text-blue-600 whitespace-nowrap"
      >
        <History className="w-3 h-3 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">History</span>
        <span className="sm:hidden">History</span>
      </button>

      {/* Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl h-[700px] overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="sticky top-0 p-4 border-b border-slate-200 flex items-center justify-between bg-white">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Analysis History</h2>
                <p className="text-xs text-slate-600">{analyses.length} analyses</p>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="text-slate-500 hover:text-slate-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {analyses.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No analyses yet</p>
                </div>
              ) : (
                analyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    className="border border-slate-200 rounded-lg p-3 hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm">
                          {analysis.locationName || analysis.location}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">📍 Lat: {analysis.latitude}, Lon: {analysis.longitude}</p>
                        <p className="text-xs text-slate-600">🛰️ {analysis.dataset}</p>
                        <p className="text-xs text-slate-600">📅 {analysis.startDate} to {analysis.endDate}</p>
                        <p className="text-xs text-slate-600">☁️ Cloud: {analysis.cloudCover}% | 🌡️ Hot: {analysis.hotThreshold}°C | 🌿 Veg: {analysis.vegThreshold}</p>
                        <p className="text-xs text-slate-500 mt-1">Searched: {analysis.searchedAt}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => loadAnalysis(analysis)}
                          className="p-2 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Load analysis"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => copyToClipboard(`${analysis.latitude}, ${analysis.longitude}`)}
                          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Copy coordinates"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeAnalysis(analysis.id)}
                          className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {analyses.length > 0 && (
              <div className="sticky bottom-0 p-4 border-t border-slate-200 bg-white">
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                >
                  Clear All History
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Clear All History?</h3>
              <p className="text-sm text-slate-600 mb-6">
                This will permanently delete all {analyses.length} analysis records from your history. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={clearHistory}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AnalysisHistory;
