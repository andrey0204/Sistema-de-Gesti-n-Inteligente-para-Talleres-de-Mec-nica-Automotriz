<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import { assignMechanic } from '@/api/work-orders'
import { listMechanics } from '@/api/users'
import { getErrorMessage } from '@/lib/http'
import { useToast } from '@/composables/useToast'
import type { User, WorkOrder } from '@/types/models'

const props = defineProps<{
  open: boolean
  workOrderId: number
  /** Mecánico asignado actualmente, si lo hay. */
  currentMechanicId: number | null
}>()

const emit = defineEmits<{ close: []; assigned: [workOrder: WorkOrder] }>()

const toast = useToast()

const mechanics = ref<User[]>([])
const loading = ref(false)
const loadError = ref('')

const selectedId = ref('')
const saving = ref(false)

watch(
  () => props.open,
  async (open) => {
    if (!open) return

    selectedId.value = props.currentMechanicId ? String(props.currentMechanicId) : ''

    if (mechanics.value.length > 0) return

    loading.value = true
    loadError.value = ''
    try {
      mechanics.value = await listMechanics()
    } catch (error) {
      loadError.value = getErrorMessage(error, 'No se pudo cargar la lista de mecánicos')
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)

async function save(): Promise<void> {
  if (!selectedId.value) return

  saving.value = true
  try {
    const workOrder = await assignMechanic(props.workOrderId, Number(selectedId.value))
    toast.success('Mecánico asignado correctamente')
    emit('assigned', workOrder)
  } catch (error) {
    toast.error(getErrorMessage(error, 'No se pudo asignar el mecánico'))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <BaseModal :open="open" title="Asignar mecánico" @close="emit('close')">
    <div class="mt-4 flex flex-col gap-3">
      <div v-if="loading" class="flex justify-center py-6">
        <span class="loading loading-spinner"></span>
      </div>

      <p v-else-if="loadError" class="text-sm text-error">{{ loadError }}</p>

      <p v-else-if="mechanics.length === 0" class="text-sm opacity-70">
        No hay mecánicos registrados. Créalos primero en la sección Usuarios.
      </p>

      <div v-else class="form-control">
        <label class="label" for="mechanic">
          <span class="label-text">Mecánico</span>
        </label>
        <select id="mechanic" v-model="selectedId" class="select select-bordered w-full">
          <option value="" disabled>Selecciona un mecánico</option>
          <option v-for="mechanic in mechanics" :key="mechanic.id" :value="String(mechanic.id)">
            {{ mechanic.fullName }}
          </option>
        </select>
      </div>

      <!-- El backend no ofrece forma de desasignar: solo se puede sustituir. -->
      <p v-if="currentMechanicId !== null" class="text-xs opacity-70">
        Al guardar se sustituye el mecánico asignado actualmente.
      </p>

      <div class="modal-action">
        <button type="button" class="btn btn-ghost" :disabled="saving" @click="emit('close')">
          Cancelar
        </button>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="saving || !selectedId"
          @click="save"
        >
          <span v-if="saving" class="loading loading-spinner loading-sm"></span>
          Asignar
        </button>
      </div>
    </div>
  </BaseModal>
</template>
