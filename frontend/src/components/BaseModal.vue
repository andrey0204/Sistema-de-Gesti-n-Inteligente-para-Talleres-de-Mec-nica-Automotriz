<script setup lang="ts">
import { useTemplateRef, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    /** Ancho máximo del cuadro; útil para formularios largos. */
    size?: 'md' | 'lg'
  }>(),
  { size: 'md' },
)

const emit = defineEmits<{ close: [] }>()

const dialog = useTemplateRef<HTMLDialogElement>('dialog')

// `flush: 'post'` para que el <dialog> ya exista en el DOM al abrirlo.
watch(
  () => props.open,
  (open) => {
    const el = dialog.value
    if (!el) return
    if (open && !el.open) el.showModal()
    else if (!open && el.open) el.close()
  },
  { immediate: true, flush: 'post' },
)
</script>

<template>
  <!-- El evento nativo `close` cubre también el cierre con la tecla Escape. -->
  <dialog ref="dialog" class="modal" @close="emit('close')">
    <div class="modal-box" :class="size === 'lg' ? 'max-w-2xl' : ''">
      <form method="dialog">
        <button class="btn btn-circle btn-ghost btn-sm absolute right-2 top-2" aria-label="Cerrar">
          ✕
        </button>
      </form>

      <h3 class="text-lg font-bold">{{ title }}</h3>

      <slot />
    </div>

    <form method="dialog" class="modal-backdrop">
      <button aria-label="Cerrar">cerrar</button>
    </form>
  </dialog>
</template>
