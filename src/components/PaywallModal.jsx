import { useState } from 'react'
import { usePurchases } from '../contexts/PurchasesContext'
import SubscriptionPlanList from './SubscriptionPlans'
import BottomSheet from './BottomSheet'

export default function PaywallModal({ open, onClose }) {
  const purchases = usePurchases()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

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

  // 가계부 검색처럼 body로 포탈된 전체화면 시트로 띄운다. 페이지 래퍼(zoom·전환 애니메이션) 안에서
  // position:fixed로 그리면 WebKit이 뷰포트 대신 래퍼 기준으로 고정해 화면 하단부만 보이는 문제가 있었다.
  return (
    <BottomSheet variant="full" open={!!open} onClose={onClose} showHandle={false} background="#F5F5F7" zIndex={1200}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 20px 0', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
          <button onClick={onClose}
            style={{ width: 36, height: 36, borderRadius: 10, background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B95A1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <SubscriptionPlanList onPurchased={onClose} renderLayout={({ plans, cta }) => (
          <>
            {/* 스크롤 영역: 소개 + 요금제 선택 */}
            <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, padding: '8px 24px 16px', WebkitOverflowScrolling: 'touch' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 12px', borderRadius: 9999, background: 'rgba(49,130,246,0.1)', border: '1px solid rgba(49,130,246,0.3)' }}>
                <span style={{ fontSize: 12 }}>💎</span>
                <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#3182F6' }}>PRO</span>
              </div>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#111', letterSpacing: '-0.02em', lineHeight: 1.1, marginTop: 10 }}>모아 Pro</p>
              <p style={{ fontSize: 13.5, color: 'rgba(0,0,0,0.45)', marginTop: 6, marginBottom: 20, lineHeight: 1.6 }}>
                결제 알림, 고정지출·대출 관리, 검색, 내보내기 등
                <br />
                더 많은 기능을 이용해보세요.
              </p>

              {plans}
            </div>

            {/* 하단 고정: 구독 버튼 + 안내·약정 문구(모두 버튼 아래). 기기 높이와 상관없이 홈 인디케이터 바로 위에 붙는다 */}
            <div style={{ flexShrink: 0, padding: '12px 24px calc(env(safe-area-inset-bottom, 0px) + 12px)', background: '#F5F5F7', boxShadow: '0 -8px 16px -8px rgba(0,0,0,0.08)' }}>
              {cta}
              {error && <p style={{ fontSize: 12, color: '#ef4444', textAlign: 'center', marginTop: 8 }}>{error}</p>}
              <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)', textAlign: 'center', lineHeight: 1.5, marginTop: 10 }}>
                구독을 해지하거나 체험이 끝나도 Pro 데이터는 삭제되지 않아요.
                <br />
                다시 구독하면 그대로 이어서 사용할 수 있어요.
              </p>
              <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)', textAlign: 'center', lineHeight: 1.5, marginTop: 6 }}>
                구독은 결제 주기마다 자동 갱신되며 App Store에서 언제든 해지할 수 있어요.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6 }}>
                <button onClick={handleRestore} disabled={busy}
                  style={{ background: 'none', border: 'none', padding: '4px 0', textDecoration: 'underline', textUnderlineOffset: '2px', color: 'rgba(0,0,0,0.4)', fontSize: 11, cursor: busy ? 'not-allowed' : 'pointer' }}>
                  {busy ? '복원하는 중...' : '이전 구매 복원하기'}
                </button>
                <span style={{ color: 'rgba(0,0,0,0.15)', fontSize: 11 }}>·</span>
                <a href="/terms.html" target="_blank" rel="noreferrer" style={{ color: 'rgba(0,0,0,0.4)', fontSize: 11, textDecoration: 'underline', textUnderlineOffset: '2px', padding: '4px 0' }}>이용약관</a>
                <span style={{ color: 'rgba(0,0,0,0.15)', fontSize: 11 }}>·</span>
                <a href="/privacy.html" target="_blank" rel="noreferrer" style={{ color: 'rgba(0,0,0,0.4)', fontSize: 11, textDecoration: 'underline', textUnderlineOffset: '2px', padding: '4px 0' }}>개인정보처리방침</a>
              </div>
            </div>
          </>
        )} />
      </div>
    </BottomSheet>
  )
}
