import React from 'react';
import { AlarmListProps } from '../types';

const AlarmList: React.FC<AlarmListProps> = ({ alarms, currentLocation, onDeleteAlarm }) => {
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

  const handleViewOnMap = (latitude: number, longitude: number) => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div className="alarm-list">
      <h2>Active Alarms</h2>
      {alarms.length === 0 ? (
        <p>No alarms set</p>
      ) : (
        <ul>
          {alarms.map((alarm) => {
            const distance = currentLocation
              ? calculateDistance(
                  currentLocation.coords.latitude,
                  currentLocation.coords.longitude,
                  alarm.latitude,
                  alarm.longitude
                )
              : null;

            return (
              <li key={alarm.id} className="alarm-item">
                <div className="alarm-info">
                  <h3>{alarm.name}</h3>
                  <p>Location: {alarm.latitude.toFixed(4)}, {alarm.longitude.toFixed(4)}</p>
                  {distance !== null && (
                    <p>
                      Current Distance: {(distance / 1000).toFixed(2)} km
                      {distance <= alarm.radius && (
                        <span className="alarm-triggered"> (ALARM TRIGGERED!)</span>
                      )}
                    </p>
                  )}
                  <p>Will trigger within {(alarm.radius / 1000).toFixed(2)} km of destination</p>
                </div>
                <div className="alarm-actions">
                  <button
                    onClick={() => handleViewOnMap(alarm.latitude, alarm.longitude)}
                  >
                    View on Map
                  </button>
                  <button
                    onClick={() => onDeleteAlarm(alarm.id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default AlarmList; 