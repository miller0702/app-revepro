import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { AppIcon } from '../ui/AppIcon';
import { spacing, radius } from '../../theme/tokens';

interface AnnouncementBannerProps {
  body: string;
  onDismiss: () => void;
}

export function AnnouncementBanner({ body, onDismiss }: AnnouncementBannerProps) {
  const { colors, scaleFont } = useTheme();
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push('/feed')}
      style={[styles.wrap, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '44' }]}
      accessibilityRole="button"
      accessibilityLabel="Nuevo anuncio de RESVEPRO"
    >
      <View style={styles.row}>
        <AppIcon name="feed-filled" size={20} color={colors.primary} />
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: colors.text, fontSize: scaleFont(13) }]}>
            Novedad de @resvepro
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary, fontSize: scaleFont(12) }]} numberOfLines={2}>
            {body}
          </Text>
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            onDismiss();
          }}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Cerrar aviso"
        >
          <AppIcon name="close" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  textCol: { flex: 1 },
  title: { fontWeight: '700', marginBottom: 2 },
  body: { lineHeight: 18 },
});
