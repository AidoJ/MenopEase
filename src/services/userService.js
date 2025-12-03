import { supabase } from '../config/supabase'

// User Profiles
export const userService = {
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle() // Use maybeSingle() instead of single() to avoid error when no row exists
    return { data, error }
  },

  async createProfile(profileData) {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([profileData])
      .select()
      .single()
    return { data, error }
  },

  async updateProfile(userId, updates) {
    // Remove null/undefined values to avoid overwriting with null
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== null && v !== undefined)
    )
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update(cleanUpdates)
      .eq('user_id', userId)
      .select()
      .maybeSingle() // Use maybeSingle in case update affects 0 rows (shouldn't happen but safer)
    
    if (error) {
      console.error('Supabase update error:', error)
    }
    
    return { data, error }
  },

  async getSubscriptionTier(userId) {
    const { data, error } = await this.getProfile(userId)
    if (error && error.code !== 'PGRST116') {
      // Only return error if it's not a "no rows" error
      return { tier: { tier_code: 'free', tier_name: 'Free' }, profile: null, error }
    }
    
    const tierCode = data?.subscription_tier || 'free'
    
    // Get tier details
    const { data: tierData, error: tierError } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('tier_code', tierCode)
      .maybeSingle() // Use maybeSingle() to handle missing tiers gracefully
    
    return { 
      tier: tierData || { tier_code: 'free', tier_name: 'Free', price_monthly: 0, max_reminders_per_day: 0, features: {} }, 
      profile: data,
      error: tierError 
    }
  },

  async getAllTiers() {
    const { data, error } = await supabase
      .from('subscription_tiers')
      .select('*')
      .order('price_monthly', { ascending: true })
    return { data, error }
  },

  async updateSubscription(userId, tierCode, startDate, endDate = null) {
    const updates = {
      subscription_tier: tierCode,
      subscription_status: 'active',
      subscription_start_date: startDate,
    }
    
    if (endDate) {
      updates.subscription_end_date = endDate
    }
    
    return await this.updateProfile(userId, updates)
  },
}

// Reminders
export const reminderService = {
  async getReminders(userId) {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .order('time', { ascending: true })
    return { data, error }
  },

  async createReminder(reminderData) {
    const { data, error } = await supabase
      .from('reminders')
      .insert([reminderData])
      .select()
      .single()
    return { data, error }
  },

  async updateReminder(reminderId, updates) {
    const { data, error } = await supabase
      .from('reminders')
      .update(updates)
      .eq('id', reminderId)
      .select()
      .single()
    return { data, error }
  },

  async deleteReminder(reminderId) {
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', reminderId)
    return { error }
  },

  async getReminderLogs(userId, startDate, endDate) {
    const { data, error } = await supabase
      .from('reminder_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('sent_at', startDate)
      .lte('sent_at', endDate)
      .order('sent_at', { ascending: false })
    return { data, error }
  },
}

