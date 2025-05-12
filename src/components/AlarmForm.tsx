import React, { useState } from 'react';
import { AlarmFormProps, LocationAlarm } from '../types';

const AlarmForm: React.FC<AlarmFormProps> = ({ onAddAlarm }) => {
  const [name, setName] = useState('');
  const [radiusKm, setRadiusKm] = useState('1');
  const [destination, setDestination] = useState('');
  const [destinationCoords, setDestinationCoords] = useState<{lat: number, lng: number} | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const searchLocation = async () => {
    if (!destination.trim()) {
      setSearchError('Please enter a destination');
      return false;
    }

    setSearching(true);
    setSearchError('');

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        setDestinationCoords({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        });
        setSearchError('');
        return true;
      } else {
        setSearchError('Location not found. Please try a different search.');
        setDestinationCoords(null);
        return false;
      }
    } catch (error) {
      setSearchError('Error searching location. Please try again.');
      setDestinationCoords(null);
      return false;
    } finally {
      setSearching(false);
    }
  };

  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDestination(e.target.value);
    setDestinationCoords(null);
    setSearchError('');
  };

  const handleSearchClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    await searchLocation();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!destinationCoords) {
      const found = await searchLocation();
      if (!found) return;
    }

    if (!destinationCoords) return;

    const newAlarm: LocationAlarm = {
      id: Date.now().toString(),
      name,
      latitude: destinationCoords.lat,
      longitude: destinationCoords.lng,
      radius: parseFloat(radiusKm) * 1000, // Convert km to meters
      isActive: true
    };

    onAddAlarm(newAlarm);
    setName('');
    setRadiusKm('1');
    setDestination('');
    setDestinationCoords(null);
  };

  return (
    <form onSubmit={handleSubmit} className="alarm-form">
      <div className="form-group">
        <label htmlFor="name">Alarm Name:</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Enter a name for your alarm"
        />
      </div>

      <div className="form-group">
        <label htmlFor="destination">Destination:</label>
        <div className="destination-input-group">
          <input
            type="text"
            id="destination"
            value={destination}
            onChange={handleDestinationChange}
            required
            placeholder="Enter city, town, or place name"
            className={destinationCoords ? 'location-found' : ''}
          />
          <button 
            type="button" 
            onClick={handleSearchClick}
            disabled={searching || !destination.trim()}
            className="search-button"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>
        {searchError && <div className="error-message">{searchError}</div>}
        {destinationCoords && (
          <div className="success-message">
            ✓ Location found at {destinationCoords.lat.toFixed(4)}, {destinationCoords.lng.toFixed(4)}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="radius">Distance (kilometers):</label>
        <input
          type="number"
          id="radius"
          value={radiusKm}
          onChange={(e) => setRadiusKm(e.target.value)}
          required
          min="0.1"
          max="10"
          step="0.1"
          placeholder="Enter distance in kilometers"
        />
        <small className="input-help">Enter a value between 0.1 and 10 kilometers</small>
      </div>

      <button 
        type="submit" 
        className="submit-button"
        disabled={searching || !name || !destination || !destinationCoords}
      >
        Set Alarm
      </button>
    </form>
  );
};

export default AlarmForm; 