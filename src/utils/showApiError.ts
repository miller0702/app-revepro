import { getApiErrorMessage } from './apiError';
import { toast } from './toast';

/** Muestra un toast de error a partir de una excepción de API o genérica. */
export function showApiError(error: unknown, fallback?: string) {
  toast.error(getApiErrorMessage(error, fallback));
}
