import { Platform } from 'react-native';

export type HealthSnapshot = {
  steps:          number;
  activeCalories: number;
};

// Use require() throughout so the module is never statically resolved
// on platforms / builds where it behaves unexpectedly.
function hc() {
  return require('react-native-health-connect');
}

// ─── Availability ─────────────────────────────────────────────────────────────

/**
 * Returns true only when Health Connect (Android) or HealthKit (iOS) is fully
 * available AND the SDK is initialised. Safe to call repeatedly.
 */
export async function initializeHealth(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      const { getSdkStatus, SdkAvailabilityStatus, initialize } = hc();
      const status = await getSdkStatus();
      // SDK_AVAILABLE = 2; anything else means HC is not installed / needs update
      if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) return false;
      return await initialize();
    }
    if (Platform.OS === 'ios') {
      const { initialize } = hc();
      return await initialize();
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Returns true when HC is unavailable but can be installed from the Play Store.
 * Use this to show an "Install Health Connect" CTA.
 */
export async function healthConnectNeedsInstall(): Promise<boolean> {
  try {
    if (Platform.OS !== 'android') return false;
    const { getSdkStatus, SdkAvailabilityStatus } = hc();
    const status = await getSdkStatus();
    return status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED;
  } catch {
    return false;
  }
}

// ─── Permissions ──────────────────────────────────────────────────────────────

export async function hasStepsPermission(): Promise<boolean> {
  try {
    const { getGrantedPermissions } = hc();
    const granted = await getGrantedPermissions();
    return granted.some(
      (p: any) => p.recordType === 'Steps' && p.accessType === 'read'
    );
  } catch {
    return false;
  }
}

/**
 * Requests read permissions for Steps + ActiveCaloriesBurned.
 * Only call this after confirming initializeHealth() === true.
 */
export async function requestHealthPermissions(): Promise<boolean> {
  try {
    const { requestPermission } = hc();
    const granted = await requestPermission([
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
      { accessType: 'read', recordType: 'Weight' },
      { accessType: 'read', recordType: 'SleepSession' },
    ]);
    return granted.some((p: any) => p.recordType === 'Steps');
  } catch {
    return false;
  }
}

// ─── Data fetching ────────────────────────────────────────────────────────────

export async function fetchTodayHealth(): Promise<HealthSnapshot | null> {
  try {
    const { readRecords } = hc();

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

export async function fetchLatestBodyWeight(): Promise<number | null> {
  try {
    const { readRecords } = hc();
    const now           = new Date();
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const res = await readRecords('Weight', {
      timeRangeFilter: {
        operator:  'between' as const,
        startTime: threeMonthsAgo.toISOString(),
        endTime:   now.toISOString(),
      },
    });
    if (!res.records.length) return null;
    const latest = res.records[res.records.length - 1];
    return latest.weight?.inKilograms ?? null;
  } catch {
    return null;
  }
}

export async function fetchLastNightSleep(): Promise<number | null> {
  try {
    const { readRecords } = hc();
    const now        = new Date();
    const yesterday  = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(18, 0, 0, 0); // from 6pm yesterday
    const res = await readRecords('SleepSession', {
      timeRangeFilter: {
        operator:  'between' as const,
        startTime: yesterday.toISOString(),
        endTime:   now.toISOString(),
      },
    });
    if (!res.records.length) return null;
    const totalMs = res.records.reduce((sum: number, r: any) => {
      const start = new Date(r.startTime).getTime();
      const end   = new Date(r.endTime).getTime();
      return sum + (end - start);
    }, 0);
    return Math.round(totalMs / 3600000 * 10) / 10; // hours, 1dp
  } catch {
    return null;
  }
}
