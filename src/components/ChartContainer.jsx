import { cloneElement, useLayoutEffect, useRef, useState } from 'react'

// recharts ResponsiveContainer 대신 쓰는 폭 맞춤 컨테이너.
// 글자 크기 설정은 화면을 CSS zoom으로 확대하는데, ResponsiveContainer는 확대된 화면 폭
// (getBoundingClientRect)으로 차트 크기를 정해서 zoom이 한 번 더 곱해져 카드 밖으로 넘쳤다.
// clientWidth는 확대 전 레이아웃 폭이라 zoom과 무관하게 칸에 딱 맞는다.
export default function ChartContainer({ height, children }) {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setWidth(el.clientWidth)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={ref} style={{ width: '100%', height }}>
      {width > 0 && cloneElement(children, { width, height })}
    </div>
  )
}
