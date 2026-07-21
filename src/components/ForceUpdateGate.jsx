import { useAppConfig } from '../contexts/AppConfigContext'
import { compareVersions } from '../utils/version'

// vite.config.js의 define에서 package.json 버전을 주입한다.
const APP_VERSION = __APP_VERSION__

const PRIMARY = '#3182F6'
const TEXT = '#111827'
const TEXT2 = '#6B7280'

// AppConfigContext(=Firestore config/app 문서)의 minVersion보다 현재 앱 버전이
// 낮으면 전체 화면을 덮어 진행을 막는다. 로딩 중이거나 문서가 아직 없을 때는
// (minVersion 기본값 0.0.0이라 항상 통과) children을 그대로 보여줘 정상 사용자를
// 막지 않는다.
export default function ForceUpdateGate({ children }) {
  const { minVersion, iosStoreUrl, loading } = useAppConfig()

  const blocked = !loading && compareVersions(APP_VERSION, minVersion) < 0

  return (
    <>
      {children}
      {blocked && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 32px',
            textAlign: 'center',
          }}
        >
          <div style={{ width: 72, height: 72, borderRadius: 20, background: PRIMARY, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 32 }}>⬆️</span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: TEXT, marginBottom: 8 }}>새로운 버전이 있어요</h1>
          <p style={{ fontSize: 14, color: TEXT2, lineHeight: 1.6, marginBottom: 32 }}>
            안정적인 사용을 위해 최신 버전으로<br />업데이트한 후 이용해주세요.
          </p>
          {iosStoreUrl && (
            <button
              onClick={() => window.open(iosStoreUrl, '_blank')}
              style={{ width: '100%', maxWidth: 320, padding: '16px', borderRadius: 14, background: PRIMARY, color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
            >
              업데이트하러 가기
            </button>
          )}
        </div>
      )}
    </>
  )
}
