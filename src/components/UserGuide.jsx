import { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";

const UserGuide = () => {
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (showGuide) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showGuide]);

  return (
    <>
      {/* Guide Button */}
      <button
        onClick={() => setShowGuide(true)}
        className="flex items-center gap-1 px-2 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm font-semibold bg-blue-50 hover:bg-blue-100 text-blue-600 whitespace-nowrap"
      >
        <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">Guide</span>
        <span className="sm:hidden">Guide</span>
      </button>

      {/* Guide Model */}
      {showGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl h-[700px] overflow-y-auto flex flex-col">
            <div className="sticky top-0 p-4 border-b border-slate-200 flex items-center justify-between bg-white">
              <h2 className="text-xl font-bold text-slate-900">Guide</h2>
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
                    <p className="font-semibold text-slate-900 mb-1">2. Set Analysis Period</p>
                    <p>Choose start and end dates. For best results, use summer months when heat islands are most pronounced.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">3. Adjust Thresholds (Optional)</p>
                    <p>Modify cloud cover, hot threshold, and vegetation threshold if needed. Default values work well for most cases. Lower hot threshold = more areas flagged as needing trees.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">4. Click Analyze</p>
                    <p>Click the green "Analyze" button. The tool will process satellite data and show real-time progress in the logs panel. Analysis typically takes 2-10 minutes depending on area size.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">5. View Results</p>
                    <p>Once complete, you'll see: a heat map showing temperature distribution, summary statistics, priority zones list, and temperature range visualization.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">6. Explore Priority Zones</p>
                    <p>Click on any priority zone to open it in Google Maps. This shows the exact location where tree planting would have the most impact.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">7. Download Map (Optional)</p>
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
    </>
  );
};

export default UserGuide;
