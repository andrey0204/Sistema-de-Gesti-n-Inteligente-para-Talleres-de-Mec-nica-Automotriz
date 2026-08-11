<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import ToastHost from '@/components/ToastHost.vue'
import { useAuthStore } from '@/stores/auth'
import { roleLabels } from '@/lib/labels'
import type { Role } from '@/types/models'

interface NavItem {
  name: string
  label: string
  icon: string
  roles?: Role[]
}

const NAV_ITEMS: NavItem[] = [
  { name: 'dashboard', label: 'Panel principal', icon: '🏠' },
  { name: 'clients', label: 'Clientes', icon: '👥', roles: ['ADMIN', 'RECEPTIONIST'] },
  { name: 'vehicles', label: 'Vehículos', icon: '🚗', roles: ['ADMIN', 'RECEPTIONIST'] },
  { name: 'work-orders', label: 'Órdenes de trabajo', icon: '🔧' },
  { name: 'reminders', label: 'Recordatorios', icon: '🔔' },
  { name: 'reports', label: 'Reportes', icon: '📊', roles: ['ADMIN'] },
  { name: 'users', label: 'Usuarios', icon: '⚙️', roles: ['ADMIN'] },
]

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const drawerOpen = ref(false)

const navItems = computed(() => NAV_ITEMS.filter((item) => !item.roles || auth.hasRole(...item.roles)))

/**
 * Marca activa la sección también en sus rutas hijas: el detalle de una orden
 * se llama `work-orders-detail`, así que basta con comparar el prefijo.
 */
function isActive(name: string): boolean {
  const current = String(route.name ?? '')
  return current === name || current.startsWith(`${name}-`)
}
const pageTitle = computed(() => route.meta.title ?? 'Taller')
const initials = computed(() =>
  (auth.user?.fullName ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join(''),
)

async function handleLogout(): Promise<void> {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="drawer lg:drawer-open">
    <input id="app-drawer" v-model="drawerOpen" type="checkbox" class="drawer-toggle" />

    <div class="drawer-content flex min-h-screen flex-col bg-base-200">
      <header class="navbar sticky top-0 z-20 border-b border-base-300 bg-base-100">
        <div class="flex-none lg:hidden">
          <label for="app-drawer" class="btn btn-square btn-ghost" aria-label="Abrir menú">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </label>
        </div>

        <div class="flex-1 px-2">
          <h1 class="text-lg font-semibold">{{ pageTitle }}</h1>
        </div>

        <div class="flex-none">
          <div class="dropdown dropdown-end">
            <div tabindex="0" role="button" class="btn btn-ghost gap-2">
              <span class="avatar avatar-placeholder">
                <span class="w-8 rounded-full bg-primary text-primary-content">
                  <span class="text-xs">{{ initials }}</span>
                </span>
              </span>
              <span class="hidden text-left sm:block">
                <span class="block text-sm leading-tight">{{ auth.user?.fullName }}</span>
                <span class="block text-xs leading-tight opacity-60">
                  {{ auth.role ? roleLabels[auth.role] : '' }}
                </span>
              </span>
            </div>
            <ul tabindex="0" class="dropdown-content menu z-30 w-52 rounded-box bg-base-100 p-2 shadow">
              <li class="menu-title">{{ auth.user?.email }}</li>
              <li><button type="button" @click="handleLogout">Cerrar sesión</button></li>
            </ul>
          </div>
        </div>
      </header>

      <main class="flex-1 p-4 lg:p-6">
        <RouterView />
      </main>

      <ToastHost />
    </div>

    <aside class="drawer-side z-30">
      <label for="app-drawer" class="drawer-overlay" aria-label="Cerrar menú"></label>
      <nav class="flex min-h-full w-64 flex-col bg-base-100 lg:border-r lg:border-base-300">
        <div class="flex items-center gap-2 border-b border-base-300 px-4 py-4">
          <span class="text-2xl">🔧</span>
          <span class="text-base font-bold">Taller Mecánico</span>
        </div>

        <ul class="menu w-full flex-1 gap-1 p-2">
          <li v-for="item in navItems" :key="item.name">
            <RouterLink
              :to="{ name: item.name }"
              :class="{ 'menu-active': isActive(item.name) }"
              @click="drawerOpen = false"
            >
              <span>{{ item.icon }}</span>
              {{ item.label }}
            </RouterLink>
          </li>
        </ul>
      </nav>
    </aside>
  </div>
</template>
