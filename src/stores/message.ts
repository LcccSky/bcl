import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Message {
  id: string
  author_id: string
  content: string
  image_url?: string
  mood_tag: 'miss' | 'cheer' | 'goodnight' | 'surprise'
  publish_at: string
  is_published: boolean
  is_read: boolean
  read_at?: string
  likes_count: number
  created_at: string
  updated_at: string
}

export const useMessageStore = defineStore('message', () => {
  const messages = ref<Message[]>([])
  const loading = ref(false)

  function setMessages(data: Message[]) {
    messages.value = data
  }

  function addMessage(message: Message) {
    messages.value.unshift(message)
  }

  function updateMessage(id: string, data: Partial<Message>) {
    const index = messages.value.findIndex(m => m.id === id)
    if (index !== -1) {
      messages.value[index] = { ...messages.value[index], ...data }
    }
  }

  function deleteMessage(id: string) {
    messages.value = messages.value.filter(m => m.id !== id)
  }

  return {
    messages,
    loading,
    setMessages,
    addMessage,
    updateMessage,
    deleteMessage
  }
})
