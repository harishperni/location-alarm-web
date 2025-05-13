import React, { useEffect, useRef, useState } from 'react';
import { AlarmListProps } from '../types';

const AlarmList: React.FC<AlarmListProps> = ({ alarms, currentLocation, onDeleteAlarm }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const vibrationInterval = useRef<number | null>(null);
  const previousTriggeredState = useRef<{[key: string]: boolean}>({});
  const [activeAlarms, setActiveAlarms] = useState<{[key: string]: boolean}>({});

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

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  const startVibration = () => {
    if ('vibrate' in navigator) {
      // Clear any existing vibration interval
      if (vibrationInterval.current) {
        clearInterval(vibrationInterval.current);
      }
      
      // Vibrate pattern: 500ms on, 200ms off
      navigator.vibrate(500);
      vibrationInterval.current = window.setInterval(() => {
        navigator.vibrate(500);
      }, 700);
    }
  };

  const stopVibration = () => {
    if (vibrationInterval.current) {
      clearInterval(vibrationInterval.current);
      vibrationInterval.current = null;
    }
    if ('vibrate' in navigator) {
      navigator.vibrate(0); // Stop any ongoing vibration
    }
  };

  const playAlarmSound = (alarmId: string) => {
    if (audioRef.current) {
      audioRef.current.loop = true; // Make the sound loop
      audioRef.current.play().catch(error => {
        console.log('Error playing sound:', error);
      });
      setActiveAlarms(prev => ({ ...prev, [alarmId]: true }));
      startVibration();
    }
  };

  const stopAlarm = (alarmId: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    stopVibration();
    setActiveAlarms(prev => ({ ...prev, [alarmId]: false }));
  };

  const showNotification = (alarmName: string, distance: number) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Location Alarm Triggered!', {
        body: `You are within ${(distance / 1000).toFixed(2)}km of ${alarmName}`,
        icon: '/favicon.ico'
      });
    }
  };

  useEffect(() => {
    // Request notification permission when component mounts
    requestNotificationPermission();

    // Create audio element with a longer alarm sound
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      stopVibration();
    };
  }, []);

  useEffect(() => {
    if (!currentLocation) return;

    alarms.forEach(alarm => {
      const distance = calculateDistance(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        alarm.latitude,
        alarm.longitude
      );

      const isTriggered = distance <= alarm.radius;
      const wasTriggered = previousTriggeredState.current[alarm.id];

      // Only trigger notification and sound if the alarm wasn't triggered before
      if (isTriggered && !wasTriggered) {
        playAlarmSound(alarm.id);
        showNotification(alarm.name, distance);
      } else if (!isTriggered && wasTriggered) {
        // Stop alarm when moving out of range
        stopAlarm(alarm.id);
      }

      // Update the triggered state
      previousTriggeredState.current[alarm.id] = isTriggered;
    });
  }, [alarms, currentLocation]);

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

            const isTriggered = distance !== null && distance <= alarm.radius;

            return (
              <li key={alarm.id} className="alarm-item">
                <div className="alarm-info">
                  <h3>{alarm.name}</h3>
                  <p>Location: {alarm.latitude.toFixed(4)}, {alarm.longitude.toFixed(4)}</p>
                  {distance !== null && (
                    <p>
                      Current Distance: {(distance / 1000).toFixed(2)} km
                      {isTriggered && (
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
                  {isTriggered && activeAlarms[alarm.id] && (
                    <button
                      onClick={() => stopAlarm(alarm.id)}
                      className="stop-alarm-btn"
                      style={{
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '6px',
                        marginLeft: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      Stop Alarm
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteAlarm(alarm.id)}
                    className="delete-btn"
                    disabled={activeAlarms[alarm.id]}
                    style={{
                      ...(!activeAlarms[alarm.id] ? {} : {
                        opacity: 0.5,
                        cursor: 'not-allowed',
                        backgroundColor: '#ffd4d4'
                      })
                    }}
                  >
                    Delete {activeAlarms[alarm.id] ? '(Stop alarm first)' : ''}
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