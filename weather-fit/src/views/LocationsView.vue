<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'

const auth = useAuthStore()

// Minimal demo state (replace with real API later)
const locations = ref([])

// Single modal with two modes: 'create' | 'edit'
const showModal = ref(false)
const mode = ref('create')
const editingId = ref(null)

const form = reactive({ name: '', latitude: '', longitude: '', is_default: false, city: '' })

const page = ref(1)
const limit = ref(5)
const totalItems = ref(0)

const totalPages = computed(() => Math.ceil(totalItems.value / limit.value))

function openCreateModal() {
  mode.value = 'create'
  editingId.value = null
  Object.assign(form, { name: '', latitude: '', longitude: '', is_default: false, city: '' })
  showModal.value = true
}
async function openEditModal(location) {
  mode.value = 'edit'
  editingId.value = location.id
  const res = await api.get(`/locations/${auth.user?.id}/${location.id}`)
  const locationData = res.data
  Object.assign(form, {
    name: locationData.name,
    latitude: locationData.latitude,
    longitude: locationData.longitude,
    is_default: !!locationData.is_default,
    city: locationData.city || '',
  })
  showModal.value = true
}
function closeModal() {
  showModal.value = false
}

async function submit() {
  // use open meteo geocoding api to get lat lon from city name
  if (!form.city.trim()) {
    alert('Please enter a city name')
    return
  }

  try {
    const geo = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
      params: {
        name: form.city.trim(),
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
    form.latitude = result.latitude
    form.longitude = result.longitude
  } catch (e) {
    alert(e.message || 'Geocoding failed')
    return
  }

  if (mode.value === 'create') {
    const newLocation = {
      name: form.name.trim(),
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      is_default: !!form.is_default,
      city: form.city.trim(),
      user_id: auth.user.id,
    }

    await api.post('/locations', newLocation)

    closeModal()

    await fetchLocations()

    return
  }

  // edit
  const id = editingId.value
  await api.put(`/locations/${id}`, {
    name: form.name.trim(),
    latitude: parseFloat(form.latitude),
    longitude: parseFloat(form.longitude),
    is_default: !!form.is_default,
    city: form.city.trim(),
  })

  closeModal()

  await fetchLocations()
}

async function deleteLocation(location) {
  if (confirm(`Are you sure you want to delete "${location.name}"?`)) {
    await api.delete(`/locations/${location.id}`)
    locations.value = locations.value.filter((loc) => loc.id !== location.id)
  }
}

async function fetchLocations() {
  try {
    const res = await api.get(`/locations/${auth.user?.id}?page=${page.value}&limit=${limit.value}`)
    locations.value = res.data.locations
    totalItems.value = res.data.total
  } catch (e) {
    console.error('Failed to fetch locations', e)
  }
}

watch(page, async (newPage) => {
  if (newPage < 1) {
     page.value = 1
  }
  else if (newPage > totalPages.value) {
    page.value = totalPages.value
  }
  else {
    await fetchLocations()
  }
})

onMounted(async () => {
  await fetchLocations()
})
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">Locations</h1>
        <p class="text-sm text-gray-600">Manage your saved locations. Set one as default.</p>
      </div>
      <button
        @click="openCreateModal"
        class="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700"
      >
        Add Location
      </button>
    </div>

    <!-- Locations List Card -->
    <div class="bg-white rounded-xl shadow">
      <div class="p-4 border-b">
        <h2 class="text-base font-medium text-gray-900">Your Locations</h2>
      </div>
      <ul class="divide-y">
        <li
          v-for="location in locations"
          :key="location.id"
          class="p-4 flex items-center justify-between"
        >
          <div>
            <div class="flex items-center gap-2">
              <span class="font-medium text-gray-900">{{ location.name }}</span>
              <span
                v-if="location.is_default"
                class="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200"
              >
                Default
              </span>
            </div>
            <div class="text-sm text-gray-500">
              Lat: {{ location.latitude }} • Lon: {{ location.longitude }}
            </div>
            <div class="text-sm text-gray-500">
              City: {{ location.city }}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="openEditModal(location)"
              class="inline-flex items-center rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50"
            >
              Edit
            </button>
            <button
              @click="deleteLocation(location)"
              class="inline-flex items-center rounded-md bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700"
            >
              Delete
            </button>
          </div>
        </li>
        <li v-if="locations.length === 0" class="p-8 text-center text-sm text-gray-500">
          No locations yet. Click "Add Location" to create one.
        </li>
      </ul>
    </div>

    <!-- pagination controls -->
    <div class="flex items-center justify-between p-4">
      <button
        @click="page--"
        :disabled="page === 1"
        class="inline-flex items-center rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
      >
        Previous
      </button>
      <span class="text-sm text-gray-700">Page {{ page }} of {{ totalPages }}</span>
      <button
        @click="page++"
        :disabled="page === totalPages"
        class="inline-flex items-center rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
      >
        Next
      </button>
    </div>

    <!-- Create/Edit Modal -->
    <div v-show="showModal" class="fixed inset-0 z-40">
      <div class="absolute inset-0 bg-black/30" @click="closeModal"></div>
      <div class="relative z-50 flex min-h-full items-center justify-center p-4">
        <div class="w-full max-w-lg bg-white rounded-xl shadow">
          <div class="px-6 py-4 border-b flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900">
              {{ mode === 'create' ? 'Add Location' : 'Edit Location' }}
            </h3>
            <button @click="closeModal" class="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <form @submit.prevent class="px-6 py-4 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                v-model="form.name"
                type="text"
                required
                class="block w-full rounded-md px-3 py-2 bg-white text-gray-900 placeholder:text-gray-400 ring-1 ring-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g., Home"
              />
            </div>
            <!-- city name for geocoding api -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                v-model="form.city"
                type="text"
                required
                class="block w-full rounded-md px-3 py-2 bg-white text-gray-900 placeholder:text-gray-400 ring-1 ring-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g., San Francisco"
              />
            </div>

            <!-- Default Toggle -->
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-700">Set as default</span>
              <label class="relative inline-flex items-center cursor-pointer">
                <input v-model="form.is_default" type="checkbox" class="sr-only peer" />
                <div
                  class="h-6 w-11 rounded-full bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 transition-colors peer-checked:bg-indigo-600"
                ></div>
                <span
                  class="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"
                ></span>
              </label>
            </div>
          </form>
          <div class="px-6 py-4 border-t flex items-center justify-end gap-3">
            <button
              @click="closeModal"
              class="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              @click="submit"
              class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {{ mode === 'create' ? 'Save' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
