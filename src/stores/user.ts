import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface User {
  id: string
  username: string
  role: 'admin' | 'viewer'
  avatar_url?: string
}

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const isAuthenticated = ref(false)

  function setUser(userData: User) {
    user.value = userData
    isAuthenticated.value = true
  }

  function clearUser() {
    user.value = null
    isAuthenticated.value = false
  }

  function isAdmin() {
    return user.value?.role === 'admin'
  }

  return {
    user,
    isAuthenticated,
    setUser,
    clearUser,
    isAdmin
  }
})
