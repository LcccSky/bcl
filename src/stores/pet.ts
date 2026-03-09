import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Pet } from '@/types'

export const usePetStore = defineStore('pet', () => {
  const pet = ref<Pet | null>(null)
  const loading = ref(false)

  function setPet(petData: Pet) {
    pet.value = petData
  }

  function clearPet() {
    pet.value = null
  }

  function updatePetStatus(updates: Partial<Pet>) {
    if (pet.value) {
      pet.value = { ...pet.value, ...updates }
    }
  }

  return {
    pet,
    loading,
    setPet,
    clearPet,
    updatePetStatus
  }
})
