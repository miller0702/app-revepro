import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../hooks/useI18n';
import { Button } from '../ui/Button';
import { SCREEN_PADDING_X } from '../../theme/layout';
import { spacing } from '../../theme/tokens';

interface FeedEndFooterProps {
  hasMore: boolean;
  loadingMore?: boolean;
  onReload: () => void;
  loadingReload?: boolean;
}

export function FeedEndFooter({
  hasMore,
  loadingMore,
  onReload,
  loadingReload,
}: FeedEndFooterProps) {
  const { colors, scaleFont } = useTheme();
  const { t } = useI18n();

  if (hasMore) {
    if (!loadingMore) return null;
    return (
      <View style={styles.wrap}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={[styles.message, { color: colors.textSecondary, fontSize: scaleFont(14) }]}>
        {t('feed.noMore')}
      </Text>
      <Button
        title={t('feed.reload')}
        variant="outline"
        onPress={onReload}
        loading={loadingReload}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: SCREEN_PADDING_X,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
    minHeight: 72,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
  },
  button: {
    minWidth: 180,
  },
});
