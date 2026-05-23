import AsyncStorage from '@react-native-async-storage/async-storage';

const FIRST_LAUNCH_KEY = '@raw_eye_first_launch';

/**
 * Returns true if this is the first time the app has launched.
 * After the first call that returns true, subsequent calls return false.
 */
export async function isFirstLaunch(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
    if (value === null) {
      await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'false');
      return true;
    }
    return false;
  } catch {
    // If storage fails, treat as returning user (safer UX)
    return false;
  }
}

/**
 * Reset first launch state (for testing/dev).
 */
export async function resetFirstLaunch(): Promise<void> {
  await AsyncStorage.removeItem(FIRST_LAUNCH_KEY);
}
