from flask import Flask, request, jsonify, send_file, Response, stream_with_context
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import ee
import geemap
from sklearn.cluster import KMeans
import folium
import os
from dotenv import load_dotenv
import io
import base64
from contextlib import contextmanager
import queue
import threading
import uuid
from datetime import datetime
import json
from werkzeug.routing import BaseConverter

load_dotenv()


class FilenameConverter(BaseConverter):
    regex = r'[^/]+'


app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

app.url_map.converters['filename'] = FilenameConverter


# Global dictionary to store log queues for each analysis session
analysis_sessions = {}
sessions_lock = threading.Lock()

def get_session_id():
    """Generate unique session ID"""
    return str(uuid.uuid4())

def stream_log(session_id, message):
    """Add message to session's log queue"""
    with sessions_lock:
        if session_id in analysis_sessions:
            timestamp = datetime.now().strftime("%H:%M:%S")
            log_entry = f"[{timestamp}] {message}"
            analysis_sessions[session_id]['logs'].put(log_entry)
    print(message)  # Also print to console

# Configuration
GEE_PROJECT_ID = os.getenv("GEE_PROJECT_ID", "gen-lang-client-0612311886")

# ratelimiting 
limiter = Limiter(
    app = app,
    key_func = get_remote_address,
    default_limits = ["200 per day", "50 per hour"]
)

#################################################################
#######  THIS AUTHENTICATION IS FOR DEPLOYEMENT SERVER  #########
#######  YOU MUST COMMENT IT WHILE WORKING WITH LOCAL  ##########
#################################################################
# Initialize Earth Engine once at startup
def authenticate_gee(project_id):
    project_id = str(project_id)
    try:
        ee.Initialize()
        print("Google Earth Engine already initialized")
        return True
    except Exception as e:
        print(f"Initial initialization failed: {e}")
        
    try:
        print("Attempting to authenticate Google Earth Engine with service account...")
        
        # Try to use service account credentials from environment
        service_account_json = os.getenv("GEE_SERVICE_ACCOUNT_JSON")
        
        if service_account_json:
            print("Found GEE_SERVICE_ACCOUNT_JSON environment variable")
            try:
                import json
                from google.oauth2 import service_account
                
                # Parse the JSON string
                credentials_dict = json.loads(service_account_json)
                
                # Create credentials from the dict
                credentials = service_account.Credentials.from_service_account_info(
                    credentials_dict,
                    scopes=['https://www.googleapis.com/auth/earthengine']
                )
                
                ee.Initialize(credentials, project=project_id)
                print("Successfully authenticated to Google Earth Engine with service account")
                return True
            except json.JSONDecodeError as je:
                print(f"JSON decode error in service account: {je}")
                raise
            except Exception as se:
                print(f"Service account authentication error: {se}")
                raise
        else:
            print("No GEE_SERVICE_ACCOUNT_JSON found in environment variables")
            print("Available env vars:", [k for k in os.environ.keys() if 'GEE' in k or 'GOOGLE' in k])
            raise RuntimeError("GEE_SERVICE_ACCOUNT_JSON not set in environment")
                
    except Exception as auth_error:
        print(f"GEE authentication failed: {auth_error}")
        import traceback
        traceback.print_exc()
        raise RuntimeError(f"Failed to authenticate with GEE: {auth_error}")

try:
    authenticate_gee(GEE_PROJECT_ID)
    GEE_INITIALIZED = True
except Exception as e:
    print(f"GEE authentication failed at startup: {e}\n")
    GEE_INITIALIZED = False


#######################################################################
#######  THIS AUTHENTICATION IS FOR PC LOCAL SERVER      ##############
#######  YOU MUST COMMENT IT WHILE WORKING WITH DEPLOYEMENT  ##########
#######################################################################

# # Initialize Earth Engine once at startup
# def authenticate_gee(project_id):
#     project_id = str(project_id)
#     try:
#         ee.Initialize()
#         print("Google Earth Engine already initialized")
#         return True
#     except Exception as e:
#         print(f"Initial initialization failed: {e}")
        
#     try:
#         print("Attempting to authenticate Google Earth Engine...")
#         ee.Authenticate()
#         ee.Initialize(project=project_id)
#         print("Successfully authenticated to Google Earth Engine")
#         return True
#     except Exception as auth_error:
#         print(f"GEE authentication failed: {auth_error}")
#         import traceback
#         traceback.print_exc()
#         raise RuntimeError(f"Failed to authenticate with GEE: {auth_error}")

# try:
#     authenticate_gee(GEE_PROJECT_ID)
#     GEE_INITIALIZED = True
# except Exception as e:
#     print(f"GEE authentication failed at startup: {e}\n")
#     GEE_INITIALIZED = False

def validate_coordinates(latitude, longitude):
    if not (-90 <= latitude <= 90):
        raise ValueError(f"Latitude must be between -90 to 90 got {latitude}")
    if not (-180 <= longitude <= 180):
        raise ValueError(f"Longitude must be between -180 and 180, got {longitude}")
    
    return True

def validate_dates(start_date, end_date):
    from datetime import datetime
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")

        if start >= end:
            raise ValueError("Start date must be before end date")
        days_diff = (end - start).days
        if days_diff > 365:
            raise ValueError("Date range cannot exceed 365 days")
        if days_diff < 7:
            raise ValueError("Date range must be at least 7 days")
        
        return True
    except ValueError as e:
        raise ValueError(f"Invalid date format or range: {e}")
        
def validate_thresholds(cloude_cover, hot_threshold, veg_threshold):
    if not (0 <= cloud_cover <= 100):
        raise ValueError(f"Cloude cover must be 0-100%, got {cloude_cover}")
    if not (0 <= hot_threshold <= 60):
        raise ValueError(f"Hot threshold must be 0-60°C, got {hot_threshold}")
    if not (0 <= veg_threshold <= 1):
        raise ValueError(f"Veg threshold must be 0-1, got {veg_threshold}")
    
    return True

def validate_dataset(dataset):
    """Validate dataset parameter"""
    if not dataset or not isinstance(dataset, str):
        raise ValueError("Dataset is required and must be a string")
    
    dataset = dataset.strip()
    
    # Check if it looks like a valid GEE dataset path
    if '/' not in dataset:
        raise ValueError("Dataset must be in format: COLLECTION/DATASET (e.g., LANDSAT/LC09/C02/T1_L2)")
    
    return dataset

def get_satellite_data(
    lat,
    lon,
    start,
    end,
    cloud_cover_threshold,
    dataset
):
    point = ee.Geometry.Point(lon, lat)
    
    try:
        # Create image collection from the specified dataset
        collection = ee.ImageCollection(dataset).filterBounds(point).filterDate(start, end)
        
        # Apply cloud cover filter if dataset has CLOUD_COVER property
        try:
            collection = collection.filter(ee.Filter.lt("CLOUD_COVER", cloud_cover_threshold))
        except:
            # Some datasets use different cloud cover property names
            try:
                collection = collection.filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", cloud_cover_threshold))
            except:
                # If no cloud cover property, just proceed without filtering
                pass
        
        # Sort by cloud cover if available
        try:
            collection = collection.sort("CLOUD_COVER")
        except:
            try:
                collection = collection.sort("CLOUDY_PIXEL_PERCENTAGE")
            except:
                pass
        
        image = collection.first()
        if image is None:
            raise ValueError(f"No imagery found in dataset '{dataset}' for the given location and date range.")
        
        return image
        
    except Exception as e:
        raise ValueError(f"Error accessing dataset '{dataset}': {str(e)}")

def calculate_ndvi_lst(image, dataset):
    try:
        # Try Landsat bands first (most common)
        if 'LANDSAT' in dataset.upper():
            ndvi = image.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI')
            thermal = (
                image.select('ST_B10')
                .multiply(0.00341802)
                .add(149.0)
                .subtract(273.15)
                .rename('LST_Celsius')
            )
        # Try Sentinel-2 bands
        elif 'SENTINEL' in dataset.upper() or 'S2' in dataset.upper():
            ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI')
            # Sentinel-2 doesn't have thermal, use NDVI as proxy
            thermal = ndvi.multiply(-50).add(50).rename('LST_Celsius')
        # Try MODIS bands
        elif 'MODIS' in dataset.upper():
            ndvi = image.select('NDVI').multiply(0.0001).rename('NDVI')
            thermal = image.select('LST_Day_1km').multiply(0.02).subtract(273.15).rename('LST_Celsius')
        else:
            # Generic approach: try common band names
            try:
                ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI')
            except:
                ndvi = image.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI')
            
            try:
                thermal = image.select('ST_B10').multiply(0.00341802).add(149.0).subtract(273.15).rename('LST_Celsius')
            except:
                thermal = ndvi.multiply(-50).add(50).rename('LST_Celsius')
        
        return image.addBands([ndvi, thermal])
        
    except Exception as e:
        raise Exception(f"Error calculating NDVI/LST for dataset '{dataset}': {str(e)}")

def extract_hotspots(processed_image, roi, hot_threshold, veg_threshold):
    hotspots = processed_image.select('LST_Celsius').gt(hot_threshold) \
        .And(processed_image.select('NDVI').lt(veg_threshold)) \
        .And(processed_image.select('NDVI').gt(0))
    
    final_image = processed_image.updateMask(hotspots)
    
    vectors = final_image.sample(
        region=roi,
        scale=30,
        numPixels=2000,
        geometries=True
    )
    
    return vectors

def add_lat_lon(feature):
    coords = feature.geometry().coordinates()
    return feature.set({
        'lon': coords.get(0),
        'lat': coords.get(1)
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'message': 'Urban Heat Island Analyzer API is running'
    }), 200

@app.route('/api/analyze', methods=['POST'])
@limiter.limit("50 per minute")
def analyze_heat_island():
    try:
        if not GEE_INITIALIZED:
            return jsonify({
                'error': 'Google Earth Engine not initialized. Please try again later.'
            }), 503

        data = request.get_json()
        if not data or not isinstance(data, dict):
            return jsonify({'error': 'Invalid JSON payload'}), 400

        required_fields = ['latitude', 'longitude', 'startDate', 'endDate']
        if not all(field in data for field in required_fields):
            return jsonify({
                'error': 'Missing required fields',
                'required': required_fields
            }), 400

        # Extract and validate coordinates
        try:
            latitude = float(data['latitude'])
            longitude = float(data['longitude'])
            validate_coordinates(latitude, longitude)
        except (ValueError, TypeError) as e:
            return jsonify({'error': f'Invalid coordinates: {str(e)}'}), 400

        # Validate dates
        try:
            start_date = data['startDate']
            end_date = data['endDate']
            validate_dates(start_date, end_date)
        except ValueError as e:
            return jsonify({'error': f'Invalid date format or range: {str(e)}'}), 400

        # Optional parameters with defaults and validation
        try:
            cloud_cover = int(data.get('cloudCover', 20))
            hot_threshold = float(data.get('hotThreshold', 37))
            veg_threshold = float(data.get('vegThreshold', 0.2))
            dataset = data.get('dataset', 'LANDSAT/LC09/C02/T1_L2')

            if cloud_cover < 0 or cloud_cover > 100:
                raise ValueError("cloudCover must be between 0 and 100")
            if hot_threshold < 0:
                raise ValueError("hotThreshold must be >= 0")
            if not (0 <= veg_threshold <= 1):
                raise ValueError("vegThreshold must be between 0 and 1")
            
            dataset = validate_dataset(dataset)
        except (ValueError, TypeError) as e:
            return jsonify({'error': f'Invalid threshold values: {str(e)}'}), 400

        # Create session for this analysis
        session_id = get_session_id()
        with sessions_lock:
            analysis_sessions[session_id] = {
                'logs': queue.Queue(),
                'status': 'running',
                'result': None,
                'error': None
            }
        
        # Start analysis in background thread
        thread = threading.Thread(
            target=_run_analysis,
            args=(
                session_id, latitude, longitude,
                start_date, end_date, cloud_cover,
                hot_threshold, veg_threshold, dataset
            )
        )
        thread.daemon = True
        thread.start()
        
        # Return session ID immediately
        return jsonify({
            'sessionId': session_id,
            'message': 'Analysis started. Connect to /api/logs/<sessionId> to stream logs.'
        }), 202

    except Exception as e:
        print(f"Unexpected error in analyze_heat_island: {str(e)}")
        return jsonify({'error': 'Internal server error during analysis.'}), 500


def _run_analysis(
    session_id,
    latitude,
    longitude,
    start_date,
    end_date, 
    cloud_cover,
    hot_threshold,
    veg_threshold,
    dataset
):
    try:
        stream_log(session_id, "Starting analysis...")
        stream_log(session_id, f"Processing analysis for (lat: {latitude}, lon: {longitude})...")
        stream_log(session_id, f"Using dataset: {dataset}")

        # === Fetch satellite data ===
        try:
            stream_log(session_id, f"Fetching data from {dataset}...")
            raw_image = get_satellite_data(
                latitude,
                longitude,
                start_date,
                end_date,
                cloud_cover,
                dataset
            )
            if raw_image is None:
                raise ValueError('No valid imagery found for the given parameters.')
            stream_log(session_id, "✓ Satellite data retrieved")
        except ValueError as e:
            raise ValueError(f'Invalid parameters for satellite data: {str(e)}')

        # === Calculate NDVI and LST ===
        try:
            stream_log(session_id, "Calculating NDVI (vegetation index)...")
            stream_log(session_id, "Calculating LST (land surface temperature)...")
            processed_image = calculate_ndvi_lst(raw_image, dataset)
            if processed_image is None:
                raise ValueError('Failed to process NDVI/LST from raw imagery.')
            stream_log(session_id, "✓ NDVI and LST calculated")
        except Exception as e:
            raise Exception(f'Error during NDVI/LST calculation: {str(e)}')

        # === Define ROI and extract hotspots ===
        roi = ee.Geometry.Point(longitude, latitude).buffer(5000)

        try:
            stream_log(session_id, "Extracting hotspots (areas with high temperature and low vegetation)...")
            vectors = extract_hotspots(processed_image, roi, hot_threshold, veg_threshold)
            if vectors is None:
                raise ValueError('Hotspot extraction returned no features.')

            vectors_with_coords = vectors.map(add_lat_lon)
            stream_log(session_id, "Converting Earth Engine data to dataframe...")
            df = geemap.ee_to_df(vectors_with_coords)

            if df.empty:
                raise ValueError('No hotspots found with current thresholds. Try lowering hotThreshold or vegThreshold.')

            stream_log(session_id, f"✓ Extracted {len(df)} potential planting sites")
        except Exception as e:
            raise Exception(f'Hotspot extraction failed: {str(e)}')

        # === K-Means clustering ===
        try:
            stream_log(session_id, "Running K-Means clustering to group similar hotspots...")
            X = df[['lat', 'lon']]
            n_clusters = min(5, len(df))
            if n_clusters < 1:
                n_clusters = 1
            kmeans = KMeans(n_clusters=n_clusters, random_state=42)
            df['cluster'] = kmeans.fit_predict(X)
            centers = kmeans.cluster_centers_
            stream_log(session_id, f"✓ Identified {n_clusters} priority zones")

            # === Temperature statistics ===
            stream_log(session_id, "Calculating temperature statistics...")
            lst_data = processed_image.select('LST_Celsius').reduceRegion(
                reducer=ee.Reducer.minMax(),
                geometry=roi,
                scale=30
            ).getInfo()

            min_temp = lst_data.get('LST_Celsius_min', None)
            max_temp = lst_data.get('LST_Celsius_max', None)
            avg_temp = (min_temp + max_temp) / 2 if min_temp and max_temp else None
            stream_log(session_id, f"✓ Temperature range: {min_temp:.1f}°C - {max_temp:.1f}°C")

            # === Build priority zones ===
            stream_log(session_id, "Building priority zones list...")
            priority_zones = []
            for i, center in enumerate(centers):
                lat, lon = center[0], center[1]
                zone_data = df[df['cluster'] == i]

                # each zone with its own temp data
                zone_temps = zone_data.get('LST_Celsius', []) if 'LST_Celsius' in zone_data.columns else []
                zone_avg_temp = zone_temps.mean() if len(zone_temps) > 0 else avg_temp

                priority_zones.append({
                    'id': i + 1,
                    'lat': float(lat),
                    'lon': float(lon),
                    'temp': round(zone_avg_temp, 2) if zone_avg_temp is not None else None,
                    'pointCount': len(zone_data),
                    'area': f"{len(zone_data) * 0.9:.1f} km²"
                })
            stream_log(session_id, "✓ Priority zones created")

        except Exception as e:
            raise Exception(f'Clustering failed: {str(e)}')

        # === Generate Folium map ===
        try:
            stream_log(session_id, "Generating interactive Folium map...")
            m = folium.Map(location=[latitude, longitude], zoom_start=12)

            # Candidate points
            for _, row in df.iterrows():
                folium.CircleMarker(
                    location=[row['lat'], row['lon']],
                    radius=2,
                    color='red',
                    fill=True,
                    fill_opacity=0.6,
                    tooltip="Potential hotspot"
                ).add_to(m)

            # Add priority zones (green markers)
            for i, center in enumerate(centers):
                lat, lon = center[0], center[1]
                maps_url = f"https://www.google.com/maps?q={lat},{lon}"
                
                folium.Marker(
                    location=[lat, lon],
                    popup=(
                        f"<b>Priority Planting Zone #{i+1}</b><br>"
                        f"Center of Heat Cluster<br>"
                        f"<a href='{maps_url}' target='_blank'>"
                        f"({lat:.5f}, {lon:.5f})"
                        f"</a>"
                    ),
                    icon=folium.Icon(color='green', icon='tree', prefix='fa')
                ).add_to(m)

            outfile = f"urban_heat_map_{latitude}_{longitude}.html"
            m.save(outfile)
            stream_log(session_id, f"✓ Map saved as {outfile}")

        except Exception as e:
            raise Exception(f'Map generation failed: {str(e)}')

        map_html = m._repr_html_()

        # === Final result ===
        results = {
            'success': True,
            'hotspotsFound': len(df),
            'clusters': len(centers),
            'minTemperature': round(min_temp, 2) if min_temp is not None else None,
            'maxTemperature': round(max_temp, 2) if max_temp is not None else None,
            'avgTemperature': round(avg_temp, 2) if avg_temp is not None else None,
            'priorityZones': priority_zones,
            'analysisPeriod': {'start': start_date, 'end': end_date},
            'mapHtml': map_html,
            'mapFileName': os.path.basename(outfile) if outfile else None
        }

        stream_log(session_id, "✓ Analysis complete!")
        
        with sessions_lock:
            if session_id in analysis_sessions:
                analysis_sessions[session_id]['status'] = 'completed'
                analysis_sessions[session_id]['result'] = results

    except Exception as e:
        error_msg = str(e)
        stream_log(session_id, f"✗ Analysis failed: {error_msg}")
        with sessions_lock:
            if session_id in analysis_sessions:
                analysis_sessions[session_id]['status'] = 'failed'
                analysis_sessions[session_id]['error'] = error_msg

@app.route('/api/logs/<session_id>')
def stream_logs(session_id):
    def generate():
        sent_logs = set()
        
        while True:
            with sessions_lock:
                if session_id not in analysis_sessions:
                    error_data = json.dumps({'error': 'Session not found'})
                    yield f"data: {error_data}\n\n"
                    break
                
                session = analysis_sessions[session_id]
                
                # Send all new logs
                while not session['logs'].empty():
                    try:
                        log_msg = session['logs'].get_nowait()
                        if log_msg not in sent_logs:
                            sent_logs.add(log_msg)
                            # Create proper JSON for log message
                            log_data = json.dumps({'log': log_msg})
                            yield f"data: {log_data}\n\n"
                    except queue.Empty:
                        break
                
                # Check if analysis is complete
                if session['status'] in ['completed', 'failed']:
                    if session['status'] == 'completed':
                        result_data = json.dumps({
                            'status': 'completed',
                            'result': session['result']
                        })
                        yield f"data: {result_data}\n\n"
                    else:
                        error_data = json.dumps({
                            'status': 'failed',
                            'error': session['error']
                        })
                        yield f"data: {error_data}\n\n"
                    break
            
            # Small delay to prevent busy waiting
            import time
            time.sleep(0.1)
    
    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
            'Connection': 'keep-alive'
        }
    )

@app.route('/api/analysis-result/<session_id>')
def get_analysis_result(session_id):
    with sessions_lock:
        if session_id not in analysis_sessions:
            return jsonify({'error': 'Session not found'}), 404
        
        session = analysis_sessions[session_id]
        
        if session['status'] == 'running':
            return jsonify({'status': 'running'}), 202
        elif session['status'] == 'completed':
            return jsonify(session['result']), 200
        else:  # failed
            return jsonify({'error': session['error']}), 500

@app.route('/api/parameters', methods=['GET'])
def get_default_parameters():
    return jsonify({
        'latitude': 29.518321,
        'longitude': 74.993558,
        'startDate': '2025-05-29',
        'endDate': '2025-08-30',
        'cloudCover': 20,
        'hotThreshold': 37,
        'vegThreshold': 0.2,
        'geeProjectId': GEE_PROJECT_ID,
        'dataset': 'LANDSAT/LC09/C02/T1_L2',
    }), 200

@app.route('/api/download-map/<filename>', methods=['GET'])
def download_map(filename):
    try:
        # Security: only allow downloading files that match expected pattern
        if not filename.startswith(f'urban_heat_map_{latitude}_{longitude}') or not filename.endswith('.html'):
            return jsonify({'error': 'Invalid filename'}), 400
        
        return send_file(
            filename,
            mimetype='text/html',
            as_attachment=True,
            download_name=filename
        )
    except FileNotFoundError:
        return jsonify({'error': 'Map file not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/delete-map/<filename:filename>', methods=['DELETE'])
def delete_map(filename):
    try:
        # Security: only allow deleting files that match expected pattern
        if not filename.startswith('urban_heat_map_') or not filename.endswith('.html'):
            return jsonify({'error': 'Invalid filename'}), 400
        
        if os.path.exists(filename):
            os.remove(filename)
            return jsonify({'success': True, 'message': 'Map file deleted'}), 200
        else:
            return jsonify({'success': True, 'message': 'File not found, but record deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
