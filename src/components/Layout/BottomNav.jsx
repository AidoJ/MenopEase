import { NavLink, useLocation } from 'react-router-dom'
import './BottomNav.css'

const BottomNav = () => {
  const location = useLocation()

  const navItems = [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/track', icon: '📊', label: 'Track' },
    { path: '/insights', icon: '💡', label: 'Insights' },
    { path: '/profile', icon: '👤', label: 'Profile' },
  ]

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={`nav-btn ${isActive ? 'active' : ''}`}
          >
            <span className="icon">{item.icon}</span>
            <span className="label">{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}

export default BottomNav

