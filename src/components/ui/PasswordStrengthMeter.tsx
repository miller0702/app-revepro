import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { radius, typography } from '../../theme/tokens';
import {
  analyzePassword,
  type PasswordStrengthLevel,
} from '../../utils/passwordStrength';

type Props = {
  password: string;
};

function strengthColor(
  level: PasswordStrengthLevel,
  colors: ReturnType<typeof useTheme>['colors'],
): string {
  switch (level) {
    case 'weak':
      return colors.error;
    case 'fair':
      return colors.primary;
    case 'strong':
      return colors.accent;
    default:
      return colors.border;
  }
}

export function PasswordStrengthMeter({ password }: Props) {
  const { colors } = useTheme();
  const { level, label, segments, criteria } = analyzePassword(password);

  if (level === 'empty') return null;

  const activeColor = strengthColor(level, colors);

  return (
    <View style={styles.wrap} accessibilityRole="text" accessibilityLabel={`Seguridad de la contraseña: ${label}`}>
      <View style={styles.header}>
        <Text style={[styles.headerLabel, { color: colors.textSecondary }]}>Seguridad</Text>
        <Text style={[styles.headerValue, { color: activeColor }]}>{label}</Text>
      </View>

      <View style={styles.barRow}>
        {[1, 2, 3].map((segment) => (
          <View
            key={segment}
            style={[
              styles.barSegment,
              {
                backgroundColor: segment <= segments ? activeColor : colors.border,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.criteria}>
        {criteria.map((criterion) => (
          <View key={criterion.id} style={styles.criterionRow}>
            <View
              style={[
                styles.criterionDot,
                {
                  backgroundColor: criterion.met ? colors.accent : 'transparent',
                  borderColor: criterion.met ? colors.accent : colors.textSecondary,
                },
              ]}
            />
            <Text
              style={[
                styles.criterionText,
                { color: criterion.met ? colors.text : colors.textSecondary },
              ]}
            >
              {criterion.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: -4,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLabel: {
    ...typography.caption,
  },
  headerValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  barRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  barSegment: {
    flex: 1,
    height: 4,
    borderRadius: radius.full,
  },
  criteria: {
    gap: 6,
  },
  criterionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  criterionDot: {
    width: 14,
    height: 14,
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  criterionText: {
    fontSize: 13,
    flex: 1,
  },
});
