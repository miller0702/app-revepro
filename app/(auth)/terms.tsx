import { ScrollView, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { platformApi } from '../../src/api/platform';
import { AuthBackHeader } from '../../src/components/ui/AuthBackHeader';
import { useTheme } from '../../src/hooks/useTheme';
import { spacing, radius } from '../../src/theme/tokens';

export default function TermsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['legal', 'TERMS'],
    queryFn: async () => {
      const res = await platformApi.getLegalDocument('TERMS');
      return res.data.data;
    },
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.scroll}
    >
      <AuthBackHeader
        title="Términos y condiciones"
        subtitle="Lee el documento antes de aceptar el registro"
        onBack={() => router.back()}
      />

      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : isError || !data ? (
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            No se pudieron cargar los términos. Intenta de nuevo más tarde.
          </Text>
        ) : (
          <>
            <Text style={[styles.version, { color: colors.textSecondary }]}>
              Versión {data.version}
            </Text>
            <Text style={[styles.body, { color: colors.text }]}>{data.content}</Text>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
  },
  loader: { paddingVertical: spacing.xl },
  version: { fontSize: 12, marginBottom: spacing.md, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 24 },
});
