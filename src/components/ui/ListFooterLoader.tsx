import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { spacing } from '../../theme/tokens';

interface ListFooterLoaderProps {
  loading?: boolean;
  hasMore?: boolean;
  label?: string;
}

export function ListFooterLoader({
  loading,
  hasMore,
  label = 'Cargando más…',
}: ListFooterLoaderProps) {
  const { colors } = useTheme();

  if (!loading && !hasMore) return null;

  return (
    <View style={styles.wrap}>
      {loading ? (
        <>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.text, { color: colors.textSecondary }]}>{label}</Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  text: { fontSize: 13 },
});
