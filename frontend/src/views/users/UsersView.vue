<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import UserFormModal from './UserFormModal.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import PaginationControls from '@/components/PaginationControls.vue'
import { deleteUser, listUsers } from '@/api/users'
import { getErrorMessage } from '@/lib/http'
import { roleBadges, roleLabels } from '@/lib/labels'
import { formatDate } from '@/lib/format'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import type { PaginationMeta } from '@/types/api'
import type { Role, User } from '@/types/models'

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 350

const route = useRoute()
const router = useRouter()
const toast = useToast()
const auth = useAuthStore()

const users = ref<User[]>([])
const meta = ref<PaginationMeta>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 })
const loading = ref(false)
const loadError = ref('')

/** Lee el rol de la URL descartando cualquier valor que no sea válido. */
function readRoleFromQuery(): Role | '' {
  const value = route.query.rol
  if (typeof value !== 'string') return ''
  return value in roleLabels ? (value as Role) : ''
}

// Se inicializan desde la URL para que recargar la página mantenga el listado.
const search = ref(typeof route.query.search === 'string' ? route.query.search : '')
const role = ref<Role | ''>(readRoleFromQuery())
const page = ref(Number(route.query.page) > 0 ? Number(route.query.page) : 1)

const formOpen = ref(false)
const editingUser = ref<User | null>(null)

const userToDelete = ref<User | null>(null)
const deleting = ref(false)

let searchTimer: number | undefined

/**
 * Desactivarse a uno mismo dejaría la sesión sin cuenta detrás: el access token
 * seguiría valiendo hasta caducar y luego no habría forma de volver a entrar.
 * El backend no lo valida, así que se bloquea aquí.
 */
function isOwnAccount(user: User): boolean {
  return user.id === auth.user?.id
}

async function load(): Promise<void> {
  loading.value = true
  loadError.value = ''
  try {
    const result = await listUsers({
      page: page.value,
      limit: PAGE_SIZE,
      search: search.value.trim() || undefined,
      role: role.value || undefined,
    })
    users.value = result.users
    meta.value = result.meta
  } catch (error) {
    loadError.value = getErrorMessage(error, 'No se pudieron cargar los usuarios')
  } finally {
    loading.value = false
  }
}

/** Guarda el estado del listado en la URL y recarga los datos. */
function reload(): void {
  const query: Record<string, string> = {}
  if (page.value > 1) query.page = String(page.value)
  if (search.value.trim()) query.search = search.value.trim()
  if (role.value) query.rol = role.value

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

function onRoleChange(): void {
  page.value = 1
  reload()
}

function goToPage(next: number): void {
  page.value = next
  reload()
}

function openCreate(): void {
  editingUser.value = null
  formOpen.value = true
}

function openEdit(user: User): void {
  editingUser.value = user
  formOpen.value = true
}

function onSaved(): void {
  const wasCreating = editingUser.value === null
  formOpen.value = false

  // Un usuario nuevo aparece primero (el backend ordena por fecha descendente).
  if (wasCreating) page.value = 1
  reload()
}

async function confirmDelete(): Promise<void> {
  const user = userToDelete.value
  if (!user) return

  deleting.value = true
  try {
    await deleteUser(user.id)
    toast.success('Usuario desactivado correctamente')
    userToDelete.value = null

    // Si era el último de la página, se retrocede para no quedar en una vacía.
    if (users.value.length === 1 && page.value > 1) page.value -= 1
    reload()
  } catch (error) {
    toast.error(getErrorMessage(error, 'No se pudo desactivar el usuario'))
  } finally {
    deleting.value = false
  }
}

onMounted(load)
onBeforeUnmount(() => clearTimeout(searchTimer))
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div class="flex flex-wrap items-end gap-3">
        <div class="form-control">
          <label class="label" for="userSearch">
            <span class="label-text">Buscar</span>
          </label>
          <label class="input input-bordered flex w-full items-center gap-2 sm:w-72">
            <span class="opacity-60">🔍</span>
            <input
              id="userSearch"
              v-model="search"
              type="search"
              class="grow"
              placeholder="Nombre o correo"
              @input="onSearchInput"
            />
          </label>
        </div>

        <div class="form-control">
          <label class="label" for="roleFilter">
            <span class="label-text">Rol</span>
          </label>
          <select
            id="roleFilter"
            v-model="role"
            class="select select-bordered"
            @change="onRoleChange"
          >
            <option value="">Todos</option>
            <option v-for="(label, value) in roleLabels" :key="value" :value="value">
              {{ label }}
            </option>
          </select>
        </div>
      </div>

      <button type="button" class="btn btn-primary" @click="openCreate">Nuevo usuario</button>
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

        <div v-else-if="users.length === 0" class="px-4 py-12 text-center">
          <div class="text-4xl">⚙️</div>
          <p class="mt-3 font-medium">
            {{
              search.trim() || role
                ? 'Sin usuarios con estos filtros'
                : 'Aún no hay usuarios registrados'
            }}
          </p>
          <p class="mt-1 text-sm opacity-70">
            {{
              search.trim() || role
                ? 'Prueba con otro nombre, correo u otro rol.'
                : 'Crea el primero con el botón «Nuevo usuario».'
            }}
          </p>
        </div>

        <template v-else>
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Registrado</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.id" class="hover">
                  <td class="font-medium">
                    {{ user.fullName }}
                    <span v-if="isOwnAccount(user)" class="badge badge-ghost badge-sm ml-1">
                      Tú
                    </span>
                  </td>
                  <td>{{ user.email }}</td>
                  <td>
                    <span class="badge badge-sm" :class="roleBadges[user.role]">
                      {{ roleLabels[user.role] }}
                    </span>
                  </td>
                  <td>{{ formatDate(user.createdAt) }}</td>
                  <td>
                    <div class="flex justify-end gap-1">
                      <button type="button" class="btn btn-ghost btn-xs" @click="openEdit(user)">
                        Editar
                      </button>
                      <!-- `text-error` solo cuando está activo: si no, el rojo
                           pisa el estilo de deshabilitado y parece pulsable. -->
                      <button
                        type="button"
                        class="btn btn-ghost btn-xs"
                        :class="{ 'text-error': !isOwnAccount(user) }"
                        :disabled="isOwnAccount(user)"
                        :title="
                          isOwnAccount(user) ? 'No puedes desactivar tu propia cuenta' : undefined
                        "
                        @click="userToDelete = user"
                      >
                        Desactivar
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

    <UserFormModal :open="formOpen" :user="editingUser" @close="formOpen = false" @saved="onSaved" />

    <ConfirmDialog
      :open="userToDelete !== null"
      title="Desactivar usuario"
      :message="`¿Seguro que deseas desactivar a ${userToDelete?.fullName}? Dejará de poder iniciar sesión y no aparecerá en el listado, pero su historial de órdenes se conserva.`"
      confirm-label="Desactivar"
      :loading="deleting"
      @close="userToDelete = null"
      @confirm="confirmDelete"
    />
  </div>
</template>
