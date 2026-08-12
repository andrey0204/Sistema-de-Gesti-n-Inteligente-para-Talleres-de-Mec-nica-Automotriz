<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { roleLabels } from '@/lib/labels'
import type { Role } from '@/types/models'

interface Shortcut {
  name: string
  label: string
  description: string
  icon: string
  roles?: Role[]
}

const SHORTCUTS: Shortcut[] = [
  { name: 'clients', label: 'Clientes', description: 'Registro y búsqueda de clientes', icon: '👥', roles: ['ADMIN', 'RECEPTIONIST'] },
  { name: 'vehicles', label: 'Vehículos', description: 'Vehículos asociados a cada cliente', icon: '🚗', roles: ['ADMIN', 'RECEPTIONIST'] },
  { name: 'work-orders', label: 'Órdenes de trabajo', description: 'Seguimiento de reparaciones', icon: '🔧' },
  { name: 'reminders', label: 'Recordatorios', description: 'Mantenimientos programados', icon: '🔔', roles: ['ADMIN', 'RECEPTIONIST'] },
  { name: 'reports', label: 'Reportes', description: 'Indicadores del taller', icon: '📊', roles: ['ADMIN', 'RECEPTIONIST'] },
]

const auth = useAuthStore()

const firstName = computed(() => auth.user?.fullName.split(' ')[0] ?? '')
const shortcuts = computed(() => SHORTCUTS.filter((item) => !item.roles || auth.hasRole(...item.roles)))
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h2 class="card-title">Hola, {{ firstName }} 👋</h2>
        <p class="opacity-70">
          Sesión iniciada como
          <span class="badge badge-primary badge-sm align-middle">
            {{ auth.role ? roleLabels[auth.role] : '' }}
          </span>
        </p>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <RouterLink
        v-for="shortcut in shortcuts"
        :key="shortcut.name"
        :to="{ name: shortcut.name }"
        class="card bg-base-100 shadow-sm transition hover:shadow-md"
      >
        <div class="card-body">
          <span class="text-3xl">{{ shortcut.icon }}</span>
          <h3 class="card-title text-base">{{ shortcut.label }}</h3>
          <p class="text-sm opacity-70">{{ shortcut.description }}</p>
        </div>
      </RouterLink>
    </div>
  </div>
</template>
