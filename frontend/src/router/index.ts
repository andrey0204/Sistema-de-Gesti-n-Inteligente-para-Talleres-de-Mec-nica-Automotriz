import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { Role } from '@/types/models'

declare module 'vue-router' {
  interface RouteMeta {
    /** Requiere sesión iniciada. */
    requiresAuth?: boolean
    /** Roles autorizados; si se omite, cualquier rol autenticado entra. */
    roles?: Role[]
    /** Título mostrado en la barra superior y en `document.title`. */
    title?: string
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { title: 'Iniciar sesión' },
    },
    {
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
          meta: { title: 'Panel principal' },
        },
        {
          path: 'clientes',
          name: 'clients',
          component: () => import('@/views/clients/ClientsView.vue'),
          meta: { title: 'Clientes', roles: ['ADMIN', 'RECEPTIONIST'] },
        },
        {
          path: 'vehiculos',
          name: 'vehicles',
          component: () => import('@/views/PlaceholderView.vue'),
          meta: { title: 'Vehículos', roles: ['ADMIN', 'RECEPTIONIST'] },
        },
        {
          path: 'ordenes',
          name: 'work-orders',
          component: () => import('@/views/PlaceholderView.vue'),
          meta: { title: 'Órdenes de trabajo' },
        },
        {
          path: 'recordatorios',
          name: 'reminders',
          component: () => import('@/views/PlaceholderView.vue'),
          meta: { title: 'Recordatorios' },
        },
        {
          path: 'reportes',
          name: 'reports',
          component: () => import('@/views/PlaceholderView.vue'),
          meta: { title: 'Reportes', roles: ['ADMIN'] },
        },
        {
          path: 'usuarios',
          name: 'users',
          component: () => import('@/views/PlaceholderView.vue'),
          meta: { title: 'Usuarios', roles: ['ADMIN'] },
        },
      ],
    },
    {
      path: '/sin-permiso',
      name: 'forbidden',
      component: () => import('@/views/ForbiddenView.vue'),
      meta: { title: 'Acceso denegado' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: 'Página no encontrada' },
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.name === 'login' && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }

  if (to.meta.roles && !auth.hasRole(...to.meta.roles)) {
    return { name: 'forbidden' }
  }

  return true
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · Taller` : 'Taller'
})

export default router
