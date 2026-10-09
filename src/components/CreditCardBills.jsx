import FitText from './FitText'

// [홈] 신용카드 대금 — 전월 사용분을 카드별로 결산해 보여주고,
// 체크 시 연동계좌 + 금융 카테고리로 '신용카드 대금 납부' 내역을 가계부에 기재한다.
// 계산/저장 로직은 Home.jsx가 담당하고, 이 컴포넌트는 표시만 한다.
// 레이아웃은 '다가오는 결제' 섹션과 동일한 구성(섹션 제목 + 리스트 카드 + 44px 아이콘 + 금액/배지)을 따른다.
export default function CreditCardBills({ bills, billMonthLabel, fmt, primary, onToggle, busyCardId, neu = false, cardBg = '#fff', textColor = '#191F28' }) {
  if (!bills.length) return null
  const total = bills.reduce((s, b) => s + b.amount, 0)
  const today = new Date().getDate()

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: textColor }}>신용카드 대금</p>
        <p style={{ fontSize: 13, color: '#8B95A1' }}>{billMonthLabel} 사용분 · <span style={{ fontWeight: 700, color: textColor }}><FitText>{fmt(total)}원</FitText></span></p>
      </div>
      <div className={neu ? 'neu-card' : undefined}
        style={neu
          ? { borderRadius: 22, padding: '8px 16px' }
          : { background: cardBg, borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        {bills.map((b, i) => {
          const { card } = b
          const noAccount = !card.linkedAccount
          const disabled = busyCardId === card.id || (!b.paid && (noAccount || b.amount <= 0))
          const dueDay = parseInt(card.billingDay, 10)
          const daysLeft = dueDay ? dueDay - today : null

          // 배지: 납부 완료 / 계좌 미설정 / 결제일까지 남은 일수 (다가오는 결제와 같은 긴급도 색상)
          let badge = null
          if (b.paid) badge = { label: '납부 완료', color: primary }
          else if (daysLeft !== null) {
            const color = daysLeft <= 3 ? '#FF5A5F' : daysLeft <= 7 ? '#F59E0B' : primary
            badge = { label: daysLeft < 0 ? '결제일 지남' : daysLeft === 0 ? 'D-Day' : `D-${daysLeft}`, color }
          }
          const iconColor = b.paid ? primary : (card.color || primary)
          // 결제일은 배지(D-n)로 보여주므로 부제는 출금 계좌만 짧게 표시
          const sub = noAccount ? 'MY에서 연동계좌 설정' : card.linkedAccount

          return (
            <label key={card.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: neu ? '12px 4px' : '16px 20px',
                borderBottom: i < bills.length - 1 ? (neu ? '1px solid rgba(163,177,198,0.2)' : '1px solid #F2F4F6') : 'none',
                cursor: disabled ? 'default' : 'pointer',
                opacity: busyCardId === card.id ? 0.5 : 1, transition: 'opacity 150ms ease',
              }}>
              <div className={neu ? 'neu-inset' : undefined}
                style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: neu ? undefined : `${iconColor}15`, transition: 'background 150ms ease' }}>
                {b.paid ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: b.paid ? '#8B95A1' : textColor, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.name}</p>
                <p style={{ fontSize: 13, color: noAccount && !b.paid ? '#F59E0B' : '#8B95A1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 700, marginBottom: badge ? 3 : 0,
                  color: b.paid ? '#B0B8C1' : '#FF5A5F' }}>
                  {/* FitText는 inline-block이라 부모의 취소선이 전달되지 않아 직접 건다 */}
                  <FitText style={{ textDecoration: b.paid ? 'line-through' : 'none' }}>-{fmt(b.amount)}원</FitText>
                </p>
                {badge && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: badge.color, borderRadius: 9999, padding: '3px 9px' }}>
                    {badge.label}
                  </span>
                )}
              </div>
              <span className="checkbox-box" style={{ marginTop: 0, width: 22, height: 22 }}>
                <input type="checkbox" checked={b.paid} disabled={disabled}
                  aria-label={`${card.name} 대금 납부`}
                  onChange={() => onToggle(b)} />
                <span className="checkbox-visual" aria-hidden="true"
                  style={b.paid
                    ? { background: primary, borderColor: primary, borderRadius: 7 }
                    : disabled ? { background: '#F2F4F6', borderColor: '#E5E8EB', borderRadius: 7 } : { borderRadius: 7 }}>
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                    <path d="M1 5L4.5 8.5L11 1.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
