export const PASSWORD_MIN_LENGTH = 8;

export type PasswordStrengthLevel = 'empty' | 'weak' | 'fair' | 'strong';

export type PasswordCriterionId = 'length' | 'lower' | 'upper' | 'number' | 'symbol';

export type PasswordCriterion = {
  id: PasswordCriterionId;
  label: string;
  met: boolean;
};

export type PasswordStrengthResult = {
  level: PasswordStrengthLevel;
  label: string;
  segments: 0 | 1 | 2 | 3;
  criteria: PasswordCriterion[];
};

const SYMBOL_REGEX = /[^a-zA-Z0-9]/;

export function analyzePassword(password: string): PasswordStrengthResult {
  const criteria: PasswordCriterion[] = [
    {
      id: 'length',
      label: 'Al menos 8 caracteres',
      met: password.length >= PASSWORD_MIN_LENGTH,
    },
    {
      id: 'lower',
      label: 'Una letra minúscula',
      met: /[a-z]/.test(password),
    },
    {
      id: 'upper',
      label: 'Una letra mayúscula',
      met: /[A-Z]/.test(password),
    },
    {
      id: 'number',
      label: 'Un número',
      met: /\d/.test(password),
    },
    {
      id: 'symbol',
      label: 'Un símbolo (!@#$…)',
      met: SYMBOL_REGEX.test(password),
    },
  ];

  if (!password) {
    return { level: 'empty', label: '', segments: 0, criteria };
  }

  const hasMinLength = criteria[0].met;
  const varietyMet = criteria.filter((c) => c.id !== 'length' && c.met).length;

  if (!hasMinLength || varietyMet <= 1) {
    return { level: 'weak', label: 'Débil', segments: 1, criteria };
  }

  if (varietyMet >= 3 || (password.length >= 12 && varietyMet >= 2)) {
    return { level: 'strong', label: 'Fuerte', segments: 3, criteria };
  }

  return { level: 'fair', label: 'Media', segments: 2, criteria };
}
