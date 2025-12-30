Urban Heat Island Analyzer

An AI-powered tool that identifies urban heat islands and recommends optimal tree planting locations using satellite imagery and machine learning.

Features

- Satellite Data Analysis: Uses Google Earth Engine to access Landsat, Sentinel-2, and MODIS satellite imagery
- Temperature Mapping: Calculates Land Surface Temperature (LST) to identify hot zones
- Vegetation Analysis: Computes NDVI (Normalized Difference Vegetation Index) to assess vegetation coverage
- Hotspot Detection: Identifies areas with high temperature and low vegetation
- Smart Clustering: Uses K-Means clustering to group hotspots into priority planting zones
- Interactive Maps: Generates Folium-based maps showing priority zones and candidate locations
- Real-time Logs: Streams analysis progress with live log updates

Tech Stack

Frontend: React 19, Tailwind CSS, Lucide React icons
Backend: Flask, Google Earth Engine API, scikit-learn
Satellite Data: Landsat 9, Landsat 8, Sentinel-2, MODIS
Mapping: Folium, Geemap

Setup

Prerequisites

- Python 3.8+
- Node.js 16+
- Google Earth Engine account with project ID
- Google Cloud credentials

Usage

1. Enter location coordinates (latitude, longitude) or city name
2. Select analysis period (minimum 7 days, maximum 365 days)
3. Choose satellite dataset (default: Landsat 9)
4. Adjust thresholds for cloud cover, temperature, and vegetation
5. Click Analyze to start processing
6. View results on the interactive map and priority zones list
7. Download the map as HTML file

Configuration

Adjust analysis parameters in the UI:
- Cloud Cover Threshold: Filter out cloudy images (0-100%)
- Hot Threshold: Temperature cutoff for hotspots (0-60°C)
- Vegetation Threshold: NDVI cutoff for vegetation (0-1)
- Dataset: Choose satellite imagery source

Limitations

- Analysis limited to 365-day periods
- Requires clear satellite imagery (cloud cover filtering)
- Rate limited to 50 requests per minute
- Thermal data availability varies by dataset

License

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
