import { useState } from 'react';
import { View, Text, StyleSheet, Alert, Linking } from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { DrawerScreenLayout } from '../../src/components/layout/DrawerScreenLayout';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { usersApi } from '../../src/api/users';
import { useAuthStore } from '../../src/stores/authStore';
import { useBrandingSettings } from '../../src/stores/brandingStore';
import { useTheme } from '../../src/hooks/useTheme';
import { useI18n } from '../../src/hooks/useI18n';
import { spacing, radius, typography } from '../../src/theme/tokens';

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return String(message[0]);
    if (typeof message === 'string') return message;
  }
  return fallback;
}

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { colors, scaleFont } = useTheme();
  const settings = useBrandingSettings();
  const logout = useAuthStore((s) => s.logout);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDelete = () => {
    if (!password.trim()) {
      Alert.alert(t('deleteAccount.errorTitle'), t('deleteAccount.passwordRequired'));
      return;
    }
    if (confirm.trim().toUpperCase() !== 'ELIMINAR') {
      Alert.alert(t('deleteAccount.errorTitle'), t('deleteAccount.confirmRequired'));
      return;
    }

    Alert.alert(t('deleteAccount.confirmTitle'), t('deleteAccount.confirmMessage'), [
      { text: t('deleteAccount.cancel'), style: 'cancel' },
      {
        text: t('deleteAccount.submit'),
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await usersApi.deleteAccount({ password, confirm: confirm.trim() });
            await logout();
            router.replace('/(auth)/login');
          } catch (error) {
            Alert.alert(t('deleteAccount.errorTitle'), getApiErrorMessage(error, t('deleteAccount.errorGeneric')));
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const openPublicForm = () => {
    const url = settings?.accountDeletionUrl;
    if (url) {
      Linking.openURL(url).catch(() => undefined);
      return;
    }
    Alert.alert(t('deleteAccount.errorTitle'), t('deleteAccount.publicUrlUnavailable'));
  };

  return (
    <DrawerScreenLayout title={t('deleteAccount.title')} subtitle={t('deleteAccount.subtitle')}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.warning, { color: colors.error, fontSize: scaleFont(14) }]}>
          {t('deleteAccount.warning')}
        </Text>
        <Text style={[styles.hint, { color: colors.textSecondary, fontSize: scaleFont(13) }]}>
          {t('deleteAccount.hint')}
        </Text>

        <Input
          label={t('deleteAccount.passwordLabel')}
          value={password}
          onChangeText={setPassword}
          isPassword
          autoCapitalize="none"
        />
        <Input
          label={t('deleteAccount.confirmLabel')}
          placeholder="ELIMINAR"
          value={confirm}
          onChangeText={setConfirm}
          autoCapitalize="characters"
        />

        <Button
          title={loading ? t('deleteAccount.deleting') : t('deleteAccount.submit')}
          onPress={handleDelete}
          loading={loading}
          disabled={loading}
          style={{ backgroundColor: colors.error, marginTop: spacing.sm }}
        />
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.hint, { color: colors.textSecondary, fontSize: scaleFont(13) }]}>
          {t('deleteAccount.publicHint')}
        </Text>
        <Button title={t('deleteAccount.publicLink')} onPress={openPublicForm} variant="outline" />
      </View>
    </DrawerScreenLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  warning: { ...typography.body, fontWeight: '600', lineHeight: 20 },
  hint: { lineHeight: 18, marginBottom: spacing.xs },
});
