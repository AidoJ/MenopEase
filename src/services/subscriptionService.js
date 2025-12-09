/**
 * Subscription Service
 *
 * Handles all subscription-related operations including:
 * - Fetching subscription tiers
 * - Creating checkout sessions
 * - Managing billing portal
 * - Checking feature access
 * - Getting tier limits
 */

import { supabase } from '../config/supabase'

export const subscriptionService = {
  /**
   * Get all available subscription tiers
   */
  getAllTiers: async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error fetching subscription tiers:', error)
      return { data: null, error }
    }
  },

  /**
   * Get a specific tier by code
   */
  getTierByCode: async (tierCode) => {
    try {
      const { data, error } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('tier_code', tierCode)
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error fetching tier:', error)
      return { data: null, error }
    }
  },

  /**
   * Get current user's subscription details
   */
  getCurrentSubscription: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          subscription_tier,
          subscription_status,
          subscription_period,
          subscription_start_date,
          subscription_end_date,
          cancel_at_period_end,
          stripe_customer_id,
          stripe_subscription_id
        `)
        .eq('user_id', userId)
        .single()

      if (error) throw error

      // Also get tier details
      const { data: tierData } = await subscriptionService.getTierByCode(data.subscription_tier)

      return {
        data: {
          ...data,
          tier_details: tierData
        },
        error: null
      }
    } catch (error) {
      console.error('Error fetching current subscription:', error)
      return { data: null, error }
    }
  },

  /**
   * Get subscription history for a user
   */
  getSubscriptionHistory: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('subscription_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error fetching subscription history:', error)
      return { data: null, error }
    }
  },

  /**
   * Create a Stripe checkout session
   * Can use either priceId (if pre-configured) or amount (to create price dynamically)
   */
  createCheckoutSession: async (priceId, userId, tierCode, period, amount = null, tierName = null) => {
    try {
      const response = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          priceId: priceId || null,
          userId,
          tierCode,
          period,
          amount: amount || null,
          tierName: tierName || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      return { data: null, error }
    }
  },

  /**
   * Create a billing portal session
   */
  createBillingPortalSession: async (userId) => {
    try {
      const response = await fetch('/.netlify/functions/create-billing-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create billing portal session')
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error creating billing portal session:', error)
      return { data: null, error }
    }
  },

  /**
   * Check if user can access a specific feature
   */
  canAccessFeature: async (userId, featurePath) => {
    try {
      const { data: subscription } = await subscriptionService.getCurrentSubscription(userId)

      if (!subscription || !subscription.tier_details) {
        return { allowed: false, reason: 'No subscription found' }
      }

      const features = subscription.tier_details.features

      // Navigate through feature path (e.g., "reminders.enabled")
      const pathParts = featurePath.split('.')
      let value = features

      for (const part of pathParts) {
        if (value && typeof value === 'object') {
          value = value[part]
        } else {
          return { allowed: false, reason: 'Feature not found' }
        }
      }

      if (typeof value === 'boolean') {
        return { allowed: value, reason: value ? null : 'Feature not available in current tier' }
      }

      return { allowed: !!value, reason: value ? null : 'Feature not available' }
    } catch (error) {
      console.error('Error checking feature access:', error)
      return { allowed: false, reason: 'Error checking access' }
    }
  },

  /**
   * Get tier limits for a specific feature
   */
  getTierLimits: async (userId, limitType) => {
    try {
      const { data: subscription } = await subscriptionService.getCurrentSubscription(userId)

      if (!subscription || !subscription.tier_details) {
        return { data: null, error: 'No subscription found' }
      }

      const features = subscription.tier_details.features

      switch (limitType) {
        case 'history_days':
          return {
            data: features.history_days,
            error: null,
            unlimited: features.history_days === null
          }

        case 'reminders_per_day':
          return {
            data: features.reminders?.max_per_day || 0,
            error: null
          }

        case 'reminder_methods':
          return {
            data: features.reminders?.methods || [],
            error: null
          }

        case 'reminder_frequencies':
          return {
            data: features.reminders?.frequencies || [],
            error: null
          }

        case 'report_methods':
          return {
            data: features.reports?.methods || [],
            error: null
          }

        case 'report_frequencies':
          return {
            data: features.reports?.frequencies || [],
            error: null
          }

        default:
          return { data: null, error: 'Unknown limit type' }
      }
    } catch (error) {
      console.error('Error getting tier limits:', error)
      return { data: null, error }
    }
  },

  /**
   * Check if user can use a specific reminder frequency
   */
  canUseReminderFrequency: async (userId, frequency) => {
    try {
      const { data: allowedFrequencies } = await subscriptionService.getTierLimits(
        userId,
        'reminder_frequencies'
      )

      return allowedFrequencies?.includes(frequency) || false
    } catch (error) {
      console.error('Error checking reminder frequency:', error)
      return false
    }
  },

  /**
   * Check if user can use a specific communication method
   */
  canUseCommunicationMethod: async (userId, method, type = 'reminders') => {
    try {
      const limitType = type === 'reminders' ? 'reminder_methods' : 'report_methods'
      const { data: allowedMethods } = await subscriptionService.getTierLimits(userId, limitType)

      return allowedMethods?.includes(method) || false
    } catch (error) {
      console.error('Error checking communication method:', error)
      return false
    }
  },

  /**
   * Get history limit in days (null = unlimited)
   */
  getHistoryLimit: async (userId) => {
    try {
      const { data, unlimited } = await subscriptionService.getTierLimits(userId, 'history_days')

      return {
        days: data,
        unlimited: unlimited || false,
        cutoffDate: unlimited ? null : new Date(Date.now() - data * 24 * 60 * 60 * 1000)
      }
    } catch (error) {
      console.error('Error getting history limit:', error)
      return { days: 7, unlimited: false, cutoffDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }
  },

  /**
   * Check if user has an active paid subscription
   */
  hasPaidSubscription: async (userId) => {
    try {
      const { data } = await subscriptionService.getCurrentSubscription(userId)

      return (
        data &&
        data.subscription_tier !== 'free' &&
        data.subscription_status === 'active'
      )
    } catch (error) {
      console.error('Error checking paid subscription:', error)
      return false
    }
  },

  /**
   * Get pretty tier name
   */
  getTierName: (tierCode) => {
    const names = {
      free: 'Free',
      basic: 'Basic',
      premium: 'Premium',
      professional: 'Professional'
    }
    return names[tierCode] || tierCode
  },

  /**
   * Format price for display
   */
  formatPrice: (amount, period = 'monthly') => {
    if (amount === 0) return 'Free'
    return `$${amount.toFixed(2)}/${period === 'yearly' ? 'year' : 'month'}`
  },

  /**
   * Calculate yearly savings
   */
  calculateYearlySavings: (monthlyPrice, yearlyPrice) => {
    const monthlyCost = monthlyPrice * 12
    const savings = monthlyCost - yearlyPrice
    const percentage = Math.round((savings / monthlyCost) * 100)
    return {
      amount: savings,
      percentage: percentage,
      description: `Save $${savings.toFixed(2)} (${percentage}%)`
    }
  }
}
