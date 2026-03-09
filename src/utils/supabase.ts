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
      .select(`
        *,
        replies:replies(count)
      `)
      .eq('is_published', true)
      .lte('publish_at', new Date().toISOString())
      .order('publish_at', { ascending: false })

    if (error) throw error

    // 处理评论数量
    return data.map((msg: any) => ({
      ...msg,
      replies_count: msg.replies?.[0]?.count || 0,
      replies: undefined
    }))
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

// 评论相关API
export const replyApi = {
  // 获取留言的所有评论
  async getReplies(messageId: string) {
    const { data, error } = await supabase
      .from('replies')
      .select('*')
      .eq('message_id', messageId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data
  },

  // 创建评论
  async createReply(reply: any) {
    const { data, error } = await supabase
      .from('replies')
      .insert(reply)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 删除评论
  async deleteReply(id: string) {
    const { error } = await supabase
      .from('replies')
      .delete()
      .eq('id', id)

    if (error) throw error
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

// 宠物相关API
export const petApi = {
  // 获取宠物信息（只有一只宠物）
  async getPet() {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  // 创建宠物
  async createPet(petData: { name: string }) {
    const { data, error } = await supabase
      .from('pets')
      .insert({
        name: petData.name,
        level: 1,
        exp: 0,
        hunger: 50,
        happiness: 50,
        last_fed_at: new Date().toISOString(),
        last_played_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 喂食
  async feedPet(petId: string) {
    const { data, error } = await supabase
      .from('pets')
      .update({
        hunger: 100,
        last_fed_at: new Date().toISOString()
      })
      .eq('id', petId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 玩耍
  async playWithPet(petId: string) {
    const { data, error } = await supabase
      .from('pets')
      .update({
        happiness: 100,
        last_played_at: new Date().toISOString()
      })
      .eq('id', petId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 增加经验值
  async addExp(petId: string, expAmount: number) {
    const pet = await this.getPet()
    if (!pet) return null

    const newExp = pet.exp + expAmount
    const newLevel = Math.floor(newExp / 100) + 1

    const { data, error } = await supabase
      .from('pets')
      .update({
        exp: newExp,
        level: newLevel
      })
      .eq('id', petId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 更新宠物状态（自动衰减）
  async updatePetStatus(petId: string) {
    const pet = await this.getPet()
    if (!pet) return null

    const now = new Date()
    const lastFed = new Date(pet.last_fed_at)
    const lastPlayed = new Date(pet.last_played_at)

    // 每小时饥饿值减少5
    const hoursSinceFed = (now.getTime() - lastFed.getTime()) / (1000 * 60 * 60)
    const newHunger = Math.max(0, pet.hunger - Math.floor(hoursSinceFed * 5))

    // 每小时心情值减少3
    const hoursSincePlayed = (now.getTime() - lastPlayed.getTime()) / (1000 * 60 * 60)
    const newHappiness = Math.max(0, pet.happiness - Math.floor(hoursSincePlayed * 3))

    const { data, error } = await supabase
      .from('pets')
      .update({
        hunger: newHunger,
        happiness: newHappiness
      })
      .eq('id', petId)
      .select()
      .single()

    if (error) throw error
    return data
  }
}
