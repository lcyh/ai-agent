import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const isLoggedIn = ref(false)
  const username = ref('')

  function login(user: string) {
    isLoggedIn.value = true
    username.value = user
  }

  function logout() {
    isLoggedIn.value = false
    username.value = ''
  }

  return {
    isLoggedIn,
    username,
    login,
    logout
  }
}) 