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

// 愿望清单相关API
export const wishApi = {
  // 获取所有愿望
  async getWishes() {
    const { data, error } = await supabase
      .from('wishes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // 创建愿望
  async createWish(wishData: { title: string; description?: string; category: string; created_by: string }) {
    const { data, error } = await supabase
      .from('wishes')
      .insert({
        ...wishData,
        is_completed: false
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 完成愿望
  async completeWish(wishId: string) {
    const { data, error } = await supabase
      .from('wishes')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('id', wishId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 取消完成
  async uncompleteWish(wishId: string) {
    const { data, error } = await supabase
      .from('wishes')
      .update({
        is_completed: false,
        completed_at: null
      })
      .eq('id', wishId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 删除愿望
  async deleteWish(wishId: string) {
    const { error } = await supabase
      .from('wishes')
      .delete()
      .eq('id', wishId)

    if (error) throw error
  }
}

// "想你了"功能API
export const missYouApi = {
  // 发送"想你了"
  async sendMissYou(fromUser: string, toUser: string) {
    const { data, error } = await supabase
      .from('miss_you')
      .insert({
        from_user: fromUser,
        to_user: toUser
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 获取今天收到的"想你了"次数
  async getTodayMissYouCount(userId: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('miss_you')
      .select('*')
      .eq('to_user', userId)
      .gte('created_at', today.toISOString())

    if (error) throw error
    return data?.length || 0
  },

  // 获取最近的"想你了"记录
  async getRecentMissYou(userId: string, limit = 10) {
    const { data, error } = await supabase
      .from('miss_you')
      .select('*')
      .eq('to_user', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }
}

// 每日打卡API
export const checkInApi = {
  // 获取今天的打卡记录
  async getTodayCheckIn(userId: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('check_ins')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', today.toISOString())

    if (error) throw error
    return data
  },

  // 早安打卡
  async morningCheckIn(userId: string, message?: string) {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('check_ins')
      .insert({
        user_id: userId,
        check_in_date: today,
        type: 'morning',
        message
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 晚安打卡
  async nightCheckIn(userId: string, message?: string) {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('check_ins')
      .insert({
        user_id: userId,
        check_in_date: today,
        type: 'night',
        message
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 获取连续打卡天数
  async getCheckInStreak(userId: string) {
    const { data, error } = await supabase
      .from('check_ins')
      .select('check_in_date')
      .eq('user_id', userId)
      .order('check_in_date', { ascending: false })

    if (error) throw error

    if (!data || data.length === 0) return 0

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const dates = [...new Set(data.map(d => d.check_in_date))].sort().reverse()

    for (let i = 0; i < dates.length; i++) {
      const checkDate = new Date(dates[i])
      checkDate.setHours(0, 0, 0, 0)

      const expectedDate = new Date(today)
      expectedDate.setDate(expectedDate.getDate() - i)
      expectedDate.setHours(0, 0, 0, 0)

      if (checkDate.getTime() === expectedDate.getTime()) {
        streak++
      } else {
        break
      }
    }

    return streak
  }
}

// 纪念日管理API
export const anniversaryApi = {
  // 获取所有纪念日
  async getAnniversaries() {
    const { data, error } = await supabase
      .from('anniversaries')
      .select('*')
      .order('date', { ascending: true })

    if (error) throw error
    return data
  },

  // 创建纪念日
  async createAnniversary(anniversaryData: {
    title: string
    date: string
    type: string
    description?: string
    is_recurring: boolean
  }) {
    const { data, error } = await supabase
      .from('anniversaries')
      .insert(anniversaryData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 更新纪念日
  async updateAnniversary(id: string, updates: Partial<{
    title: string
    date: string
    type: string
    description: string
    is_recurring: boolean
  }>) {
    const { data, error } = await supabase
      .from('anniversaries')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 删除纪念日
  async deleteAnniversary(id: string) {
    const { error } = await supabase
      .from('anniversaries')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // 获取即将到来的纪念日
  async getUpcomingAnniversaries(days = 30) {
    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)

    const { data, error } = await supabase
      .from('anniversaries')
      .select('*')
      .gte('date', today.toISOString().split('T')[0])
      .lte('date', futureDate.toISOString().split('T')[0])
      .order('date', { ascending: true })

    if (error) throw error
    return data
  }
}

// 时光胶囊API
export const timeCapsuleApi = {
  // 获取所有时光胶囊
  async getTimeCapsules() {
    const { data, error } = await supabase
      .from('time_capsules')
      .select('*')
      .order('unlock_date', { ascending: true })

    if (error) throw error
    return data
  },

  // 创建时光胶囊
  async createTimeCapsule(capsuleData: {
    title: string
    content: string
    image_url?: string
    created_by: string
    unlock_date: string
  }) {
    const { data, error } = await supabase
      .from('time_capsules')
      .insert({
        ...capsuleData,
        is_unlocked: false
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 解锁时光胶囊
  async unlockTimeCapsule(capsuleId: string) {
    const { data, error } = await supabase
      .from('time_capsules')
      .update({
        is_unlocked: true,
        unlocked_at: new Date().toISOString()
      })
      .eq('id', capsuleId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 删除时光胶囊
  async deleteTimeCapsule(capsuleId: string) {
    const { error } = await supabase
      .from('time_capsules')
      .delete()
      .eq('id', capsuleId)

    if (error) throw error
  },

  // 获取可解锁的时光胶囊
  async getUnlockableTimeCapsules() {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('time_capsules')
      .select('*')
      .eq('is_unlocked', false)
      .lte('unlock_date', today)
      .order('unlock_date', { ascending: true })

    if (error) throw error
    return data
  }
}

// 聊天消息API
export const chatApi = {
  // 获取聊天消息（分页）
  async getMessages(limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data
  },

  // 发送消息
  async sendMessage(messageData: {
    user_id: string
    user_name: string
    content: string
    message_type?: 'text' | 'image' | 'emoji'
    image_url?: string
  }) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        ...messageData,
        message_type: messageData.message_type || 'text'
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 删除消息
  async deleteMessage(messageId: string) {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId)

    if (error) throw error
  },

  // 订阅新消息（Realtime）
  subscribeToMessages(callback: (message: any) => void) {
    const channel = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          callback(payload.new)
        }
      )
      .subscribe()

    return channel
  },

  // 取消订阅
  unsubscribe(channel: any) {
    supabase.removeChannel(channel)
  }
}
