import { useTheme } from '../contexts/ThemeContext'
import SubscriptionPlanList from './SubscriptionPlans'

const PRO_FEATURES = [
  '결제 알림 (고정지출 결제일 전날 알림)',
  '고정지출 & 다가오는 결제 관리',
  '대출 / 상환 관리',
  '가계부 검색',
  '엑셀 / PDF 내보내기',
  '공과금 탭 + AI 분석',
  '카드 대금 기준 추적 · 실적 그래프',
]

export default function TrialWelcomeModal({ open, onClose }) {
  const { themeData: t } = useTheme() || {}
  if (!open) return null

  const primary = t?.primary || '#3182F6'

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#F7F8FA', zIndex: 1300, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 20px 8px', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
        <button onClick={onClose}
          style={{ width: 36, height: 36, borderRadius: 10, background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B95A1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 32px', WebkitOverflowScrolling: 'touch' }}>
        <p style={{ fontSize: 24, fontWeight: 800, color: '#191F28', marginBottom: 8 }}>✨ 1개월 무료체험이 시작됐어요</p>
        <p style={{ fontSize: 14, color: '#8B95A1', lineHeight: 1.6, marginBottom: 24 }}>
          결제 없이 오늘부터 30일 동안 Pro 기능을 전부 이용할 수 있어요.
        </p>

        <div style={{ background: '#fff', borderRadius: 20, padding: '20px 18px', marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          {PRO_FEATURES.map((label, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid #F2F4F6' : 'none' }}>
              <span style={{ color: primary, fontWeight: 800, fontSize: 15 }}>✓</span>
              <span style={{ fontSize: 14, color: '#191F28' }}>{label}</span>
            </div>
          ))}
        </div>

        <button onClick={onClose}
          style={{ width: '100%', padding: '16px', borderRadius: 16, background: primary, color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginBottom: 24 }}>
          무료로 시작하기
        </button>

        <p style={{ fontSize: 12, fontWeight: 700, color: '#8B95A1', marginBottom: 10 }}>바로 구독하고 싶다면</p>
        <SubscriptionPlanList onPurchased={onClose} />

        <p style={{ fontSize: 12, color: '#8B95A1', textAlign: 'center', lineHeight: 1.6, marginTop: 20 }}>
          🔒 체험이 끝나도 그동안 만든 Pro 데이터는 삭제되지 않아요.<br />
          나중에 다시 구독하면 그대로 이어서 쓸 수 있어요.
        </p>

        <p style={{ fontSize: 11, color: '#C9CDD4', textAlign: 'center', lineHeight: 1.6, marginTop: 8 }}>
          구독은 결제 주기마다 자동 갱신되며 App Store에서 언제든 해지할 수 있어요.{' '}
          <a href="/terms.html" target="_blank" rel="noreferrer" style={{ color: '#8B95A1' }}>이용약관</a>
          {' · '}
          <a href="/privacy.html" target="_blank" rel="noreferrer" style={{ color: '#8B95A1' }}>개인정보처리방침</a>
        </p>
      </div>
    </div>
  )
}
