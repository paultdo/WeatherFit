<script setup>
import { ref } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Switch } from '@headlessui/vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const usernameOrEmail = ref('')
const password = ref('')
const remember = ref(true)
const localError = ref('')

async function onSubmit(e) {
  e.preventDefault()
  localError.value = ''
  try {
    const payload = usernameOrEmail.value.includes('@')
      ? { email: usernameOrEmail.value, password: password.value }
      : { username: usernameOrEmail.value, password: password.value }

    await auth.login(payload)
    const redirect = (route.query.redirect || '/')
    router.replace(redirect)
  } catch (e) {
    localError.value = e.message || 'Login failed'
  }
}
</script>

<template>
  <div class="w-full flex items-center justify-center min-h-[calc(100vh-4rem-2rem)]">
    <div class="w-full max-w-md bg-white shadow rounded-xl p-6">
      <h1 class="text-2xl font-semibold text-gray-900 mb-6 text-center">Sign in</h1>

      <form @submit="onSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Username or Email</label>
          <input
            v-model="usernameOrEmail"
            type="text"
            required
            class="block w-full rounded-md px-3 py-2 bg-white text-gray-900 placeholder:text-gray-400 ring-1 ring-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="you@example.com or username"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            v-model="password"
            type="password"
            required
            class="block w-full rounded-md px-3 py-2 bg-white text-gray-900 placeholder:text-gray-400 ring-1 ring-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="••••••••"
          />
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Switch v-model="remember" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                    :class="remember ? 'bg-indigo-600' : 'bg-gray-200'">
              <span class="inline-block h-4 w-4 transform rounded-full bg-white transition" :class="remember ? 'translate-x-6' : 'translate-x-1'" />
            </Switch>
            <span class="text-sm text-gray-600">Remember me</span>
          </div>
          <RouterLink to="/register" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">Create account</RouterLink>
        </div>

        <button type="submit" :disabled="auth.loading" class="w-full inline-flex justify-center items-center rounded-md bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700 disabled:opacity-50">
          <span v-if="!auth.loading">Sign in</span>
          <span v-else>Signing in...</span>
        </button>

        <p v-if="localError || auth.error" class="text-sm text-red-600 text-center">
          {{ localError || auth.error }}
        </p>
      </form>
    </div>
  </div>
</template>
