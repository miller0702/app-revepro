import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { useModalTopInset } from '../../hooks/useSafeAreaLayout';
import { Button } from '../ui/Button';
import { AuthenticatedImage } from '../ui/AuthenticatedImage';
import {
  clampCoverFocus,
  DEFAULT_COVER_FOCUS,
  toCoverContentPosition,
  type CoverFocus,
} from '../../utils/coverFocus';
import { radius, spacing, typography } from '../../theme/tokens';

const PREVIEW_HEIGHT = 220;

interface CoverPositionSheetProps {
  visible: boolean;
  onClose: () => void;
  localUri?: string;
  remoteUrl?: string | null;
  initialFocus?: CoverFocus;
  onSave: (focus: CoverFocus) => Promise<void>;
}

export function CoverPositionSheet({
  visible,
  onClose,
  localUri,
  remoteUrl,
  initialFocus = DEFAULT_COVER_FOCUS,
  onSave,
}: CoverPositionSheetProps) {
  const { colors, scaleFont } = useTheme();
  const topInset = useModalTopInset();
  const { width: screenWidth } = useWindowDimensions();
  const [focus, setFocus] = useState<CoverFocus>(initialFocus);
  const [saving, setSaving] = useState(false);
  const focusX = useSharedValue(initialFocus.x);
  const focusY = useSharedValue(initialFocus.y);
  const startX = useSharedValue(initialFocus.x);
  const startY = useSharedValue(initialFocus.y);
  const frameWidth = screenWidth - spacing.md * 2;

  const applyFocus = useCallback((x: number, y: number) => {
    setFocus({ x, y });
  }, []);

  useEffect(() => {
    if (!visible) return;
    setFocus(initialFocus);
    focusX.value = initialFocus.x;
    focusY.value = initialFocus.y;
    startX.value = initialFocus.x;
    startY.value = initialFocus.y;
  }, [visible, initialFocus.x, initialFocus.y, localUri, remoteUrl, focusX, focusY, startX, startY]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          startX.value = focusX.value;
          startY.value = focusY.value;
        })
        .onUpdate((event) => {
          const nextX = clampCoverFocus(startX.value - (event.translationX / frameWidth) * 100);
          const nextY = clampCoverFocus(startY.value - (event.translationY / PREVIEW_HEIGHT) * 100);
          focusX.value = nextX;
          focusY.value = nextY;
          runOnJS(applyFocus)(nextX, nextY);
        }),
    [applyFocus, focusX, focusY, frameWidth, startX, startY],
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(focus);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const imageSource = localUri ?? remoteUrl;
  if (!imageSource) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Pressable onPress={onClose} disabled={saving} hitSlop={12}>
              <Text style={{ color: colors.textSecondary, fontSize: scaleFont(16) }}>Cancelar</Text>
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.text, fontSize: scaleFont(17) }]}>
              Ajustar portada
            </Text>
            <View style={{ width: 72 }} />
          </View>

          <Text style={[styles.hint, { color: colors.textSecondary, fontSize: scaleFont(14) }]}>
            Arrastra la imagen para elegir qué parte quieres mostrar en tu portada.
          </Text>

          <GestureDetector gesture={pan}>
            <View
              style={[
                styles.previewFrame,
                {
                  width: frameWidth,
                  height: PREVIEW_HEIGHT,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
            >
              {localUri ? (
                <Image
                  source={{ uri: localUri }}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="cover"
                  contentPosition={toCoverContentPosition(focus)}
                />
              ) : (
                <AuthenticatedImage
                  url={remoteUrl}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="cover"
                  contentPosition={toCoverContentPosition(focus)}
                />
              )}
              {saving ? (
                <View style={styles.savingOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              ) : null}
            </View>
          </GestureDetector>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <Button
              title={saving ? 'Guardando…' : 'Guardar portada'}
              onPress={() => void handleSave()}
              loading={saving}
              disabled={saving}
            />
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { ...typography.title, fontSize: 17 },
  hint: {
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  previewFrame: {
    alignSelf: 'center',
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: spacing.md,
  },
});
