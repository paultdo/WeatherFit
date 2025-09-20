<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/lib/api'

const auth = useAuthStore()

const city = ref('')
const loading = ref(false)
const error = ref('')
const place = ref(null) // { name, country }
const current = ref(null) // { temperature_2m, wind_speed_10m, relative_humidity_2m, precipitation }
const recommendations = ref([]);

async function getWeather(e) {
  // clear previous results
  e?.preventDefault?.()
  error.value = ''
  current.value = null
  place.value = null
  recommendations.value = []

  if (!city.value.trim()) {
    error.value = 'Please enter a city name'
    return
  }
  try {
    loading.value = true
    // Geocode city to coordinates
    const geo = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
      params: { name: city.value.trim(), count: 1, language: 'en', format: 'json', countryCode: 'US' },
    })
    const result = geo.data?.results?.[0]
    if (!result) {
      throw new Error('City not found')
    }
    place.value = { name: result.name, country: result.country, lat: result.latitude, lon: result.longitude }

    // Fetch current weather
    const weather = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: result.latitude,
        longitude: result.longitude,
        current: 'temperature_2m,precipitation,wind_speed_10m,relative_humidity_2m,precipitation_probability',
        temperature_unit: 'fahrenheit',
        windspeed_unit: 'mph',
        timezone: 'auto',
      },
    })
    current.value = weather.data?.current
    console.log(current.value)

    // Fetch weather recommendations
    const recommendationsData = await api.post('http://localhost:3000/api/weather/recommendation', {
      ...current.value,
      humidity: current.value.relative_humidity_2m,
    })
    recommendations.value = recommendationsData.data.recommendations;
    console.log(recommendations.value)
  } catch (e) {
    error.value = e?.response?.data?.reason || e.message || 'Failed to fetch weather'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // Fetch user's default location
  api.get(`locations/user/default/${auth.user?.id}`)
    .then(response => {
      city.value = response.data?.city || '';
      if (city.value) {
        getWeather();
      }
    })
    .catch(error => {
      console.error('Error fetching default location:', error);
    });
});

</script>

<template>
  <div class="max-w-3xl mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-900">Profile</h1>
      <p class="text-sm text-gray-600">View your account info and check the weather.</p>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
      <!-- User Card -->
      <div class="bg-white rounded-xl shadow p-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">Account</h2>
        <div class="space-y-2 text-sm text-gray-700">
          <div><span class="text-gray-500">Username:</span> <span class="ml-1 font-medium">{{ auth.user?.username }}</span></div>
          <div><span class="text-gray-500">Email:</span> <span class="ml-1 font-medium">{{ auth.user?.email }}</span></div>
        </div>
      </div>

      <!-- Weather Card -->
      <div class="bg-white rounded-xl shadow p-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">Weather</h2>

        <form @submit="getWeather" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"><strong>Default City</strong></label>
            <input
              v-model="city"
              type="text"
              placeholder="e.g., San Francisco"
              class="block w-full rounded-md px-3 py-2 bg-white text-gray-900 placeholder:text-gray-400 ring-1 ring-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              disabled
            />
          </div>
          <!-- <button
            type="submit"
            :disabled="loading"
            class="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            <span v-if="!loading">Get Weather</span>
            <span v-else>Loading...</span>
          </button> -->
        </form>

        <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>

        <div v-if="current" class="mt-6">
          <div class="text-sm text-gray-500">{{ place?.name }}<span v-if="place?.country">, {{ place.country }}</span></div>
          <div class="mt-2 grid grid-cols-2 gap-4 text-gray-900">
            <div class="rounded-lg ring-1 ring-gray-200 p-3">
              <div class="text-xs text-gray-500">Temperature</div>
              <div class="text-xl font-semibold">{{ current.temperature_2m }}°F</div>
            </div>
            <div class="rounded-lg ring-1 ring-gray-200 p-3">
              <div class="text-xs text-gray-500">Humidity</div>
              <div class="text-xl font-semibold">{{ current.relative_humidity_2m }}%</div>
            </div>
            <div class="rounded-lg ring-1 ring-gray-200 p-3">
              <div class="text-xs text-gray-500">Wind</div>
              <div class="text-xl font-semibold">{{ current.wind_speed_10m }} mph</div>
            </div>
            <div class="rounded-lg ring-1 ring-gray-200 p-3">
              <div class="text-xs text-gray-500">Precipitation Chance</div>
              <div class="text-xl font-semibold">{{ current.precipitation_probability }}%</div>
            </div>
          </div>
        </div>

        <div v-if="recommendations.length" class="mt-6">
          <h3 class="text-md font-medium text-gray-900 mb-2">Outfit Recommendations</h3>
          <ul class="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li v-for="(recommendation, index) in recommendations" :key="index">{{ recommendation }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
