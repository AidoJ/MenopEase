import { useAuth } from '../../contexts/AuthContext'
import { format } from 'date-fns'
import './Header.css'

const Header = () => {
  const { user, signOut } = useAuth()
  const today = format(new Date(), 'EEEE, MMMM d, yyyy')

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="header">
      <div className="header-content">
        <div>
          <h1>MenoTrak</h1>
          <div className="subtitle">{today}</div>
        </div>
        {user && (
          <button className="sign-out-btn" onClick={handleSignOut}>
            Sign Out
          </button>
        )}
      </div>
    </header>
  )
}

export default Header

