import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import FixedPortal from './FixedPortal'
import { animateSpring, createVelocityTracker, getSpringPreset, useReducedMotion } from '../utils/motion'

const DISMISS_RATIO = 0.3     // 시트 높이의 30% 이상 내려가면 dismiss
const DISMISS_VELOCITY = 0.6  // px/ms 이상으로 떼면 거리와 무관하게 dismiss
const DRAG_START_SLOP = 6     // 스크롤/드래그 판정을 가르는 최소 이동량(px)

/**
 * 네이티브 iOS 바텀시트처럼 동작하는 공용 시트.
 * - 등장: rAF 기반 spring으로 아래→위 정착 (약간의 오버슈트)
 * - 닫기: 배경 탭/부모의 open=false 전환 → spring으로 아래로 정착 후 unmount
 * - 드래그: 시트가 스크롤 최상단(scrollTop 0)일 때 아래로 당기면 손가락을 그대로 따라오고,
 *   뗄 때 이동거리/velocity로 dismiss 여부를 판정한다. 스크롤 중이거나 입력 요소를
 *   조작 중이면 드래그를 가로채지 않는다.
 */
export default function BottomSheet({
  open,
  onClose,
  children,
  variant = 'sheet', // 'sheet' | 'full'
  maxOpacity = 0.45,
  maxWidth = 430,
  radius = 20,
  background = '#F7F8FA',
  dragToDismiss = true,
  showHandle = true,
  zIndex = 200,
}) {
  const [mounted, setMounted] = useState(open)
  const sheetRef = useRef(null)
  const backdropRef = useRef(null)
  const springRef = useRef(null)
  const closingRef = useRef(false)
  const posRef = useRef(0)   // 현재 translateY(px)
  const heightRef = useRef(0)
  const dragRef = useRef(null)
  const reducedMotion = useReducedMotion()

  const applyStyle = useCallback((y, height) => {
    posRef.current = y
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${Math.max(y, 0)}px)`
    if (backdropRef.current) {
      const ratio = height > 0 ? Math.min(Math.max(1 - y / height, 0), 1) : (y <= 0 ? 1 : 0)
      backdropRef.current.style.opacity = String(ratio * maxOpacity)
    }
  }, [maxOpacity])

  const cancelSpring = () => {
    if (springRef.current) { springRef.current.cancel(); springRef.current = null }
  }

  const runExit = useCallback((velocity = 0) => {
    cancelSpring()
    const height = heightRef.current || sheetRef.current?.offsetHeight || 400
    springRef.current = animateSpring({
      from: posRef.current,
      to: height,
      velocity,
      ...getSpringPreset('sheet', reducedMotion),
      onUpdate: (y) => applyStyle(y, height),
      onComplete: () => {
        springRef.current = null
        setMounted(false)
        posRef.current = 0
        if (open) {
          // 드래그로 먼저 닫힌 경우 — 부모는 아직 open=true이므로 알려준다
          onClose && onClose()
        }
      },
    })
  }, [applyStyle, reducedMotion, open, onClose])

  // open prop 전환 처리 (열기/부모발 닫기)
  useEffect(() => {
    if (open) {
      closingRef.current = false
      if (!mounted) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- 등장 애니메이션을 위해 먼저 mount해야 함
        setMounted(true)
      }
    } else if (mounted && !closingRef.current) {
      closingRef.current = true
      runExit(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // mount 직후(paint 이전) 등장 애니메이션 시작 — 깜빡임 방지
  useLayoutEffect(() => {
    if (!mounted || !open) return
    const el = sheetRef.current
    if (!el) return
    const height = el.offsetHeight || 400
    heightRef.current = height
    posRef.current = height
    applyStyle(height, height)
    cancelSpring()
    springRef.current = animateSpring({
      from: height,
      to: 0,
      velocity: 0,
      ...getSpringPreset('sheet', reducedMotion),
      onUpdate: (y) => applyStyle(y, height),
      onComplete: () => { springRef.current = null },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted])

  useEffect(() => () => cancelSpring(), [])

  const handlePointerDown = (e) => {
    if (!dragToDismiss) return
    if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable="true"], [data-no-drag]')) return
    dragRef.current = {
      phase: 'maybe',
      startX: e.clientX,
      startY: e.clientY,
      pointerId: e.pointerId,
      target: e.currentTarget,
    }
  }

  const handlePointerMove = (e) => {
    const drag = dragRef.current
    if (!drag) return
    const dy = e.clientY - drag.startY
    const dx = e.clientX - drag.startX

    if (drag.phase === 'maybe') {
      const scrollTop = sheetRef.current?.scrollTop ?? 0
      if (Math.abs(dy) < DRAG_START_SLOP && Math.abs(dx) < DRAG_START_SLOP) return
      if (dy > 0 && scrollTop <= 0) {
        drag.phase = 'dragging'
        cancelSpring()
        drag.tracker = createVelocityTracker()
        drag.tracker.record(e.clientX, e.clientY)
        drag.startPos = posRef.current
        drag.target.setPointerCapture?.(drag.pointerId)
      } else {
        drag.phase = 'scrolling'
      }
      return
    }

    if (drag.phase === 'dragging') {
      e.preventDefault()
      const next = Math.max(drag.startPos + dy, 0)
      drag.tracker.record(e.clientX, e.clientY)
      applyStyle(next, heightRef.current || sheetRef.current?.offsetHeight || 400)
    }
  }

  const endDrag = () => {
    const drag = dragRef.current
    dragRef.current = null
    if (!drag || drag.phase !== 'dragging') return

    const { vy } = drag.tracker.getVelocity()
    const height = heightRef.current || sheetRef.current?.offsetHeight || 400
    const shouldDismiss = posRef.current > height * DISMISS_RATIO || vy > DISMISS_VELOCITY

    if (shouldDismiss) {
      closingRef.current = true
      runExit(Math.max(vy, 0))
    } else {
      cancelSpring()
      springRef.current = animateSpring({
        from: posRef.current, to: 0, velocity: vy,
        ...getSpringPreset('snappy', reducedMotion),
        onUpdate: (y) => applyStyle(y, height),
        onComplete: () => { springRef.current = null },
      })
    }
  }

  if (!mounted) return null

  const isFull = variant === 'full'

  return (
    <FixedPortal>
      <div
        style={{
          position: 'fixed', inset: 0,
          zIndex, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}
      >
        {/* opacity를 sheet와 분리된 별개 레이어에 두어야 시트 자체가 같이 흐려지지 않는다 */}
        <div
          ref={backdropRef}
          onClick={() => { if (!closingRef.current) { closingRef.current = true; runExit(0) } }}
          style={{ position: 'absolute', inset: 0, background: '#000', opacity: 0 }}
        />
        <div
          ref={sheetRef}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          style={{
            position: 'relative',
            width: '100%', maxWidth, background,
            borderTopLeftRadius: isFull ? 0 : radius,
            borderTopRightRadius: isFull ? 0 : radius,
            maxHeight: isFull ? '100dvh' : '92dvh',
            height: isFull ? '100dvh' : undefined,
            overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch',
            willChange: 'transform',
            transform: 'translateY(100%)',
          }}
        >
          {showHandle && !isFull && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', padding: '8px 0', pointerEvents: 'none' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.14)' }} />
            </div>
          )}
          {children}
        </div>
      </div>
    </FixedPortal>
  )
}
