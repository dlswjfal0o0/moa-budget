import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { animateSpring, createVelocityTracker, getSpringPreset, useReducedMotion } from '../../utils/motion'
import { HomeMockup, CalendarMockup, LedgerMockup, AnalysisMockup, MyMockup, PHONE_H } from './HowToUseMockups'

const PRIMARY = '#3182F6'
const BG = '#fff'
const TEXT = '#191F28'
const TEXT2 = '#8B95A1'

/* ───────── 슬라이드 데이터 ───────── */
const SLIDES = [
  { id:'home', tab:'홈', title:'홈 대시보드', desc:'이번 달 소비 현황을 한눈에',
    features:['이번 달 잔액 · 수입 · 지출 요약','예산별 반원 게이지와 AI 맞춤 조언','다가오는 결제 D-day 알림','카테고리별 지출 & 최근 내역'],
    Mockup:HomeMockup },
  { id:'calendar', tab:'캘린더', title:'캘린더', desc:'날짜별 소비 패턴을 파악해요',
    features:['날짜별 수입 · 지출 금액 표시','이번 주 · 이번 달 합계 카드','고정지출을 체크해 납부 관리','날짜를 누르면 그날 내역 확인'],
    Mockup:CalendarMockup },
  { id:'ledger', tab:'가계부', title:'가계부', desc:'내역 관리의 모든 것',
    features:['주간 · 월간 · 직접 기간 조회','전체 · 소비 · 수입 · 이체 필터','+ 버튼으로 빠르게 내역 추가','카드 · 계좌 · 현금 결제수단 기록'],
    Mockup:LedgerMockup },
  { id:'analysis', tab:'분석', title:'분석', desc:'AI가 소비와 공과금을 분석해요',
    features:['지난 달 대비 수입 · 지출 비교','일별 · 카테고리 · 결제수단별 분석','AI 소비 분석 & 절약 팁','공과금 탭: 관리비 · 전기 · 수도 전월 비교'],
    Mockup:AnalysisMockup },
  { id:'my', tab:'MY', title:'MY', desc:'나의 자산과 앱 설정',
    features:['총 자산 · 계좌 · 현금 잔액 관리','카드 실적 달성률 한눈에','테마 · 글자 크기 맞춤 설정','PDF · 엑셀 내보내기'],
    Mockup:MyMockup },
]

// 폰 목업 축소 비율 — 화면 높이에서 탭·설명·하단 버튼 영역(약 430pt)을 뺀 만큼만 차지한다
const phoneScaleFor = (h) => Math.min(0.5, Math.max(0.34, (h - 430) / PHONE_H))

/* ───────── 메인 컴포넌트 ───────── */
export default function HowToUse() {
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)
  const reducedMotion = useReducedMotion()
  const [phoneScale, setPhoneScale] = useState(() => phoneScaleFor(window.innerHeight))
  useEffect(() => {
    const onResize = () => setPhoneScale(phoneScaleFor(window.innerHeight))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // 화면 전환 방향(다음: right, 이전: left) — 드래그든 탭이든 동일하게 판정
  const [prevCurrent, setPrevCurrent] = useState(0)
  let enterDir = 'right'
  if (current !== prevCurrent) {
    enterDir = current > prevCurrent ? 'right' : 'left'
    setPrevCurrent(current)
  }

  const contentRef = useRef(null)
  const containerRef = useRef(null)
  const posRef = useRef(0)
  const dragRef = useRef(null)
  const springRef = useRef(null)

  const DRAG_SLOP = 8
  const ADVANCE_RATIO = 0.22
  const VELOCITY_THRESHOLD = 0.5
  const EXIT_DISTANCE = 140

  const cancelSpring = () => { if (springRef.current) { springRef.current.cancel(); springRef.current = null } }

  const applyContent = (x, opacity = 1) => {
    posRef.current = x
    if (contentRef.current) {
      contentRef.current.style.transform = `translateX(${x}px)`
      contentRef.current.style.opacity = String(opacity)
    }
  }

  const settleBack = (velocity = 0) => {
    cancelSpring()
    springRef.current = animateSpring({
      from: posRef.current, to: 0, velocity,
      ...getSpringPreset('snappy', reducedMotion),
      onUpdate: (x) => applyContent(x, 1),
      onComplete: () => { springRef.current = null },
    })
  }

  const exitAndAdvance = (indexDelta, velocity) => {
    cancelSpring()
    const exitTo = indexDelta > 0 ? -EXIT_DISTANCE : EXIT_DISTANCE
    springRef.current = animateSpring({
      from: posRef.current, to: exitTo, velocity,
      stiffness: reducedMotion ? 500 : 320, damping: reducedMotion ? 60 : 30, mass: 1,
      onUpdate: (x) => applyContent(x, Math.max(1 - Math.abs(x) / EXIT_DISTANCE, 0)),
      onComplete: () => {
        springRef.current = null
        applyContent(0, 1)
        setCurrent(c => c + indexDelta)
      },
    })
  }

  const handlePointerDown = (e) => {
    if (e.target.closest && e.target.closest('button')) return
    cancelSpring()
    dragRef.current = { phase: 'maybe', startX: e.clientX, startY: e.clientY, startPos: posRef.current }
  }

  const handlePointerMove = (e) => {
    const drag = dragRef.current
    if (!drag) return
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY

    if (drag.phase === 'maybe') {
      if (Math.abs(dx) < DRAG_SLOP && Math.abs(dy) < DRAG_SLOP) return
      if (Math.abs(dx) > Math.abs(dy)) {
        drag.phase = 'dragging'
        drag.tracker = createVelocityTracker()
        drag.tracker.record(e.clientX, e.clientY)
        // 등장 애니메이션이 아직 재생 중이면 direct style 조작과 충돌하므로 즉시 끈다
        if (contentRef.current) contentRef.current.style.animation = 'none'
        try { e.currentTarget.setPointerCapture?.(e.pointerId) } catch { /* 이미 종료된 포인터면 무시 */ }
      } else {
        drag.phase = 'scrolling'
      }
      return
    }

    if (drag.phase === 'dragging') {
      e.preventDefault()
      drag.tracker.record(e.clientX, e.clientY)
      let next = drag.startPos + dx
      const atFirst = current === 0
      const atLast = current === SLIDES.length - 1
      if ((atFirst && next > 0) || (atLast && next < 0)) next *= 0.35 // 첫/마지막 슬라이드에서는 고무줄 저항
      applyContent(next, 1)
    }
  }

  const handlePointerEnd = () => {
    const drag = dragRef.current
    dragRef.current = null
    if (!drag || drag.phase !== 'dragging') return
    const { vx } = drag.tracker.getVelocity()
    const pos = posRef.current
    const width = containerRef.current?.offsetWidth || 320
    const threshold = width * ADVANCE_RATIO
    const atFirst = current === 0
    const atLast = current === SLIDES.length - 1
    const wantsNext = (pos < -threshold || vx < -VELOCITY_THRESHOLD) && !atLast
    const wantsPrev = (pos > threshold || vx > VELOCITY_THRESHOLD) && !atFirst
    if (wantsNext) exitAndAdvance(1, vx)
    else if (wantsPrev) exitAndAdvance(-1, vx)
    else settleBack(vx)
  }

  useEffect(() => () => cancelSpring(), [])

  const slide = SLIDES[current]
  const isLast = current === SLIDES.length - 1

  return (
    <div
      ref={containerRef}
      style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: BG, overflow: 'hidden' }}>

      {/* 탭 인디케이터 */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 28px) 16px 12px', display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
        {SLIDES.map((s, i) => (
          <button key={s.id} onClick={() => setCurrent(i)} className="pressable-subtle"
            style={{ padding: '5px 12px', borderRadius: 9999, border: 'none', cursor: 'pointer', fontSize: 12, transition: 'all 0.2s',
              background: i === current ? PRIMARY : `${PRIMARY}15`,
              color: i === current ? 'white' : PRIMARY,
              fontWeight: i === current ? 700 : 400 }}>
            {s.tab}
          </button>
        ))}
      </div>

      {/* 드래그로 넘기는 콘텐츠 영역(목업 + 설명) */}
      <div
        ref={contentRef}
        key={current}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, touchAction: 'pan-y',
          animation: `${enterDir === 'left' ? 'pageEnterFromLeft' : 'pageEnterFromRight'} 240ms cubic-bezier(0.22,1,0.36,1) forwards` }}>

      {/* 폰 목업 — 실제 화면을 그대로 축소해 보여주고, 실제 사용하는 모습을 반복 재생한다 */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 16px 0' }}>
        <slide.Mockup scale={phoneScale} />
      </div>

      {/* 기능 설명 */}
      <div style={{ flex: 1, padding: '20px 28px 0', overflow: 'hidden' }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: TEXT, marginBottom: 6, lineHeight: 1.3 }}>{slide.title}</h2>
        <p style={{ fontSize: 14, color: TEXT2, marginBottom: 16, lineHeight: 1.6 }}>{slide.desc}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {slide.features.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: PRIMARY, flexShrink: 0, marginTop: 5 }} />
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.65, margin: 0 }}>{f}</p>
            </div>
          ))}
        </div>
      </div>
      </div>

      {/* 하단 네비게이션 */}
      <div style={{ padding: '12px 24px 44px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {SLIDES.map((_, i) => (
            <div key={i} onClick={() => setCurrent(i)}
              style={{ width: i === current ? 22 : 6, height: 6, borderRadius: 3, background: i === current ? PRIMARY : `${PRIMARY}25`, transition: 'width 0.3s', cursor: 'pointer' }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {!isLast && (
            <button onClick={() => navigate('/auth')} className="pressable"
              style={{ padding: '11px 16px', borderRadius: 9999, background: 'transparent', color: TEXT2, border: 'none', fontSize: 13, cursor: 'pointer' }}>
              건너뛰기
            </button>
          )}
          <button onClick={() => isLast ? navigate('/auth') : setCurrent(c => c + 1)} className="pressable-subtle"
            style={{ padding: '12px 24px', borderRadius: 9999, background: PRIMARY, color: 'white', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            {isLast ? '시작하기 →' : '다음 →'}
          </button>
        </div>
      </div>
    </div>
  )
}
