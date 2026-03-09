import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface User {
  id: string
  username: string
  role: 'admin' | 'viewer'
  avatar_url?: string
}

const NICKNAME_KEY = 'love_notes_nickname'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const isAuthenticated = ref(false)
  const nickname = ref<string>(localStorage.getItem(NICKNAME_KEY) || '')

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

  function setNickname(name: string) {
    nickname.value = name
    localStorage.setItem(NICKNAME_KEY, name)
  }

  return {
    user,
    isAuthenticated,
    nickname,
    setUser,
    clearUser,
    isAdmin,
    setNickname
  }
})
