/**
 * Test Suite for Reverse Geocoding Feature
 * Tests the getLocationName function from api.js
 */

import { getLocationName } from '../api';

describe('Reverse Geocoding - getLocationName', () => {
  
  // Test 1: Valid coordinates - Jaipur, India
  test('should return location name for Jaipur coordinates', async () => {
    const result = await getLocationName(29.518321, 74.993558);
    
    expect(result).toBeDefined();
    expect(result.name).toBeTruthy();
    expect(result.country).toBeTruthy();
    expect(result.fullName).toBeTruthy();
    expect(result.fullName).toContain(',');
    
    console.log('✓ Jaipur test passed:', result.fullName);
  });

  // Test 2: Valid coordinates - New York, USA
  test('should return location name for New York coordinates', async () => {
    const result = await getLocationName(40.7128, -74.0060);
    
    expect(result).toBeDefined();
    expect(result.name).toBeTruthy();
    expect(result.country).toBeTruthy();
    
    console.log('✓ New York test passed:', result.fullName);
  });

  // Test 3: Valid coordinates - London, UK
  test('should return location name for London coordinates', async () => {
    const result = await getLocationName(51.5074, -0.1278);
    
    expect(result).toBeDefined();
    expect(result.name).toBeTruthy();
    expect(result.country).toBeTruthy();
    
    console.log('✓ London test passed:', result.fullName);
  });

  // Test 4: Valid coordinates - Tokyo, Japan
  test('should return location name for Tokyo coordinates', async () => {
    const result = await getLocationName(35.6762, 139.6503);
    
    expect(result).toBeDefined();
    expect(result.name).toBeTruthy();
    expect(result.country).toBeTruthy();
    
    console.log('✓ Tokyo test passed:', result.fullName);
  });

  // Test 5: Invalid coordinates - should handle gracefully
  test('should handle invalid coordinates gracefully', async () => {
    const result = await getLocationName(999, 999);
    
    expect(result).toBeDefined();
    expect(result.name).toBeDefined();
    expect(result.country).toBeDefined();
    expect(result.fullName).toBeDefined();
    
    console.log('✓ Invalid coordinates test passed:', result.fullName);
  });

  // Test 6: Edge case - coordinates at equator
  test('should handle coordinates at equator', async () => {
    const result = await getLocationName(0, 0);
    
    expect(result).toBeDefined();
    expect(result.name).toBeDefined();
    
    console.log('✓ Equator test passed:', result.fullName);
  });

  // Test 7: Edge case - coordinates at poles
  test('should handle coordinates near North Pole', async () => {
    const result = await getLocationName(89.9, 0);
    
    expect(result).toBeDefined();
    expect(result.name).toBeDefined();
    
    console.log('✓ North Pole test passed:', result.fullName);
  });

  // Test 8: Response structure validation
  test('should return object with required properties', async () => {
    const result = await getLocationName(29.518321, 74.993558);
    
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('country');
    expect(result).toHaveProperty('fullName');
    expect(result).toHaveProperty('address');
    
    console.log('✓ Response structure test passed');
  });

  // Test 9: fullName format validation
  test('fullName should contain location and country separated by comma', async () => {
    const result = await getLocationName(29.518321, 74.993558);
    
    expect(result.fullName).toMatch(/,/);
    expect(result.fullName.split(',').length).toBeGreaterThanOrEqual(2);
    
    console.log('✓ fullName format test passed');
  });

  // Test 10: Performance test - should respond within 2 seconds
  test('should respond within 2 seconds', async () => {
    const startTime = Date.now();
    await getLocationName(29.518321, 74.993558);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(2000);
    console.log(`✓ Performance test passed: ${duration}ms`);
  });
});

/**
 * Manual Testing Instructions
 * 
 * 1. Run tests:
 *    npm test -- reverseGeocoding.test.js
 * 
 * 2. Test coordinates to try:
 *    - Jaipur: 29.518321, 74.993558
 *    - New York: 40.7128, -74.0060
 *    - London: 51.5074, -0.1278
 *    - Tokyo: 35.6762, 139.6503
 *    - Sydney: -33.8688, 151.2093
 *    - Paris: 48.8566, 2.3522
 * 
 * 3. Expected output format:
 *    {
 *      name: "Jaipur",
 *      country: "India",
 *      fullName: "Jaipur, India",
 *      address: { ... }
 *    }
 * 
 * 4. Browser console test:
 *    - Open DevTools (F12)
 *    - Go to Console tab
 *    - Enter coordinates in the form
 *    - Check if location name appears below coordinates
 *    - Check console for any errors
 */
