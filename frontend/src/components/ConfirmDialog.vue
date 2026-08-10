<script setup lang="ts">
import BaseModal from './BaseModal.vue'

withDefaults(
  defineProps<{
    open: boolean
    title: string
    message: string
    confirmLabel?: string
    loading?: boolean
  }>(),
  { confirmLabel: 'Confirmar', loading: false },
)

const emit = defineEmits<{ confirm: []; close: [] }>()
</script>

<template>
  <BaseModal :open="open" :title="title" @close="emit('close')">
    <p class="py-4">{{ message }}</p>

    <div class="modal-action">
      <button type="button" class="btn btn-ghost" :disabled="loading" @click="emit('close')">
        Cancelar
      </button>
      <button type="button" class="btn btn-error" :disabled="loading" @click="emit('confirm')">
        <span v-if="loading" class="loading loading-spinner loading-sm"></span>
        {{ confirmLabel }}
      </button>
    </div>
  </BaseModal>
</template>
