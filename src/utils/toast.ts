export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastPayload {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  durationMs?: number;
}

type ToastListener = (toast: ToastPayload) => void;

const listeners = new Set<ToastListener>();
let counter = 0;

function emit(toast: ToastPayload) {
  listeners.forEach((listener) => listener(toast));
}

export function subscribeToast(listener: ToastListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function showToast(input: {
  type?: ToastType;
  title?: string;
  message: string;
  durationMs?: number;
}) {
  emit({
    id: `toast-${++counter}`,
    type: input.type ?? 'info',
    title: input.title,
    message: input.message,
    durationMs: input.durationMs ?? 3500,
  });
}

export const toast = {
  success: (message: string, title?: string) => showToast({ type: 'success', message, title }),
  error: (message: string, title?: string) => showToast({ type: 'error', message, title, durationMs: 4500 }),
  info: (message: string, title?: string) => showToast({ type: 'info', message, title }),
  warning: (message: string, title?: string) => showToast({ type: 'warning', message, title }),
};
