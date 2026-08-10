<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ClientFormModal from './ClientFormModal.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import PaginationControls from '@/components/PaginationControls.vue'
import { deleteClient, listClients } from '@/api/clients'
import { getErrorMessage } from '@/lib/http'
import { documentTypeLabels } from '@/lib/labels'
import { useToast } from '@/composables/useToast'
import type { PaginationMeta } from '@/types/api'
import type { Client } from '@/types/models'

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 350

const route = useRoute()
const router = useRouter()
const toast = useToast()

const clients = ref<Client[]>([])
const meta = ref<PaginationMeta>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 })
const loading = ref(false)
const loadError = ref('')

// Se inicializan desde la URL para que recargar la página mantenga el listado.
const search = ref(typeof route.query.search === 'string' ? route.query.search : '')
const page = ref(Number(route.query.page) > 0 ? Number(route.query.page) : 1)

const formOpen = ref(false)
const editingClient = ref<Client | null>(null)

const clientToDelete = ref<Client | null>(null)
const deleting = ref(false)

let searchTimer: number | undefined

async function load(): Promise<void> {
  loading.value = true
  loadError.value = ''
  try {
    const result = await listClients({
      page: page.value,
      limit: PAGE_SIZE,
      search: search.value.trim() || undefined,
    })
    clients.value = result.clients
    meta.value = result.meta
  } catch (error) {
    loadError.value = getErrorMessage(error, 'No se pudieron cargar los clientes')
  } finally {
    loading.value = false
  }
}

/** Guarda el estado del listado en la URL y recarga los datos. */
function reload(): void {
  const query: Record<string, string> = {}
  if (page.value > 1) query.page = String(page.value)
  if (search.value.trim()) query.search = search.value.trim()

  router.replace({ query })
  load()
}

function onSearchInput(): void {
  clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => {
    page.value = 1
    reload()
  }, SEARCH_DEBOUNCE_MS)
}

function goToPage(next: number): void {
  page.value = next
  reload()
}

function openCreate(): void {
  editingClient.value = null
  formOpen.value = true
}

function openEdit(client: Client): void {
  editingClient.value = client
  formOpen.value = true
}

function onSaved(): void {
  const wasCreating = editingClient.value === null
  formOpen.value = false

  // Un cliente nuevo aparece primero (el backend ordena por fecha descendente).
  if (wasCreating) page.value = 1
  reload()
}

async function confirmDelete(): Promise<void> {
  const client = clientToDelete.value
  if (!client) return

  deleting.value = true
  try {
    await deleteClient(client.id)
    toast.success('Cliente eliminado correctamente')
    clientToDelete.value = null

    // Si era el último de la página, se retrocede para no quedar en una vacía.
    if (clients.value.length === 1 && page.value > 1) page.value -= 1
    reload()
  } catch (error) {
    toast.error(getErrorMessage(error, 'No se pudo eliminar el cliente'))
  } finally {
    deleting.value = false
  }
}

onMounted(load)
onBeforeUnmount(() => clearTimeout(searchTimer))
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <label class="input input-bordered flex w-full items-center gap-2 sm:max-w-xs">
        <span class="opacity-60">🔍</span>
        <input
          v-model="search"
          type="search"
          class="grow"
          placeholder="Buscar por nombre, teléfono o documento"
          @input="onSearchInput"
        />
      </label>

      <button type="button" class="btn btn-primary" @click="openCreate">Nuevo cliente</button>
    </div>

    <div v-if="loadError" role="alert" class="alert alert-error">
      <span>{{ loadError }}</span>
      <button type="button" class="btn btn-sm" @click="load">Reintentar</button>
    </div>

    <div class="card bg-base-100 shadow-sm">
      <div class="card-body gap-4 p-0 sm:p-4">
        <div v-if="loading" class="flex justify-center py-12">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <div v-else-if="clients.length === 0" class="px-4 py-12 text-center">
          <div class="text-4xl">👥</div>
          <p class="mt-3 font-medium">
            {{ search.trim() ? 'Sin resultados para esta búsqueda' : 'Aún no hay clientes registrados' }}
          </p>
          <p class="mt-1 text-sm opacity-70">
            {{
              search.trim()
                ? 'Prueba con otro nombre, teléfono o número de documento.'
                : 'Crea el primero con el botón «Nuevo cliente».'
            }}
          </p>
        </div>

        <template v-else>
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Documento</th>
                  <th>Teléfono</th>
                  <th>Correo</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="client in clients" :key="client.id" class="hover">
                  <td class="font-medium">{{ client.fullName }}</td>
                  <td>
                    <span class="badge badge-ghost badge-sm">{{ client.documentType }}</span>
                    {{ client.documentNumber }}
                    <span class="sr-only">{{ documentTypeLabels[client.documentType] }}</span>
                  </td>
                  <td>{{ client.phone }}</td>
                  <td>{{ client.email ?? '—' }}</td>
                  <td>
                    <div class="flex justify-end gap-1">
                      <button type="button" class="btn btn-ghost btn-xs" @click="openEdit(client)">
                        Editar
                      </button>
                      <button
                        type="button"
                        class="btn btn-ghost btn-xs text-error"
                        @click="clientToDelete = client"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="px-4 pb-4 sm:px-0 sm:pb-0">
            <PaginationControls :meta="meta" @change="goToPage" />
          </div>
        </template>
      </div>
    </div>

    <ClientFormModal
      :open="formOpen"
      :client="editingClient"
      @close="formOpen = false"
      @saved="onSaved"
    />

    <ConfirmDialog
      :open="clientToDelete !== null"
      title="Eliminar cliente"
      :message="`¿Seguro que deseas eliminar a ${clientToDelete?.fullName}? Podrás seguir consultando sus órdenes anteriores.`"
      confirm-label="Eliminar"
      :loading="deleting"
      @close="clientToDelete = null"
      @confirm="confirmDelete"
    />
  </div>
</template>
