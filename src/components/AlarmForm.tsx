import React, { useState } from 'react';
import { AlarmFormProps, LocationAlarm } from '../types';

interface SearchResult {
  lat: number;
  lon: number;
  display_name: string;
  state?: string;
  district?: string;
  country?: string;
}

const AlarmForm: React.FC<AlarmFormProps> = ({ onAddAlarm, currentLocation }) => {
  const [name, setName] = useState('');
  const [radiusKm, setRadiusKm] = useState('1');
  const [destination, setDestination] = useState('');
  const [destinationCoords, setDestinationCoords] = useState<{lat: number, lng: number} | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Returns distance in meters
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const searchLocation = async () => {
    if (!destination.trim()) {
      setSearchError('Please enter a destination');
      return false;
    }

    setSearching(true);
    setSearchError('');

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=5`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        setSearchResults(data);
        setShowDropdown(true);
        setSearchError('');
        return true;
      } else {
        setSearchError('Location not found. Please try a different search.');
        setDestinationCoords(null);
        setSearchResults([]);
        setShowDropdown(false);
        return false;
      }
    } catch (error) {
      setSearchError('Error searching location. Please try again.');
      setDestinationCoords(null);
      setSearchResults([]);
      setShowDropdown(false);
      return false;
    } finally {
      setSearching(false);
    }
  };

  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDestination(e.target.value);
    setDestinationCoords(null);
    setSearchError('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleSearchClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    await searchLocation();
  };

  const handleResultSelect = (result: SearchResult) => {
    setDestinationCoords({
      lat: parseFloat(result.lat.toString()),
      lng: parseFloat(result.lon.toString())
    });
    setDestination(result.display_name);
    setShowDropdown(false);
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
    setSearchResults([]);
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
          <div className="search-container">
            <input
              type="text"
              id="destination"
              value={destination}
              onChange={handleDestinationChange}
              required
              placeholder="Enter city, town, or place name"
              className={destinationCoords ? 'location-found' : ''}
            />
            {showDropdown && searchResults.length > 0 && (
              <div className="search-results-dropdown">
                {searchResults.map((result, index) => {
                  const distance = currentLocation
                    ? calculateDistance(
                        currentLocation.coords.latitude,
                        currentLocation.coords.longitude,
                        parseFloat(result.lat.toString()),
                        parseFloat(result.lon.toString())
                      )
                    : null;

                  return (
                    <div
                      key={index}
                      className="search-result-item"
                      onClick={() => handleResultSelect(result)}
                    >
                      <div className="result-name">{result.display_name}</div>
                      <div className="result-details">
                        {result.state && <span>{result.state}</span>}
                        {result.district && <span>{result.district}</span>}
                        {result.country && <span>{result.country}</span>}
                        {distance !== null && (
                          <span className="distance-badge">
                            {formatDistance(distance)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
          max="100"
          step="0.1"
          placeholder="Enter distance in kilometers"
        />
        <small className="input-help">Enter a value between 0.1 and 100 kilometers</small>
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