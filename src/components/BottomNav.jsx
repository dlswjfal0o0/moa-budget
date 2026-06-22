import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'

const Icon = ({ name, color }) => {
  const p = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }
  if (name === 'calendar') return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  if (name === 'book') return <svg {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
  if (name === 'home') return <svg {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  if (name === 'chart') return <svg {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  if (name === 'user') return <svg {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  return null
}

const tabs = [
  { path: '/calendar', label: '캘린더', icon: 'calendar' },
  { path: '/ledger', label: '가계부', icon: 'book' },
  { path: '/home', label: '홈', icon: 'home' },
  { path: '/analysis', label: '분석', icon: 'chart' },
  { path: '/my', label: 'MY', icon: 'user' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { themeData } = useTheme()

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430, background: '#fff',
      boxShadow: '0 -1px 0 #F2F4F6, 0 -8px 24px rgba(0,0,0,0.04)',
      display: 'flex', zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {tabs.map(tab => {
        const active = location.pathname === tab.path
        const color = active ? themeData.primary : '#C9CDD4'
        return (
          <button key={tab.path} onClick={() => navigate(tab.path)}
            style={{ flex: 1, padding: '12px 0 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
            <Icon name={tab.icon} color={color} />
            <span style={{ fontSize: 11, fontWeight: active ? 700 : 400, color, letterSpacing: '-0.2px' }}>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}