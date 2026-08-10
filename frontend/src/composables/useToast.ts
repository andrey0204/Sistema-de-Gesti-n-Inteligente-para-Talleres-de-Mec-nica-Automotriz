import { readonly, ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  type: ToastType
  message: string
}

const DURATION_MS = 4000

// Estado a nivel de módulo: todos los componentes comparten la misma cola.
const toasts = ref<Toast[]>([])
let nextId = 0

function push(type: ToastType, message: string): void {
  const id = nextId++
  toasts.value.push({ id, type, message })
  setTimeout(() => dismiss(id), DURATION_MS)
}

function dismiss(id: number): void {
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

export function useToast() {
  return {
    toasts: readonly(toasts),
    dismiss,
    success: (message: string) => push('success', message),
    error: (message: string) => push('error', message),
    info: (message: string) => push('info', message),
  }
}
