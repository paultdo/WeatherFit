<script setup>
import { ref, reactive, onMounted, watch, onScopeDispose } from 'vue'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const items = ref([])
const loading = ref(false)
const submitting = ref(false)
const error = ref('')

const showModal = ref(false)
const mode = ref('create')
const editingId = ref(null)

const form = reactive({
  name: '',
  category: 'top',
  insulation_level: 'light',
  waterproof: false,
  uv_protection: false,
  formality: 'casual',
  color: '',
  notes: '',
})

const categories = [
  { label: 'Top', value: 'top' },
  { label: 'Bottom', value: 'bottom' },
  { label: 'Outerwear', value: 'outerwear' },
  { label: 'Footwear', value: 'footwear' },
  { label: 'Accessory', value: 'accessory' },
]

const insulationLevels = [
  { label: 'Light', value: 'light' },
  { label: 'Medium', value: 'medium' },
  { label: 'Heavy', value: 'heavy' },
]

const formalityLevels = [
  { label: 'Casual', value: 'casual' },
  { label: 'Business Casual', value: 'business casual' },
  { label: 'Formal', value: 'formal' },
]

const categoryLabels = Object.fromEntries(categories.map((option) => [option.value, option.label]))
const insulationLabels = Object.fromEntries(insulationLevels.map((option) => [option.value, option.label]))
const formalityLabels = Object.fromEntries(formalityLevels.map((option) => [option.value, option.label]))

const page = ref(1)
const limit = ref(5)
const totalPages = ref(1)
const totalItems = ref(0)
const searchTerm = ref('')

let searchDebounce = null

function resetForm() {
  Object.assign(form, {
    name: '',
    category: 'top',
    insulation_level: 'light',
    waterproof: false,
    uv_protection: false,
    formality: 'casual',
    color: '',
    notes: '',
  })
}

function openCreateModal() {
  mode.value = 'create'
  editingId.value = null
  resetForm()
  showModal.value = true
}

async function openEditModal(item) {
  mode.value = 'edit'
  editingId.value = item.id
  try {
    const { data } = await api.get(`/clothing-items/${auth.user?.id}/${item.id}`)
    Object.assign(form, {
      name: data.name || '',
      category: data.category || 'top',
      insulation_level: data.insulation_level || 'light',
      waterproof: !!data.waterproof,
      uv_protection: !!data.uv_protection,
      formality: data.formality || 'casual',
      color: data.color || '',
      notes: data.notes || '',
    })
    showModal.value = true
  } catch (e) {
    console.error('Failed to load clothing item', e)
    alert('Failed to load clothing item. Please try again.')
  }
}

function closeModal() {
  showModal.value = false
}

async function fetchClothing() {
  if (!auth.user?.id) return
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get(`/clothing-items/${auth.user.id}`, {
      params: {
        page: page.value,
        limit: limit.value,
        search: searchTerm.value.trim() || undefined,
      },
    })
    items.value = data.items || []
    totalItems.value = data.totalItems || 0
    totalPages.value = data.totalPages || 1
    if (data.currentPage) {
      page.value = data.currentPage
    }
  } catch (e) {
    console.error('Failed to fetch clothing items', e)
    error.value = e?.response?.data?.error || 'Failed to fetch clothing items'
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (submitting.value) return

  const name = form.name.trim()
  if (!name) {
    alert('Name is required.')
    return
  }

  submitting.value = true
  try {
    const payload = {
      user_id: auth.user.id,
      name,
      category: form.category,
      insulation_level: form.insulation_level,
      waterproof: !!form.waterproof,
      uv_protection: !!form.uv_protection,
      formality: form.formality,
      color: form.color.trim(),
      notes: form.notes.trim(),
    }

    if (mode.value === 'create') {
      await api.post('/clothing-items', payload)
    } else if (editingId.value) {
      await api.put(`/clothing-items/${editingId.value}`, payload)
    }

    closeModal()
    await fetchClothing()
  } catch (e) {
    console.error('Failed to save clothing item', e)
    alert(e?.response?.data?.error || 'Failed to save clothing item')
  } finally {
    submitting.value = false
  }
}

async function deleteItem(item) {
  if (!confirm(`Delete "${item.name}"?`)) {
    return
  }
  try {
    await api.delete(`/clothing-items/${item.id}`)
    await fetchClothing()
  } catch (e) {
    console.error('Failed to delete clothing item', e)
    alert(e?.response?.data?.error || 'Failed to delete clothing item')
  }
}

function handleSearchInput() {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    page.value = 1
    fetchClothing()
  }, 300)
}

function changeLimit(newLimit) {
  limit.value = Number(newLimit) || 5
  page.value = 1
  fetchClothing()
}

function goToPreviousPage() {
  if (page.value > 1) {
    page.value -= 1
    fetchClothing()
  }
}

function goToNextPage() {
  if (page.value < totalPages.value) {
    page.value += 1
    fetchClothing()
  }
}

watch(limit, (value, oldValue) => {
  if (value !== oldValue) {
    page.value = 1
  }
})

onMounted(fetchClothing)

onScopeDispose(() => {
  clearTimeout(searchDebounce)
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">Clothing</h1>
        <p class="text-sm text-gray-600">Manage wardrobe pieces to keep recommendations accurate.</p>
      </div>
      <button
        @click="openCreateModal"
        class="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Add Clothing Item
      </button>
    </div>

    <div class="flex flex-col gap-4 rounded-xl bg-white p-6 shadow">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex w-full max-w-sm items-center gap-2 rounded-md border border-gray-200 px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500">
          <svg class="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            v-model="searchTerm"
            @input="handleSearchInput"
            type="search"
            placeholder="Search by name, category, or color"
            class="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
        </div>
        <div class="flex items-center gap-2 text-sm text-gray-600">
          <span>Items per page:</span>
          <select
            :value="limit"
            @change="changeLimit($event.target.value)"
            class="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
          </select>
        </div>
      </div>

      <div>
        <div v-if="loading" class="p-6 text-sm text-gray-500">Loading clothing items...</div>
        <div v-else-if="error" class="p-6 text-sm text-rose-600">{{ error }}</div>
        <template v-else>
          <template v-if="items.length">
            <ul class="divide-y">
              <li
                v-for="item in items"
                :key="item.id"
                class="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div class="space-y-2">
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
                      {{ formalityLabels[item.formality] || item.formality }}
                    </span>
                  </div>
                  <div class="flex flex-wrap gap-3 text-sm text-gray-600">
                    <span>Insulation: <span class="font-medium text-gray-900">{{ insulationLabels[item.insulation_level] || item.insulation_level }}</span></span>
                    <span>Waterproof: <span class="font-medium text-gray-900">{{ item.waterproof ? 'Yes' : 'No' }}</span></span>
                    <span>UV Protection: <span class="font-medium text-gray-900">{{ item.uv_protection ? 'Yes' : 'No' }}</span></span>
                    <span v-if="item.color">Color: <span class="font-medium text-gray-900">{{ item.color }}</span></span>
                  </div>
                  <p v-if="item.notes" class="text-sm text-gray-600">{{ item.notes }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    @click="openEditModal(item)"
                    class="inline-flex items-center rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    @click="deleteItem(item)"
                    class="inline-flex items-center rounded-md bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700"
                  >
                    Delete
                  </button>
                </div>
              </li>
            </ul>
          </template>
          <div v-else class="p-8 text-center text-sm text-gray-500">
            No clothing items match your filters.
          </div>
        </template>
      </div>

      <div class="flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-4 text-sm text-gray-600 sm:flex-row">
        <div>
          Showing
          <span class="font-medium text-gray-900">
            {{ items.length ? (page - 1) * limit + 1 : 0 }}
            -
            {{ Math.min(page * limit, totalItems) }}
          </span>
          of
          <span class="font-medium text-gray-900">{{ totalItems }}</span>
          items
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="goToPreviousPage"
            :disabled="page === 1"
            class="inline-flex items-center rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50"
          >
            Previous
          </button>
          <span>Page {{ page }} of {{ totalPages }}</span>
          <button
            @click="goToNextPage"
            :disabled="page === totalPages"
            class="inline-flex items-center rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <div v-show="showModal" class="fixed inset-0 z-40">
      <div class="absolute inset-0 bg-black/30" @click="closeModal"></div>
      <div class="relative z-50 flex min-h-full items-center justify-center p-4">
        <div class="w-full max-w-2xl rounded-xl bg-white shadow">
          <div class="flex items-center justify-between border-b px-6 py-4">
            <h3 class="text-lg font-medium text-gray-900">
              {{ mode === 'create' ? 'Add Clothing Item' : 'Edit Clothing Item' }}
            </h3>
            <button @click="closeModal" class="text-gray-400 hover:text-gray-600">&times;</button>
          </div>
          <form @submit.prevent="submit" class="space-y-4 px-6 py-4">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label class="mb-1 block text-sm font-medium text-gray-700">Name</label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  class="block w-full rounded-md bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 ring-1 ring-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Waterproof Parka"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700">Category</label>
                <select
                  v-model="form.category"
                  class="block w-full rounded-md bg-white px-3 py-2 text-gray-900 ring-1 ring-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option v-for="option in categories" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700">Insulation</label>
                <select
                  v-model="form.insulation_level"
                  class="block w-full rounded-md bg-white px-3 py-2 text-gray-900 ring-1 ring-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option v-for="option in insulationLevels" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700">Formality</label>
                <select
                  v-model="form.formality"
                  class="block w-full rounded-md bg-white px-3 py-2 text-gray-900 ring-1 ring-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option v-for="option in formalityLevels" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700">Color</label>
                <input
                  v-model="form.color"
                  type="text"
                  class="block w-full rounded-md bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 ring-1 ring-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Optional"
                />
              </div>
            </div>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label class="flex items-center gap-3 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700 ring-1 ring-gray-200">
                <input
                  type="checkbox"
                  v-model="form.waterproof"
                  class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Waterproof
              </label>
              <label class="flex items-center gap-3 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700 ring-1 ring-gray-200">
                <input
                  type="checkbox"
                  v-model="form.uv_protection"
                  class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                UV Protection
              </label>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                v-model="form.notes"
                rows="3"
                class="block w-full rounded-md bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 ring-1 ring-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Fabric, pairing tips, weather preferences..."
              ></textarea>
            </div>
            <div class="flex items-center justify-end gap-3 border-t pt-4">
              <button
                type="button"
                @click="closeModal"
                class="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="submitting"
                class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {{ submitting ? 'Saving...' : mode === 'create' ? 'Save' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
