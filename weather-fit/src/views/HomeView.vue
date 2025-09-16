<script setup>
import { useAuthStore } from '@/stores/auth'
import { RouterLink } from 'vue-router'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

const logout = async () => {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-[60vh] flex flex-col items-center justify-center gap-6">
    <h1 class="text-3xl font-semibold text-gray-900">Welcome{{ auth.user ? `, ${auth.user.username}` : '' }}!</h1>
    <p class="text-gray-600">This home page is protected and only visible when logged in.</p>
    <div class="flex items-center gap-3">
      <button @click="logout" class="rounded-md bg-gray-200 hover:bg-gray-300 px-4 py-2">Logout</button>
      <RouterLink to="/about" class="text-indigo-600 hover:text-indigo-500">Go to About</RouterLink>
    </div>
  </div>
</template>
