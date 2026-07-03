import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/authStore';
import { useTheme } from '../../src/hooks/useTheme';
import { getConfig } from '../../src/config/environments';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { BrandLogo } from '../../src/components/BrandLogo';
import { typography, spacing, radius } from '../../src/theme/tokens';
import { validateLogin, validatePassword } from '../../src/utils/validation';
import { getApiErrorMessage } from '../../src/utils/apiError';
import { toast } from '../../src/utils/toast';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ login?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const router = useRouter();
  const { colors } = useTheme();
  const { appName, appTagline } = getConfig();
  const insets = useSafeAreaInsets();

  const clearError = (field: 'login' | 'password') => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const loginError = validateLogin(identifier);
    const passwordError = validatePassword(password, { minLength: 1 });
    setErrors({ login: loginError, password: passwordError });
    return !loginError && !passwordError;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await login({ login: identifier.trim(), password });
      router.replace('/feed');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Credenciales inválidas'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.hero, { backgroundColor: colors.hero, paddingTop: insets.top + spacing.xl }]}>
          <BrandLogo variant="full" style={styles.logo} />
          <Text style={[styles.heroLabel, { color: colors.primary }]}>Bienvenido</Text>
          <Text style={[styles.heroTitle, { color: colors.onHero }]}>{appName}</Text>
          <Text style={[styles.heroSub, { color: colors.onHeroMuted }]}>{appTagline}</Text>
        </View>

        <View
          style={[
            styles.form,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <Input
            label="Correo o usuario"
            placeholder="ejemplo@correo.com o tu_usuario"
            autoCapitalize="none"
            autoComplete="username"
            textContentType="username"
            value={identifier}
            onChangeText={(text) => {
              setIdentifier(text);
              clearError('login');
            }}
            error={errors.login}
          />
          <Input
            label="Contraseña"
            placeholder="Tu contraseña"
            isPassword
            autoComplete="password"
            textContentType="password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              clearError('password');
            }}
            error={errors.password}
          />

          <Link href="/(auth)/forgot-password" asChild>
            <Pressable style={styles.forgotLink} accessibilityRole="link">
              <Text style={[styles.forgotText, { color: colors.primary }]}>
                ¿Olvidaste tu contraseña?
              </Text>
            </Pressable>
          </Link>

          <Button title="Iniciar sesión" onPress={handleLogin} loading={loading} style={styles.btn} />

          <View style={styles.orRow}>
            <View style={[styles.orLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.orText, { color: colors.textSecondary }]}>o</Text>
            <View style={[styles.orLine, { backgroundColor: colors.border }]} />
          </View>

          <Button
            title="Crear cuenta"
            variant="outline"
            onPress={() => router.push('/(auth)/register')}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: spacing.xl },
  hero: {
    paddingBottom: 40,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    alignItems: 'center',
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: spacing.sm,
  },
  heroLabel: { ...typography.label, marginBottom: 8 },
  heroTitle: { fontSize: 36, fontWeight: '700', letterSpacing: -0.5 },
  heroSub: { marginTop: 12, fontSize: 15, lineHeight: 22, maxWidth: 280 },
  form: {
    marginTop: -24,
    marginHorizontal: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 4,
  },
  forgotLink: { alignSelf: 'flex-end', marginBottom: spacing.md, marginTop: -4 },
  forgotText: { fontSize: 14, fontWeight: '600' },
  btn: { marginTop: 4 },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  orLine: { flex: 1, height: 1 },
  orText: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
});
