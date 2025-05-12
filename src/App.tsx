import React, { useState, useEffect } from 'react';
import './App.css';
import AlarmForm from './components/AlarmForm';
import AlarmList from './components/AlarmList';
import { LocationAlarm } from './types';

function App() {
  const [alarms, setAlarms] = useState<LocationAlarm[]>([]);
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Load alarms from localStorage
    const savedAlarms = localStorage.getItem('locationAlarms');
    if (savedAlarms) {
      setAlarms(JSON.parse(savedAlarms));
    }

    // Request location permissions and start watching position
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentLocation(position);
          setError('');
        },
        (err) => {
          setError(`Error getting location: ${err.message}`);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setError('Geolocation is not supported by your browser');
    }
  }, []);

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
        {error && <div className="error-message">{error}</div>}
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
