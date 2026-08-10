<script setup lang="ts">
import { computed } from 'vue'
import type { PaginationMeta } from '@/types/api'

const props = defineProps<{ meta: PaginationMeta }>()
const emit = defineEmits<{ change: [page: number] }>()

const from = computed(() => (props.meta.total === 0 ? 0 : (props.meta.page - 1) * props.meta.limit + 1))
const to = computed(() => Math.min(props.meta.page * props.meta.limit, props.meta.total))

function go(page: number): void {
  if (page >= 1 && page <= props.meta.totalPages && page !== props.meta.page) {
    emit('change', page)
  }
}
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3">
    <p class="text-sm opacity-70">
      Mostrando {{ from }}–{{ to }} de {{ meta.total }}
    </p>

    <div class="join">
      <button
        type="button"
        class="btn join-item btn-sm"
        :disabled="meta.page <= 1"
        @click="go(meta.page - 1)"
      >
        «
      </button>
      <button type="button" class="btn join-item btn-sm pointer-events-none">
        Página {{ meta.page }} de {{ Math.max(meta.totalPages, 1) }}
      </button>
      <button
        type="button"
        class="btn join-item btn-sm"
        :disabled="meta.page >= meta.totalPages"
        @click="go(meta.page + 1)"
      >
        »
      </button>
    </div>
  </div>
</template>
