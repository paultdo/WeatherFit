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
    <!-- WeatherFit Welcome Message for weather and personalized reccomendations for outfits -->
    <p class="text-gray-600 text-center max-w-md">Your personal weather companion that helps you dress appropriately for the weather conditions. Get real-time weather updates and outfit suggestions tailored to your location.</p>
    <RouterLink to="/profile" class="mt-4 rounded-md bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-white text-sm">Get Started</RouterLink>

  </div>
</template>
