import { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { authApi } from '../../src/api/auth';
import { useTheme } from '../../src/hooks/useTheme';
import { toast } from '../../src/utils/toast';
import { showApiError } from '../../src/utils/showApiError';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { AuthBackHeader } from '../../src/components/ui/AuthBackHeader';
import { spacing, radius } from '../../src/theme/tokens';
import { validateEmail } from '../../src/utils/validation';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();

  const handleSubmit = async () => {
    const emailError = validateEmail(email);
    setError(emailError);
    if (emailError) return;

    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      toast.success('Si el email existe, recibirás instrucciones.');
    } catch (error) {
      showApiError(error, 'No se pudo procesar la solicitud');
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
            title="Recuperar contraseña"
            subtitle="Te enviaremos instrucciones si el correo está registrado."
          />

          <View
            style={[
              styles.form,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Input
              label="Correo electrónico"
              placeholder="ejemplo@correo.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError(undefined);
              }}
              error={error}
            />
            <Button title="Enviar instrucciones" onPress={handleSubmit} loading={loading} />
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
});
