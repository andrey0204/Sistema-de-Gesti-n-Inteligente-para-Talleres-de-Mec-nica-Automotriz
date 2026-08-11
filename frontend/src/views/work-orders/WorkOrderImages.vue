<script setup lang="ts">
/** Galería de fotos de la orden (estado del vehículo, daños, repuestos…). */
import { onMounted, ref, useTemplateRef } from 'vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { deleteImage, imageUrl, listImages, uploadImage } from '@/api/work-order-images'
import { getErrorMessage } from '@/lib/http'
import { formatDateTime } from '@/lib/format'
import { useToast } from '@/composables/useToast'
import type { WorkOrderImage } from '@/types/models'

const props = defineProps<{
  workOrderId: number
  /** Subir puede cualquiera; borrar, solo ADMIN (lo impone el backend). */
  canDelete: boolean
}>()

const toast = useToast()

const images = ref<WorkOrderImage[]>([])
const loading = ref(false)
const loadError = ref('')

const uploading = ref(false)
const fileInput = useTemplateRef<HTMLInputElement>('fileInput')

const imageToDelete = ref<WorkOrderImage | null>(null)
const deleting = ref(false)

async function load(): Promise<void> {
  loading.value = true
  loadError.value = ''
  try {
    images.value = await listImages(props.workOrderId)
  } catch (error) {
    loadError.value = getErrorMessage(error, 'No se pudieron cargar las imágenes')
  } finally {
    loading.value = false
  }
}

async function onFileSelected(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploading.value = true
  try {
    await uploadImage(props.workOrderId, file)
    toast.success('Imagen subida correctamente')
    load()
  } catch (error) {
    toast.error(getErrorMessage(error, 'No se pudo subir la imagen'))
  } finally {
    uploading.value = false
    // Se limpia el input para poder volver a elegir el mismo archivo.
    if (fileInput.value) fileInput.value.value = ''
  }
}

async function confirmDelete(): Promise<void> {
  const image = imageToDelete.value
  if (!image) return

  deleting.value = true
  try {
    await deleteImage(props.workOrderId, image.id)
    toast.success('Imagen eliminada correctamente')
    imageToDelete.value = null
    load()
  } catch (error) {
    toast.error(getErrorMessage(error, 'No se pudo eliminar la imagen'))
  } finally {
    deleting.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="card bg-base-100 shadow-sm">
    <div class="card-body gap-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="card-title text-base">Imágenes</h2>

        <label class="flex items-center gap-2">
          <span v-if="uploading" class="loading loading-spinner loading-sm"></span>
          <input
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            class="file-input file-input-bordered file-input-sm"
            :disabled="uploading"
            aria-label="Subir imagen"
            @change="onFileSelected"
          />
        </label>
      </div>

      <div v-if="loadError" role="alert" class="alert alert-error">
        <span>{{ loadError }}</span>
        <button type="button" class="btn btn-sm" @click="load">Reintentar</button>
      </div>

      <div v-if="loading" class="flex justify-center py-6">
        <span class="loading loading-spinner"></span>
      </div>

      <p v-else-if="images.length === 0" class="py-4 text-sm opacity-70">
        Aún no hay imágenes. Se admiten JPEG, PNG, WebP y GIF.
      </p>

      <ul v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <li v-for="image in images" :key="image.id" class="group relative">
          <a :href="imageUrl(image)" target="_blank" rel="noopener" class="block">
            <img
              :src="imageUrl(image)"
              :alt="image.originalName"
              loading="lazy"
              class="h-32 w-full rounded-lg border border-base-300 object-cover"
            />
          </a>
          <p class="mt-1 truncate text-xs opacity-70" :title="image.originalName">
            {{ image.originalName }}
          </p>
          <p class="text-xs opacity-50">{{ formatDateTime(image.createdAt) }}</p>

          <button
            v-if="canDelete"
            type="button"
            class="btn btn-circle btn-error btn-xs absolute right-1 top-1"
            :aria-label="`Eliminar ${image.originalName}`"
            @click="imageToDelete = image"
          >
            ✕
          </button>
        </li>
      </ul>
    </div>

    <ConfirmDialog
      :open="imageToDelete !== null"
      title="Eliminar imagen"
      :message="`¿Seguro que deseas eliminar «${imageToDelete?.originalName}»? El archivo se borra del servidor.`"
      confirm-label="Eliminar"
      :loading="deleting"
      @close="imageToDelete = null"
      @confirm="confirmDelete"
    />
  </div>
</template>
