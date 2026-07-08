import { ScrollView, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { platformApi } from '../../api/platform';
import { AuthBackHeader } from '../ui/AuthBackHeader';
import { useTheme } from '../../hooks/useTheme';
import { spacing, radius } from '../../theme/tokens';

type LegalType = 'TERMS' | 'PRIVACY' | 'COOKIES' | 'ACCEPTABLE_USE';

interface LegalDocumentScreenProps {
  type: LegalType;
  title: string;
  subtitle: string;
  onBack: () => void;
}

function renderLegalContent(content: string, textColor: string, headingColor: string) {
  return content.split('\n').map((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      return (
        <Text key={index} style={[styles.heading1, { color: headingColor }]}>
          {trimmed.slice(2)}
        </Text>
      );
    }
    if (trimmed.startsWith('## ')) {
      return (
        <Text key={index} style={[styles.heading2, { color: headingColor }]}>
          {trimmed.slice(3)}
        </Text>
      );
    }
    if (!trimmed) {
      return <View key={index} style={styles.spacer} />;
    }
    return (
      <Text key={index} style={[styles.body, { color: textColor }]}>
        {line}
      </Text>
    );
  });
}

export function LegalDocumentScreen({
  type,
  title,
  subtitle,
  onBack,
}: LegalDocumentScreenProps) {
  const { colors } = useTheme();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['legal', type],
    queryFn: async () => {
      const res = await platformApi.getLegalDocument(type);
      return res.data.data;
    },
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.scroll}
    >
      <AuthBackHeader title={title} subtitle={subtitle} onBack={onBack} />

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
            No se pudo cargar el documento. Intenta de nuevo más tarde.
          </Text>
        ) : (
          <>
            <Text style={[styles.version, { color: colors.textSecondary }]}>
              Versión {data.version}
            </Text>
            {renderLegalContent(data.content, colors.text, colors.text)}
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
  heading1: { fontSize: 22, fontWeight: '700', marginBottom: spacing.md, marginTop: spacing.sm },
  heading2: { fontSize: 17, fontWeight: '700', marginBottom: spacing.sm, marginTop: spacing.md },
  spacer: { height: spacing.sm },
  body: { fontSize: 15, lineHeight: 24 },
});
