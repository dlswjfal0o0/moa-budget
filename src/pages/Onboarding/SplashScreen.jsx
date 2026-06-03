import { useNavigate } from 'react-router-dom'

const BG = '#fff'
const PRIMARY = '#3182F6'
const TEXT = '#111827'
const TEXT2 = '#6B7280'

export default function SplashScreen() {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '0 32px', background: BG, position: 'relative', overflow: 'hidden' }}>
      {/* 배경 장식 */}
      <div style={{ position: 'absolute', top: -80, right: -80, width: 240, height: 240, borderRadius: '50%', background: PRIMARY, opacity: 0.06 }} />
      <div style={{ position: 'absolute', bottom: -60, left: -60, width: 180, height: 180, borderRadius: '50%', background: PRIMARY, opacity: 0.05 }} />

      {/* 앱 아이콘 */}
      <div style={{ width: 110, height: 110, marginBottom: 24 }}>
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
      <p style={{ fontSize: 15, color: TEXT2, marginBottom: 64, letterSpacing: '0.8px', lineHeight: 1.6 }}>발 달린 내 돈, 어디 가는지 궁금하다면</p>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          onClick={() => navigate('/how-to-use')}
          style={{ width: '100%', padding: '16px', borderRadius: 14, background: PRIMARY, color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.3 }}>
          시작하기
        </button>
        <button
          onClick={() => navigate('/auth', { state: { mode: 'login' } })}
          style={{ width: '100%', padding: '16px', borderRadius: 14, background: 'transparent', color: TEXT, border: `1.5px solid ${TEXT}18`, fontSize: 16, fontWeight: 500, cursor: 'pointer' }}>
          로그인
        </button>
      </div>
    </div>
  )
}