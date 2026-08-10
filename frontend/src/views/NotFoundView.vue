<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="hero min-h-screen bg-base-200">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <div class="text-6xl">🧭</div>
        <h1 class="mt-4 text-3xl font-bold">Página no encontrada</h1>
        <p class="mt-2 opacity-70">La dirección que intentas abrir no existe.</p>
        <RouterLink :to="{ name: 'dashboard' }" class="btn btn-primary mt-6">
          Volver al panel
        </RouterLink>
      </div>
    </div>
  </div>
</template>
