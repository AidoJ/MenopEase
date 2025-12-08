import { useNavigate } from 'react-router-dom'
import Button from '../UI/Button'
import Card from '../UI/Card'
import { subscriptionService } from '../../services/subscriptionService'
import './UpgradePrompt.css'

/**
 * UpgradePrompt Component
 * 
 * Shows when user tries to access a feature they don't have access to.
 * Displays upgrade options and benefits.
 */
const UpgradePrompt = ({ 
  requiredTier = 'basic',
  currentTier = 'free',
  feature = null,
  title = null,
  description = null
}) => {
  const navigate = useNavigate()

  const tierNames = {
    free: 'Free',
    basic: 'Basic',
    premium: 'Premium',
    professional: 'Professional'
  }

  const tierDescriptions = {
    basic: 'Get reminders, reports, and extended history',
    premium: 'Unlock advanced features and unlimited history',
    professional: 'Access all features including API and white-label options'
  }

  const handleUpgrade = () => {
    navigate('/subscription/plans')
  }

  const displayTitle = title || `Upgrade to ${tierNames[requiredTier]}`
  const displayDescription = description || tierDescriptions[requiredTier] || 
    `This feature requires a ${tierNames[requiredTier]} subscription.`

  return (
    <Card className="upgrade-prompt">
      <div className="upgrade-prompt-icon">🔒</div>
      <h3 className="upgrade-prompt-title">{displayTitle}</h3>
      <p className="upgrade-prompt-description">{displayDescription}</p>
      
      <div className="upgrade-prompt-features">
        <div className="feature-item">
          <span className="feature-icon">✅</span>
          <span>Extended history access</span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">✅</span>
          <span>Email & SMS reminders</span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">✅</span>
          <span>Automated reports</span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">✅</span>
          <span>Advanced insights</span>
        </div>
      </div>

      <div className="upgrade-prompt-actions">
        <Button 
          variant="primary" 
          onClick={handleUpgrade}
          style={{ width: '100%' }}
        >
          View Plans & Upgrade
        </Button>
        <Button 
          variant="secondary" 
          onClick={() => navigate('/profile')}
          style={{ width: '100%', marginTop: '8px' }}
        >
          Manage Subscription
        </Button>
      </div>
    </Card>
  )
}

export default UpgradePrompt

