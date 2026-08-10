<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="hero min-h-screen bg-base-200">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <div class="text-6xl">🔒</div>
        <h1 class="mt-4 text-3xl font-bold">Acceso denegado</h1>
        <p class="mt-2 opacity-70">Tu rol no tiene permiso para ver esta sección.</p>
        <RouterLink :to="{ name: 'dashboard' }" class="btn btn-primary mt-6">
          Volver al panel
        </RouterLink>
      </div>
    </div>
  </div>
</template>
