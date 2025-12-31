import { useState, useRef, useEffect } from 'react';
import Navbar from './Navbar.jsx';
import ConfigurationPanel from './ConfigurationPanel.jsx';
import ResultsPanel from './ResultsPanel.jsx';

const UrbanHeatAnalyzer = () => {
  const [formData, setFormData] = useState({
    latitude: '29.518321',
    longitude: '74.993558',
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
  const mapContainerRef = useRef(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar></Navbar>
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-3">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 sm:gap-3">
          <ConfigurationPanel 
            formData={formData}
            setFormData={setFormData}
            analyzing={analyzing}
            setAnalyzing={setAnalyzing}
            error={error}
            setError={setError}
            logs={logs}
            setLogs={setLogs}
            setResults={setResults}
          />
          <ResultsPanel 
            results={results} 
            analyzing={analyzing} 
            mapContainerRef={mapContainerRef}
          />
        </div>
      </main>
    </div>
  );
};

export default UrbanHeatAnalyzer;