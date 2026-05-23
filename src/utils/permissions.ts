import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

export type PermissionResult = 'granted' | 'denied' | 'undetermined';

/**
 * Request media library (gallery save) permission.
 * Shows alert with settings link if permanently denied.
 */
export async function requestMediaLibraryPermission(): Promise<PermissionResult> {
  const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync();

  if (status === 'granted') return 'granted';

  if (!canAskAgain) {
    Alert.alert(
      'Permission Required',
      'RAW Eye needs gallery access to save your edits. Please enable it in Settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ],
    );
    return 'denied';
  }

  return 'denied';
}

/**
 * Request image picker (photo selection) permission.
 * Shows alert with settings link if permanently denied.
 */
export async function requestImagePickerPermission(): Promise<PermissionResult> {
  const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status === 'granted') return 'granted';

  if (!canAskAgain) {
    Alert.alert(
      'Permission Required',
      'RAW Eye needs photo access to open images for editing. Please enable it in Settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ],
    );
    return 'denied';
  }

  return 'denied';
}
