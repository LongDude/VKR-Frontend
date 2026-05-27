<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView, useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  void router.isReady().then(() => {
    requestAnimationFrame(() => {
      document.getElementById('app-preloader')?.remove()
    })
  })
})
</script>

<template>
  <RouterView />
</template>
