<script setup lang="ts">
import { useRoute } from 'vue-router'

// Vista temporal: cada módulo la irá reemplazando por su pantalla real.
const route = useRoute()
</script>

<template>
  <div class="hero rounded-box bg-base-100 py-16">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <div class="text-5xl">🚧</div>
        <h2 class="mt-4 text-2xl font-bold">{{ route.meta.title }}</h2>
        <p class="mt-2 opacity-70">Este módulo está en construcción.</p>
      </div>
    </div>
  </div>
</template>
