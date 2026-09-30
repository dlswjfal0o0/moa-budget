import { useEffect, useRef } from 'react'

// 구 표면에 고르게 흩뿌린 점(피보나치 구). 한 번만 계산해 모든 인스턴스가 공유한다.
const POINT_COUNT = 140
const SPHERE_POINTS = (() => {
  const pts = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < POINT_COUNT; i++) {
    const y = 1 - (i / (POINT_COUNT - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const theta = golden * i
    pts.push([Math.cos(theta) * r, y, Math.sin(theta) * r])
  }
  return pts
})()

const TILT = 0.38 // 살짝 기울여서 위에서 내려다보는 입체감을 준다

// 점으로 된 구가 천천히 회전하는 캔버스. 가까운 점일수록 크고 진하게 그린다.
function DotSphere({ color, size }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const speed = reduceMotion ? 0.00035 : 0.0011
    const half = size / 2
    const cosT = Math.cos(TILT)
    const sinT = Math.sin(TILT)
    const dotBase = Math.max(0.6, size / 40)
    let raf
    let start

    const draw = (now) => {
      if (start == null) start = now
      const t = now - start
      const angle = t * speed
      // 은은한 호흡: 구가 아주 조금 부풀었다 줄어든다
      const radius = half * (0.84 + Math.sin(t * 0.0021) * 0.05)
      const cosA = Math.cos(angle)
      const sinA = Math.sin(angle)

      ctx.clearRect(0, 0, size, size)
      ctx.fillStyle = color
      for (const [x, y, z] of SPHERE_POINTS) {
        // Y축 회전 → X축 기울기
        const x1 = x * cosA + z * sinA
        const z1 = -x * sinA + z * cosA
        const y2 = y * cosT - z1 * sinT
        const z2 = y * sinT + z1 * cosT
        const depth = (z2 + 1) / 2 // 0(뒤) ~ 1(앞)
        // 앞쪽 점이 한 번씩 반짝이며 지나가 "생각 중" 느낌을 더한다
        const twinkle = 0.5 + 0.5 * Math.sin(t * 0.004 + x * 6 + y * 4)
        ctx.globalAlpha = 0.12 + depth * (0.55 + twinkle * 0.33)
        ctx.beginPath()
        ctx.arc(half + x1 * radius, half + y2 * radius, dotBase * (0.45 + depth * 0.75), 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [color, size])

  return <canvas ref={canvasRef} aria-hidden="true" style={{ width: size, height: size, display: 'block', flexShrink: 0 }} />
}

// AI 분석 로딩 표시.
// - label 없음: 점 구만 표시
// - label 있음: 구 + 빛이 훑고 지나가는 문구
export default function ThinkingOrbs({ color = '#4F46E5', size = 36, label, fontSize = 15 }) {
  if (!label) {
    return <span role="status" aria-label="AI가 분석하고 있어요" style={{ display: 'inline-flex' }}><DotSphere color={color} size={size} /></span>
  }
  return (
    <span role="status" style={{ display: 'inline-flex', alignItems: 'center', gap: size >= 32 ? 12 : 8, '--orb-color': color }}>
      <DotSphere color={color} size={size} />
      <span className="thinking-orbs-text" style={{ fontSize }}>{label}</span>
    </span>
  )
}
