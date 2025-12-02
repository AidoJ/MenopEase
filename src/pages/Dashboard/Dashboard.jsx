import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/UI/Card'
import Button from '../../components/UI/Button'
import { supabase } from '../../config/supabase'
import './Dashboard.css'

const Dashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    sleep: '7.5h',
    energy: '😊',
    water: '1.8L',
    meals: '3/3',
  })

  const quickActions = [
    { icon: '🌙', label: 'Sleep', path: '/sleep' },
    { icon: '🍽️', label: 'Food', path: '/food' },
    { icon: '📋', label: 'Symptoms', path: '/symptoms' },
    { icon: '💊', label: 'Medications', path: '/medications' },
    { icon: '🏃', label: 'Exercise', path: '/exercise' },
    { icon: '💆', label: 'Mood', path: '/mood' },
    { icon: '🌤️', label: 'Weather', path: '/mood' },
    { icon: '📝', label: 'Journal', path: '/journal' },
  ]

  useEffect(() => {
    // TODO: Fetch actual stats from Supabase
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    // TODO: Implement data fetching
  }

  return (
    <div className="dashboard">
      <Card>
        <div className="card-header">
          <div>
            <div className="card-title">Today's Overview</div>
            <div className="card-subtitle">Your daily health snapshot</div>
          </div>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{stats.sleep}</span>
            <span className="stat-label">Sleep</span>
          </div>
          <div className="stat-card teal">
            <span className="stat-value">{stats.energy}</span>
            <span className="stat-label">Energy</span>
          </div>
          <div className="stat-card teal">
            <span className="stat-value">{stats.water}</span>
            <span className="stat-label">Water</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.meals}</span>
            <span className="stat-label">Meals</span>
          </div>
        </div>
      </Card>

      <Card>
        <div className="card-header">
          <div>
            <div className="card-title">Quick Log</div>
            <div className="card-subtitle">Track your day</div>
          </div>
        </div>
        <div className="quick-grid">
          {quickActions.map((action) => (
            <div
              key={action.path}
              className="quick-btn"
              onClick={() => navigate(action.path)}
            >
              <div className="icon">{action.icon}</div>
              <div className="label">{action.label}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="card-header">
          <div className="card-title">Tracking Streak</div>
        </div>
        <p style={{ fontSize: '14px', marginBottom: '10px' }}>
          You've logged data for <strong>7 days</strong> in a row! 🎉
        </p>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: '70%' }}></div>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px' }}>
          70% of daily goals completed
        </p>
      </Card>
    </div>
  )
}

export default Dashboard

