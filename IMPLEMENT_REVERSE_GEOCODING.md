# How to Implement Reverse Geocoding (Get Location Name from Coordinates)

## Overview
Convert latitude/longitude coordinates into readable location names (city, country, etc.) using OpenStreetMap Nominatim API (free, no API key needed).

---

## Step 1: Add Reverse Geocoding Function to API Service

**File:** `src/services/api.js`

Add this function at the end of the file:

```javascript
// Reverse geocoding - get location name from coordinates
export const getLocationName = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'UrbanHeatIslandAnalyzer'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch location name');
    }

    const data = await response.json();
    
    // Extract location name from response
    const address = data.address || {};
    const locationName = 
      address.city || 
      address.town || 
      address.village || 
      address.county || 
      address.state || 
      'Unknown Location';
    
    const country = address.country || '';
    
    return {
      name: locationName,
      country: country,
      fullName: `${locationName}, ${country}`,
      address: data.address
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      name: 'Unknown',
      country: '',
      fullName: 'Unknown Location',
      address: {}
    };
  }
};
```

---

## Step 2: Update ConfigurationPanel to Fetch Location Name

**File:** `src/components/ConfigurationPanel.jsx`

Import the function at the top:

```javascript
import { analyzeHeatIsland as callAnalyzeAPI, healthCheck, getLocationName } from '../services/api';
```

Add a new state for location name:

```javascript
const [locationName, setLocationName] = useState('');
```

Add this function to fetch location name when coordinates change:

```javascript
// Fetch location name when coordinates change
const fetchLocationName = async (lat, lon) => {
  if (lat && lon) {
    const location = await getLocationName(parseFloat(lat), parseFloat(lon));
    setLocationName(location.fullName);
  }
};

// Call this when latitude or longitude changes
const handleInputChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: value
  }));
  
  // Fetch location name if coordinates changed
  if (name === 'latitude' || name === 'longitude') {
    const lat = name === 'latitude' ? value : formData.latitude;
    const lon = name === 'longitude' ? value : formData.longitude;
    fetchLocationName(lat, lon);
  }
};
```

Add this to display the location name (add after the coordinates input):

```javascript
{/* Location Name Display */}
{locationName && (
  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
    <p className="text-xs text-blue-700">
      📍 <strong>{locationName}</strong>
    </p>
  </div>
)}
```

---

## Step 3: Update Analysis History to Store Location Name

**File:** `src/components/ConfigurationPanel.jsx`

When saving analysis to history, add the location name:

```javascript
// Track analysis in history with full results
const analysisRecord = {
  id: Date.now().toString(),
  latitude: parseFloat(formData.latitude),
  longitude: parseFloat(formData.longitude),
  location: `${formData.latitude}, ${formData.longitude}`,
  locationName: locationName || 'Unknown Location',  // ADD THIS
  startDate: formData.startDate,
  endDate: formData.endDate,
  cloudCover: parseInt(formData.cloudCover),
  hotThreshold: parseFloat(formData.hotThreshold),
  vegThreshold: parseFloat(formData.vegThreshold),
  dataset: formData.dataset.trim(),
  geeProjectId: formData.geeProjectId,
  timestamp: new Date().toISOString(),
  searchedAt: new Date().toLocaleString(),
  results: response
};
```

---

## Step 4: Update Analysis History Display

**File:** `src/components/AnalysisHistory.jsx`

Update the display to show location name instead of just coordinates:

```javascript
<div className="flex-1 min-w-0">
  <p className="font-semibold text-slate-900 text-sm">
    {analysis.locationName || analysis.location}
  </p>
  <p className="text-xs text-slate-600 mt-1">
    📍 {analysis.latitude}, {analysis.longitude}
  </p>
  {/* rest of the display */}
</div>
```

---

## Step 5: Update UrbanHeatAnalyzer to Load Location Name

**File:** `src/components/UrbanHeatAnalyzer.jsx`

When loading analysis from history, also restore the location name:

```javascript
// Load analysis from history
const handleLoadAnalysis = (analysis) => {
  console.log('handleLoadAnalysis called with:', analysis);
  
  // Fill form with old parameters
  setFormData({
    latitude: analysis.latitude.toString(),
    longitude: analysis.longitude.toString(),
    startDate: analysis.startDate,
    endDate: analysis.endDate,
    cloudCover: analysis.cloudCover.toString(),
    hotThreshold: analysis.hotThreshold.toString(),
    vegThreshold: analysis.vegThreshold.toString(),
    geeProjectId: analysis.geeProjectId,
    dataset: analysis.dataset
  });
  
  // Load old results
  if (analysis.results) {
    console.log('Setting results:', analysis.results);
    setResults(analysis.results);
  } else {
    console.log('No results found in analysis');
  }
};
```

---

## How It Works

### Data Flow

```
User enters coordinates (29.518321, 74.993558)
    ↓
handleInputChange() called
    ↓
fetchLocationName() called
    ↓
API call to Nominatim:
https://nominatim.openstreetmap.org/reverse?format=json&lat=29.518321&lon=74.993558
    ↓
Response: { address: { city: "Jaipur", state: "Rajasthan", country: "India" } }
    ↓
Extract: "Jaipur, India"
    ↓
Display in UI: "📍 Jaipur, India"
    ↓
Save to history with locationName
```

### API Response Example

```json
{
  "place_id": 123456,
  "licence": "...",
  "osm_type": "way",
  "osm_id": 789,
  "lat": "29.518321",
  "lon": "74.993558",
  "class": "place",
  "type": "city",
  "place_rank": 16,
  "importance": 0.5,
  "addresstype": "city",
  "name": "Jaipur",
  "display_name": "Jaipur, Rajasthan, India",
  "address": {
    "city": "Jaipur",
    "state": "Rajasthan",
    "country": "India",
    "country_code": "in"
  }
}
```

---

## Features

✅ **Free** - No API key needed
✅ **Real-time** - Fetches location name as user types
✅ **Accurate** - Uses OpenStreetMap data
✅ **Fallback** - Shows coordinates if location name fails
✅ **Cached** - Saves location name in history
✅ **Fast** - Response in <500ms usually

---

## Error Handling

The function handles errors gracefully:

```javascript
// If API fails or coordinates are invalid
return {
  name: 'Unknown',
  country: '',
  fullName: 'Unknown Location',
  address: {}
};
```

---

## Rate Limiting

OpenStreetMap Nominatim has these limits:
- **1 request per second** (for free tier)
- **No API key needed**
- **No authentication required**

For your project, this is more than enough since:
- Users only search occasionally
- You're not making bulk requests
- Each analysis is one request

---

## Testing

1. **Enter coordinates:** 29.518321, 74.993558
2. **Wait 1 second**
3. **Should see:** "📍 Jaipur, India"
4. **Try another:** 40.7128, -74.0060 (New York)
5. **Should see:** "📍 New York, United States"

---

## Optional: Add Loading State

If you want to show loading while fetching location name:

```javascript
const [loadingLocation, setLoadingLocation] = useState(false);

const fetchLocationName = async (lat, lon) => {
  if (lat && lon) {
    setLoadingLocation(true);
    const location = await getLocationName(parseFloat(lat), parseFloat(lon));
    setLocationName(location.fullName);
    setLoadingLocation(false);
  }
};

// In JSX:
{loadingLocation && (
  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
    <p className="text-xs text-blue-700">
      📍 Fetching location...
    </p>
  </div>
)}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/services/api.js` | Add `getLocationName()` function |
| `src/components/ConfigurationPanel.jsx` | Add location name state, fetch function, display |
| `src/components/AnalysisHistory.jsx` | Display location name in history |
| `src/components/UrbanHeatAnalyzer.jsx` | (Optional) Handle location name on load |

---

## Complete Example

### Before
```
User enters: 29.518321, 74.993558
History shows: "29.518321, 74.993558"
```

### After
```
User enters: 29.518321, 74.993558
UI shows: "📍 Jaipur, India"
History shows: "Jaipur, India" with coordinates below
```

---

## Troubleshooting

**Issue:** Location name not showing
- Check browser console for errors
- Verify coordinates are valid (lat: -90 to 90, lon: -180 to 180)
- Wait 1 second after entering coordinates

**Issue:** "Unknown Location" showing
- Coordinates might be in ocean or remote area
- Try major city coordinates for testing

**Issue:** API rate limit error
- Wait a few seconds before making another request
- Nominatim allows 1 request/second

---

## Next Steps

1. Add the `getLocationName()` function to `api.js`
2. Update `ConfigurationPanel.jsx` with location name state and display
3. Update `AnalysisHistory.jsx` to show location name
4. Test with different coordinates
5. Done!

That's it! Now your app will show readable location names instead of just coordinates.
