import { useState, useEffect, createContext, useContext } from 'react'
import { db } from '../firebase/config'
import { doc, onSnapshot } from 'firebase/firestore'

const AppConfigContext = createContext()

// 인증 여부와 무관하게(로그인 전에도) 읽어야 하므로 다른 Context와 달리
// onAuthStateChanged에 의존하지 않는다. config/app 문서가 아직 없을 수도 있으므로
// 게이트가 걸리지 않는 안전한 기본값으로 시작한다.
const DEFAULT_CONFIG = {
  minVersion: '0.0.0',
  latestVersion: '0.0.0',
  iosStoreUrl: '',
  flags: {},
}

export function AppConfigProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'config', 'app'),
      (snap) => {
        setConfig(snap.exists() ? { ...DEFAULT_CONFIG, ...snap.data() } : DEFAULT_CONFIG)
        setLoading(false)
      },
      () => {
        // 오프라인/권한 오류 등 — 기본값을 유지한 채 로딩만 끝낸다(강제 게이트 걸리지 않게).
        setLoading(false)
      }
    )
    return unsub
  }, [])

  return (
    <AppConfigContext.Provider value={{ ...config, loading }}>
      {children}
    </AppConfigContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAppConfig = () => useContext(AppConfigContext)
