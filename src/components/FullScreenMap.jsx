import { useRef, useEffect } from 'react';
import { Maximize2 } from 'lucide-react';

const FullScreenMap = ({ results, fullscreenMap, setFullscreenMap, locationName }) => {
  const fullscreenMapRef = useRef(null);

  useEffect(() => {
    if (results?.mapHtml && fullscreenMap && fullscreenMapRef.current) {
      fullscreenMapRef.current.innerHTML = results.mapHtml;
    }
  }, [results?.mapHtml, fullscreenMap]);

  useEffect(() => {
    if (fullscreenMap) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [fullscreenMap]);

  return (
    <>
      <button 
        onClick={() => setFullscreenMap(true)}
        disabled={!results?.mapHtml}
        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium disabled:text-slate-400"
      >
        <Maximize2 className="w-3 h-3" />
        Fullscreen  
      </button>
      
      {fullscreenMap && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col p-0 sm:p-4">
          <style>{`
            #fullscreen-map-container {
              flex: 1;
              overflow: hidden !important;
              width: 100% !important;
              height: 100% !important;
            }
            #fullscreen-map-container * {
              width: 100% !important;
              height: 100% !important;
            }
            #fullscreen-map-container .leaflet-container {
              width: 100% !important;
              height: 100% !important;
            }
            #fullscreen-map-container .leaflet-pane {
              width: 100% !important;
              height: 100% !important;
            }
            #fullscreen-map-container iframe {
              width: 100% !important;
              height: 100% !important;
            }
          `}</style>
          <div className="bg-white rounded-none sm:rounded-xl w-full h-full sm:w-full sm:max-w-6xl sm:max-h-screen sm:rounded-xl flex flex-col sm:m-auto">
            <div className="sticky top-0 z-10 p-3 sm:p-4 border-b border-slate-200 flex items-center justify-between bg-white flex-shrink-0">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 truncate flex-1">Heat Map -
              {locationName && (
                <span className="text-xs text-blue-600 px-2 py-1">{locationName}</span>
              )}
              </h3>
              <button 
                onClick={() => setFullscreenMap(false)}
                className="text-slate-500 hover:text-slate-700 text-2xl sm:text-3xl flex-shrink-0 ml-2"
              >
                ×
              </button>
            </div>
            <div id="fullscreen-map-container" className="flex-1 overflow-hidden w-full">
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
    </>
  );
};

export default FullScreenMap;
