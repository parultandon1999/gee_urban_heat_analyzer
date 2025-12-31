const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const REQUEST_TIMEOUT = 300000; // 5 minutes for analysis

export const streamAnalysisLogs = (sessionId, onLog, onComplete, onError) => {
  try {
    const eventSource = new EventSource(`${API_BASE_URL}/logs/${sessionId}`);
    let hasCompleted = false;
    
    eventSource.onmessage = (event) => {
      try {
        console.log('Raw event data:', event.data);
        const data = JSON.parse(event.data);
        console.log('Parsed data:', data);
        
        if (data.log) {
          // New log message
          console.log('Received log:', data.log);
          onLog(data.log);
        } else if (data.status === 'completed') {
          // Analysis completed
          if (!hasCompleted) {
            hasCompleted = true;
            console.log('Analysis completed, result:', data.result);
            eventSource.close();
            onComplete(data.result);
          }
        } else if (data.status === 'failed') {
          // Analysis failed
          if (!hasCompleted) {
            hasCompleted = true;
            console.log('Analysis failed:', data.error);
            eventSource.close();
            onError(new Error(data.error || 'Analysis failed'));
          }
        }
      } catch (err) {
        console.error('Error parsing log data:', err, 'Raw data:', event.data);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      eventSource.close();
      if (!hasCompleted) {
        hasCompleted = true;
        onError(new Error('Connection lost while streaming logs'));
      }
    };
    
    // Return function to close the connection
    return () => {
      console.log('Closing EventSource');
      eventSource.close();
    };
    
  } catch (error) {
    console.error('Error in streamAnalysisLogs:', error);
    onError(error);
    return () => {};
  }
};

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

export const searchLocation = async (query) => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'UrbanHeatIslandAnalyzer'
      }
    });
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      return [];
    }
    
    return data.map(result => ({
      name: result.name || result.display_name.split(',')[0],
      fullName: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      type: result.type
    }));
  } catch (error) {
    console.error('Location search error:', error);
    return [];
  }
};

// Helper function to add timeout to fetch
const fetchWithTimeout = (url, options = {}, timeout = REQUEST_TIMEOUT) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
};

const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  backoffMultiplier: 2, // exponential backoff
  retryableStatusCodes: [408, 429, 500, 502, 503, 504] // timeout, rate limit, server errors
};

// Helper function for retry logic
const fetchWithRetry = async (url, options = {}, timeout = REQUEST_TIMEOUT) => {
  let lastError;
  
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, timeout);
      
      // Don't retry on client errors (4xx) except specific ones
      if (!response.ok && !RETRY_CONFIG.retryableStatusCodes.includes(response.status)) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }
      
      if (response.ok) {
        return response;
      }
      
      // If retryable status code, continue to retry
      if (RETRY_CONFIG.retryableStatusCodes.includes(response.status)) {
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
        
        if (attempt < RETRY_CONFIG.maxRetries) {
          const delay = RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1);
          console.log(`Retry attempt ${attempt}/${RETRY_CONFIG.maxRetries} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      return response;
    } catch (error) {
      lastError = error;
      
      // Retry on network errors
      if (attempt < RETRY_CONFIG.maxRetries) {
        const delay = RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1);
        console.log(`Retry attempt ${attempt}/${RETRY_CONFIG.maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }
  
  throw lastError || new Error('Request failed after retries');
};

const validateCoordinates = (latitude, longitude) => {
  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);
  
  if (isNaN(lat) || isNaN(lon)) {
    throw new Error('Latitude and longitude must be valid numbers');
  }
  
  if (lat < -90 || lat > 90) {
    throw new Error('Latitude must be between -90 and 90');
  }
  
  if (lon < -180 || lon > 180) {
    throw new Error('Longitude must be between -180 and 180');
  }
  
  return { lat, lon };
};

const validateDates = (startDate, endDate) => {
  if (!startDate || !endDate) {
    throw new Error('Start date and end date are required');
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date format. Use YYYY-MM-DD');
  }
  
  if (start >= end) {
    throw new Error('Start date must be before end date');
  }
  
  const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
  
  if (daysDiff < 7) {
    throw new Error('Date range must be at least 7 days');
  }
  
  if (daysDiff > 365) {
    throw new Error('Date range cannot exceed 365 days');
  }
  
  return { start, end };
};

const validateThresholds = (cloudCover, hotThreshold, vegThreshold) => {
  const cc = parseInt(cloudCover);
  const ht = parseFloat(hotThreshold);
  const vt = parseFloat(vegThreshold);
  
  if (isNaN(cc) || cc < 0 || cc > 100) {
    throw new Error('Cloud cover must be between 0 and 100%');
  }
  
  if (isNaN(ht) || ht < 0 || ht > 60) {
    throw new Error('Hot threshold must be between 0 and 60°C');
  }
  
  if (isNaN(vt) || vt < 0 || vt > 1) {
    throw new Error('Vegetation threshold must be between 0 and 1');
  }
  
  return { cc, ht, vt };
};

const validateDataset = (dataset) => {
  if (!dataset || dataset.trim().length === 0) {
    throw new Error('Dataset is required');
  }
  
  const trimmedDataset = dataset.trim();
  
  // Check if it looks like a valid GEE dataset path
  if (!trimmedDataset.includes('/')) {
    throw new Error('Dataset must be in format: COLLECTION/DATASET (e.g., LANDSAT/LC09/C02/T1_L2)');
  }
  
  return trimmedDataset;
};

const validateAnalysisParameters = (parameters) => {
  // Validate coordinates
  validateCoordinates(parameters.latitude, parameters.longitude);
  
  // Validate dates
  validateDates(parameters.startDate, parameters.endDate);
  
  // Validate thresholds
  validateThresholds(parameters.cloudCover, parameters.hotThreshold, parameters.vegThreshold);
    
  // Validate dataset
  validateDataset(parameters.dataset);
  
  return true;
};

export const analyzeHeatIsland = async (parameters, onLogUpdate) => {
  try {
    validateAnalysisParameters(parameters);
    
    // Start analysis and get session ID
    const response = await fetchWithRetry(
      `${API_BASE_URL}/analyze`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parameters),
      },
      300000
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}: Analysis failed`);
    }

    const { sessionId } = await response.json();
    
    // Return a promise that resolves when analysis completes
    return new Promise((resolve, reject) => {
      streamAnalysisLogs(
        sessionId,
        (log) => {
          if (onLogUpdate) onLogUpdate(log);
        },
        (result) => {
          resolve(result);
        },
        (error) => {
          reject(error);
        }
      );
    });
    
  } catch (error) {
    if (error.message === 'Request timeout') {
      throw new Error('Analysis took too long. Please try with a smaller area or shorter date range.');
    }
    throw error;
  }
};

export const getDefaultParameters = async () => {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/parameters`,
      {},
      10000 // 10 second timeout
    );
    if (!response.ok) throw new Error('Failed to fetch parameters');
    return await response.json();
  } catch (error) {
    if (error.message === 'Request timeout') {
      throw new Error('Server is not responding. Please check if backend is running.');
    }
    throw error;
  }
};

export const healthCheck = async () => {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/health`,
      {},
      5000 // 5 second timeout
    );
    return response.ok;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};

export const downloadMap = async (filename) => {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/download-map/${filename}`,
      {},
      30000 // 30 second timeout
    );
    
    if (!response.ok) {
      throw new Error('Failed to download map');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    if (error.message === 'Request timeout') {
      throw new Error('Download took too long. Please try again.');
    }
    throw error;
  }
};

export const deleteMapFile = async (filename) => {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/delete-map/${filename}`,
      {
        method: 'DELETE'
      },
      10000
    );
    
    if (!response.ok) {
      throw new Error('Failed to delete map file');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting map file:', error);
    // Don't throw - allow deletion to proceed even if file delete fails
    return { success: true };
  }
};