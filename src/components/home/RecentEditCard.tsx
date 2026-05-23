import { Pressable, View, Image, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import Text from '../Text';

interface Props {
  imageUri: string;
  updatedAt: number;
  onPress: () => void;
}

export default function RecentEditCard({ imageUri, updatedAt, onPress }: Props) {
  const timeAgo = getTimeAgo(updatedAt);

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <Image source={{ uri: imageUri }} style={styles.thumbnail} resizeMode="cover" />
      <View style={styles.overlay}>
        <MaterialIcons name="edit" size={14} color={colors.onSurface} />
        <Text variant="monoData" color="onSurfaceVariant">{timeAgo}</Text>
      </View>
    </Pressable>
  );
}

function getTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainerHigh,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
});
