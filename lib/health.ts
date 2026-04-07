import { Platform } from 'react-native';
import {
  initialize,
  requestPermission,
  readRecords,
  getGrantedPermissions,
} from 'react-native-health-connect';

export type HealthSnapshot = {
  steps:          number;
  activeCalories: number;
};

// ─── Availability ─────────────────────────────────────────────────────────────

export async function initializeHealth(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      // On Android, getSdkStatus tells us if Health Connect is installed
      const { getSdkStatus, SdkAvailabilityStatus } = require('react-native-health-connect');
      const status = await getSdkStatus();
      if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) return false;
    }
    return await initialize();
  } catch {
    return false;
  }
}

// ─── Permissions ──────────────────────────────────────────────────────────────

export async function hasStepsPermission(): Promise<boolean> {
  try {
    const granted = await getGrantedPermissions();
    return granted.some(
      (p: any) => p.recordType === 'Steps' && p.accessType === 'read'
    );
  } catch {
    return false;
  }
}

export async function requestHealthPermissions(): Promise<boolean> {
  try {
    const granted = await requestPermission([
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
    ]);
    return granted.some((p: any) => p.recordType === 'Steps');
  } catch {
    return false;
  }
}

// ─── Data fetching ────────────────────────────────────────────────────────────

export async function fetchTodayHealth(): Promise<HealthSnapshot | null> {
  try {
    const now        = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const timeRangeFilter = {
      operator:  'between' as const,
      startTime: startOfDay.toISOString(),
      endTime:   now.toISOString(),
    };

    const [stepsRes, calsRes] = await Promise.all([
      readRecords('Steps',                { timeRangeFilter }),
      readRecords('ActiveCaloriesBurned', { timeRangeFilter }),
    ]);

    const steps = stepsRes.records.reduce(
      (sum: number, r: any) => sum + (r.count ?? 0), 0
    );
    const activeCalories = calsRes.records.reduce(
      (sum: number, r: any) => sum + (r.energy?.inKilocalories ?? 0), 0
    );

    return { steps: Math.round(steps), activeCalories: Math.round(activeCalories) };
  } catch {
    return null;
  }
}
