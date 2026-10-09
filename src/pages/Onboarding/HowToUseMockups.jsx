import { useState, useEffect, useRef } from 'react'
import { useReducedMotion } from '../../utils/motion'

/*
 * 온보딩(HowToUse) 폰 목업.
 * 실제 화면을 375×812(iPhone 기준 pt) 그대로 그린 뒤 PhoneFrame에서 transform: scale로 축소한다.
 * 그래서 폰트·여백·반경 값이 실제 페이지(Home/Calendar/Ledger/Analysis/MyPage)와 1:1로 대응한다.
 * 디자인 원본: Figma "모아 온보딩 — 실제 앱 기준 목업" (App screens / Onboarding 페이지)
 *
 * 각 목업은 usePhase 타임라인으로 "실제 사용하는 모습"(탭 → 반응)을 반복 재생한다.
 * 동작 줄이기 설정이면 타임라인을 멈추고 숫자·그래프를 최종값으로 바로 보여준다.
 */

const PRIMARY = '#3182F6'
const TEXT = '#191F28'
const TEXT2 = '#8B95A1'
const DANGER = '#FF5A5F'
const SUCCESS = '#2ECC71'
const PAGE = '#F2F4F6'
const CARD_SHADOW = '0 4px 20px rgba(0,0,0,0.06)'

const SCREEN_W = 375
const SCREEN_H = 812
const STATUS_H = 47
const BEZEL = 12
export const PHONE_W = SCREEN_W + BEZEL * 2
export const PHONE_H = SCREEN_H + BEZEL * 2
const CONTENT_H = SCREEN_H - STATUS_H
const NAV_TOP = SCREEN_H - 34 - 62 // 홈 인디케이터 영역(34pt) 위에 떠 있는 플로팅 네비

const fmt = (n) => n.toLocaleString('ko-KR')

/* ───────── 타임라인 훅 ───────── */
// marks(ms)마다 phase가 1씩 오르고, loopMs가 지나면 0으로 돌아가 처음부터 다시 재생한다.
function usePhase(marks, loopMs, reduced) {
  const [phase, setPhase] = useState(0)
  const [cycle, setCycle] = useState(0)
  useEffect(() => {
    if (reduced) return
    const timers = marks.map((m, i) => setTimeout(() => setPhase(i + 1), m))
    timers.push(setTimeout(() => { setPhase(0); setCycle(c => c + 1) }, loopMs))
    return () => timers.forEach(clearTimeout)
    // marks/loopMs는 각 목업에서 상수로 넘긴다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycle, reduced])
  return { phase, cycle }
}

// 마운트 직후 한 번 false → true로 바뀌어 CSS transition(막대 성장 등)을 시작시킨다
function useArmed(delay = 60) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setArmed(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return armed
}

function CountUp({ to, from = 0, duration = 900, delay = 0, reduced, format = fmt }) {
  const [value, setValue] = useState(from)
  const startRef = useRef(from)
  useEffect(() => {
    if (reduced) return
    const start = startRef.current
    startRef.current = to
    let raf = 0
    let t0 = 0
    const timer = setTimeout(() => {
      const step = (now) => {
        if (!t0) t0 = now
        const p = Math.min((now - t0) / duration, 1)
        const eased = 1 - Math.pow(1 - p, 3)
        setValue(Math.round(start + (to - start) * eased))
        if (p < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }, delay)
    return () => { clearTimeout(timer); cancelAnimationFrame(raf) }
  }, [to, duration, delay, reduced])
  return format(reduced ? to : value)
}

// 손가락 탭 표시 — show가 true가 되는 순간 한 번 퍼졌다 사라진다
function Tap({ x, y, show }) {
  if (!show) return null
  return (
    <div style={{
      position: 'absolute', left: x - 22, top: y - 22, width: 44, height: 44, borderRadius: '50%', zIndex: 50,
      background: 'rgba(25,31,40,0.18)', border: '2px solid rgba(255,255,255,0.9)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      animation: 'moaTap 560ms cubic-bezier(0.22,1,0.36,1) forwards', pointerEvents: 'none',
    }} />
  )
}

/* ───────── 아이콘 (실제 앱과 동일한 feather 계열 path) ───────── */
const ICON = {
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
  book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
  home: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>,
  chart: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>,
  user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  food: <><path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" /></>,
  down: <polyline points="6 9 12 15 18 9" />,
  right: <polyline points="9 18 15 12 9 6" />,
  left: <polyline points="15 18 9 12 15 6" />,
  check: <polyline points="20 6 9 17 4 12" />,
  search: <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
  pulse: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
  card: <><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></>,
  edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
  camera: <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
  bulb: <><path d="M12 2a5 5 0 0 0-5 5c0 1.6.8 3 2 3.87V13a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2.13c1.2-.87 2-2.27 2-3.87a5 5 0 0 0-5-5z" /><line x1="9" y1="19" x2="15" y2="19" /><line x1="10" y1="22" x2="14" y2="22" /></>,
  bell: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>,
  tag: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></>,
  palette: <><circle cx="13.5" cy="6.5" r="1" /><circle cx="17.5" cy="10.5" r="1" /><circle cx="8.5" cy="7.5" r="1" /><circle cx="6.5" cy="12.5" r="1" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.84-.44-1.13-.29-.29-.44-.65-.44-1.13A1.64 1.64 0 0 1 14.44 18h2c3.05 0 5.55-2.5 5.55-5.55C21.97 6.01 17.46 2 12 2z" /></>,
  type: <><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" /></>,
  upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></>,
  drop: <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />,
  bolt: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
}

function Icon({ name, size = 20, color = 'currentColor', stroke = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block' }}>
      {ICON[name]}
    </svg>
  )
}

/* ───────── 폰 프레임 ───────── */
const NAV_TABS = [['캘린더', 'calendar'], ['가계부', 'book'], ['홈', 'home'], ['분석', 'chart'], ['MY', 'user']]

// BottomNav.jsx 기본(플랫) 스타일과 동일: 343×62, r28, 회색 pill 인디케이터
function MockNav({ active }) {
  const idx = NAV_TABS.findIndex(([label]) => label === active)
  return (
    <div style={{
      position: 'absolute', left: 16, top: NAV_TOP, width: 343, height: 62, boxSizing: 'border-box', padding: 6, display: 'flex',
      background: '#fff', borderRadius: 28, zIndex: 20,
      boxShadow: '0 12px 32px rgba(20,24,32,0.12), 0 2px 8px rgba(20,24,32,0.05)',
    }}>
      <div style={{
        position: 'absolute', top: 6, bottom: 6, left: 6, width: 'calc((100% - 12px) / 5)', borderRadius: 22,
        background: '#F0F1F3', boxShadow: '0 1px 3px rgba(20,24,32,0.08)', transform: `translateX(${idx * 100}%)`,
      }} />
      {NAV_TABS.map(([label, icon]) => {
        const on = label === active
        const color = on ? PRIMARY : '#ABB1BA'
        return (
          <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, position: 'relative' }}>
            <Icon name={icon} size={22} color={color} stroke={1.8} />
            <span style={{ fontSize: 10.5, fontWeight: on ? 700 : 500, color, letterSpacing: '-0.2px' }}>{label}</span>
          </div>
        )
      })}
    </div>
  )
}

function StatusBar({ bg, tone }) {
  const c = tone === 'light' ? '#fff' : TEXT
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: STATUS_H, background: bg, zIndex: 30, transition: 'background 300ms ease' }}>
      <span style={{ position: 'absolute', left: 38, top: 14, fontSize: 16, fontWeight: 700, color: c, letterSpacing: 0, transition: 'color 300ms ease' }}>9:41</span>
      <svg width="68" height="12" viewBox="0 0 68 12" fill="none" style={{ position: 'absolute', left: 290, top: 19 }}>
        <rect x="0" y="8" width="3" height="4" rx="1" fill={c} /><rect x="5" y="5.5" width="3" height="6.5" rx="1" fill={c} />
        <rect x="10" y="3" width="3" height="9" rx="1" fill={c} /><rect x="15" y="0" width="3" height="12" rx="1" fill={c} />
        <path d="M30 3.2a9 9 0 0 1 12 0M32.2 5.8a5.6 5.6 0 0 1 7.6 0M34.4 8.4a2.4 2.4 0 0 1 3.2 0" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
        <rect x="44.5" y="0.5" width="21" height="11" rx="3.5" stroke={c} strokeOpacity="0.4" />
        <rect x="46.5" y="2.5" width="17" height="7" rx="2" fill={c} />
        <rect x="66.5" y="4" width="1.5" height="4" rx="0.75" fill={c} fillOpacity="0.4" />
      </svg>
      <div style={{ position: 'absolute', left: 126, top: 11, width: 123, height: 36, borderRadius: 18, background: '#000' }} />
    </div>
  )
}

function PhoneFrame({ scale, statusBg = '#fff', statusTone = 'dark', nav, overlay, children }) {
  return (
    <div aria-hidden="true" style={{ width: PHONE_W * scale, height: PHONE_H * scale, flexShrink: 0, pointerEvents: 'none', userSelect: 'none' }}>
      <div style={{
        width: PHONE_W, height: PHONE_H, boxSizing: 'border-box', padding: BEZEL, borderRadius: 56, background: '#111',
        transform: `scale(${scale})`, transformOrigin: '0 0', boxShadow: '0 24px 60px rgba(49,130,246,0.18)',
      }}>
        <div style={{ position: 'relative', width: SCREEN_W, height: SCREEN_H, borderRadius: 44, overflow: 'hidden', background: PAGE, letterSpacing: '-0.3px', textAlign: 'left' }}>
          <div style={{ position: 'absolute', top: STATUS_H, left: 0, width: SCREEN_W, height: CONTENT_H, overflow: 'hidden' }}>
            {children}
          </div>
          {nav && <MockNav active={nav} />}
          {overlay}
          <StatusBar bg={statusBg} tone={statusTone} />
          <div style={{ position: 'absolute', left: 121, bottom: 8, width: 134, height: 5, borderRadius: 3, background: TEXT, zIndex: 40 }} />
        </div>
      </div>
      <style>{`
        @keyframes moaTap { 0% { opacity: 0; transform: scale(0.5); } 25% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(1.35); } }
        @keyframes moaPop { 0% { transform: scale(0.4); } 60% { transform: scale(1.15); } 100% { transform: scale(1); } }
        @keyframes moaFade { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  )
}

/* ───────── 공통 조각 ───────── */
const card = { background: '#fff', borderRadius: 20, boxShadow: CARD_SHADOW }
const outlinedCard = { ...card, border: `1.5px solid ${PRIMARY}33` }
const addBtn = { height: 30, padding: '0 14px', borderRadius: 12, background: PRIMARY, color: '#fff', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center' }

function MonthNav({ title, size = 18, caret = '#C9CDD4', pad = '16px 24px 14px' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: pad }}>
      <span style={{ fontSize: 20, color: TEXT2, width: 23, textAlign: 'center' }}>‹</span>
      <p style={{ fontSize: size, fontWeight: 700, color: TEXT }}>{title}{caret && <span style={{ fontSize: 13, color: caret, marginLeft: 4 }}>▾</span>}</p>
      <span style={{ fontSize: 20, color: TEXT2, width: 23, textAlign: 'center' }}>›</span>
    </div>
  )
}

/* ───────── 홈 ───────── */
const UPCOMING = [
  { title: '넷플릭스', day: 3, amount: 17000, left: 1 },
  { title: '월세', day: 5, amount: 550000, left: 3 },
  { title: '자동차 할부', day: 10, amount: 280000, left: 8 },
  { title: '헬스장', day: 11, amount: 80000, left: 9 },
]
const HOME_TIPS = [['하루 한도 정하기', 'calendar'], ['식비 먼저 살펴보기', 'food'], ['주말 지출 계획', 'chart']]

export function HomeMockup({ scale }) {
  const reduced = useReducedMotion()
  // 0: 진입 / 1: 게이지 채움 / 2: 다가오는 결제까지 스크롤 / 3: 맨 위로 복귀
  const { phase, cycle } = usePhase([450, 2600, 5200], 7200, reduced)
  const gaugeOn = reduced || phase >= 1
  const scrolled = phase === 2
  const arc = Math.PI * 36
  return (
    <PhoneFrame scale={scale} nav="홈" statusBg={scrolled ? PAGE : PRIMARY} statusTone={scrolled ? 'dark' : 'light'}>
      <div style={{ background: PAGE, transform: `translateY(${scrolled ? -500 : 0}px)`, transition: 'transform 1.4s cubic-bezier(0.45,0,0.2,1)' }}>
        <div style={{ background: PRIMARY, padding: '24px 24px 28px', color: '#fff' }}>
          <p style={{ fontSize: 13, fontWeight: 500, opacity: 0.75, lineHeight: '16px', marginBottom: 4 }}>2026년 10월</p>
          <p style={{ fontSize: 18, fontWeight: 600, lineHeight: '22px', marginBottom: 23 }}>이번 달 현황</p>
          <div style={{ background: 'rgba(0,0,0,0.14)', borderRadius: 20, padding: '20px 24px' }}>
            <p style={{ fontSize: 13, fontWeight: 500, opacity: 0.75, lineHeight: '16px', marginBottom: 8 }}>이번 달 잔액</p>
            <p style={{ fontSize: 38, fontWeight: 700, lineHeight: '42px', letterSpacing: '-1px', marginBottom: 19 }}>
              <CountUp key={cycle} to={1984000} delay={300} duration={1000} reduced={reduced} />원
            </p>
            <div style={{ display: 'flex' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 500, opacity: 0.65, lineHeight: '15px', marginBottom: 4 }}>수입</p>
                <p style={{ fontSize: 17, fontWeight: 700, lineHeight: '20px' }}>+3,500,000원</p>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.2)', margin: '0 20px' }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 500, opacity: 0.65, lineHeight: '15px', marginBottom: 4 }}>지출</p>
                <p style={{ fontSize: 17, fontWeight: 700, lineHeight: '20px' }}>-1,516,000원</p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '24px 24px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: TEXT }}>예산 관리</p>
            <div style={addBtn}>+ 추가</div>
          </div>
          <div style={{ ...card, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>10월 생활비</span>
              <span style={{ fontSize: 12, color: TEXT2 }}>10/01 ~ 10/31</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ position: 'relative', width: 88, height: 48, flexShrink: 0 }}>
                <svg width="88" height="48" viewBox="0 0 88 48">
                  <path d="M 8 44 A 36 36 0 0 1 80 44" fill="none" stroke="#F2F4F6" strokeWidth="9" strokeLinecap="round" />
                  <path d="M 8 44 A 36 36 0 0 1 80 44" fill="none" stroke={PRIMARY} strokeWidth="9" strokeLinecap="round"
                    strokeDasharray={arc} strokeDashoffset={gaugeOn ? arc * 0.5 : arc}
                    style={{ transition: reduced ? 'none' : 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
                </svg>
                <p style={{ position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center', fontSize: 13, fontWeight: 700, color: PRIMARY }}>
                  <CountUp key={cycle} to={50} delay={450} duration={1200} reduced={reduced} format={String} />%
                </p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: TEXT2, lineHeight: '15px', marginBottom: 4 }}>이번 달 사용</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: TEXT, lineHeight: '24px', marginBottom: 4 }}>400,300원</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: SUCCESS, lineHeight: '16px' }}>잔여 399,700원</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 13, background: `${PRIMARY}10`, borderRadius: 14, padding: '13px 14px' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: PRIMARY, flexShrink: 0, marginTop: 5 }} />
              <p style={{ fontSize: 13, color: TEXT, lineHeight: '21px' }}>10월 생활비 예산을 여유 있게 관리하고 있어요. 지금까지 50%를 사용했고, 남은 30일 동안 하루 약 13,300원씩 쓸 수 있어요.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 11 }}>
              {HOME_TIPS.map(([title, icon]) => (
                <div key={title} style={{ height: 64, boxSizing: 'border-box', border: '1px solid #E5E8EB', borderRadius: 16, padding: '0 17px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${PRIMARY}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={icon} size={18} color={PRIMARY} />
                  </div>
                  <p style={{ flex: 1, fontSize: 14, fontWeight: 600, color: TEXT }}>{title}</p>
                  <Icon name="down" size={18} color="#C9CDD4" stroke={2.5} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, height: 37, borderRadius: 12, background: `${PRIMARY}10`, color: PRIMARY, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🔄 다시 분석</div>
          </div>

          <p style={{ fontSize: 18, fontWeight: 700, color: TEXT, margin: '28px 0 12px' }}>다가오는 결제</p>
          <div style={{ ...card, padding: '4px 20px' }}>
            {UPCOMING.map((f, i) => {
              const urgent = f.left <= 3
              const color = urgent ? DANGER : PRIMARY
              return (
                <div key={f.title} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: i < UPCOMING.length - 1 ? '1px solid #F2F4F6' : 'none' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: urgent ? '#FFF1F1' : `${PRIMARY}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="card" size={20} color={color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: TEXT, marginBottom: 3 }}>{f.title}</p>
                    <p style={{ fontSize: 13, color: TEXT2 }}>매월 {f.day}일</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: DANGER, marginBottom: 3 }}>-{fmt(f.amount)}원</p>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: color, borderRadius: 9999, padding: '3px 9px' }}>D-{f.left}</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ height: 140 }} />
        </div>
      </div>
    </PhoneFrame>
  )
}

/* ───────── 캘린더 ───────── */
// [수입, 지출] — 데모 데이터(utils/demoData.js) 10월분과 같은 값
const CAL_DATA = {
  1: ['+3,200,000', '-5,500'], 2: [null, '-83,600'], 3: [null, '-65,200'], 5: [null, '-618,900'], 6: [null, '-9,800'], 7: [null, '-81,000'],
  8: [null, '-15,000'], 9: [null, '-61,900'], 10: ['+300,000', null], 11: [null, '-80,000'], 13: [null, '-33,000'], 15: [null, '-7,800'],
  16: [null, '-49,300'], 17: [null, '-51,700'], 18: [null, '-11,600'], 19: [null, '-31,100'], 20: [null, '-30,000'], 21: [null, '-16,400'],
  22: [null, '-23,800'], 23: [null, '-136,700'], 25: [null, '-91,300'], 27: [null, '-3,800'], 28: [null, '-8,600'],
}
const FIXED_DAYS = [10, 18, 22, 25]
const FIXED_ITEMS = [
  { name: '넷플릭스', sub: '매월 3일 · KB국민 신용카드', amount: '-17,000원', done: true },
  { name: '월세', sub: '매월 5일 · 신한은행', amount: '-550,000원', done: true },
  { name: '자동차 할부', sub: '매월 10일 · KB국민 신용카드', amount: '-280,000원', done: false, demo: true },
  { name: '헬스장', sub: '매월 11일 · 신한 체크카드', amount: '-80,000원', done: true },
]

export function CalendarMockup({ scale }) {
  const reduced = useReducedMotion()
  // 1: 10일 탭 / 2: 10일 선택 / 3: 고정지출로 스크롤 / 4: 체크박스 탭 / 5: 납부 완료 체크
  const { phase } = usePhase([700, 820, 1800, 2700, 2820], 5400, reduced)
  const selected = phase >= 2 ? 10 : null
  const scrolled = phase >= 3
  const SCROLL = 260
  const cells = Array.from({ length: 35 }, (_, i) => i - 3) // 10/1 = 목요일
  return (
    <PhoneFrame scale={scale} nav="캘린더">
      <div style={{ transform: `translateY(${scrolled ? -SCROLL : 0}px)`, transition: 'transform 0.9s cubic-bezier(0.45,0,0.2,1)' }}>
        <div style={{ background: '#fff', borderBottom: '1px solid #F2F4F6', paddingBottom: 12 }}>
          <MonthNav title="2026년 10월" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 24px', marginBottom: 6 }}>
            {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
              <p key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, lineHeight: '19px', color: i === 0 ? DANGER : i === 6 ? PRIMARY : TEXT2 }}>{d}</p>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 1.5, columnGap: 1, padding: '0 24px' }}>
            {cells.map((day, i) => {
              if (day < 1 || day > 31) return <div key={i} style={{ height: 50 }} />
              const dow = i % 7
              const isSel = day === selected
              const [inc, exp] = CAL_DATA[day] || []
              return (
                <div key={i} style={{
                  height: 50, boxSizing: 'border-box', borderRadius: 12, paddingTop: 4.5, textAlign: 'center',
                  background: isSel ? '#EEF2FF' : FIXED_DAYS.includes(day) ? `${PRIMARY}22` : 'transparent',
                  border: `1.5px solid ${isSel ? PRIMARY : 'transparent'}`,
                  transform: phase === 1 && day === 10 ? 'scale(0.94)' : 'scale(1)', transition: 'transform 120ms ease, background 150ms ease, border-color 150ms ease',
                }}>
                  <p style={{ fontSize: 13, lineHeight: '16px', marginBottom: 2, fontWeight: day === 2 ? 700 : 400, color: day === 2 || dow === 6 ? PRIMARY : dow === 0 ? DANGER : TEXT }}>{day === 2 ? '●' : day}</p>
                  {inc && <p style={{ fontSize: 8, lineHeight: '10px', color: SUCCESS, letterSpacing: '-0.4px' }}>{inc}</p>}
                  {exp && <p style={{ fontSize: 8, lineHeight: '10px', color: DANGER, letterSpacing: '-0.4px', marginTop: inc ? 0 : 10 }}>{exp}</p>}
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px 10px', padding: '12px 20px 0' }}>
          {[['이번 주 지출', '-89,100원', DANGER], ['이번 주 수입', '+3,200,000원', SUCCESS], ['10월 지출', '-1,516,000원', DANGER], ['10월 수입', '+3,500,000원', SUCCESS]].map(([l, v, c]) => (
            <div key={l} style={{ ...card, padding: '13px 14px' }}>
              <p style={{ fontSize: 12, color: TEXT2, lineHeight: '15px', marginBottom: 2 }}>{l}</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: c, lineHeight: '18px' }}>{v}</p>
            </div>
          ))}
        </div>

        <div style={{ margin: '12px 16px 0', background: '#fff', borderRadius: '20px 20px 0 0', paddingBottom: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #F2F4F6' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: TEXT }}>고정지출</p>
            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: TEXT2, background: PAGE, borderRadius: 9999, padding: '3px 8px' }}>7개 · 월 1,258,900원</span>
            <div style={{ ...addBtn, marginLeft: 'auto' }}>+ 추가</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 14px' }}>
            {FIXED_ITEMS.map(item => {
              const done = item.done || (item.demo && phase >= 5)
              return (
                <div key={item.name} style={{
                  height: 65, boxSizing: 'border-box', borderRadius: 20, padding: '0 18px', display: 'flex', alignItems: 'center', gap: 14,
                  background: done ? '#F7F8FA' : '#fff', border: `1.5px solid ${done ? '#F2F4F6' : `${PRIMARY}33`}`, transition: 'background 200ms ease, border-color 200ms ease',
                }}>
                  <span style={{
                    width: 22, height: 22, boxSizing: 'border-box', borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: done ? PRIMARY : '#fff', border: `1.5px solid ${done ? PRIMARY : '#D1D6DB'}`,
                    animation: item.demo && phase >= 5 && !reduced ? 'moaPop 320ms cubic-bezier(0.22,1,0.36,1)' : 'none',
                  }}>
                    {done && <Icon name="check" size={12} color="#fff" stroke={3.5} />}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: done ? '#C9CDD4' : TEXT, marginBottom: 2, transition: 'color 200ms ease' }}>{item.name}</p>
                    <p style={{ fontSize: 12, color: TEXT2 }}>{item.sub}</p>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: done ? '#C9CDD4' : DANGER, transition: 'color 200ms ease' }}>{item.amount}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <Tap x={329} y={163} show={phase === 1} />
      <Tap x={59} y={757 - SCROLL} show={phase === 4} />
    </PhoneFrame>
  )
}

/* ───────── 가계부 ───────── */
const LEDGER_GROUPS = [
  ['10/28', [{ id: 'pharmacy', title: '약국', sub: '13:50 · 의료/건강 · 현금', amount: 8600, color: '#87CEFA', icon: 'pulse' }]],
  ['10/27', [{ id: 'cvs', title: '편의점', sub: '22:10 · 식비 · 카카오뱅크 체크카드', amount: 3800, color: '#FF6B6B', icon: 'food' }]],
  ['10/25', [
    { id: 'gas', title: '가스요금', sub: '09:32 · 공과금 · 신한 체크카드', amount: 44800, color: '#B9A6F5', icon: 'grid' },
    { id: 'water', title: '수도요금', sub: '09:31 · 공과금 · 신한 체크카드', amount: 15500, color: '#B9A6F5', icon: 'grid' },
  ]],
]
const NEW_TXN = { id: 'new', title: '스타벅스', sub: '14:20 · 식비 · 카카오뱅크 체크카드', amount: 5600, color: '#FF6B6B', icon: 'food' }

function TxnCard({ t }) {
  return (
    <div style={{ height: 75, boxSizing: 'border-box', background: '#fff', borderRadius: 20, border: '1.5px solid transparent', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', padding: '0 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 14, background: `${t.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={t.icon} size={20} color={t.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 3 }}>{t.title}</p>
        <p style={{ fontSize: 12, color: TEXT2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.sub}</p>
      </div>
      <p style={{ fontSize: 15, fontWeight: 700, color: DANGER }}>-{fmt(t.amount)}원</p>
    </div>
  )
}

export function LedgerMockup({ scale }) {
  const reduced = useReducedMotion()
  // 1: + 버튼 탭 / 2: 새 내역 추가 / 3: '소비' 필터 탭 / 4: 필터 적용
  const { phase, cycle } = usePhase([700, 950, 2700, 2820], 5400, reduced)
  const added = phase >= 2
  const filter = phase >= 4 ? '소비' : '전체'
  return (
    <PhoneFrame scale={scale} nav="가계부">
      <div style={{ background: '#fff', borderBottom: '1px solid #F2F4F6', padding: '20px 24px 17px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: TEXT }}>가계부</p>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="search" size={18} color={TEXT2} /></div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['주간', '월간', '직접'].map(t => (
            <div key={t} style={{ width: 60, height: 33, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: t === '월간' ? 700 : 500, background: t === '월간' ? PRIMARY : PAGE, color: t === '월간' ? '#fff' : TEXT2 }}>{t}</div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 22, color: TEXT2, lineHeight: '22px' }}>‹</span>
          <p style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>2026년 10월<span style={{ fontSize: 13, color: TEXT2, marginLeft: 4 }}>▾</span></p>
          <span style={{ fontSize: 22, color: TEXT2, lineHeight: '22px' }}>›</span>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, background: '#FFF1F1', borderRadius: 20, padding: '14px 16px' }}>
            <p style={{ fontSize: 13, color: TEXT2, lineHeight: '16px', marginBottom: 4 }}>지출</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: DANGER, lineHeight: '22px' }}>
              -<CountUp key={cycle} from={1516000} to={added ? 1521600 : 1516000} duration={600} reduced={reduced} />원
            </p>
          </div>
          <div style={{ flex: 1, background: '#F0FDF4', borderRadius: 20, padding: '14px 16px' }}>
            <p style={{ fontSize: 13, color: TEXT2, lineHeight: '16px', marginBottom: 4 }}>수입</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: SUCCESS, lineHeight: '22px' }}>+3,500,000원</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {['전체', '소비', '수입', '이체'].map(t => (
            <div key={t} style={{ width: 52, height: 31, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: t === filter ? 700 : 500, background: t === filter ? TEXT : 'transparent', color: t === filter ? '#fff' : TEXT2, transition: 'background 150ms ease, color 150ms ease' }}>{t}</div>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 500, color: TEXT2 }}>↓ 최신순</span>
        </div>
      </div>

      <div style={{ padding: '28px 24px 0' }}>
        {LEDGER_GROUPS.map(([date, rows], gi) => {
          const sum = rows.reduce((s, t) => s + t.amount, 0) + (gi === 0 && added ? NEW_TXN.amount : 0)
          return (
            <div key={date} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: TEXT2 }}>{date}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: DANGER }}>-{fmt(sum)}원</span>
              </div>
              {gi === 0 && (
                <div style={{ display: 'grid', gridTemplateRows: added ? '1fr' : '0fr', transition: reduced ? 'none' : 'grid-template-rows 360ms cubic-bezier(0.22,1,0.36,1)' }}>
                  <div style={{ overflow: 'hidden', minHeight: 0 }}>
                    <div style={{ paddingBottom: 8, opacity: added ? 1 : 0, transform: added ? 'translateY(0)' : 'translateY(-12px)', transition: 'opacity 300ms ease 80ms, transform 360ms cubic-bezier(0.22,1,0.36,1) 40ms' }}>
                      <TxnCard t={NEW_TXN} />
                    </div>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {rows.map(t => <TxnCard key={t.id} t={t} />)}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{
        position: 'absolute', right: 20, bottom: CONTENT_H - (NAV_TOP - STATUS_H) + 13, width: 56, height: 56, borderRadius: '50%', background: PRIMARY,
        display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(49,130,246,0.4)', zIndex: 10,
        transform: phase === 1 ? 'scale(0.9)' : 'scale(1)', transition: 'transform 140ms ease',
      }}>
        <Icon name="plus" size={24} color="#fff" stroke={2.5} />
      </div>
      <Tap x={327} y={NAV_TOP - STATUS_H - 13 - 28} show={phase === 1} />
      <Tap x={120} y={271} show={phase === 3} />
    </PhoneFrame>
  )
}

/* ───────── 분석 ───────── */
// 데모 데이터 10월 일별 지출(만원)
const DAILY = [3.2, 8.4, 6.5, 0, 61.9, 1, 8.1, 1.5, 6.2, 0, 8, 0, 3.3, 0, 0.8, 4.9, 5.2, 1.2, 3.1, 3, 1.6, 2.4, 13.7, 0, 9.1, 0, 0.4, 0.9, 0, 0, 0]
const CATEGORIES = [['주거', '#C9B1FF', 36], ['식비', '#FF6B6B', 20], ['쇼핑', '#45B7D1', 18], ['공과금', '#FF8C69', 6], ['생활', '#A8E6CF', 6]]
// 도넛 각 조각의 시작 위치(누적 %)
const CATEGORY_STARTS = CATEGORIES.map((_, i) => CATEGORIES.slice(0, i).reduce((s, c) => s + c[2], 0))
const UTILITIES = [
  { name: '관리비', icon: 'home', bg: '#F3F4F6', color: '#6B7280', amount: 120000, diff: '↑ +2,000원', up: true, prev: '전월 118,000원', day: 20, bars: [112, 115, 118, 120] },
  { name: '수도세', icon: 'drop', bg: '#EFF6FF', color: '#3B82F6', amount: 15000, diff: '↓ -1,200원', up: false, prev: '전월 16,200원', day: 25, bars: [14, 17, 16.2, 15] },
  { name: '전기세', icon: 'bolt', bg: '#FFFBEB', color: '#F59E0B', amount: 33000, diff: '↓ -4,500원', up: false, prev: '전월 37,500원', day: 25, bars: [52, 46, 37.5, 33] },
]

function SpendingView({ reduced }) {
  const armed = useArmed() || reduced
  const R = 52
  const circ = 2 * Math.PI * R
  return (
    <div style={{ padding: '16px 20px 0', animation: 'moaFade 260ms ease' }}>
      <div style={{ ...outlinedCard, padding: 18, marginBottom: 16 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: TEXT, marginBottom: 16 }}>지난 달 대비</p>
        <div style={{ display: 'flex', gap: 12 }}>
          {[['지출', '1,516,000원', '↓ 8,600원 감소', DANGER, SUCCESS], ['수입', '3,500,000원', '↓ 0원 감소', SUCCESS, DANGER]].map(([l, v, d, vc, dc]) => (
            <div key={l} style={{ ...card, flex: 1, padding: 14 }}>
              <p style={{ fontSize: 12, color: TEXT2, marginBottom: 3 }}>{l}</p>
              <p style={{ fontSize: 17, fontWeight: 700, color: vc, marginBottom: 6 }}>{v}</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: dc }}>{d}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...outlinedCard, padding: 18, marginBottom: 16 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: TEXT, marginBottom: 16 }}>일별 지출</p>
        <div style={{ position: 'relative', height: 186 }}>
          {['80만', '60만', '40만', '20만'].map((l, i) => (
            <div key={l} style={{ position: 'absolute', left: 0, right: 0, top: i * 42, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 28, textAlign: 'right', fontSize: 10, color: '#C9CDD4' }}>{l}</span>
              <div style={{ flex: 1, height: 1, background: '#F2F4F6' }} />
            </div>
          ))}
          <div style={{ position: 'absolute', left: 36, right: 0, bottom: 18, height: 168, display: 'flex', alignItems: 'flex-end', gap: 3 }}>
            {DAILY.map((v, i) => (
              <div key={i} style={{
                flex: 1, height: v ? Math.max((v / 80) * 168, 2) : 0, borderRadius: '2px 2px 0 0', background: i === 4 ? PRIMARY : '#C9CDD4',
                transformOrigin: 'bottom', transform: armed ? 'scaleY(1)' : 'scaleY(0)', transition: `transform 600ms cubic-bezier(0.22,1,0.36,1) ${i * 22}ms`,
              }} />
            ))}
          </div>
          <div style={{ position: 'absolute', left: 36, right: 0, bottom: 0, display: 'flex', justifyContent: 'space-between' }}>
            {[1, 6, 11, 16, 21, 26, 31].map(d => <span key={d} style={{ fontSize: 10, color: TEXT2 }}>{d}</span>)}
          </div>
        </div>
        <p style={{ textAlign: 'center', fontSize: 12, color: TEXT2, marginTop: 12 }}>최고 지출일: <b style={{ color: PRIMARY }}>5일</b> (-618,900원)</p>
      </div>
      <div style={{ ...card, padding: 16 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: TEXT, marginBottom: 16 }}>카테고리별 지출</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
            <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="65" cy="65" r={R} fill="none" stroke="#F2F4F6" strokeWidth="22" />
              {CATEGORIES.map(([name, color, pct], i) => {
                const len = (pct / 100) * circ
                const offset = -(CATEGORY_STARTS[i] / 100) * circ
                return (
                  <circle key={name} cx="65" cy="65" r={R} fill="none" stroke={color} strokeWidth="22"
                    strokeDasharray={`${armed ? len : 0} ${circ}`} strokeDashoffset={offset}
                    style={{ transition: `stroke-dasharray 500ms cubic-bezier(0.22,1,0.36,1) ${200 + i * 120}ms` }} />
                )
              })}
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 9, color: TEXT2 }}>총 지출</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: TEXT }}>152만원</span>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {CATEGORIES.map(([name, color, pct], i) => (
              <div key={name}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
                  <span style={{ flex: 1, fontSize: 11, color: TEXT }}>{name}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: TEXT2 }}>{pct}%</span>
                </div>
                <div style={{ height: 5, borderRadius: 9999, background: `${color}22`, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 9999, background: color, width: `${pct}%`, transformOrigin: 'left', transform: armed ? 'scaleX(1)' : 'scaleX(0)', transition: `transform 600ms ease ${300 + i * 80}ms` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function UtilitiesView({ reduced }) {
  const armed = useArmed() || reduced
  return (
    <div style={{ padding: '16px 20px 0', animation: 'moaFade 260ms ease' }}>
      <div style={{ background: PRIMARY, borderRadius: 20, padding: '18px 20px', marginBottom: 16, color: '#fff' }}>
        <p style={{ fontSize: 13, opacity: 0.75, marginBottom: 4 }}>이번 달 공과금 합계</p>
        <p style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}><CountUp to={208000} duration={800} delay={100} reduced={reduced} />원</p>
        <p style={{ fontSize: 13, fontWeight: 600, opacity: 0.9 }}>전월 대비 -3,700원 감소</p>
      </div>
      {UTILITIES.map((u, ui) => {
        const max = Math.max(...u.bars)
        return (
          <div key={u.name} style={{ ...card, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: u.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={u.icon} size={20} color={u.color} /></div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>{u.name}</p>
                  <p style={{ fontSize: 12, color: '#C9CDD4' }}>매월 {u.day}일</p>
                </div>
              </div>
              <span style={{ padding: 4 }}><Icon name="edit" size={16} color="#bbb" /></span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: TEXT }}>{fmt(u.amount)}원</p>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: u.up ? '#f97316' : SUCCESS }}>{u.diff}</p>
                <p style={{ fontSize: 11, color: '#C9CDD4' }}>{u.prev}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 48, marginTop: 8 }}>
              {u.bars.map((b, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{
                    width: '100%', height: (b / max) * 38, borderRadius: '3px 3px 0 0', background: i === 3 ? PRIMARY : `${PRIMARY}44`,
                    transformOrigin: 'bottom', transform: armed ? 'scaleY(1)' : 'scaleY(0)', transition: `transform 500ms cubic-bezier(0.22,1,0.36,1) ${ui * 120 + i * 50}ms`,
                  }} />
                  <span style={{ fontSize: 9, color: i === 3 ? '#555' : '#ccc' }}>{7 + i}월</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function AnalysisMockup({ scale }) {
  const reduced = useReducedMotion()
  // 1: '공과금' 탭 / 2: 공과금 화면 / 3: '소비' 탭 / 4: 소비 화면
  const { phase } = usePhase([3000, 3150, 6600, 6750], 7400, reduced)
  const tab = phase >= 2 && phase < 4 ? '공과금' : '소비'
  return (
    <PhoneFrame scale={scale} nav="분석">
      <div style={{ background: '#fff', borderBottom: '1px solid #F2F4F6', height: 69, boxSizing: 'border-box' }}>
        <MonthNav title="2026년 10월 분석" caret={null} pad="20px 24px" />
      </div>
      <div style={{ padding: '12px 20px 0' }}>
        <div style={{ display: 'flex', background: PAGE, borderRadius: 9999, padding: 3 }}>
          {['소비', '공과금'].map(t => (
            <div key={t} style={{ flex: 1, padding: 10, borderRadius: 9999, textAlign: 'center', fontSize: 14, fontWeight: t === tab ? 700 : 500, background: t === tab ? PRIMARY : 'transparent', color: t === tab ? '#fff' : TEXT2, transition: 'all 0.15s' }}>{t}</div>
          ))}
        </div>
      </div>
      {tab === '소비' ? <SpendingView key="spending" reduced={reduced} /> : <UtilitiesView key="utilities" reduced={reduced} />}
      <Tap x={271} y={104} show={phase === 1} />
      <Tap x={104} y={104} show={phase === 3} />
    </PhoneFrame>
  )
}

/* ───────── MY ───────── */
const MY_CARDS = [
  { name: '신한 체크카드', kind: '체크', kindBg: '#E0F2FE', kindColor: '#0284C7', sub: '**** 1234', used: '312,700원', pct: 100, done: true },
  { name: 'KB국민 신용카드', kind: '신용', kindBg: '#FEE2E2', kindColor: '#EF4444', sub: '결제일 매월 15일 · **** 5678', used: '282,200원', pct: 94 },
  { name: '삼성 신용카드', kind: '신용', kindBg: '#FEE2E2', kindColor: '#EF4444', sub: '결제일 매월 10일 · **** 9012', used: '267,000원', pct: 89 },
]
const SETTINGS_GROUPS = [
  ['기능', [['홈', '표시 옵션', 'home'], ['가계부', '주 시작 요일, 정렬 순서, 표시 옵션', 'book'], ['분석', '탭 구성 옵션', 'chart'], ['MY', '기능 관리', 'user'], ['AI 분석', '분석 스타일, 조언 표시', 'bulb'], ['알림', '다가오는 결제 알림', 'bell']]],
  [null, [['카테고리 관리', '지출 · 수입 카테고리 편집', 'tag']]],
  ['디스플레이', [['테마', '앱 색상 테마 변경', 'palette'], ['글자 크기', '앱 전체 글자 크기 조절', 'type']]],
  ['데이터', [['데이터 내보내기', '엑셀 · PDF 파일로 저장', 'upload']]],
]

function SettingsScreen({ open }) {
  return (
    <div style={{
      position: 'absolute', top: STATUS_H, left: 0, width: SCREEN_W, height: CONTENT_H, background: PAGE, zIndex: 25, overflow: 'hidden',
      transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 300ms cubic-bezier(0.22,1,0.36,1)',
      boxShadow: open ? '-8px 0 24px rgba(0,0,0,0.08)' : 'none',
    }}>
      <div style={{ height: 55, boxSizing: 'border-box', background: '#fff', borderBottom: '1px solid #F2F4F6', display: 'flex', alignItems: 'center', gap: 4, padding: '0 16px' }}>
        <Icon name="left" size={20} color={TEXT} stroke={2.5} />
        <p style={{ fontSize: 18, fontWeight: 700, color: TEXT }}>설정</p>
      </div>
      <div style={{ padding: '0 20px' }}>
        {SETTINGS_GROUPS.map(([label, rows], gi) => (
          <div key={gi}>
            {label ? <p style={{ fontSize: 12, fontWeight: 600, color: TEXT2, padding: '21px 4px 7px' }}>{label}</p> : <div style={{ height: 16 }} />}
            <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden' }}>
              {rows.map(([title, desc, icon], i) => (
                <div key={title} style={{ height: 62.5, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', borderTop: i ? '1px solid #F2F4F6' : 'none' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={18} color="#fff" /></div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>{title}</p>
                    <p style={{ fontSize: 12, color: TEXT2 }}>{desc}</p>
                  </div>
                  <Icon name="right" size={16} color="#C9CDD4" stroke={2.5} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MyMockup({ scale }) {
  const reduced = useReducedMotion()
  // 1: 실적 바 채움 / 2: ⚙ 탭 / 3: 설정 진입 / 4: 뒤로 탭 / 5: MY 복귀
  const { phase, cycle } = usePhase([350, 2800, 2950, 5400, 5550], 6800, reduced)
  const barsOn = reduced || phase >= 1
  const settingsOpen = phase >= 3 && phase < 5
  return (
    <PhoneFrame scale={scale} nav="MY" statusBg={settingsOpen ? '#fff' : PRIMARY} statusTone={settingsOpen ? 'dark' : 'light'}
      overlay={<><SettingsScreen open={settingsOpen} /><Tap x={26} y={STATUS_H + 27} show={phase === 4} /></>}>
      <div style={{ background: PRIMARY, height: 112, boxSizing: 'border-box', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 64, height: 64, boxSizing: 'border-box', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#fff' }}>모</div>
            <div style={{ position: 'absolute', right: 0, bottom: 0, width: 22, height: 22, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="camera" size={12} color="#555" /></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>모아 moa</p>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,0.25)', borderRadius: 9999, padding: '3px 8px' }}>✨ Pro</span>
            <span style={{ fontSize: 11, color: '#fff', background: 'rgba(255,255,255,0.2)', borderRadius: 9999, padding: '3px 8px' }}>수정</span>
          </div>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: phase === 2 ? 'scale(0.9)' : 'scale(1)', transition: 'transform 140ms ease' }}>
          <Icon name="gear" size={20} color="#fff" />
        </div>
      </div>

      <div style={{ padding: '16px 24px 0' }}>
        <div style={{ ...outlinedCard, padding: 18, marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: TEXT2, marginBottom: 7 }}>총 자산</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: TEXT, lineHeight: '34px', marginBottom: 12 }}>
            <CountUp key={cycle} to={3520000} delay={200} duration={1000} reduced={reduced} />원
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            {[['계좌', '3,370,000원', PRIMARY], ['현금', '150,000원', SUCCESS]].map(([l, v, c]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: TEXT2 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />{l}<span style={{ fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 15 }}>
          <Icon name="card" size={18} color={PRIMARY} />
          <p style={{ fontSize: 18, fontWeight: 700, color: TEXT }}>카드</p>
          <span style={{ fontSize: 12, fontWeight: 600, color: PRIMARY, background: `${PRIMARY}15`, borderRadius: 9999, padding: '2px 8px' }}>4개</span>
          <div style={{ ...addBtn, marginLeft: 'auto' }}>+ 추가</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {MY_CARDS.map((c, i) => {
            const color = c.done ? '#22C55E' : PRIMARY
            return (
              <div key={c.name} style={{ ...card, padding: '16px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{c.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: c.kindColor, background: c.kindBg, borderRadius: 9999, padding: '2px 7px' }}>{c.kind}</span>
                  {c.done && <span style={{ fontSize: 10, fontWeight: 600, color: '#16A34A', background: '#DCFCE7', borderRadius: 9999, padding: '2px 7px' }}>✓ 달성</span>}
                  <span style={{ marginLeft: 'auto' }}><Icon name="edit" size={16} color="#bbb" /></span>
                </div>
                <p style={{ fontSize: 11, color: '#bbb', marginBottom: 8 }}>{c.sub}</p>
                <p style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>이번 달 사용</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: TEXT, marginBottom: 6 }}>{c.used}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                  <span style={{ color: '#aaa' }}>목표 300,000원</span>
                  <span style={{ fontWeight: 600, color }}>{c.done ? '✓ 달성' : `${c.pct}%`}</span>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: '#F0F0F0', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 99, background: color, width: `${c.pct}%`, transformOrigin: 'left', transform: barsOn ? 'scaleX(1)' : 'scaleX(0)', transition: reduced ? 'none' : `transform 800ms cubic-bezier(0.22,1,0.36,1) ${i * 150}ms` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <Tap x={333} y={38} show={phase === 2} />
    </PhoneFrame>
  )
}
