import { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useTutorialSteps } from '../../hooks/useTutorialSteps';
import { AppIcon, type AppIconName } from '../ui/AppIcon';
import { Button } from '../ui/Button';
import { isTutorialCompleted, setTutorialCompleted } from '../../storage/appExperience';
import { useTutorialStore } from '../../stores/tutorialStore';
import { spacing, radius, typography } from '../../theme/tokens';

interface OnboardingTutorialProps {
  /** Forzar apertura (p. ej. desde Ajustes). */
  forceOpen?: boolean;
  onClose?: () => void;
}

export function OnboardingTutorial({ forceOpen = false, onClose }: OnboardingTutorialProps) {
  const { colors, scaleFont } = useTheme();
  const router = useRouter();
  const { data: steps } = useTutorialSteps();
  const replayToken = useTutorialStore((s) => s.replayToken);
  const visibleSteps = (steps ?? []).filter((s) => s.isVisible).sort((a, b) => a.sortOrder - b.sortOrder);
  const [open, setOpen] = useState(forceOpen);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (replayToken > 0) {
      setOpen(true);
      setIndex(0);
      return;
    }
    if (forceOpen) {
      setOpen(true);
      setIndex(0);
      return;
    }
    isTutorialCompleted().then((done) => {
      if (!done && visibleSteps.length > 0) setOpen(true);
    });
  }, [forceOpen, replayToken, visibleSteps.length]);

  if (!open || visibleSteps.length === 0) return null;

  const step = visibleSteps[index];
  const isLast = index >= visibleSteps.length - 1;

  const finish = async () => {
    await setTutorialCompleted(true);
    setOpen(false);
    onClose?.();
  };

  const next = async () => {
    if (isLast) {
      await finish();
    } else {
      setIndex((i) => i + 1);
    }
  };

  const skip = async () => {
    await finish();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={skip}>
      <View style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primary + '22' }]}>
              <AppIcon name={(step.icon as AppIconName) || 'home'} size={36} color={colors.primary} />
            </View>
            <Text style={[styles.stepLabel, { color: colors.textSecondary, fontSize: scaleFont(12) }]}>
              Paso {index + 1} de {visibleSteps.length}
            </Text>
            <Text style={[styles.title, { color: colors.text, fontSize: scaleFont(22) }]}>{step.title}</Text>
            <Text style={[styles.body, { color: colors.textSecondary, fontSize: scaleFont(15), lineHeight: scaleFont(22) }]}>
              {step.body}
            </Text>
          </ScrollView>

          <View style={styles.dots}>
            {visibleSteps.map((s, i) => (
              <View
                key={s.code}
                style={[
                  styles.dot,
                  { backgroundColor: i === index ? colors.primary : colors.border },
                ]}
              />
            ))}
          </View>

          <View style={styles.actions}>
            <Pressable onPress={skip} accessibilityRole="button">
              <Text style={[styles.skip, { color: colors.textSecondary, fontSize: scaleFont(14) }]}>Omitir</Text>
            </Pressable>
            <Button title={isLast ? 'Comenzar' : 'Siguiente'} onPress={next} />
          </View>

          {isLast ? (
            <Pressable
              onPress={() => {
                void finish();
                router.push('/manual');
              }}
              style={styles.manualLink}
            >
              <Text style={{ color: colors.primary, fontSize: scaleFont(13), fontWeight: '600' }}>
                Ver manual completo
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  card: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  scroll: { paddingBottom: spacing.md },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  stepLabel: { ...typography.label, marginBottom: spacing.xs },
  title: { ...typography.title, marginBottom: spacing.sm },
  body: { marginBottom: spacing.md },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: spacing.md },
  dot: { width: 8, height: 8, borderRadius: 4 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  skip: { paddingVertical: spacing.sm, paddingHorizontal: spacing.xs },
  manualLink: { alignItems: 'center', marginTop: spacing.md },
});
