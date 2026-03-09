import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ThemeName = 'pink' | 'purple' | 'blue' | 'green' | 'sunset'

export interface Theme {
  name: ThemeName
  label: string
  emoji: string
  colors: {
    primary: string
    secondary: string
    background: string
    backgroundGradient: string
  }
}

export const themes: Record<ThemeName, Theme> = {
  pink: {
    name: 'pink',
    label: '粉色恋曲',
    emoji: '💗',
    colors: {
      primary: '#ff6b9d',
      secondary: '#ffc1e3',
      background: '#fff5f7',
      backgroundGradient: 'linear-gradient(135deg, #ffeef8 0%, #fff5f7 100%)'
    }
  },
  purple: {
    name: 'purple',
    label: '紫色浪漫',
    emoji: '💜',
    colors: {
      primary: '#9b59b6',
      secondary: '#d7bde2',
      background: '#f8f5ff',
      backgroundGradient: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)'
    }
  },
  blue: {
    name: 'blue',
    label: '蓝色海洋',
    emoji: '💙',
    colors: {
      primary: '#3498db',
      secondary: '#85c1e9',
      background: '#f0f8ff',
      backgroundGradient: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)'
    }
  },
  green: {
    name: 'green',
    label: '清新绿意',
    emoji: '💚',
    colors: {
      primary: '#2ecc71',
      secondary: '#a9dfbf',
      background: '#f0fff4',
      backgroundGradient: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)'
    }
  },
  sunset: {
    name: 'sunset',
    label: '日落余晖',
    emoji: '🧡',
    colors: {
      primary: '#ff6b6b',
      secondary: '#ffa07a',
      background: '#fff5f0',
      backgroundGradient: 'linear-gradient(135deg, #ffe5e5 0%, #ffd4a3 100%)'
    }
  }
}

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref<ThemeName>('pink')

  // 从 localStorage 加载主题
  const savedTheme = localStorage.getItem('app-theme') as ThemeName
  if (savedTheme && themes[savedTheme]) {
    currentTheme.value = savedTheme
  }

  function setTheme(themeName: ThemeName) {
    currentTheme.value = themeName
    localStorage.setItem('app-theme', themeName)
    applyTheme(themeName)
  }

  function applyTheme(themeName: ThemeName) {
    const theme = themes[themeName]
    const root = document.documentElement

    root.style.setProperty('--primary-color', theme.colors.primary)
    root.style.setProperty('--secondary-color', theme.colors.secondary)
    root.style.setProperty('--background-color', theme.colors.background)
    root.style.setProperty('--background-gradient', theme.colors.backgroundGradient)
  }

  // 初始化时应用主题
  applyTheme(currentTheme.value)

  return {
    currentTheme,
    setTheme,
    themes
  }
})
