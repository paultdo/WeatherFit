<script setup>
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const logout = async () => {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-6">
          <RouterLink to="/" class="text-lg font-semibold text-gray-900">WeatherFit</RouterLink>
          <nav class="hidden sm:flex items-center gap-4 text-gray-600">
            <RouterLink to="/" class="hover:text-gray-900">Home</RouterLink>
            <RouterLink to="/profile" class="hover:text-gray-900">Profile</RouterLink>
          </nav>
        </div>
        <div class="flex items-center gap-3">
          <template v-if="auth.user">
            <span class="text-sm text-gray-600">Hi, {{ auth.user.username }}</span>
            <button @click="logout" class="rounded-md bg-gray-200 hover:bg-gray-300 px-3 py-1.5 text-sm">Logout</button>
          </template>
          <template v-else>
            <RouterLink to="/login" class="text-sm text-indigo-600 hover:text-indigo-500">Login</RouterLink>
            <RouterLink to="/register" class="text-sm text-indigo-600 hover:text-indigo-500">Register</RouterLink>
          </template>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto p-4">
      <RouterView />
    </main>
  </div>
  
</template>

<style scoped>
</style>
