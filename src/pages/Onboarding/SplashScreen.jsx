import { useNavigate } from 'react-router-dom'

export default function SplashScreen() {
  const navigate = useNavigate()

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh', padding: '0 32px',
      background: '#ffffff'
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: 24,
        background: '#4F46E5', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 20, fontSize: 38
      }}>
        💰
      </div>

      <h1 style={{ fontSize: 32, fontWeight: 700, color: '#111', marginBottom: 8 }}>모아</h1>
      <p style={{ fontSize: 15, color: '#888', marginBottom: 60 }}>내 돈, 내가 관리해요</p>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          onClick={() => navigate('/how-to-use')}
          style={{
            width: '100%', padding: '16px', borderRadius: 14,
            background: '#4F46E5', color: '#fff', border: 'none',
            fontSize: 16, fontWeight: 600, cursor: 'pointer'
          }}>
          시작하기
        </button>
        <button
          onClick={() => navigate('/auth')}
          style={{
            width: '100%', padding: '16px', borderRadius: 14,
            background: '#fff', color: '#333', border: '1.5px solid #e0e0e0',
            fontSize: 16, fontWeight: 500, cursor: 'pointer'
          }}>
          로그인
        </button>
      </div>
    </div>
  )
}