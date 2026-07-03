import type { AxiosError } from 'axios';

const DEFAULT_MESSAGES: Record<number, string> = {
  400: 'Solicitud inválida',
  401: 'Credenciales inválidas',
  403: 'No tienes permiso para esta acción',
  404: 'Recurso no encontrado',
  409: 'Conflicto con datos existentes',
  422: 'Datos no válidos',
  429: 'Demasiados intentos. Espera un momento',
  500: 'Error interno del servidor',
  502: 'Servicio no disponible',
  503: 'Servicio en mantenimiento',
  504: 'El servidor tardó demasiado en responder',
};

function extractMessage(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const payload = data as { message?: string | string[] };
  if (Array.isArray(payload.message)) return payload.message.join('\n');
  if (typeof payload.message === 'string' && payload.message.trim()) return payload.message.trim();
  return undefined;
}

export function getApiErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado'): string {
  if (!error || typeof error !== 'object') return fallback;

  const axiosError = error as AxiosError<{ message?: string | string[] }>;
  const status = axiosError.response?.status;
  const fromBody = extractMessage(axiosError.response?.data);

  if (fromBody) return fromBody;
  if (status && DEFAULT_MESSAGES[status]) return DEFAULT_MESSAGES[status];

  if (axiosError.code === 'ECONNABORTED') return 'La conexión tardó demasiado';
  if (!axiosError.response) return 'Sin conexión con el servidor';

  return fallback;
}

export function isServerUnavailableError(error: unknown): boolean {
  const status = (error as AxiosError)?.response?.status;
  return status === 502 || status === 503 || status === 504;
}

export function isNetworkError(error: unknown): boolean {
  const axiosError = error as AxiosError;
  return !axiosError.response && Boolean(axiosError.request);
}
