import { useState } from "react"
import { Leaf, Database } from "lucide-react"
import UserGuide from './UserGuide.jsx';

const Navbar = () => {
  const [showGuide, setShowGuide] = useState(false);
  return (
    <>
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
              <UserGuide showGuide={showGuide} setShowGuide={setShowGuide} />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export default Navbar;