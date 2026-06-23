import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../../firebase/config'

const BG = '#fff'
const PRIMARY = '#3182F6'
const TEXT = '#111827'
const TEXT2 = '#6B7280'

export default function SplashScreen() {
  const navigate = useNavigate()

  useEffect(() => {
    // 이전에 로그인한 적 있으면 즉시 홈으로
    if (localStorage.getItem('moa_logged_in') === 'true') {
        navigate('/home', { replace: true })
        return
    }

    // 처음이면 Firebase 확인
    const unsub = onAuthStateChanged(auth, u => {
        if (u) {
            localStorage.setItem('moa_logged_in', 'true')
            navigate('/home', { replace: true })
        }
    })
    return unsub
  }, [navigate])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 32px 0', background: BG, position: 'relative', overflow: 'hidden' }}>
      {/* 앱 아이콘 */}
      <div style={{ width: 110, height: 110, marginBottom: 24, borderRadius: 24, overflow: 'hidden' }}>
        <img
          src="/moa_icon.png"
          alt="모아"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => {
            e.target.style.display = 'none'
            e.target.parentElement.style.background = PRIMARY
          }}
        />
      </div>

      <h1 style={{ fontSize: 38, fontWeight: 700, color: TEXT, marginBottom: 8, letterSpacing: 0 }}>모아</h1>
      <p style={{ fontSize: 15, color: TEXT2, marginBottom: 64, lineHeight: 1.6, textAlign: 'center' }}>발 달린 내 돈,<br />어디 가는지 궁금하다면</p>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          onClick={() => navigate('/how-to-use')}
          style={{ width: '100%', padding: '16px', borderRadius: 14, background: PRIMARY, color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.3 }}>
          시작하기
        </button>
        <button
          onClick={() => navigate('/auth', { state: { mode: 'login' } })}
          style={{ width: '100%', padding: '16px', borderRadius: 14, background: '#f2f4f7', color: TEXT, border: 'none', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
          로그인
        </button>
      </div>
    </div>
  )
}