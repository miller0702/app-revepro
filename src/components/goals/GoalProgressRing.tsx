import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import { AppIcon, type AppIconName } from '../ui/AppIcon';

type Props = {
  /** Progreso 0–1 hacia la meta. */
  progress: number;
  /** Minutos completados (parte entera). */
  value: number;
  /** Segundos totales; permite mostrar progreso y etiqueta antes del primer minuto. */
  totalSeconds?: number;
  /** Meta en minutos; muestra "actual/meta" en el centro. */
  goalMinutes?: number;
  activeColor: string;
  icon?: AppIconName;
  size?: number;
};

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function centerLabel(value: number, goalMinutes?: number, totalSeconds?: number): string {
  if (goalMinutes == null) return String(value);
  const seconds = totalSeconds ?? value * 60;
  if (seconds > 0 && seconds < 60) return `<1/${goalMinutes}`;
  return `${Math.floor(seconds / 60)}/${goalMinutes}`;
}

export function GoalProgressRing({
  progress,
  value,
  totalSeconds,
  goalMinutes,
  activeColor,
  icon = 'time',
  size = 52,
}: Props) {
  const { colors } = useTheme();
  const clamped = clamp01(progress);
  const strokeWidth = Math.max(3, Math.round(size * 0.08));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const visibleProgress = clamped > 0 ? Math.max(clamped, 0.04) : 0;
  const strokeDashoffset = circumference * (1 - visibleProgress);
  const label = centerLabel(value, goalMinutes, totalSeconds);
  const fontSize = label.length > 4 ? Math.round(size * 0.17) : Math.round(size * 0.2);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {visibleProgress > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={activeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </Svg>
      <View style={styles.center}>
        <AppIcon name={icon} size={Math.round(size * 0.22)} color={activeColor} />
        <Text style={[styles.value, { color: colors.text, fontSize }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    paddingHorizontal: 4,
  },
  value: {
    fontWeight: '800',
    lineHeight: 14,
    textAlign: 'center',
  },
});
