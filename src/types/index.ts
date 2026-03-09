export interface Message {
  id: string
  author_id: string
  author_name?: string
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

export interface User {
  id: string
  username: string
  role: 'admin' | 'viewer'
  avatar_url?: string
  created_at: string
}

export interface Reply {
  id: string
  message_id: string
  user_id: string
  content: string
  created_at: string
}

export interface Settings {
  id: string
  user_id: string
  theme: string
  notification_enabled: boolean
  daily_mode: boolean
  created_at: string
  updated_at: string
}

export const MOOD_TAGS = {
  miss: { label: '想你', emoji: '💕', color: '#ff6b9d' },
  cheer: { label: '加油', emoji: '🌟', color: '#ffd93d' },
  goodnight: { label: '晚安', emoji: '🌙', color: '#a8dadc' },
  surprise: { label: '惊喜', emoji: '🎁', color: '#f4a261' }
} as const
