import { useEffect, useState } from 'react'
import FixedPortal from './FixedPortal'

// 홈 화면에 추가한 웹 앱(standalone, status-bar-style: black-translucent)과 네이티브 WebView는
// 상태바가 화면 위에 겹쳐 그려진다. 문서 전체가 스크롤되는 탭(홈·분석 등)에서는 내용이
// 시계·배터리 아이콘 아래로 그대로 지나가 글자가 겹쳐 보이므로, 스크롤했을 때만
// 상태바 영역(safe-area-inset-top)에 반투명 블러 막을 깐다. 맨 위에서는 투명이라
// 각 화면의 헤더 배경이 그대로 보인다. 노치가 없는 환경에서는 높이가 0이라 아무 영향이 없다.
export default function StatusBarScrim() {
  const [scrolled, setScrolled] = useState(() => window.scrollY > 0)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <FixedPortal>
      <div aria-hidden style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 'env(safe-area-inset-top, 0px)',
        zIndex: 90, pointerEvents: 'none',
        background: 'rgba(247,248,250,0.82)',
        WebkitBackdropFilter: 'saturate(180%) blur(16px)', backdropFilter: 'saturate(180%) blur(16px)',
        opacity: scrolled ? 1 : 0, transition: 'opacity 160ms ease',
      }} />
    </FixedPortal>
  )
}
