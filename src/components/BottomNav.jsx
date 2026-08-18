import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { haptic } from '../utils/haptics'
import FixedPortal from './FixedPortal'

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
  const activeIndex = tabs.findIndex(tab => tab.path === location.pathname)

  return (
    <FixedPortal>
      <div style={{
        position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom) + 14px)', left: '50%', transform: 'translateX(-50%)',
        width: 'min(calc(100% - 32px), 398px)', background: '#fff',
        borderRadius: 28,
        boxShadow: '0 12px 32px rgba(20,24,32,0.12), 0 2px 8px rgba(20,24,32,0.05)',
        display: 'flex', padding: 6, zIndex: 100,
      }}>
        <div style={{
          position: 'absolute', top: 6, bottom: 6,
          left: `calc(6px + ${Math.max(activeIndex, 0)} * ((100% - 12px) / ${tabs.length}))`,
          width: `calc((100% - 12px) / ${tabs.length})`,
          background: '#F2F3F6', borderRadius: 22,
          boxShadow: 'inset 3px 3px 6px rgba(0,0,0,0.10), inset -3px -3px 6px rgba(255,255,255,0.85)',
          opacity: activeIndex === -1 ? 0 : 1,
          transition: 'left 380ms cubic-bezier(0.34, 1.2, 0.64, 1), opacity 200ms ease',
          pointerEvents: 'none',
        }} />
        {tabs.map(tab => {
          const active = location.pathname === tab.path
          const color = active ? themeData.primary : '#ABB1BA'
          return (
            <button key={tab.path} onClick={() => { if (!active) { haptic.selection(); navigate(tab.path) } }}
              className="pressable-subtle"
              style={{
                flex: 1, minHeight: 48, padding: '6px 2px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                background: 'transparent', borderRadius: 22, position: 'relative', zIndex: 1,
                border: 'none', cursor: 'pointer',
              }}>
              <span style={{ display: 'flex', animation: active ? 'navIconPop 380ms cubic-bezier(0.34, 1.2, 0.64, 1)' : 'none' }}>
                <Icon name={tab.icon} color={color} />
              </span>
              <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500, color, letterSpacing: '-0.2px', transition: 'color 180ms ease, font-weight 180ms ease' }}>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </FixedPortal>
  )
}