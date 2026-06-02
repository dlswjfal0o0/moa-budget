import { useNavigate } from 'react-router-dom'

const features = [
  { icon: '🏠', color: '#EEF2FF', title: '홈 대시보드', desc: '소비·수입 현황을 원그래프로 한눈에' },
  { icon: '📅', color: '#F0FDF4', title: '달력 보기', desc: '날짜별 수입·지출 및 고정지출 확인' },
  { icon: '📒', color: '#FFF7ED', title: '가계부 입력', desc: '카테고리별 소비·수입 기록 관리' },
  { icon: '📊', color: '#FDF2F8', title: 'AI 소비 분석', desc: '줄여야 할 카테고리를 AI가 추천' },
  { icon: '💳', color: '#F1F5F9', title: '카드·계좌 관리', desc: '카드 실적과 잔액을 한 번에' },
]

export default function HowToUse() {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '48px 28px 32px', background: '#fff' }}>
      <div style={{ flex: 1 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 6 }}>이런 기능이 있어요</h2>
        <p style={{ fontSize: 14, color: '#999', marginBottom: 36 }}>쉽고 빠른 가계부 관리</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {features.map((f) => (
            <div key={f.title} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: f.color, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0
              }}>
                {f.icon}
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 2 }}>{f.title}</p>
                <p style={{ fontSize: 13, color: '#888' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => navigate('/auth')}
        style={{
          width: '100%', padding: '16px', borderRadius: 14,
          background: '#4F46E5', color: '#fff', border: 'none',
          fontSize: 16, fontWeight: 600, cursor: 'pointer'
        }}>
        다음
      </button>
    </div>
  )
}