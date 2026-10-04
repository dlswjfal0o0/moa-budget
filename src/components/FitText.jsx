import { useLayoutEffect, useRef } from 'react'

// 금액처럼 절대 줄바꿈되면 안 되는 짧은 텍스트용. 항상 한 줄로 두고,
// 들어갈 자리보다 길어질 때만 글자 크기를 그 비율만큼 줄인다(최소 MIN_SCALE).
// 작은 기기(SE 320pt)나 설정의 '글자 크기'를 키운 경우에도 '원'이 다음 줄로 넘어가지 않는다.
const MIN_SCALE = 0.4

export default function FitText({ children, style }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => {
      el.style.fontSize = ''
      // 글자 폭은 글자 크기에 비례하므로 비율만큼 줄인다. 가로 배치(flex) 안에서는 글자를 줄이면
      // 자리도 같이 좁아질 수 있어 한 번에 안 맞을 수 있으므로, 맞을 때까지 몇 번 다시 잰다.
      let scale = 1
      for (let i = 0; i < 6 && el.scrollWidth > el.clientWidth + 0.5 && scale > MIN_SCALE; i++) {
        scale = Math.max(MIN_SCALE, scale * (el.clientWidth / el.scrollWidth) - 0.005)
        el.style.fontSize = `${scale}em`
      }
    }
    fit()
    // 자기 자신은 글자 크기를 바꾸면 크기가 변하므로, 들어갈 자리(부모)의 크기 변화를 본다
    const parent = el.parentElement
    if (!parent || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(fit)
    ro.observe(parent)
    return () => ro.disconnect()
  })

  return (
    <span ref={ref} className="fit-text" style={{
      display: 'inline-block', maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden',
      verticalAlign: 'top', ...style,
    }}>
      {children}
    </span>
  )
}
