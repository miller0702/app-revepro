import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../ui/Button';
import { moderationApi } from '../../api/moderation';
import {
  REPORT_REASONS,
  REPORT_TARGET_LABELS,
  type ModerationReportReason,
  type ModerationReportTargetType,
} from '../../constants/moderationReport';
import { radius, spacing, typography } from '../../theme/tokens';

interface ReportContentSheetProps {
  visible: boolean;
  targetType: ModerationReportTargetType;
  targetId: string;
  contextUrl?: string;
  onClose: () => void;
  onSubmitted?: () => void;
  embedded?: boolean;
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return String(message[0]);
    if (typeof message === 'string') return message;
  }
  return fallback;
}

export function ReportContentSheet({
  visible,
  targetType,
  targetId,
  contextUrl,
  onClose,
  onSubmitted,
  embedded = false,
}: ReportContentSheetProps) {
  const { colors, scaleFont } = useTheme();
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState<ModerationReportReason | null>(null);
  const [details, setDetails] = useState('');

  const submitMutation = useMutation({
    mutationFn: () =>
      moderationApi.createReport({
        targetType,
        targetId,
        reason: reason!,
        details: details.trim() || undefined,
        contextUrl,
      }),
    onSuccess: () => {
      Alert.alert(
        'Reporte enviado',
        'Gracias. El equipo de moderación revisará tu reporte pronto.',
      );
      setReason(null);
      setDetails('');
      onSubmitted?.();
      onClose();
    },
    onError: (error) => {
      Alert.alert('No se pudo enviar', getApiErrorMessage(error, 'Intenta de nuevo más tarde.'));
    },
  });

  const handleClose = () => {
    if (submitMutation.isPending) return;
    setReason(null);
    setDetails('');
    onClose();
  };

  const label = REPORT_TARGET_LABELS[targetType];

  const sheetBody = (
    <View style={[styles.overlay, embedded && styles.embeddedOverlay]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            paddingBottom: Math.max(insets.bottom, spacing.md),
          },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        <Text style={[styles.title, { color: colors.text, fontSize: scaleFont(17) }]}>
          Reportar {label}
        </Text>
        <Text style={[styles.hint, { color: colors.textSecondary, fontSize: scaleFont(13) }]}>
          Cuéntanos qué ocurre. Los administradores revisarán este reporte.
        </Text>

        <ScrollView style={styles.reasonList} keyboardShouldPersistTaps="handled">
          {REPORT_REASONS.map((item) => {
            const active = reason === item.code;
            return (
              <Pressable
                key={item.code}
                onPress={() => setReason(item.code)}
                style={[
                  styles.reasonChip,
                  { borderColor: colors.border },
                  active && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
              >
                <Text
                  style={{
                    color: active ? colors.onPrimary : colors.text,
                    fontWeight: '600',
                    fontSize: scaleFont(14),
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <TextInput
          value={details}
          onChangeText={setDetails}
          placeholder="Detalles adicionales (opcional)"
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={1000}
          style={[
            styles.input,
            {
              color: colors.text,
              borderColor: colors.border,
              backgroundColor: colors.background,
              fontSize: scaleFont(15),
            },
          ]}
        />

        <Button
          title={submitMutation.isPending ? 'Enviando…' : 'Enviar reporte'}
          onPress={() => {
            if (!reason) {
              Alert.alert('Selecciona un motivo', 'Elige la razón del reporte.');
              return;
            }
            submitMutation.mutate();
          }}
          loading={submitMutation.isPending}
          disabled={!reason}
          style={styles.submitBtn}
        />
        <Pressable onPress={handleClose} style={styles.cancelBtn}>
          <Text style={{ color: colors.textSecondary, fontSize: scaleFont(15), fontWeight: '600' }}>
            Cancelar
          </Text>
        </Pressable>
      </View>
    </View>
  );

  if (!visible) return null;

  if (embedded) {
    return (
      <View style={styles.embeddedRoot} pointerEvents="box-none">
        {sheetBody}
      </View>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      {sheetBody}
    </Modal>
  );
}

const styles = StyleSheet.create({
  embeddedRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
  },
  embeddedOverlay: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    maxHeight: '88%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: spacing.md,
  },
  title: { ...typography.title, textAlign: 'center', marginBottom: spacing.xs },
  hint: { textAlign: 'center', lineHeight: 20, marginBottom: spacing.md },
  reasonList: { maxHeight: 220, marginBottom: spacing.md },
  reasonChip: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  input: {
    minHeight: 88,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  submitBtn: { marginBottom: spacing.sm },
  cancelBtn: { alignItems: 'center', paddingVertical: spacing.sm },
});
