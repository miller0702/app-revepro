import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { useTheme } from '../../src/hooks/useTheme';
import { Input } from '../../src/components/ui/Input';
import { PasswordStrengthMeter } from '../../src/components/ui/PasswordStrengthMeter';
import { Button } from '../../src/components/ui/Button';
import { AuthBackHeader } from '../../src/components/ui/AuthBackHeader';
import { TermsAcceptance } from '../../src/components/ui/TermsAcceptance';
import { spacing, radius } from '../../src/theme/tokens';
import {
  validateConfirmPassword,
  validateEmail,
  validateName,
  validatePassword,
  validateTermsAccepted,
  validateUsername,
} from '../../src/utils/validation';
import { showApiError } from '../../src/utils/showApiError';

type FormErrors = {
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms?: string;
};

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const router = useRouter();
  const { colors } = useTheme();

  const clearError = (field: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const next: FormErrors = {
      username: validateUsername(username),
      firstName: validateName(firstName, 'nombre'),
      lastName: validateName(lastName, 'apellido'),
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
      acceptTerms: validateTermsAccepted(acceptTerms),
    };
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await register({
        username: username.trim().toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        acceptTerms: true,
      });
      router.replace('/feed');
    } catch (error) {
      showApiError(error, 'No se pudo crear la cuenta');
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
        <View style={styles.content}>
          <AuthBackHeader
            title="Crear cuenta"
            subtitle="Regístrate con usuario o correo para iniciar sesión después"
          />

          <View
            style={[
              styles.form,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Input
              label="Nombre de usuario"
              placeholder="Ej. juan_perez"
              variant="username"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                clearError('username');
              }}
              error={errors.username}
            />
            <Input
              label="Nombre"
              placeholder="Ej. Muñoz"
              variant="personName"
              value={firstName}
              onChangeText={(text) => {
                setFirstName(text);
                clearError('firstName');
              }}
              error={errors.firstName}
            />
            <Input
              label="Apellido"
              placeholder="Ej. Pérez"
              variant="personName"
              value={lastName}
              onChangeText={(text) => {
                setLastName(text);
                clearError('lastName');
              }}
              error={errors.lastName}
            />
            <Input
              label="Correo electrónico"
              placeholder="ejemplo@correo.com"
              variant="email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                clearError('email');
              }}
              error={errors.email}
            />
            <View>
              <Input
                label="Contraseña"
                placeholder="Mínimo 8 caracteres"
                isPassword
                autoComplete="new-password"
                textContentType="newPassword"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  clearError('password');
                  if (confirmPassword) clearError('confirmPassword');
                }}
                error={errors.password}
              />
              <PasswordStrengthMeter password={password} />
            </View>
            <Input
              label="Confirmar contraseña"
              placeholder="Repite tu contraseña"
              isPassword
              autoComplete="new-password"
              textContentType="newPassword"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                clearError('confirmPassword');
              }}
              error={errors.confirmPassword}
            />

            <TermsAcceptance
              value={acceptTerms}
              onChange={(next) => {
                setAcceptTerms(next);
                clearError('acceptTerms');
              }}
              onPressTerms={() => router.push('/(auth)/terms')}
              onPressPrivacy={() => router.push('/(auth)/privacy')}
              error={errors.acceptTerms}
            />

            <Button
              title="Registrarse"
              onPress={handleRegister}
              loading={loading}
              style={styles.btn}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              ¿Ya tienes cuenta?{' '}
            </Text>
            <Text
              style={[styles.footerLink, { color: colors.primary }]}
              onPress={() => router.replace('/(auth)/login')}
            >
              Iniciar sesión
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: spacing.xl },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  form: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
  },
  btn: { marginTop: 8 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: spacing.lg,
  },
  footerText: { fontSize: 15 },
  footerLink: { fontSize: 15, fontWeight: '700' },
});
