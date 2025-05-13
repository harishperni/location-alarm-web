import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import AlarmForm from './components/AlarmForm';
import AlarmList from './components/AlarmList';
import { LocationAlarm } from './types';

function App() {
  const [alarms, setAlarms] = useState<LocationAlarm[]>([]);
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string>('');
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [useManualLocation, setUseManualLocation] = useState(false);

  // For testing purposes - simulated location
  const simulateLocation = () => {
    const mockPosition = {
      coords: {
        latitude: 15.8277,  // Your current latitude
        longitude: 80.1856, // Your current longitude
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        toJSON: function() { return this; }
      },
      timestamp: Date.now(),
      toJSON: function() { return this; }
    } as GeolocationPosition;
    setCurrentLocation(mockPosition);
    setError('');
    setLocationStatus('Using simulated location for testing');
    setUseManualLocation(true);
  };

  const startWatchingLocation = useCallback(() => {
    console.log('Starting location watch');
    return navigator.geolocation.watchPosition(
      (position) => {
        if (!useManualLocation) {
          console.log('Location update received:', position);
          setCurrentLocation(position);
          setError('');
          // Add speed and heading info if available
          const speedInfo = position.coords.speed ? `, Speed: ${(position.coords.speed * 3.6).toFixed(1)} km/h` : '';
          const headingInfo = position.coords.heading ? `, Heading: ${position.coords.heading.toFixed(0)}°` : '';
          setLocationStatus(
            `Location tracking active (Accuracy: ${position.coords.accuracy.toFixed(1)}m${speedInfo}${headingInfo})`
          );
        }
      },
      (err) => {
        console.error('Watch position error:', err);
        if (!useManualLocation) {
          handleLocationError(err);
        }
      },
      {
        enableHighAccuracy: true,    // Keep high accuracy mode
        timeout: 10000,              // 10 second timeout
        maximumAge: 1000             // 1 second update frequency
      }
    );
  }, [useManualLocation]);

  const requestLocation = useCallback(() => {
    if (useManualLocation) {
      simulateLocation();
      return;
    }

    if ('geolocation' in navigator) {
      setLocationStatus('Requesting location access...');
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Initial position received:', position);
          setCurrentLocation(position);
          setError('');
          const speedInfo = position.coords.speed ? `, Speed: ${(position.coords.speed * 3.6).toFixed(1)} km/h` : '';
          const headingInfo = position.coords.heading ? `, Heading: ${position.coords.heading.toFixed(0)}°` : '';
          setLocationStatus(
            `Location received (Accuracy: ${position.coords.accuracy.toFixed(1)}m${speedInfo}${headingInfo})`
          );
          startWatchingLocation();  // Start high-accuracy tracking after initial position
        },
        (err) => {
          console.error('Location request failed:', err);
          handleLocationError(err);
          // Even if we get an error, still try watching location
          startWatchingLocation();
        },
        {
          enableHighAccuracy: false, // Use lower accuracy for faster initial position
          timeout: 5000,             // Shorter timeout for initial position
          maximumAge: 10000          // Accept positions up to 10 seconds old for initial request
        }
      );
    }
  }, [useManualLocation, startWatchingLocation]);

  const handleLocationError = (err: GeolocationPositionError) => {
    let errorMessage = 'Error getting location: ';
    switch (err.code) {
      case err.PERMISSION_DENIED:
        errorMessage += 'Location permission denied. Please enable location access in your browser settings.';
        break;
      case err.POSITION_UNAVAILABLE:
        errorMessage += 'Position information is unavailable. Please check if location services are enabled on your device.';
        break;
      case err.TIMEOUT:
        errorMessage += 'Location request timed out. Please try again.';
        break;
      default:
        errorMessage += err.message;
    }
    setError(errorMessage);
    setLocationStatus('Location tracking failed');
  };

  useEffect(() => {
    // Load alarms from localStorage
    const savedAlarms = localStorage.getItem('locationAlarms');
    if (savedAlarms) {
      setAlarms(JSON.parse(savedAlarms));
    }

    // Check if geolocation is supported
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    // Initial location request
    requestLocation();
  }, [requestLocation]);

  // Save alarms to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('locationAlarms', JSON.stringify(alarms));
  }, [alarms]);

  const handleAddAlarm = (alarm: LocationAlarm) => {
    setAlarms([...alarms, alarm]);
  };

  const handleDeleteAlarm = (id: string) => {
    setAlarms(alarms.filter(alarm => alarm.id !== id));
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Location Alarm</h1>
      </header>
      <main>
        {locationStatus && (
          <div className="status-message" style={{
            padding: '10px',
            margin: '10px 0',
            backgroundColor: '#f0f8ff',
            border: '1px solid #4a90e2',
            borderRadius: '4px'
          }}>
            {locationStatus}
            <div style={{ marginTop: '10px' }}>
              <button
                onClick={requestLocation}
                style={{
                  marginRight: '10px',
                  padding: '5px 10px',
                  backgroundColor: '#4a90e2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Retry Location
              </button>
              <button
                onClick={() => {
                  if (useManualLocation) {
                    setUseManualLocation(false);
                    requestLocation();
                  } else {
                    simulateLocation();
                  }
                }}
                style={{
                  padding: '5px 10px',
                  backgroundColor: useManualLocation ? '#e74c3c' : '#2ecc71',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {useManualLocation ? 'Use Real Location' : 'Use Test Location'}
              </button>
            </div>
          </div>
        )}
        {error && (
          <div className="error-message" style={{
            padding: '10px',
            margin: '10px 0',
            backgroundColor: '#fff0f0',
            border: '1px solid #e74c3c',
            borderRadius: '4px'
          }}>
            <p>{error}</p>
            <div style={{ marginTop: '10px', fontSize: '0.9em' }}>
              To fix this:
              <ol style={{ marginLeft: '20px' }}>
                <li>Check if location services are enabled on your device</li>
                <li>Allow location access in your browser settings</li>
                <li>Try refreshing the page</li>
                <li>If using macOS, ensure Location Services are enabled in System Settings</li>
                <li>Or use the "Use Test Location" button for testing</li>
              </ol>
            </div>
          </div>
        )}
        <AlarmForm onAddAlarm={handleAddAlarm} />
        <AlarmList 
          alarms={alarms} 
          currentLocation={currentLocation} 
          onDeleteAlarm={handleDeleteAlarm}
        />
      </main>
    </div>
  );
}

export default App;
