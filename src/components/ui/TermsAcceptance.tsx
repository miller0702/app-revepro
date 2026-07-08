import { View, Text, Switch, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { spacing } from '../../theme/tokens';

interface TermsAcceptanceProps {
  value: boolean;
  onChange: (next: boolean) => void;
  onPressTerms: () => void;
  onPressPrivacy: () => void;
  error?: string;
}

export function TermsAcceptance({
  value,
  onChange,
  onPressTerms,
  onPressPrivacy,
  error,
}: TermsAcceptanceProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#fff"
          accessibilityLabel="Aceptar términos y política de privacidad"
        />
        <View style={styles.labelRow}>
          <Pressable onPress={() => onChange(!value)}>
            <Text style={[styles.text, { color: colors.textSecondary }]}>Acepto los </Text>
          </Pressable>
          <Pressable onPress={onPressTerms} hitSlop={8}>
            <Text style={[styles.link, { color: colors.primary }]}>términos y condiciones</Text>
          </Pressable>
          <Text style={[styles.text, { color: colors.textSecondary }]}> y la </Text>
          <Pressable onPress={onPressPrivacy} hitSlop={8}>
            <Text style={[styles.link, { color: colors.primary }]}>política de privacidad</Text>
          </Pressable>
        </View>
      </View>
      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  labelRow: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', paddingTop: 2 },
  text: { fontSize: 14, lineHeight: 21 },
  link: { fontWeight: '700', textDecorationLine: 'underline' },
  error: { fontSize: 13, marginTop: 6, marginLeft: 52 },
});
