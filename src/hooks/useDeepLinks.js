import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { App } from '@capacitor/app'

// 커스텀 스킴(moabudget://ledger)과 유니버설 링크(https://moa-budget.vercel.app/ledger)
// 둘 다 appUrlOpen 이벤트로 들어온다. 커스텀 스킴은 슬래시가 두 개면 경로가 host 쪽에
// 실리므로(new URL('moabudget://ledger').hostname === 'ledger', pathname === '') host와
// pathname을 이어붙여서 라우팅 경로를 만든다.
function toRoutePath(url) {
  try {
    const u = new URL(url)
    const combined = `/${u.hostname}${u.pathname}`.replace(/\/+/g, '/')
    return combined + u.search
  } catch {
    return null
  }
}

export function useDeepLinks() {
  const navigate = useNavigate()

  useEffect(() => {
    const listenerPromise = App.addListener('appUrlOpen', ({ url }) => {
      const path = toRoutePath(url)
      if (path) navigate(path)
    })
    return () => { listenerPromise.then(l => l.remove()) }
  }, [navigate])
}
