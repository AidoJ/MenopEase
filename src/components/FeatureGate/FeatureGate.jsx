import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { subscriptionService } from '../../services/subscriptionService'
import UpgradePrompt from '../UpgradePrompt/UpgradePrompt'
import './FeatureGate.css'

/**
 * FeatureGate Component
 * 
 * Wraps content that requires a specific subscription tier or feature.
 * Shows upgrade prompt if user doesn't have access.
 * 
 * @param {string} requiredTier - Required tier: 'free', 'basic', 'premium', 'professional'
 * @param {string} feature - Feature path (e.g., 'reminders.enabled')
 * @param {ReactNode} children - Content to show if user has access
 * @param {ReactNode} fallback - Custom fallback content (optional)
 */
const FeatureGate = ({ 
  requiredTier = 'free', 
  feature = null,
  children, 
  fallback = null 
}) => {
  const { user } = useAuth()
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentTier, setCurrentTier] = useState('free')

  useEffect(() => {
    checkAccess()
  }, [user, requiredTier, feature])

  const checkAccess = async () => {
    if (!user) {
      setHasAccess(false)
      setLoading(false)
      return
    }

    try {
      // Get current subscription
      const { data: subscription } = await subscriptionService.getCurrentSubscription(user.id)
      
      if (!subscription) {
        setCurrentTier('free')
        setHasAccess(requiredTier === 'free')
        setLoading(false)
        return
      }

      const userTier = subscription.subscription_tier || 'free'
      setCurrentTier(userTier)

      // Check tier access
      const tierRank = { free: 0, basic: 1, premium: 2, professional: 3 }
      const userRank = tierRank[userTier] || 0
      const requiredRank = tierRank[requiredTier] || 0

      if (userRank < requiredRank) {
        setHasAccess(false)
        setLoading(false)
        return
      }

      // If feature path is specified, check feature access
      if (feature) {
        const { allowed } = await subscriptionService.canAccessFeature(user.id, feature)
        setHasAccess(allowed)
      } else {
        setHasAccess(true)
      }
    } catch (error) {
      console.error('Error checking feature access:', error)
      setHasAccess(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="feature-gate-loading">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    return (
      <UpgradePrompt 
        requiredTier={requiredTier}
        currentTier={currentTier}
        feature={feature}
      />
    )
  }

  return <>{children}</>
}

export default FeatureGate

