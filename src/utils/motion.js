import { useEffect, useState } from 'react'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}

/** OS의 Reduce Motion 설정을 실시간으로 구독한다. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(prefersReducedMotion)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia(REDUCED_MOTION_QUERY)
    const handler = (e) => setReduced(e.matches)
    if (mq.addEventListener) mq.addEventListener('change', handler)
    else mq.addListener(handler)
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler)
      else mq.removeListener(handler)
    }
  }, [])

  return reduced
}

// damping ratio ≈ damping / (2 * sqrt(stiffness * mass))
export const SPRING = {
  // 바텀시트/카드 정착 — 살짝의 오버슈트만 남는 iOS 스타일
  sheet: { stiffness: 300, damping: 30, mass: 1 },
  // 스와이프 행/작은 UI 정착 — 조금 더 탄력 있게
  snappy: { stiffness: 420, damping: 32, mass: 1 },
  // reduced-motion 환경 — 오버슈트 없이 짧게 정지
  still: { stiffness: 420, damping: 60, mass: 1 },
}

export function getSpringPreset(name, reduced) {
  if (reduced) return SPRING.still
  return SPRING[name] || SPRING.sheet
}

/**
 * rAF 기반 감쇠 스프링 시뮬레이션(semi-implicit Euler). 제스처가 진행 중일 때
 * 언제든 cancel()로 끊고 새 목표로 이어받을 수 있어, 빠르게 반복 입력해도
 * 애니메이션이 꼬이거나 누적되지 않는다.
 */
export function animateSpring({
  from,
  to,
  velocity = 0,
  stiffness = 300,
  damping = 30,
  mass = 1,
  restDisplacement = 0.4,
  restVelocity = 0.4,
  onUpdate,
  onComplete,
}) {
  let pos = from
  let vel = velocity
  let raf = null
  let cancelled = false
  let lastTime = null

  function step(now) {
    if (cancelled) return
    if (lastTime === null) lastTime = now
    // 탭 전환 등으로 프레임이 크게 벌어져도 한 번에 튀지 않도록 dt를 clamp
    const dt = Math.min((now - lastTime) / 1000, 1 / 30)
    lastTime = now

    // 저프레임 환경에서도 안정적이도록 서브스텝으로 적분
    const steps = dt > 1 / 60 ? 2 : 1
    const subDt = dt / steps
    for (let i = 0; i < steps; i++) {
      const springForce = -stiffness * (pos - to)
      const dampingForce = -damping * vel
      const accel = (springForce + dampingForce) / mass
      vel += accel * subDt
      pos += vel * subDt
    }

    const displacement = Math.abs(to - pos)
    const isResting = displacement < restDisplacement && Math.abs(vel) < restVelocity

    if (isResting) {
      onUpdate(to)
      if (onComplete) onComplete()
      return
    }

    onUpdate(pos)
    raf = requestAnimationFrame(step)
  }

  raf = requestAnimationFrame(step)

  return {
    cancel() {
      cancelled = true
      if (raf) cancelAnimationFrame(raf)
    },
  }
}

/**
 * 최근 ~100ms 표본으로 release velocity(px/ms)를 계산한다.
 * touchend 직전 한 샘플만 보면 손떨림에 취약하므로 짧은 창으로 평균낸다.
 */
export function createVelocityTracker() {
  let samples = []
  const WINDOW_MS = 100

  return {
    record(x, y) {
      const t = performance.now()
      samples.push({ t, x, y })
      samples = samples.filter((s) => t - s.t <= WINDOW_MS)
    },
    reset() {
      samples = []
    },
    getVelocity() {
      if (samples.length < 2) return { vx: 0, vy: 0 }
      const first = samples[0]
      const last = samples[samples.length - 1]
      const dt = last.t - first.t
      if (dt <= 0) return { vx: 0, vy: 0 }
      return {
        vx: (last.x - first.x) / dt,
        vy: (last.y - first.y) / dt,
      }
    },
  }
}
