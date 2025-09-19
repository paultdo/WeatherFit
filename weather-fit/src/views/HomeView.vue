<script setup>
import { useAuthStore } from '@/stores/auth'
import { RouterLink } from 'vue-router'

const auth = useAuthStore()
</script>

<template>
  <div class="min-h-[70vh] flex flex-col justify-center">
    <section class="grid gap-10 lg:grid-cols-[2fr,3fr] items-center">
      <div class="space-y-6">
        <span class="inline-flex items-center gap-2 rounded-full bg-indigo-100 text-indigo-700 px-3 py-1 text-sm font-medium">
          <span class="h-2 w-2 rounded-full bg-indigo-500"></span>
          Dress smart for every forecast
        </span>
        <h1 class="text-4xl sm:text-5xl font-semibold text-gray-900 leading-tight">
          Hi{{ auth.user ? `, ${auth.user.username}` : '' }}. Get weather-aware outfit tips in seconds.
        </h1>
        <p class="text-gray-600 text-lg max-w-xl">
          WeatherFit keeps you ahead of the forecast with realtime updates, future-hour insights, and wardrobe guidance built around your saved locations.
        </p>
        <div class="flex flex-wrap items-center gap-3">
          <RouterLink
            to="/today"
            class="inline-flex items-center rounded-md bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-white font-medium transition"
          >
            Check Today
          </RouterLink>
          <RouterLink to="/locations" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            Manage Locations
          </RouterLink>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="rounded-2xl bg-white shadow-sm border border-gray-100 p-6 space-y-3">
          <div class="flex items-center gap-3">
            <span class="h-10 w-10 flex items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-lg font-semibold">1</span>
            <h2 class="text-lg font-semibold text-gray-900">Realtime Forecasts</h2>
          </div>
          <p class="text-sm text-gray-600">
            Pull the latest conditions and see what the next 12 hours have in store without leaving the dashboard.
          </p>
        </div>

        <div class="rounded-2xl bg-white shadow-sm border border-gray-100 p-6 space-y-3">
          <div class="flex items-center gap-3">
            <span class="h-10 w-10 flex items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-lg font-semibold">2</span>
            <h2 class="text-lg font-semibold text-gray-900">Smart Outfit Tips</h2>
          </div>
          <p class="text-sm text-gray-600">
            Recommendations adapt to rain, wind, and temperature swings so you always step out prepared.
          </p>
        </div>

        <div class="rounded-2xl bg-white shadow-sm border border-gray-100 p-6 space-y-3">
          <div class="flex items-center gap-3">
            <span class="h-10 w-10 flex items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-lg font-semibold">3</span>
            <h2 class="text-lg font-semibold text-gray-900">Favorite Locations</h2>
          </div>
          <p class="text-sm text-gray-600">
            Save your go-to cities and jump between them instantly to plan commutes, workouts, or travel days.
          </p>
        </div>

        <div class="rounded-2xl bg-white shadow-sm border border-gray-100 p-6 space-y-3">
          <div class="flex items-center gap-3">
            <span class="h-10 w-10 flex items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-lg font-semibold">4</span>
            <h2 class="text-lg font-semibold text-gray-900">Personalized Account</h2>
          </div>
          <p class="text-sm text-gray-600">
            Keep recommendations in sync with your profile and adjust preferences whenever plans change.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
</style>
