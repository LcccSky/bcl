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
  replies_count?: number
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
  author_name?: string
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

export interface Pet {
  id: string
  name: string
  level: number
  exp: number
  hunger: number // 0-100, 饥饿值
  happiness: number // 0-100, 心情值
  last_fed_at: string
  last_played_at: string
  created_at: string
  updated_at: string
}

export interface Wish {
  id: string
  title: string
  description?: string
  category: 'travel' | 'food' | 'movie' | 'activity' | 'other'
  is_completed: boolean
  completed_at?: string
  created_by: string
  created_at: string
  updated_at: string
}

export const WISH_CATEGORIES = {
  travel: { label: '旅行', emoji: '✈️', color: '#4caf50' },
  food: { label: '美食', emoji: '🍜', color: '#ff9800' },
  movie: { label: '电影', emoji: '🎬', color: '#9c27b0' },
  activity: { label: '活动', emoji: '🎯', color: '#2196f3' },
  other: { label: '其他', emoji: '💫', color: '#607d8b' }
} as const

export interface MissYou {
  id: string
  from_user: string
  to_user: string
  created_at: string
}

export interface CheckIn {
  id: string
  user_id: string
  check_in_date: string
  type: 'morning' | 'night'
  message?: string
  created_at: string
}

export interface Anniversary {
  id: string
  title: string
  date: string
  type: 'together' | 'birthday' | 'first_date' | 'custom'
  description?: string
  is_recurring: boolean
  created_at: string
  updated_at: string
}

export const ANNIVERSARY_TYPES = {
  together: { label: '在一起', emoji: '💕', color: '#ff6b9d' },
  birthday: { label: '生日', emoji: '🎂', color: '#ffd93d' },
  first_date: { label: '第一次约会', emoji: '🌹', color: '#f4a261' },
  custom: { label: '自定义', emoji: '🎉', color: '#a8dadc' }
} as const

export interface TimeCapsule {
  id: string
  title: string
  content: string
  image_url?: string
  created_by: string
  unlock_date: string
  is_unlocked: boolean
  unlocked_at?: string
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  user_id: string
  user_name: string
  content: string
  message_type: 'text' | 'image' | 'emoji'
  image_url?: string
  created_at: string
}
