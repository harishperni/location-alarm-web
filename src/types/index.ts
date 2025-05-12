export interface LocationAlarm {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // Distance in meters to trigger alarm
  isActive: boolean;
}

export interface LocationError {
  code: number;
  message: string;
}

export interface AlarmFormProps {
  onAddAlarm: (alarm: LocationAlarm) => void;
}

export interface AlarmListProps {
  alarms: LocationAlarm[];
  currentLocation: GeolocationPosition | null;
  onDeleteAlarm: (id: string) => void;
} 