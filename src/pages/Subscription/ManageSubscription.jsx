import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { subscriptionService } from '../../services/subscriptionService'
import Card from '../../components/UI/Card'
import Button from '../../components/UI/Button'
import { format } from 'date-fns'
import './ManageSubscription.css'

const ManageSubscription = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState(null)
  const [history, setHistory] = useState([])
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadSubscription()
  }, [user])

  const loadSubscription = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data: subscriptionData, error: subError } = await subscriptionService.getCurrentSubscription(user.id)
      if (subError) throw subError

      const { data: historyData, error: historyError } = await subscriptionService.getSubscriptionHistory(user.id)
      if (historyError) console.warn('Error loading history:', historyError)

      setSubscription(subscriptionData)
      setHistory(historyData || [])
    } catch (err) {
      console.error('Error loading subscription:', err)
      setError('Failed to load subscription details')
    } finally {
      setLoading(false)
    }
  }

  const handleManageBilling = async () => {
    if (!user) return

    setProcessing(true)
    setError('')
    setSuccess('')

    try {
      const { data, error: portalError } = await subscriptionService.createBillingPortalSession(user.id)
      
      if (portalError) throw portalError

      if (data?.url) {
        window.location.href = data.url
      } else {
        throw new Error('No portal URL received')
      }
    } catch (err) {
      console.error('Error creating billing portal session:', err)
      setError(err.message || 'Failed to open billing portal. Please try again.')
      setProcessing(false)
    }
  }

  const handleUpgrade = () => {
    window.location.href = '/subscription/plans'
  }

  const getStatusColor = (status) => {
    const colors = {
      active: 'var(--teal)',
      cancelled: 'var(--text-secondary)',
      past_due: '#f59e0b',
      trialing: 'var(--purple)',
      expired: '#ef4444'
    }
    return colors[status] || 'var(--text-secondary)'
  }

  const formatEventType = (eventType) => {
    return eventType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  if (loading) {
    return (
      <div className="manage-subscription">
        <div className="page-title">Manage Subscription</div>
        <Card>
          <p>Loading subscription details...</p>
        </Card>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="manage-subscription">
        <div className="page-title">Manage Subscription</div>
        <Card>
          <p>No subscription found. You're currently on the Free plan.</p>
          <Button variant="primary" onClick={handleUpgrade} style={{ marginTop: '16px' }}>
            View Plans & Upgrade
          </Button>
        </Card>
      </div>
    )
  }

  const isFree = subscription.subscription_tier === 'free'
  const isActive = subscription.subscription_status === 'active'
  const tierDetails = subscription.tier_details

  return (
    <div className="manage-subscription">
      <div className="page-title">Manage Subscription</div>

      {error && (
        <Card className="error-card">
          <div className="error-message">{error}</div>
        </Card>
      )}

      {success && (
        <Card className="success-card">
          <div className="success-message">{success}</div>
        </Card>
      )}

      {/* Current Plan Card */}
      <Card className="current-plan-card">
        <div className="plan-header-section">
          <div>
            <h2 className="plan-title">
              {subscriptionService.getTierName(subscription.subscription_tier)} Plan
            </h2>
            <div 
              className="status-badge"
              style={{ backgroundColor: getStatusColor(subscription.subscription_status) }}
            >
              {subscription.subscription_status}
            </div>
          </div>
          {!isFree && (
            <div className="plan-price-display">
              {subscription.subscription_period === 'yearly' ? (
                <span>
                  ${tierDetails?.price_yearly?.toFixed(2) || '0.00'}/year
                </span>
              ) : (
                <span>
                  ${tierDetails?.price_monthly?.toFixed(2) || '0.00'}/month
                </span>
              )}
            </div>
          )}
        </div>

        {tierDetails?.description && (
          <p className="plan-description">{tierDetails.description}</p>
        )}

        <div className="subscription-details-grid">
          {subscription.subscription_start_date && (
            <div className="detail-item">
              <span className="detail-label">Started:</span>
              <span className="detail-value">
                {format(new Date(subscription.subscription_start_date), 'MMM d, yyyy')}
              </span>
            </div>
          )}
          
          {subscription.subscription_end_date && (
            <div className="detail-item">
              <span className="detail-label">
                {subscription.cancel_at_period_end ? 'Cancels on:' : 'Renews on:'}
              </span>
              <span className="detail-value">
                {format(new Date(subscription.subscription_end_date), 'MMM d, yyyy')}
              </span>
            </div>
          )}

          <div className="detail-item">
            <span className="detail-label">Billing Period:</span>
            <span className="detail-value">
              {subscription.subscription_period === 'yearly' ? 'Yearly' : 'Monthly'}
            </span>
          </div>
        </div>

        {/* Features List */}
        {tierDetails?.features && (
          <div className="features-section">
            <h3 className="section-title">Your Plan Includes:</h3>
            <div className="features-list">
              {tierDetails.features.history_days && (
                <div className="feature-item">
                  <span className="feature-icon">📊</span>
                  <span>
                    {tierDetails.features.history_days === null 
                      ? 'Unlimited history' 
                      : `${tierDetails.features.history_days}-day history`}
                  </span>
                </div>
              )}
              
              {tierDetails.features.reminders?.enabled && (
                <div className="feature-item">
                  <span className="feature-icon">🔔</span>
                  <span>
                    {tierDetails.features.reminders.max_per_day || 0} reminder{tierDetails.features.reminders.max_per_day !== 1 ? 's' : ''} per day
                  </span>
                </div>
              )}
              
              {tierDetails.features.reports?.enabled && (
                <div className="feature-item">
                  <span className="feature-icon">📄</span>
                  <span>Automated reports</span>
                </div>
              )}
              
              {tierDetails.features.insights && (
                <div className="feature-item">
                  <span className="feature-icon">💡</span>
                  <span>
                    {tierDetails.features.insights === 'basic' ? 'Basic insights' : 'Advanced insights'}
                  </span>
                </div>
              )}
              
              {tierDetails.features.pdf_export && (
                <div className="feature-item">
                  <span className="feature-icon">📥</span>
                  <span>PDF export</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          {isFree ? (
            <Button variant="primary" onClick={handleUpgrade} style={{ width: '100%' }}>
              Upgrade to Premium
            </Button>
          ) : (
            <>
              <Button 
                variant="primary" 
                onClick={handleManageBilling}
                disabled={processing}
                style={{ width: '100%' }}
              >
                {processing ? 'Opening...' : 'Manage Billing'}
              </Button>
              <Button 
                variant="secondary" 
                onClick={handleUpgrade}
                style={{ width: '100%', marginTop: '12px' }}
              >
                Change Plan
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Subscription History */}
      {history.length > 0 && (
        <Card className="history-card">
          <h3 className="section-title">Subscription History</h3>
          <div className="history-list">
            {history.map((event) => (
              <div key={event.id} className="history-item">
                <div className="history-event">
                  <div className="history-event-type">{formatEventType(event.event_type)}</div>
                  <div className="history-event-date">
                    {format(new Date(event.created_at), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
                {event.from_tier && event.to_tier && (
                  <div className="history-change">
                    {subscriptionService.getTierName(event.from_tier)} → {subscriptionService.getTierName(event.to_tier)}
                  </div>
                )}
                {event.amount && (
                  <div className="history-amount">${event.amount.toFixed(2)}</div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

export default ManageSubscription

