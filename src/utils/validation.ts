const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export { PASSWORD_MIN_LENGTH } from './passwordStrength';

export function isValidEmail(value: string) {
  return EMAIL_REGEX.test(value.trim());
}

export function validateLogin(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return 'Ingresa tu correo o nombre de usuario';
  if (trimmed.includes('@') && !isValidEmail(trimmed)) return 'Ingresa un correo válido';
  return undefined;
}

export function validateEmail(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return 'Ingresa tu correo electrónico';
  if (!isValidEmail(trimmed)) return 'Ingresa un correo válido';
  return undefined;
}

export function validateUsername(value: string) {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return 'Ingresa un nombre de usuario';
  if (trimmed.length < 3) return 'El usuario debe tener al menos 3 caracteres';
  if (trimmed.length > 30) return 'El usuario no puede superar 30 caracteres';
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return 'Solo letras, números y guion bajo';
  }
  if (trimmed.includes('@')) return 'El usuario no puede ser un correo';
  return undefined;
}

/** Letras Unicode (incluye ñ, tildes, ü), espacios, apóstrofo, punto y guion. */
const PERSON_NAME_PATTERN = /^[\p{L}\p{M}\s'.-]+$/u;

export function validateName(value: string, field: 'nombre' | 'apellido') {
  const trimmed = value.trim();
  if (!trimmed) return `Ingresa tu ${field}`;
  if (trimmed.length < 2) return `El ${field} debe tener al menos 2 caracteres`;
  if (trimmed.length > 80) return `El ${field} no puede superar 80 caracteres`;
  if (!PERSON_NAME_PATTERN.test(trimmed)) {
    return `El ${field} solo puede contener letras y espacios`;
  }
  return undefined;
}

import { PASSWORD_MIN_LENGTH } from './passwordStrength';

export function validatePassword(value: string, options?: { minLength?: number; required?: boolean }) {
  const minLength = options?.minLength ?? PASSWORD_MIN_LENGTH;
  const required = options?.required ?? true;

  if (!value) {
    return required ? 'Ingresa tu contraseña' : undefined;
  }
  if (value.length < minLength) {
    return `La contraseña debe tener al menos ${minLength} caracteres`;
  }
  return undefined;
}

export function validateConfirmPassword(password: string, confirm: string) {
  if (!confirm) return 'Confirma tu contraseña';
  if (password !== confirm) return 'Las contraseñas no coinciden';
  return undefined;
}

export function validateTermsAccepted(accepted: boolean) {
  if (!accepted) return 'Debes aceptar los términos y condiciones';
  return undefined;
}
