# Urban Heat Island Analyzer

An AI-powered tool that identifies urban heat islands and recommends optimal tree planting locations using satellite imagery and machine learning.

## Features

- **Satellite Data Analysis**: Uses Google Earth Engine to access Landsat, Sentinel-2, and MODIS satellite imagery
- **Temperature Mapping**: Calculates Land Surface Temperature (LST) to identify hot zones
- **Vegetation Analysis**: Computes NDVI (Normalized Difference Vegetation Index) to assess vegetation coverage
- **Hotspot Detection**: Identifies areas with high temperature and low vegetation
- **Smart Clustering**: Uses K-Means clustering to group hotspots into priority planting zones
- **Interactive Maps**: Generates Folium-based maps showing priority zones and candidate locations
- **Real-time Logs**: Streams analysis progress with live log updates via Server-Sent Events (SSE)
- **Location Search**: Autocomplete location search using OpenStreetMap Nominatim API
- **Analysis History**: Save and reload previous analyses from browser localStorage
- **Responsive Design**: Mobile-friendly interface with adaptive layouts
- **Download & Share**: Export heat maps as HTML files for presentations and sharing

## Tech Stack

**Frontend:**
- React 19.2.3 with Hooks (useState, useRef, useEffect)
- Tailwind CSS 3.4.19 for responsive styling
- Lucide React icons for UI elements
- Nominatim API for location search and reverse geocoding

**Backend:**
- Flask with Flask-CORS for API endpoints
- Google Earth Engine API for satellite data access
- Geemap for Earth Engine Python integration
- Scikit-learn for K-Means clustering
- Folium for interactive map generation
- Flask-Limiter for rate limiting (50 req/min, 200/day)

**Satellite Data Sources:**
- Landsat 9 (LANDSAT/LC09/C02/T1_L2) - 30m resolution, thermal bands, recommended
- Landsat 8 (LANDSAT/LC08/C02/T1_L2) - 30m resolution, historical data
- Sentinel-2 (COPERNICUS/S2_SR_HARMONIZED) - 10m resolution, no thermal
- MODIS (MODIS/061/MOD11A2) - 1km resolution, global coverage

## Setup

### Prerequisites

- Python 3.8+
- Node.js 16+
- Google Earth Engine account with project ID
- Google Cloud credentials (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd urban-heat-island-analyzer
   ```

2. **Backend Setup**
   ```bash
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   npm install
   ```

4. **Environment Configuration**
   
   Create `.env` file in root:
   ```
   GEE_PROJECT_ID=your-gee-project-id
   ```
   
   Create `.env.local` in root:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   ```

5. **Run the Application**
   
   Terminal 1 - Backend:
   ```bash
   python app.py
   ```
   
   Terminal 2 - Frontend:
   ```bash
   npm start
   ```

## Usage

1. **Enter Location**: Search for a city or enter latitude/longitude coordinates manually
2. **Set Analysis Period**: Choose start and end dates (7-365 days apart, summer months recommended)
3. **Choose Dataset**: Select satellite imagery source (default: Landsat 9)
4. **Adjust Thresholds** (optional):
   - Cloud Cover: 0-100% (default: 20%)
   - Hot Threshold: 0-60°C (default: 37°C)
   - Vegetation Threshold: 0-1 NDVI (default: 0.2)
5. **Click Analyze**: Start processing satellite data
6. **View Results**: 
   - Interactive heat map showing temperature distribution
   - Summary statistics (hotspots, zones, temperatures)
   - Priority zones list with coordinates
   - Temperature range visualization
7. **Explore Zones**: Click any priority zone to open in Google Maps
8. **Download Map**: Export heat map as HTML file for sharing

## Configuration

### Analysis Parameters

- **Cloud Cover Threshold (%)**: Filter out cloudy satellite images. Lower = clearer images but fewer options. Recommended: 10-20%
- **Hot Threshold (°C)**: Temperature above which areas are flagged as needing trees. Recommended: 35-40°C
- **Vegetation Threshold (NDVI)**: NDVI value below which areas lack vegetation. Recommended: 0.2-0.3
- **Dataset**: Choose satellite imagery source based on resolution and coverage needs

### Rate Limiting

- 50 requests per minute per IP
- 200 requests per day per IP
- Prevents excessive Google Earth Engine API usage

## Features in Detail

### Real-Time Analysis Streaming
- Server-Sent Events (SSE) for live log updates
- Background thread processing prevents blocking
- Session-based log queuing with timestamps

### Analysis History
- Automatically saves analyses to browser localStorage
- Quick reload of previous analyses with all parameters
- Download history tracking for exported maps
- Clear history option available

### Mobile Responsive
- Single column layout on mobile
- Location name displays in ConfigurationPanel on mobile
- Heat map location name hides on mobile to save space
- Touch-friendly buttons and inputs

### Location Search
- Autocomplete search using OpenStreetMap Nominatim
- Debounced search (500ms) for performance
- Reverse geocoding to get location names from coordinates
- Manual coordinate input as fallback

## Limitations

- Analysis limited to 365-day periods
- Requires clear satellite imagery (cloud cover filtering)
- Rate limited to 50 requests per minute
- Thermal data availability varies by dataset
- Google Earth Engine API quota limits apply
- Nominatim API has usage policies (1 request/second recommended)

## Troubleshooting

**"Backend server is not running"**
- Ensure Flask backend is running: `python app.py`
- Check that port 5000 is available

**"No locations found" in search**
- Try searching with different keywords
- Use coordinates directly as fallback
- Check internet connection for Nominatim API

**Analysis takes too long**
- Reduce date range (use 7-30 days instead of 365)
- Increase cloud cover threshold to get fewer images
- Try a smaller geographic area

**Map not displaying**
- Check browser console for errors
- Ensure backend analysis completed successfully
- Try downloading the map file instead

## License

MIT


Future Scope

Planned Enhancements

Machine Learning Improvements
- Implement deep learning models (CNN, LSTM) for more accurate temperature prediction
- Train custom models on historical data to improve hotspot detection accuracy
- Add anomaly detection to identify unusual temperature patterns
- Develop predictive models to forecast future heat island growth

Advanced Analysis Features
- Multi-temporal analysis to track heat island changes over years
- Seasonal trend analysis to identify peak heat periods
- Integration of air quality data (PM2.5, NO2) with temperature analysis
- Soil moisture and water body detection for better cooling potential assessment
- Population density mapping to prioritize high-impact planting zones

Enhanced User Experience
- 3D visualization of temperature gradients and terrain
- Comparison tool to analyze multiple cities side-by-side
- Historical data comparison to show UHI progression
- Export analysis reports in PDF format with detailed statistics
- Mobile app for on-field verification and tree planting tracking

Data Integration
- Real-time weather station data integration
- Integration with urban planning databases
- Building footprint and material classification
- Tree species recommendation based on climate and soil conditions
- Cost-benefit analysis for tree planting initiatives

Optimization Algorithms
- Genetic algorithms to optimize tree placement for maximum cooling
- Network analysis to identify connected cooling corridors
- Simulation models to predict temperature reduction after planting
- Resource allocation optimization for planting campaigns

Scalability and Performance
- Distributed processing for large-scale regional analysis
- Caching mechanisms for faster repeated queries
- Database integration for storing historical analysis results
- API rate limit optimization and batch processing support
- Support for real-time streaming satellite data

Community and Collaboration
- User authentication and project sharing capabilities
- Collaborative analysis tools for urban planners and environmental teams
- Integration with citizen science platforms for ground-truth validation
- Public dashboard showing city-wide heat island metrics
- API for third-party integrations with urban planning tools
