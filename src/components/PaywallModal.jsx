import { useState } from 'react'
import { usePurchases } from '../contexts/PurchasesContext'
import SubscriptionPlanList from './SubscriptionPlans'

export default function PaywallModal({ open, onClose }) {
  const purchases = usePurchases()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  const handleRestore = async () => {
    setBusy(true)
    setError('')
    try {
      await purchases?.restorePurchases()
      onClose?.()
    } catch {
      setError('복원할 구독 내역을 찾지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1200, display: 'flex', alignItems: 'flex-end' }}
      onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: '#fff', borderRadius: '28px 28px 0 0', maxHeight: '90dvh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: '#E5E8EB', margin: '0 auto 18px' }} />
          <p style={{ fontSize: 20, fontWeight: 800, color: '#191F28' }}>MOA Pro</p>
          <p style={{ fontSize: 13, color: '#8B95A1', marginTop: 4, marginBottom: 16 }}>
            결제 알림, 고정지출·대출 관리, 검색, 내보내기 등 더 많은 기능을 이용해보세요.
          </p>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '0 24px 8px', WebkitOverflowScrolling: 'touch' }}>
          <SubscriptionPlanList onPurchased={onClose} />

          {error && <p style={{ fontSize: 13, color: '#ef4444', marginTop: 4 }}>{error}</p>}

          <button onClick={handleRestore} disabled={busy}
            style={{ width: '100%', background: 'none', border: 'none', padding: '14px 0', fontSize: 14, fontWeight: 600, color: '#8B95A1', cursor: busy ? 'not-allowed' : 'pointer' }}>
            {busy ? '복원하는 중...' : '이전 구매 복원하기'}
          </button>

          <p style={{ fontSize: 12, color: '#8B95A1', textAlign: 'center', lineHeight: 1.6, padding: '0 8px 12px' }}>
            🔒 구독을 해지하거나 체험이 끝나도 Pro 데이터는 삭제되지 않아요.<br />
            다시 구독하면 그대로 이어서 사용할 수 있어요.
          </p>

          <p style={{ fontSize: 11, color: '#C9CDD4', textAlign: 'center', lineHeight: 1.6, padding: '4px 0 20px' }}>
            구독은 결제 주기마다 자동 갱신되며 App Store에서 언제든 해지할 수 있어요.{' '}
            <a href="/terms.html" target="_blank" rel="noreferrer" style={{ color: '#8B95A1' }}>이용약관</a>
            {' · '}
            <a href="/privacy.html" target="_blank" rel="noreferrer" style={{ color: '#8B95A1' }}>개인정보처리방침</a>
          </p>
        </div>
      </div>
    </div>
  )
}
