import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 消息相关API
export const messageApi = {
  // 获取所有已发布的消息
  async getPublishedMessages() {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('is_published', true)
      .lte('publish_at', new Date().toISOString())
      .order('publish_at', { ascending: false })

    if (error) throw error
    return data
  },

  // 获取单条消息
  async getMessage(id: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // 创建消息
  async createMessage(message: any) {
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 更新消息
  async updateMessage(id: string, updates: any) {
    const { data, error } = await supabase
      .from('messages')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 删除消息
  async deleteMessage(id: string) {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // 标记为已读
  async markAsRead(id: string) {
    const { data, error } = await supabase
      .from('messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 点赞
  async likeMessage(id: string) {
    const { data, error } = await supabase.rpc('increment_likes', { message_id: id })
    if (error) throw error
    return data
  },

  // 上传图片
  async uploadImage(file: File) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
    const filePath = `messages/${fileName}`

    const { error } = await supabase.storage
      .from('images')
      .upload(filePath, file)

    if (error) throw error

    // 获取公开URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath)

    return publicUrl
  }
}

// 用户相关API
export const userApi = {
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }
}
