<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const username = ref('')
const email = ref('')
const password = ref('')
const confirm = ref('')
const error = ref('')
const success = ref('')

async function onSubmit(e) {
  e.preventDefault()
  error.value = ''
  success.value = ''
  if (password.value !== confirm.value) {
    error.value = 'Passwords do not match'
    return
  }
  try {
    await auth.register({ username: username.value, email: email.value, password: password.value })
    success.value = 'Registered! You can now sign in.'
    setTimeout(() => router.replace({ name: 'login' }), 1000)
  } catch (e) {
    error.value = e.message || 'Registration failed'
  }
}
</script>

<template>
  <div class="w-full flex items-center justify-center min-h-[calc(100vh-4rem-2rem)]">
    <div class="w-full max-w-md bg-white shadow rounded-xl p-6">
      <h1 class="text-2xl font-semibold text-gray-900 mb-6 text-center">Create account</h1>

      <form @submit="onSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input v-model="username" type="text" required class="block w-full rounded-md px-3 py-2 bg-white text-gray-900 placeholder:text-gray-400 ring-1 ring-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input v-model="email" type="email" required class="block w-full rounded-md px-3 py-2 bg-white text-gray-900 placeholder:text-gray-400 ring-1 ring-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input v-model="password" type="password" required class="block w-full rounded-md px-3 py-2 bg-white text-gray-900 placeholder:text-gray-400 ring-1 ring-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
          <input v-model="confirm" type="password" required class="block w-full rounded-md px-3 py-2 bg-white text-gray-900 placeholder:text-gray-400 ring-1 ring-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>

        <button type="submit" :disabled="auth.loading" class="w-full inline-flex justify-center items-center rounded-md bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700 disabled:opacity-50">
          <span v-if="!auth.loading">Register</span>
          <span v-else>Registering...</span>
        </button>

        <p v-if="error" class="text-sm text-red-600 text-center">{{ error }}</p>
        <p v-if="success" class="text-sm text-green-600 text-center">{{ success }}</p>

        <p class="text-center text-sm text-gray-600">Already have an account?
          <RouterLink to="/login" class="text-indigo-600 font-medium hover:text-indigo-500">Sign in</RouterLink>
        </p>
      </form>
    </div>
  </div>
</template>
