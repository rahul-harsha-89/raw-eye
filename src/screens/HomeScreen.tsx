import { useCallback, useEffect } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { colors, spacing } from '../theme';
import Text from '../components/Text';
import RecentEditCard from '../components/home/RecentEditCard';
import { requestImagePickerPermission } from '../utils/permissions';
import { useProjectStore } from '../store/projectStore';
import type { RootStackParamList } from '../navigation/RootNavigator';

type HomeNavProp = StackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const { projects, isLoaded, loadProjects } = useProjectStore();

  useEffect(() => {
    if (!isLoaded) loadProjects();
  }, [isLoaded, loadProjects]);

  const pickImage = useCallback(async () => {
    const permission = await requestImagePickerPermission();
    if (permission !== 'granted') return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      navigation.navigate('Editor', {
        imageUri: result.assets[0].uri,
      });
    }
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="displaySm" color="onSurface">RAW Eye</Text>
        <Text variant="monoData" color="outline" style={styles.subtitle}>
          PRECISION PHOTO EDITOR
        </Text>
      </View>

      {projects.length > 0 ? (
        <View style={styles.recentsSection}>
          <Text variant="labelCaps" color="outline" style={styles.sectionLabel}>
            RECENT EDITS
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentsRow}
          >
            {projects.map((project) => (
              <RecentEditCard
                key={project.id}
                imageUri={project.imageUri}
                updatedAt={project.updatedAt}
                onPress={() =>
                  navigation.navigate('Editor', {
                    imageUri: project.imageUri,
                    projectId: project.id,
                  })
                }
              />
            ))}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <MaterialIcons name="photo-library" size={48} color={colors.outline} />
          <Text variant="bodyMd" color="onSurfaceVariant" style={styles.emptyText}>
            No recent edits
          </Text>
          <Text variant="monoData" color="outline">
            Tap the button below to start editing
          </Text>
        </View>
      )}

      <Pressable onPress={pickImage} style={styles.fab}>
        <MaterialIcons name="add" size={24} color={colors.onPrimary} />
        <Text variant="labelSm" style={{ color: colors.onPrimary }}>NEW EDIT</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: spacing.edgeMargin,
    gap: spacing.unit,
  },
  subtitle: {
    letterSpacing: 2,
  },
  recentsSection: {
    marginTop: 32,
  },
  sectionLabel: {
    paddingHorizontal: spacing.edgeMargin,
    marginBottom: spacing.gutter,
  },
  recentsRow: {
    paddingHorizontal: spacing.edgeMargin,
    gap: spacing.gutter,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.gutter,
  },
  emptyText: {
    marginTop: spacing.gutter,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gutter,
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 24,
    height: spacing.touchTarget,
    borderRadius: 22,
  },
});
