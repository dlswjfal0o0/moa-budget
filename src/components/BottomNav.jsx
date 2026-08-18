import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { haptic } from '../utils/haptics'
import FixedPortal from './FixedPortal'

const Icon = ({ name, color }) => {
  const p = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", style: { transition: 'stroke 180ms ease' } }
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

const PAD = 6

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { themeData } = useTheme()
  const activeIndex = tabs.findIndex(tab => tab.path === location.pathname)
  const rowRef = useRef(null)
  const indicatorRef = useRef(null)
  const prevIndexRef = useRef(activeIndex)

  // 탭 전환 시 pill이 출발/도착 사이를 순간적으로 늘어났다 blur와 함께 수축하며 정착하는
  // 앱스토어 스타일 "liquid morph" 이동을 흉내낸다.
  // left/width를 직접 애니메이션하면 매 프레임 레이아웃을 다시 계산해야 해서(reflow),
  // 탭 직후 라우트 전환·컴포넌트 마운트로 바쁜 메인 스레드와 경쟁해 버벅이고 탭 반응도
  // 늦어진다. 그래서 실제 위치(left/width)는 항상 최종 탭 위치로 고정해두고,
  // 시각적인 늘어남은 GPU 합성만으로 처리되는 transform(translateX+scaleX)으로만 표현한다.
  useEffect(() => {
    const prevIndex = prevIndexRef.current
    prevIndexRef.current = activeIndex
    if (activeIndex === -1 || prevIndex === -1 || prevIndex === activeIndex) return

    const row = rowRef.current
    const indicator = indicatorRef.current
    if (!row || !indicator) return

    const colWidth = (row.clientWidth - PAD * 2) / tabs.length
    const leftFor = i => PAD + i * colWidth
    const startLeft = leftFor(prevIndex)
    const endLeft = leftFor(activeIndex)
    const startL = startLeft, startR = startLeft + colWidth
    const endL = endLeft, endR = endLeft + colWidth
    const dir = endLeft > startLeft ? 1 : -1
    const overshoot = 8
    const lerp = (a, b, t) => a + (b - a) * t
    // transform-origin: 0% 50% 기준이므로, 원하는 시각적 박스 [L, R]을
    // (최종 정착 위치인) 기준 박스 [endL, endR] 대비 translateX/scaleX로 환산한다.
    const toTransform = (L, R) => `translateX(${L - endL}px) scaleX(${(R - L) / colWidth})`

    // 대칭으로 늘어나면 방향성 없는 뭉게진 덩어리처럼 보여서 "슬라이드"로 안 읽힌다.
    // 이동 방향 쪽 모서리는 목적지를 향해 먼저 쏘아 나가고(오버슈트 포함),
    // 반대쪽 모서리는 뒤늦게 따라붙게 해서 화살촉처럼 늘어나는 방향성을 준다.
    let p1L, p1R, p2L, p2R
    if (dir === 1) {
      const raceTarget = endR + overshoot
      p1R = lerp(startR, raceTarget, 0.92); p1L = lerp(startL, endL, 0.10)
      p2R = lerp(raceTarget, endR, 0.7); p2L = lerp(startL, endL, 0.82)
    } else {
      const raceTarget = endL - overshoot
      p1L = lerp(startL, raceTarget, 0.92); p1R = lerp(startR, endR, 0.10)
      p2L = lerp(raceTarget, endL, 0.7); p2R = lerp(startR, endR, 0.82)
    }

    // 쉬고 있을 때의 뉴모피즘 회색(#F2F3F6)은 흰 배경과 명도 차이가 거의 없어서,
    // 늘어난 채로 blur까지 걸리면 눌림 그림자의 미세한 경계마저 뭉개져 사실상 안 보인다.
    // 움직이는 동안만 흰색-연한 회색 중간 톤(#E4E6E9, 무채색 유지)으로 살짝 짙어졌다가
    // 멈추면 다시 원래 뉴모피즘 회색으로 가라앉힌다.
    indicator.getAnimations().forEach(a => a.cancel())
    indicator.animate([
      { transform: toTransform(startL, startR), filter: 'blur(0px)', background: '#F2F3F6', offset: 0, easing: 'cubic-bezier(0.2, 0, 0.4, 1)' },
      { transform: toTransform(p1L, p1R), filter: 'blur(4px)', background: '#E4E6E9', offset: 0.34, easing: 'cubic-bezier(0.3, 0, 0.3, 1)' },
      { transform: toTransform(p2L, p2R), filter: 'blur(1.5px)', background: '#F2F3F6', offset: 0.68, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
      { transform: toTransform(endL, endR), filter: 'blur(0px)', background: '#F2F3F6', offset: 1 },
    ], { duration: 380, fill: 'forwards' })
  }, [activeIndex])

  return (
    <FixedPortal>
      <div ref={rowRef} style={{
        position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)', left: '50%', transform: 'translateX(-50%)',
        width: 'min(calc(100% - 32px), 398px)', background: '#fff',
        borderRadius: 28,
        boxShadow: '0 12px 32px rgba(20,24,32,0.12), 0 2px 8px rgba(20,24,32,0.05)',
        display: 'flex', padding: PAD, zIndex: 100,
      }}>
        <div ref={indicatorRef} style={{
          position: 'absolute', top: 6, bottom: 6,
          left: `calc(6px + ${Math.max(activeIndex, 0)} * ((100% - 12px) / ${tabs.length}))`,
          width: `calc((100% - 12px) / ${tabs.length})`,
          background: '#F2F3F6', borderRadius: 22, transformOrigin: '0% 50%', willChange: 'transform, filter',
          boxShadow: 'inset 3px 3px 6px rgba(0,0,0,0.10), inset -3px -3px 6px rgba(255,255,255,0.85)',
          opacity: activeIndex === -1 ? 0 : 1,
          transition: 'opacity 200ms ease',
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
                border: 'none', cursor: 'pointer', touchAction: 'manipulation',
              }}>
              <span style={{ display: 'flex', animation: active ? 'navIconPop 400ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none' }}>
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
