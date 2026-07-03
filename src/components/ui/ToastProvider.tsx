import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { subscribeToast, type ToastPayload, type ToastType } from '../../utils/toast';
import { useTheme } from '../../hooks/useTheme';
import { radius, spacing, typography } from '../../theme/tokens';

const ICON_BY_TYPE: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
  warning: 'warning',
};

function toastColors(type: ToastType, colors: ReturnType<typeof useTheme>['colors']) {
  switch (type) {
    case 'success':
      return { bg: colors.accentSoft, border: colors.accent, text: colors.text, icon: colors.accent };
    case 'error':
      return { bg: '#fdecea', border: colors.error, text: colors.text, icon: colors.error };
    case 'warning':
      return { bg: '#fff8e6', border: colors.primary, text: colors.text, icon: colors.primaryDark };
    default:
      return { bg: colors.surfaceElevated, border: colors.border, text: colors.text, icon: colors.primary };
  }
}

export function ToastProvider() {
  const insets = useSafeAreaInsets();
  const { colors, isDark, scaleFont } = useTheme();
  const [current, setCurrent] = useState<ToastPayload | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queueRef = useRef<ToastPayload[]>([]);
  const showingRef = useRef(false);

  const hide = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -12, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setCurrent(null);
      showingRef.current = false;
      const next = queueRef.current.shift();
      if (next) showNext(next);
    });
  };

  const showNext = (toast: ToastPayload) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    showingRef.current = true;
    setCurrent(toast);
    opacity.setValue(0);
    translateY.setValue(-12);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
    timerRef.current = setTimeout(hide, toast.durationMs ?? 3500);
  };

  useEffect(() => {
    return subscribeToast((toast) => {
      if (showingRef.current) {
        queueRef.current.push(toast);
        return;
      }
      showNext(toast);
    });
  }, []);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  if (!current) return null;

  const palette = toastColors(current.type, colors);
  const backgroundColor =
    current.type === 'error'
      ? isDark ? '#3a1f1a' : palette.bg
      : current.type === 'warning'
        ? isDark ? '#3a3018' : palette.bg
        : palette.bg;

  return (
    <View pointerEvents="box-none" style={[styles.host, { top: insets.top + spacing.sm }]}>
      <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        <Pressable
          onPress={hide}
          style={[
            styles.toast,
            {
              backgroundColor,
              borderColor: palette.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <Ionicons name={ICON_BY_TYPE[current.type]} size={22} color={palette.icon} />
          <View style={styles.copy}>
            {current.title ? (
              <Text style={[styles.title, { color: palette.text, fontSize: scaleFont(14) }]}>
                {current.title}
              </Text>
            ) : null}
            <Text style={[styles.message, { color: palette.text, fontSize: scaleFont(13) }]}>
              {current.message}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 9999,
    elevation: 20,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  copy: { flex: 1 },
  title: { ...typography.body, fontWeight: '700', marginBottom: 2 },
  message: { ...typography.body, lineHeight: 18 },
});
