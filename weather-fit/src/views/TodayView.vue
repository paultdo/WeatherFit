<script setup>
import { ref, onMounted, watch } from 'vue'
import { api } from '@/lib/api'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const loading = ref(false)
const error = ref('')
const place = ref(null) // { name, country }
const current = ref(null) // { temperature_2m, wind_speed_10m, relative_humidity_2m, precipitation }
const recommendations = ref([])
const forecast = ref([])
const changes = ref([])
const locations = ref([]) // user's saved locations
const selectedLocation = ref(null)

const clothingOutfit = ref([])
const clothingGaps = ref([])
const clothingContext = ref(null)
const clothingLoading = ref(false)

const categoryLabels = {
  top: 'Top',
  bottom: 'Bottom',
  outerwear: 'Outerwear',
  footwear: 'Footwear',
  accessory: 'Accessory',
}

const insulationLabels = {
  light: 'Light',
  medium: 'Medium',
  heavy: 'Heavy',
}

async function fetchLocations() {
  try {
    const res = await api.get(`/locations/${auth.user?.id}`)
    locations.value = res.data.locations
  } catch (e) {
    console.error('Failed to fetch locations', e)
  }
}

function resetClothingSuggestions() {
  clothingOutfit.value = []
  clothingGaps.value = []
  clothingContext.value = null
  clothingLoading.value = false
}

function getPeakPrecipitation(hours) {
  if (!Array.isArray(hours) || !hours.length) {
    return null
  }
  const values = hours
    .map((hour) => Number(hour.precipitation_probability))
    .filter((value) => !Number.isNaN(value))

  if (!values.length) {
    return null
  }

  return Math.max(...values)
}

async function getWeather(e) {
  // clear previous results
  e?.preventDefault?.()
  error.value = ''
  current.value = null
  place.value = null
  recommendations.value = []
  forecast.value = []
  changes.value = []
  resetClothingSuggestions()

  if (!selectedLocation.value?.city?.trim()) {
    error.value = 'Please enter a city name'
    return
  }
  try {
    loading.value = true
    // Geocode city to coordinates
    const geo = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
      params: {
        name: selectedLocation.value.city.trim(),
        count: 1,
        language: 'en',
        format: 'json',
        countryCode: 'US',
      },
    })
    const result = geo.data?.results?.[0]
    if (!result) {
      throw new Error('City not found')
    }
    place.value = {
      name: result.name,
      country: result.country,
      lat: result.latitude,
      lon: result.longitude,
      timezone: result.timezone,
    }

    const forecastResponse = await api.post('/weather/forecast', {
      latitude: result.latitude,
      longitude: result.longitude,
      timezone: result.timezone,
    })

    current.value = forecastResponse.data?.current || null
    recommendations.value = forecastResponse.data?.recommendations || []
    forecast.value = forecastResponse.data?.forecast || []
    changes.value = forecastResponse.data?.changes || []

    clothingLoading.value = true
    try {
      const peakPrecip = getPeakPrecipitation(forecast.value)
      const clothingPayload = {
        temperature: current.value?.temperature_2m,
        humidity: current.value?.relative_humidity_2m,
        precipitation_chance:
          peakPrecip ?? current.value?.precipitation_probability ?? current.value?.precipitation ?? 0,
        wind_speed: current.value?.wind_speed_10m,
      }
      if (current.value?.uv_index) {
        clothingPayload.uv_index = current.value.uv_index
      }

      const { data: clothing } = await api.post('/weather/clothing', clothingPayload)
      clothingOutfit.value = clothing?.outfit || []
      clothingGaps.value = clothing?.gaps || []
      clothingContext.value = clothing?.context || null
    } catch (clothingError) {
      console.error('Failed to build clothing suggestions', clothingError)
      clothingGaps.value = ['Unable to generate outfit suggestions right now.']
    } finally {
      clothingLoading.value = false
    }

    console.log(current.value)
    console.log(forecast.value)
    console.log(recommendations.value)
    console.log(changes.value)
  } catch (e) {
    error.value = e?.response?.data?.reason || e.message || 'Failed to fetch weather'
    resetClothingSuggestions()
  } finally {
    loading.value = false
  }
}

function formatHourLabel(time) {
  if (!time) {
    return ''
  }
  try {
    return new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit' }).format(new Date(time))
  } catch (err) {
    console.error('Failed to format hour label', err)
    return time
  }
}

watch(selectedLocation, async (newLocation, oldLocation) => {
  if (newLocation?.city !== oldLocation?.city) {
    await getWeather()
  }
})

onMounted(async () => {
  await fetchLocations()
  if (locations.value.length > 0) {
    // selected location defaults to default location
    selectedLocation.value = locations.value.find((loc) => loc.is_default) || locations.value[0]
    console.log('Selected location:', selectedLocation.value)

    await getWeather()
  }
})
</script>

<template>
  <div class="p-4">
    <div class="grid gap-6 lg:grid-cols-2">
      <div class="space-y-4">
        <!-- select location -->
        <div>
          <label for="location" class="block text-sm font-medium text-gray-700">Select Location</label>
          <select
            id="location"
            v-model="selectedLocation"
            class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option v-for="location in locations" :key="location.id" :value="location">
              {{ location.name }}
            </option>
          </select>
        </div>

        <div>
          <h1 class="text-2xl font-bold mb-4">Today's Weather</h1>
          <div v-if="current" class="bg-white shadow rounded-lg p-6">
            <h2 class="text-xl font-semibold mb-2">{{ place.name }}</h2>
            <p class="text-gray-700 mb-1">Temperature: {{ current.temperature_2m }}F</p>
            <p class="text-gray-700 mb-1">Condition: {{ current.condition }}</p>
            <p class="text-gray-700">Humidity: {{ current.relative_humidity_2m }}%</p>
          </div>
          <div v-else class="text-gray-500">Loading weather data...</div>
        </div>

        <div class="bg-white shadow rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-semibold">Outfit Suggestions</h2>
              <p class="text-sm text-gray-500">Based on today's weather at {{ place?.name || 'your location' }}</p>
            </div>
            <div class="flex flex-col items-end gap-1 text-xs text-gray-500">
              <span v-if="clothingContext?.targetInsulation">Target insulation: {{ insulationLabels[clothingContext.targetInsulation] || clothingContext.targetInsulation }}</span>
              <span v-if="clothingContext?.requireWaterproof">Waterproof gear strongly recommended</span>
              <span v-else-if="clothingContext?.preferWaterproof">Consider waterproof pieces</span>
            </div>
          </div>

          <div v-if="clothingLoading" class="text-sm text-gray-500">Building outfit suggestions...</div>
          <template v-else>
            <div v-if="clothingOutfit.length" class="space-y-4">
              <div
                v-for="item in clothingOutfit"
                :key="item.id"
                class="rounded-lg border border-gray-200 p-4"
              >
                <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="text-lg font-medium text-gray-900">{{ item.name }}</span>
                      <span
                        class="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200"
                      >
                        {{ categoryLabels[item.category] || item.category }}
                      </span>
                      <span
                        class="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200"
                      >
                        {{ insulationLabels[item.insulation_level] || item.insulation_level }} insulation
                      </span>
                      <span
                        v-if="item.optional"
                        class="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200"
                      >
                        Optional
                      </span>
                    </div>
                    <div class="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
                      <span v-if="item.waterproof">Waterproof</span>
                      <span v-if="item.uv_protection">UV protection</span>
                      <span v-if="item.formality">{{ item.formality }}</span>
                      <span v-if="item.color">Color: {{ item.color }}</span>
                    </div>
                    <p v-if="item.notes" class="mt-2 text-sm text-gray-600">{{ item.notes }}</p>
                  </div>
                  <div v-if="item.rationale?.length" class="text-xs text-gray-500">
                    <p class="font-medium uppercase tracking-wide text-gray-400">Why it works</p>
                    <ul class="mt-1 list-disc pl-4 space-y-0.5">
                      <li v-for="(reason, index) in item.rationale" :key="`reason-${item.id}-${index}`">{{ reason }}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="clothingGaps.length" class="space-y-2 text-sm text-rose-600">
              <p class="font-medium text-rose-700">What to add next</p>
              <ul class="list-disc list-inside space-y-1">
                <li v-for="(gap, index) in clothingGaps" :key="`gap-${index}`">{{ gap }}</li>
              </ul>
            </div>

            <p v-if="!clothingOutfit.length && !clothingGaps.length" class="text-sm text-gray-500">
              Save clothing items in your closet to get tailored outfit ideas.
            </p>
          </template>
        </div>
      </div>

      <div class="space-y-4">
        <div v-if="forecast.length" class="bg-white shadow rounded-lg p-6">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">Next 12 Hours</h2>
            <span v-if="place?.timezone" class="text-xs text-gray-500 uppercase">{{ place.timezone }}</span>
          </div>
          <div class="mt-4 overflow-x-auto">
            <div class="flex gap-4 min-w-max">
              <div v-for="hour in forecast" :key="hour.time" class="bg-gray-50 rounded-lg p-4 w-40 flex-shrink-0">
                <div class="text-sm text-gray-500">{{ formatHourLabel(hour.time) }}</div>
                <div class="mt-2 text-gray-700 font-medium">{{ hour.temperature_2m }}F</div>
                <div class="text-xs text-gray-600 mt-1">Humidity: {{ hour.relative_humidity_2m }}%</div>
                <div class="text-xs text-gray-600">Precip: {{ hour.precipitation_probability }}%</div>
                <div class="text-xs text-gray-600">Wind: {{ hour.wind_speed_10m }} mph</div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="changes.length || recommendations.length"
          class="bg-white shadow rounded-lg p-6 space-y-4"
        >
          <div v-if="changes.length">
            <h2 class="text-xl font-semibold mb-2">Upcoming Changes</h2>
            <ul class="space-y-1 text-gray-700">
              <li v-for="(change, index) in changes" :key="`change-${index}`">{{ change }}</li>
            </ul>
          </div>

          <div v-if="recommendations.length" :class="{ 'pt-4 border-t border-gray-200': changes.length }">
            <h2 class="text-xl font-semibold mb-3">Recommendations</h2>
            <ul class="list-disc list-inside text-gray-700 space-y-1">
              <li v-for="(recommendation, index) in recommendations" :key="`rec-${index}`">{{ recommendation }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>
</style>
