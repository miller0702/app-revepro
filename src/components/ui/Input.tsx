import { useState } from 'react';
import { Platform, TextInput, TextInputProps, View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppIcon } from './AppIcon';
import { radius, typography } from '../../theme/tokens';

export type InputVariant = 'default' | 'personName' | 'username' | 'email';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  isPassword?: boolean;
  variant?: InputVariant;
}

function variantDefaults(variant: InputVariant): TextInputProps {
  switch (variant) {
    case 'personName':
      if (Platform.OS === 'ios') {
        // iOS: textContentType "name"/"givenName" puede forzar teclado ASCII sin ñ.
        return {
          keyboardType: 'default',
          autoCapitalize: 'words',
          autoCorrect: false,
          spellCheck: false,
          textContentType: 'none',
          autoComplete: 'off',
        };
      }
      return {
        keyboardType: 'default',
        inputMode: 'text',
        autoCapitalize: 'words',
        autoCorrect: false,
        spellCheck: false,
        autoComplete: 'name',
      };
    case 'username':
      return {
        autoCapitalize: 'none',
        autoCorrect: false,
        autoComplete: 'username',
        textContentType: 'username',
      };
    case 'email':
      return {
        autoCapitalize: 'none',
        keyboardType: 'email-address',
        inputMode: 'email',
        autoCorrect: false,
        autoComplete: 'email',
        textContentType: 'emailAddress',
      };
    default:
      return {};
  }
}

export function Input({
  label,
  error,
  isPassword,
  secureTextEntry,
  variant = 'default',
  style,
  ...props
}: InputProps) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const secure = isPassword ? !visible : secureTextEntry;
  const preset = variantDefaults(variant);
  const iosPersonNameLock =
    variant === 'personName' && Platform.OS === 'ios'
      ? ({ textContentType: 'none', autoComplete: 'off' } as const)
      : null;

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text> : null}
      <View style={styles.row}>
        <TextInput
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={secure}
          {...preset}
          style={[
            styles.input,
            isPassword && styles.inputWithIcon,
            {
              backgroundColor: colors.input,
              borderColor: error ? colors.error : colors.border,
              color: colors.text,
            },
            style,
          ]}
          {...props}
          {...iosPersonNameLock}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            style={styles.eyeBtn}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <AppIcon
              name={visible ? 'eye-off' : 'eye'}
              size={22}
              color={colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { ...typography.caption, marginBottom: 6 },
  row: { position: 'relative' },
  input: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
  },
  inputWithIcon: { paddingRight: 52 },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  error: { fontSize: 13, marginTop: 6 },
});
