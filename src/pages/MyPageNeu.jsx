import BottomSheet from '../components/BottomSheet'
import FixedPortal from '../components/FixedPortal'
import LoadError from '../components/LoadError'

const NEU_BG = 'var(--neu-bg)'

const neuInputStyle = {
  width: '100%', padding: '14px 16px', borderRadius: 14, border: 'none',
  fontSize: 15, outline: 'none', color: '#191F28', boxSizing: 'border-box',
}

function NeuChip({ selected, onClick, children, activeColor, style }) {
  return (
    <button onClick={onClick} className={`neu-chip${selected ? ' selected' : ''}`}
      style={{ padding: '9px 16px', borderRadius: 9999, fontSize: 13, fontWeight: selected ? 700 : 500,
        color: selected ? (activeColor || '#191F28') : '#8B95A1', flexShrink: 0, ...style }}>
      {children}
    </button>
  )
}

function BackIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#191F28" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
}

export default function MyPageNeu(props) {
  const {
    themeData, loadError, fileRef,
    profileImg, handleProfileImg,
    nickname, setNickname, editingNick, setEditingNick, handleNicknameSave,
    user, setSettingsPage,
    fmt, totalAsset, accounts, getAccountBalance, getCashBalance,
    cards, setCards, saveToFirestore,
    showAddCard, setShowAddCard,
    cardExitId, newCardId, highlightCardId,
    expandedCardId, setExpandedCardId, getCardUsed,
    setSelectedCard, handleCardClick,
    setEditingCardId, setEditCardData, handleDeleteCard,
    editingCardId, editCardData,
    newCard, setNewCard, EMPTY_CARD,
    cardSaveState, handleAddCard, handleSaveCard,
    showAccountNumbers, setShowAccountNumbers,
    setShowAddAccount, expandedAccountEditId, setExpandedAccountEditId,
    maskAccountNumber, setSelectedAccount, setAccountHistoryMonth,
    handleEditAccount, handleDeleteAccount,
    editingAccountId, setEditingAccountId, editAccountData, setEditAccountData,
    handleSaveAccount, showAddAccount, newAccount, setNewAccount, handleAddAccount,
    editingCash, setEditingCash, cashInput, setCashInput, cash, handleCashSave,
    showLoan, loans, calcMonthlyInterest,
    setSelectedLoan, setLoanDetailSort,
    expandedLoanId, setExpandedLoanId,
    setLoanForm, setEditingLoan, handleDeleteLoan, EMPTY_LOAN,
    showAddLoan, setShowAddLoan, editingLoan, loanForm,
    handleAddLoan, handleSaveLoan,
    selectedCard, displayCard, cardDetailTab, setCardDetailTab, cardHistoryMonth, setCardHistoryMonth, cardTransactions,
    selectedAccount, displayAccount, accountHistoryMonth, allTxns,
    selectedLoan, displayLoan, loanDetailSort, loanRepaymentTxns, loadingRepayments,
    deleteConfirmCard, setDeleteConfirmCard, confirmDeleteCard,
    undoSnackbar, handleUndo,
  } = props

  const primary = themeData.primary
  const accountsSum = accounts.reduce((s, a) => s + getAccountBalance(a), 0)

  return (
    <div className="neu-page" style={{ minHeight: '100vh', paddingBottom: 'calc(95px + env(safe-area-inset-bottom, 0px))' }}>

      {loadError && (
        <div style={{ padding: '12px 20px 0' }}>
          <LoadError message={loadError} onRetry={() => window.location.reload()} />
        </div>
      )}

      {/* 헤더 — 테마 색상 하이라이트 배너 (뉴모피즘 on에서도 유지) */}
      <div style={{ background: primary, padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
            <div onClick={() => fileRef.current.click()} style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.4)' }}>
                {profileImg ? <img src={profileImg} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#fff' }}>{nickname[0] || '?'}</span>}
              </div>
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleProfileImg} />
            <div style={{ flex: 1, minWidth: 0 }}>
              {editingNick ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input value={nickname} onChange={e => setNickname(e.target.value)}
                    style={{ ...neuInputStyle, background: 'rgba(255,255,255,0.9)', flex: 1, padding: '8px 12px' }} />
                  <button onClick={handleNicknameSave} style={{ background: 'rgba(255,255,255,0.3)', border: 'none', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 13, cursor: 'pointer' }}>저장</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <p style={{ fontSize: 20, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nickname}</p>
                  <button onClick={() => setEditingNick(true)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 9999, padding: '3px 8px', color: '#fff', fontSize: 11, cursor: 'pointer' }}>수정</button>
                </div>
              )}
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
            </div>
          </div>

          {!editingNick && (
            <button onClick={() => setSettingsPage('root')} aria-label="설정"
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 12, width: 36, height: 36, padding: 0, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '16px 20px 0' }}>

        {/* 총 자산 */}
        <div className="neu-card" style={{ borderRadius: 20, padding: 16, marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: '#8B95A1', fontWeight: 700, marginBottom: 8 }}>총 자산</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#191F28', marginBottom: 12 }}>{fmt(totalAsset)}원</p>
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: primary, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#8B95A1' }}>계좌</span>
              <span style={{ fontSize: 12, color: accountsSum < 0 ? '#FF5A5F' : '#8B95A1', fontWeight: 500 }}>{fmt(accountsSum)}원</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2ECC71', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#8B95A1' }}>현금</span>
              <span style={{ fontSize: 12, color: '#8B95A1', fontWeight: 500 }}>{fmt(getCashBalance())}원</span>
            </div>
          </div>
        </div>

        {/* 카드 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#191F28' }}>카드</p>
              {cards.length > 0 && <span style={{ fontSize: 12, color: primary, background: `${primary}15`, borderRadius: 9999, padding: '2px 8px', fontWeight: 600 }}>{cards.length}개</span>}
            </div>
            <button onClick={() => setShowAddCard(true)} className="neu-btn" style={{ borderRadius: 12, padding: '7px 16px', color: primary, fontSize: 13, fontWeight: 600 }}>+ 추가</button>
          </div>
          {cards.map(card => {
            const cardUsed = getCardUsed(card)
            const pct = Math.min((cardUsed / (card.limit || 1)) * 100, 100)
            const achieved = card.limit > 0 && cardUsed >= card.limit
            const isExiting = cardExitId === card.id
            const isNew = newCardId === card.id
            const isHighlighted = highlightCardId === card.id
            return (
              <div key={card.id} style={{
                marginBottom: isExiting ? 0 : 10,
                maxHeight: isExiting ? 0 : 400,
                opacity: isExiting ? 0 : 1,
                overflow: isExiting ? 'hidden' : 'visible',
                transition: isExiting ? 'opacity 250ms ease, max-height 250ms ease, margin-bottom 250ms ease' : undefined,
                animation: isNew ? 'cardEnter 300ms cubic-bezier(0.34,1.2,0.64,1) forwards' : undefined,
              }}>
                <div className="neu-card" style={{ borderRadius: 20, padding: '12px 14px', cursor: 'pointer',
                  boxShadow: isHighlighted ? `0 0 0 2px ${primary}55, 8px 8px 16px rgba(163,177,198,0.55), -8px -8px 16px rgba(255,255,255,0.9)` : undefined,
                  transition: 'box-shadow 400ms ease' }}
                  onClick={() => handleCardClick(card)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#191F28' }}>{card.name}</span>
                      <span style={{ fontSize: 10, background: card.cardType === 'credit' ? '#FFE0E0' : '#DCEEFB', color: card.cardType === 'credit' ? '#ef4444' : '#0284c7', borderRadius: 9999, padding: '2px 7px', fontWeight: 600 }}>
                        {card.cardType === 'credit' ? '신용' : '체크'}
                      </span>
                      {achieved && <span style={{ fontSize: 10, background: '#D9F5E3', color: '#16a34a', borderRadius: 9999, padding: '2px 7px', fontWeight: 600 }}>✓ 달성</span>}
                    </div>
                    <button onClick={e => { e.stopPropagation(); setExpandedCardId(expandedCardId === card.id ? null : card.id) }}
                      aria-label={expandedCardId === card.id ? '카드 상세 접기' : '카드 상세 펼치기'}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: expandedCardId === card.id ? primary : '#8B95A1', padding: 4, lineHeight: 0, flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </div>
                  {(card.billingDay || card.cardNumber) && (
                    <p style={{ fontSize: 11, color: '#8B95A1', marginBottom: 8 }}>
                      {card.billingDay ? `결제일 매월 ${card.billingDay}일` : ''}
                      {card.billingDay && card.cardNumber ? ' · ' : ''}
                      {card.cardNumber ? `**** ${card.cardNumber}` : ''}
                    </p>
                  )}
                  <p style={{ fontSize: 12, color: '#8B95A1', marginBottom: 4 }}>이번 달 사용</p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: '#191F28', marginBottom: 6 }}>{fmt(cardUsed)}원</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: '#8B95A1' }}>목표 {fmt(card.limit || 0)}원</span>
                    {card.limit > 0 && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: achieved ? '#22c55e' : primary }}>
                        {achieved ? '✓ 달성' : `${Math.round(pct)}%`}
                      </span>
                    )}
                  </div>
                  <div className="neu-inset" style={{ borderRadius: 99, height: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, background: achieved ? '#22c55e' : primary, width: `${pct}%`, transition: 'width 0.3s' }} />
                  </div>
                </div>
                {expandedCardId === card.id && (
                  <div className="neu-card" style={{ display: 'flex', borderRadius: 20, overflow: 'hidden', marginTop: 8 }}>
                    <button onClick={() => {
                      setEditingCardId(card.id)
                      setEditCardData({
                        cardType: card.cardType || 'debit', name: card.name, cardNumber: card.cardNumber || '',
                        expiry: card.expiry || '', linkedAccount: card.linkedAccount || '',
                        limit: String(card.limit || ''), billingDay: card.billingDay ? String(card.billingDay) : '',
                        creditTracking: card.creditTracking || '',
                      })
                      setExpandedCardId(null)
                    }} style={{ flex: 1, padding: '14px', border: 'none', background: 'none', color: '#8B95A1', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      수정
                    </button>
                    <button onClick={e => { e.stopPropagation(); handleDeleteCard(card.id) }}
                      style={{ flex: 1, padding: '14px', border: 'none', background: 'none', color: '#FF5A5F', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                      삭제
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 계좌 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="22" x2="21" y2="22" /><rect x="3" y="10" width="4" height="12" /><rect x="10" y="10" width="4" height="12" /><rect x="17" y="10" width="4" height="12" /><path d="M12 2L2 10h20z" />
              </svg>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#191F28' }}>계좌</p>
              {accounts.length > 0 && <span style={{ fontSize: 12, color: primary, background: `${primary}15`, borderRadius: 9999, padding: '2px 8px', fontWeight: 600 }}>{accounts.length}개</span>}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => setShowAccountNumbers(!showAccountNumbers)} aria-label={showAccountNumbers ? '계좌번호 숨기기' : '계좌번호 표시'}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: showAccountNumbers ? primary : '#8B95A1', lineHeight: 0 }}>
                {showAccountNumbers ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
              <button onClick={() => setShowAddAccount(true)} className="neu-btn" style={{ borderRadius: 12, padding: '7px 16px', color: primary, fontSize: 13, fontWeight: 600 }}>+ 추가</button>
            </div>
          </div>
          {accounts.map(acc => (
            <div key={acc.id} style={{ marginBottom: 10 }}>
              <div className="neu-card" style={{ borderRadius: 20, padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                onClick={() => setExpandedAccountEditId(expandedAccountEditId === acc.id ? null : acc.id)}>
                <div className="neu-inset" style={{ width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="22" x2="21" y2="22" /><rect x="3" y="10" width="4" height="12" /><rect x="10" y="10" width="4" height="12" /><rect x="17" y="10" width="4" height="12" /><path d="M12 2L2 10h20z" />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#191F28' }}>{acc.name}</p>
                  {acc.number && <p style={{ fontSize: 12, color: '#8B95A1', marginTop: 2 }}>{showAccountNumbers ? acc.number : maskAccountNumber(acc.number)}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: getAccountBalance(acc) < 0 ? '#FF5A5F' : '#191F28' }}>{fmt(getAccountBalance(acc))}원</p>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B95A1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </div>
              </div>
              {expandedAccountEditId === acc.id && (
                <div className="neu-card" style={{ display: 'flex', borderRadius: 20, overflow: 'hidden', marginTop: 8 }}>
                  <button onClick={e => { e.stopPropagation(); setSelectedAccount(acc); setAccountHistoryMonth(null); setExpandedAccountEditId(null) }}
                    style={{ flex: 1, padding: '11px', border: 'none', background: 'none', color: primary, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                    내역
                  </button>
                  <button onClick={() => { handleEditAccount(acc); setExpandedAccountEditId(null) }}
                    style={{ flex: 1, padding: '11px', border: 'none', background: 'none', color: '#8B95A1', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    수정
                  </button>
                  <button onClick={e => { e.stopPropagation(); handleDeleteAccount(acc.id) }}
                    style={{ flex: 1, padding: '11px', border: 'none', background: 'none', color: '#FF5A5F', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                    삭제
                  </button>
                </div>
              )}
            </div>
          ))}
          {accounts.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 4px 0', marginTop: 4 }}>
              <span style={{ fontSize: 13, color: '#8B95A1', fontWeight: 500 }}>계좌 합계</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: accountsSum < 0 ? '#FF5A5F' : '#191F28' }}>{fmt(accountsSum)}원</span>
            </div>
          )}

          {/* 계좌 수정 */}
          <BottomSheet open={!!editingAccountId} onClose={() => setEditingAccountId(null)} background={NEU_BG}>
            <div style={{ padding: '40px 24px calc(env(safe-area-inset-bottom, 0px) + 40px)', '--neu-focus': primary + '59' }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#191F28', marginBottom: 20 }}>계좌 수정</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#191F28', marginBottom: 8 }}>계좌 이름 <span style={{ color: '#FF5A5F' }}>*</span></p>
                  <input className="neu-inset" style={neuInputStyle} placeholder="예: 국민은행" value={editAccountData.name} onChange={e => setEditAccountData(d => ({ ...d, name: e.target.value }))} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#191F28', marginBottom: 8 }}>현재 잔액</p>
                  <input className="neu-inset" style={neuInputStyle} type="number" placeholder="예: 1500000" value={editAccountData.balance} onChange={e => setEditAccountData(d => ({ ...d, balance: e.target.value }))} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#191F28', marginBottom: 8 }}>계좌번호 <span style={{ fontSize: 12, color: '#8B95A1', fontWeight: 400 }}>(선택)</span></p>
                  <input className="neu-inset" style={neuInputStyle} placeholder="예: 1234-56-789012" value={editAccountData.number} onChange={e => setEditAccountData(d => ({ ...d, number: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button onClick={() => setEditingAccountId(null)} className="neu-btn" style={{ flex: 1, height: 56, borderRadius: 16, color: '#8B95A1', fontSize: 15, fontWeight: 600 }}>취소</button>
                <button onClick={handleSaveAccount} className="neu-btn" style={{ flex: 2, height: 56, borderRadius: 16, color: primary, fontSize: 15, fontWeight: 700 }}>저장</button>
              </div>
            </div>
          </BottomSheet>
          {/* 계좌 추가 */}
          <BottomSheet open={showAddAccount} onClose={() => { setShowAddAccount(false); setNewAccount({ name: '', balance: '', number: '' }) }} background={NEU_BG}>
            <div style={{ padding: '40px 24px calc(env(safe-area-inset-bottom, 0px) + 40px)', '--neu-focus': primary + '59' }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#191F28', marginBottom: 20 }}>계좌 추가</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#191F28', marginBottom: 8 }}>계좌 이름 <span style={{ color: '#FF5A5F' }}>*</span></p>
                  <input className="neu-inset" style={neuInputStyle} placeholder="예: 국민은행" value={newAccount.name} onChange={e => setNewAccount(a => ({ ...a, name: e.target.value }))} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#191F28', marginBottom: 8 }}>잔액</p>
                  <input className="neu-inset" style={neuInputStyle} type="number" placeholder="예: 1500000" value={newAccount.balance} onChange={e => setNewAccount(a => ({ ...a, balance: e.target.value }))} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#191F28', marginBottom: 8 }}>계좌번호 <span style={{ fontSize: 12, color: '#8B95A1', fontWeight: 400 }}>(선택)</span></p>
                  <input className="neu-inset" style={neuInputStyle} placeholder="예: 1234-56-789012" value={newAccount.number} onChange={e => setNewAccount(a => ({ ...a, number: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button onClick={() => { setShowAddAccount(false); setNewAccount({ name: '', balance: '', number: '' }) }} className="neu-btn" style={{ flex: 1, height: 56, borderRadius: 16, color: '#8B95A1', fontSize: 15, fontWeight: 600 }}>취소</button>
                <button onClick={handleAddAccount} className="neu-btn" style={{ flex: 2, height: 56, borderRadius: 16, color: primary, fontSize: 15, fontWeight: 700 }}>추가</button>
              </div>
            </div>
          </BottomSheet>
        </div>

        {/* 현금 */}
        <div className="neu-card" style={{ borderRadius: 20, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" />
              </svg>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#191F28' }}>현금</p>
            </div>
            {!editingCash && (
              <button onClick={() => { setEditingCash(true); setCashInput(String(cash || '')) }} className="neu-btn" style={{ borderRadius: 12, padding: '7px 16px', color: primary, fontSize: 13, fontWeight: 600 }}>수정</button>
            )}
          </div>
          <p style={{ fontSize: 12, color: '#8B95A1', marginBottom: 10 }}>직접 보유한 현금 자산</p>
          {editingCash ? (
            <div style={{ '--neu-focus': primary + '59' }}>
              <input type="number" className="neu-inset" value={cashInput} onChange={e => setCashInput(e.target.value)} style={neuInputStyle} placeholder="현금 잔액 입력" autoFocus />
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button onClick={() => setEditingCash(false)} className="neu-btn" style={{ flex: 1, padding: 10, borderRadius: 16, fontSize: 13, color: '#8B95A1' }}>취소</button>
                <button onClick={handleCashSave} className="neu-btn" style={{ flex: 1, padding: 10, borderRadius: 16, fontSize: 13, fontWeight: 600, color: primary }}>저장</button>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 36, fontWeight: 700, color: '#191F28' }}>{fmt(getCashBalance())}원</p>
          )}
        </div>

        {/* 대출 */}
        {showLoan && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#191F28' }}>대출</p>
                {loans.length > 0 && <span style={{ fontSize: 12, color: primary, background: `${primary}15`, borderRadius: 9999, padding: '2px 8px', fontWeight: 600 }}>{loans.length}개</span>}
              </div>
              <button onClick={() => { setLoanForm(EMPTY_LOAN); setShowAddLoan(true) }} className="neu-btn" style={{ borderRadius: 12, padding: '7px 16px', color: primary, fontSize: 13, fontWeight: 600 }}>+ 추가</button>
            </div>
            {loans.length === 0 && <p style={{ fontSize: 14, color: '#8B95A1', textAlign: 'center', padding: '12px 0' }}>등록된 대출이 없어요</p>}
            {loans.map(loan => {
              const monthlyInterest = calcMonthlyInterest(loan.remainingPrincipal, loan.rate, loan.rateType)
              const repaid = loan.principal - loan.remainingPrincipal
              const progress = loan.principal > 0 ? Math.min((repaid / loan.principal) * 100, 100) : 0
              return (
                <div key={loan.id} style={{ marginBottom: 10 }}>
                  <div className="neu-card" style={{ borderRadius: 20, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                      onClick={() => { setSelectedLoan({ ...loan }); setLoanDetailSort('desc') }}>
                      <div className="neu-inset" style={{ width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF5A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#191F28', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loan.name}</p>
                        <p style={{ fontSize: 12, color: '#8B95A1' }}>원금 {fmt(loan.principal)}원</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: 15, fontWeight: 700, color: '#FF5A5F' }}>
                          {fmt(loan.rate ? loan.remainingPrincipal + monthlyInterest : loan.remainingPrincipal)}원
                        </p>
                        {loan.rate && <p style={{ fontSize: 11, color: '#8B95A1', marginTop: 1 }}>월 이자 {fmt(monthlyInterest)}원</p>}
                      </div>
                      <button onClick={e => { e.stopPropagation(); setExpandedLoanId(expandedLoanId === loan.id ? null : loan.id) }}
                        aria-label={expandedLoanId === loan.id ? '대출 상세 접기' : '대출 상세 펼치기'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: expandedLoanId === loan.id ? primary : '#8B95A1', padding: 4, lineHeight: 0, flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    </div>
                    <div className="neu-inset" style={{ height: 3, margin: '0 16px 12px', borderRadius: 9999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${progress}%`, background: progress >= 100 ? '#2ECC71' : primary, borderRadius: 9999, transition: 'width 0.4s' }} />
                    </div>
                  </div>
                  {expandedLoanId === loan.id && (
                    <div className="neu-card" style={{ display: 'flex', borderRadius: 20, overflow: 'hidden', marginTop: 8 }}>
                      <button onClick={e => {
                        e.stopPropagation()
                        setLoanForm({ name: loan.name, principal: String(loan.principal), remainingPrincipal: String(loan.remainingPrincipal), startDate: loan.startDate, rate: loan.rate != null ? String(loan.rate) : '', rateType: loan.rateType || 'simple', monthlyPayment: loan.monthlyPayment != null ? String(loan.monthlyPayment) : '', paymentDay: loan.paymentDay != null ? String(loan.paymentDay) : '', maturityDate: loan.maturityDate || '' })
                        setEditingLoan(loan); setExpandedLoanId(null)
                      }} style={{ flex: 1, padding: '14px', border: 'none', background: 'none', color: '#8B95A1', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        수정
                      </button>
                      <button onClick={e => { e.stopPropagation(); handleDeleteLoan(loan.id) }}
                        style={{ flex: 1, padding: '14px', border: 'none', background: 'none', color: '#FF5A5F', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

      </div>

      {/* ── 카드 추가/수정 전체화면 폼 ── */}
      {(() => {
        const isEdit = !!editingCardId
        const data = isEdit ? editCardData : newCard
        const setData = isEdit ? setEditCardData : setNewCard
        const isCredit = data.cardType === 'credit'
        const isValid = !!data.name && !!data.cardType && (!isCredit || !!data.creditTracking)
        const showValidationMsg = isCredit && !!data.name && !data.creditTracking

        const TRACKING_OPTS = [
          {
            val: 'spend',
            titleNode: () => (<span>신용카드 <span style={{ color: primary, fontWeight: 800 }}>지출</span>이 중요해요</span>),
            desc: '카드를 사용하는 순간마다 가계부 지출로 기록합니다. 소비 습관 관리를 원하는 사용자에게 적합합니다.',
            tags: ['결제 내역 → 지출 포함', '결제 대금 : 지출 미포함', '소비 패턴 분석'],
            icon: (color) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>),
          },
          {
            val: 'billing',
            titleNode: () => (<span>신용카드 <span style={{ color: primary, fontWeight: 800 }}>대금</span>이 중요해요</span>),
            desc: '매월 카드 대금 청구 시점에 지출을 기록합니다. 카드값 관리 중심 사용자에게 적합합니다.',
            tags: ['청구일 기준 기록', '카드값 관리', '결제 내역 : 지출 미포함'],
            icon: (color) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>),
          },
        ]

        const CARD_FIELDS = [
          { label: '카드 이름', req: true, placeholder: '예: 신한카드', key: 'name', type: 'text', extra: {} },
          { label: '카드번호 끝 4자리', req: false, placeholder: '예: 1234', key: 'cardNumber', type: 'text', extra: { maxLength: 4 } },
          { label: '유효기간', req: false, placeholder: 'MM/YY', key: 'expiry', type: 'text', extra: {} },
          { label: '실적 목표 금액', req: false, placeholder: '예: 300000', key: 'limit', type: 'number', extra: {} },
          { label: '결제일', req: false, placeholder: '예: 15', key: 'billingDay', type: 'number', extra: { min: '1', max: '31' } },
        ]

        return (
          <BottomSheet variant="full" showHandle={false} background={NEU_BG}
            open={showAddCard || isEdit}
            onClose={() => { if (isEdit) setEditingCardId(null); else { setShowAddCard(false); setNewCard(EMPTY_CARD) } }}>
            <div className="neu-page" style={{ display: 'flex', flexDirection: 'column', height: '100%', '--neu-focus': primary + '59' }}>
              <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 24px 16px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => { if (isEdit) setEditingCardId(null); else { setShowAddCard(false); setNewCard(EMPTY_CARD) } }} aria-label="뒤로가기" className="neu-btn"
                    style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <BackIcon />
                  </button>
                  <p style={{ fontSize: 18, fontWeight: 700, color: '#191F28' }}>{isEdit ? '카드 수정' : '카드 추가'}</p>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 40px', WebkitOverflowScrolling: 'touch' }}>

                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', marginBottom: 10, letterSpacing: 0.5, textTransform: 'uppercase' }}>카드 종류</p>
                  <div className="neu-inset" style={{ display: 'flex', borderRadius: 16, padding: 4, gap: 4 }}>
                    {[{ val: 'debit', label: '체크카드' }, { val: 'credit', label: '신용카드' }].map(opt => {
                      const sel = data.cardType === opt.val
                      return (
                        <button key={opt.val} onClick={() => setData(c => ({ ...c, cardType: opt.val, creditTracking: opt.val === 'debit' ? '' : c.creditTracking }))}
                          className={sel ? 'neu-btn' : ''}
                          style={{ flex: 1, height: 48, borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 15,
                            fontWeight: sel ? 700 : 500, color: sel ? primary : '#8B95A1', background: sel ? undefined : 'transparent' }}>
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div style={{
                  maxHeight: isCredit ? '800px' : '0px', opacity: isCredit ? 1 : 0, pointerEvents: isCredit ? 'auto' : 'none',
                  transition: isCredit ? 'max-height 250ms ease-out, opacity 200ms ease-out' : 'max-height 200ms ease-in, opacity 150ms ease-in',
                  marginBottom: isCredit ? 24 : 0, overflow: 'visible',
                }}>
                  <div style={{ overflow: 'hidden', paddingBottom: 2 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', marginBottom: 4, letterSpacing: 0.5, textTransform: 'uppercase' }}>지출 추적 방식</p>
                    <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 14 }}>신용카드를 어떻게 관리할지 선택해주세요</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {TRACKING_OPTS.map(opt => {
                        const sel = data.creditTracking === opt.val
                        return (
                          <button key={opt.val} onClick={() => setData(c => ({ ...c, creditTracking: opt.val }))}
                            className={sel ? 'neu-inset' : 'neu-card'}
                            style={{ width: '100%', textAlign: 'left', padding: '18px 16px', borderRadius: 22, border: 'none', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                              <div className={sel ? 'neu-card' : 'neu-inset'} style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {opt.icon(sel ? primary : '#8B95A1')}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                  <p style={{ fontSize: 15, fontWeight: 700, color: sel ? primary : '#191F28', lineHeight: 1.4 }}>{opt.titleNode()}</p>
                                  <div className={sel ? 'neu-card' : 'neu-inset'} style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginLeft: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {sel && <div style={{ width: 8, height: 8, borderRadius: '50%', background: primary }} />}
                                  </div>
                                </div>
                                <p style={{ fontSize: 13, color: '#8B95A1', lineHeight: 1.55, marginBottom: 12 }}>{opt.desc}</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  {opt.tags.map(tag => (
                                    <span key={tag} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 9999,
                                      background: sel ? `${primary}18` : 'rgba(163,177,198,0.18)', color: sel ? primary : '#8B95A1', fontWeight: sel ? 600 : 400, whiteSpace: 'nowrap' }}>{tag}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="neu-card" style={{ borderRadius: 22, padding: 20, marginBottom: 16 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', marginBottom: 16, letterSpacing: 0.5, textTransform: 'uppercase' }}>카드 정보</p>
                  {CARD_FIELDS.map(({ label, req, placeholder, key, type, extra }, i, arr) => (
                    <div key={key} style={{ marginBottom: i < arr.length - 1 ? 18 : 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#191F28', marginBottom: 8 }}>{label}{req && <span style={{ color: '#FF5A5F' }}> *</span>}</p>
                      <input className="neu-inset" style={neuInputStyle} type={type} placeholder={placeholder}
                        value={data[key] || ''} onChange={e => setData(c => ({ ...c, [key]: e.target.value }))} {...extra} />
                    </div>
                  ))}
                </div>

                <div className="neu-card" style={{ borderRadius: 22, padding: 20, marginBottom: 32 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', marginBottom: 4, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    연동 계좌 <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 12 }}>(선택)</span>
                  </p>
                  <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 14 }}>카드 대금이 출금되는 계좌를 선택하세요</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {[{ id: '__none', name: '없음' }, ...accounts].map(a => {
                      const sel = a.id === '__none' ? data.linkedAccount === '' : data.linkedAccount === a.name
                      return (
                        <NeuChip key={a.id} selected={sel} activeColor={primary}
                          onClick={() => setData(c => ({ ...c, linkedAccount: a.id === '__none' ? '' : a.name }))}>{a.name}</NeuChip>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div style={{ padding: '12px 20px', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)', flexShrink: 0 }}>
                {showValidationMsg && (
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#FF5A5F', textAlign: 'center', marginBottom: 8 }}>지출 추적 방식을 선택해주세요</p>
                )}
                <button onClick={isEdit ? handleSaveCard : handleAddCard} disabled={!isValid || !!cardSaveState} className="neu-btn"
                  style={{ width: '100%', height: 56, borderRadius: 16,
                    color: cardSaveState === 'success' ? '#22c55e' : (isValid ? primary : '#8B95A1'),
                    fontSize: 16, fontWeight: 700, cursor: (isValid && !cardSaveState) ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {cardSaveState === 'loading' ? (
                    <><div className="spin-loader" style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.15)', borderTopColor: 'currentColor', borderRadius: '50%', flexShrink: 0 }} />저장 중...</>
                  ) : cardSaveState === 'success' ? (
                    <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12" /></svg>저장 완료</>
                  ) : (isEdit ? '저장하기' : '추가하기')}
                </button>
              </div>
            </div>
          </BottomSheet>
        )
      })()}

      {/* 카드 상세 모달 */}
      <BottomSheet open={!!selectedCard} onClose={() => setSelectedCard(null)} maxOpacity={0.4} background="transparent" zIndex={400}>
        <div className="neu-page" style={{ borderRadius: '28px 28px 0 0', width: '100%', maxWidth: 430, maxHeight: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="neu-card" style={{ borderRadius: '28px 28px 0 0', padding: '24px 20px 20px', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#191F28' }}>{displayCard.name}</p>
              <button onClick={() => setSelectedCard(null)} aria-label="닫기" className="neu-btn" style={{ borderRadius: 8, padding: '4px 10px', color: '#8B95A1', fontSize: 14 }}>✕</button>
            </div>
            <p style={{ fontSize: 18, letterSpacing: 4, marginBottom: 14, color: primary }}>**** **** **** {displayCard.cardNumber || '****'}</p>
            <div style={{ display: 'flex', gap: 24 }}>
              <div>
                <p style={{ fontSize: 11, color: '#8B95A1', marginBottom: 2 }}>유효기간</p>
                <p style={{ fontSize: 13, color: '#191F28' }}>{displayCard.expiry || '--/--'}</p>
              </div>
              {displayCard.linkedAccount && (
                <div>
                  <p style={{ fontSize: 11, color: '#8B95A1', marginBottom: 2 }}>연동 계좌</p>
                  <p style={{ fontSize: 13, color: '#191F28' }}>{displayCard.linkedAccount}</p>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexShrink: 0, padding: '8px 12px 0' }}>
            {[{ key: 'benefits', label: '혜택' }, { key: 'history', label: '내역' }, ...(displayCard.cardType === 'credit' ? [{ key: 'installment', label: '할부' }] : [])].map(tab => (
              <button key={tab.key} onClick={() => setCardDetailTab(tab.key)}
                style={{ flex: 1, padding: '10px', border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: cardDetailTab === tab.key ? 700 : 400,
                  color: cardDetailTab === tab.key ? primary : '#8B95A1',
                  borderBottom: cardDetailTab === tab.key ? `2px solid ${primary}` : '2px solid transparent' }}>
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            {cardDetailTab === 'benefits' ? (
              <div>
                {(displayCard.benefits || []).length === 0 && (
                  <p style={{ fontSize: 14, color: '#8B95A1', textAlign: 'center', padding: '20px 0' }}>혜택을 추가해보세요</p>
                )}
                {(displayCard.benefits || []).map((b, i) => (
                  <div key={i} className="neu-inset" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 12, marginBottom: 8 }}>
                    <p style={{ fontSize: 14, color: '#191F28' }}>• {b}</p>
                    <button onClick={() => {
                      const updated = cards.map(c => c.id === displayCard.id ? { ...c, benefits: c.benefits.filter((_, j) => j !== i) } : c)
                      setCards(updated); saveToFirestore({ cards: updated })
                      setSelectedCard(prev => ({ ...prev, benefits: prev.benefits.filter((_, j) => j !== i) }))
                    }} aria-label="혜택 삭제" style={{ background: 'none', border: 'none', color: '#8B95A1', cursor: 'pointer', fontSize: 16 }}>✕</button>
                  </div>
                ))}
              </div>
            ) : cardDetailTab === 'installment' ? (
              <div>
                {(() => {
                  const installmentTxns = cardTransactions.filter(tx => tx.type === 'expense' && Number(tx.installmentMonths) >= 2).sort((a, b) => (b.date || '').localeCompare(a.date || ''))
                  if (installmentTxns.length === 0) return <p style={{ fontSize: 14, color: '#8B95A1', textAlign: 'center', padding: '20px 0' }}>할부로 결제한 내역이 없어요</p>
                  return installmentTxns.map(tx => {
                    const months = Number(tx.installmentMonths)
                    const monthlyAmount = Math.round((tx.amount || 0) / months)
                    return (
                      <div key={tx.id} className="neu-card" style={{ padding: '14px 16px', borderRadius: 14, marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#191F28', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>{tx.title}</p>
                          <p style={{ fontSize: 11, color: '#8B95A1', flexShrink: 0 }}>{tx.date}</p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <p style={{ fontSize: 12, color: '#8B95A1' }}>전체 {fmt(tx.amount || 0)}원 · {months}개월</p>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#ef4444', flexShrink: 0 }}>월 {fmt(monthlyAmount)}원</p>
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            ) : (
              <div>
                {cardTransactions.length > 0 && (() => {
                  const availableMonths = [...new Set(cardTransactions.map(tx => tx.month || tx.date?.slice(0, 7) || ''))].filter(Boolean).sort((a, b) => b.localeCompare(a))
                  return (
                    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 4 }}>
                      <NeuChip selected={cardHistoryMonth === null} activeColor={primary} onClick={() => setCardHistoryMonth(null)} style={{ fontSize: 12, padding: '6px 14px' }}>전체</NeuChip>
                      {availableMonths.map(m => (
                        <NeuChip key={m} selected={cardHistoryMonth === m} activeColor={primary} onClick={() => setCardHistoryMonth(m)} style={{ fontSize: 12, padding: '6px 14px' }}>
                          {m.replace(/^(\d{4})-0?(\d+)$/, '$1년 $2월')}
                        </NeuChip>
                      ))}
                    </div>
                  )
                })()}
                {cardTransactions.length === 0 ? (
                  <p style={{ fontSize: 14, color: '#8B95A1', textAlign: 'center', padding: '20px 0' }}>이 카드로 결제한 내역이 없어요</p>
                ) : (() => {
                  const filtered = cardHistoryMonth ? cardTransactions.filter(tx => (tx.month || tx.date?.slice(0, 7)) === cardHistoryMonth) : cardTransactions
                  const byMonth = filtered.reduce((acc, tx) => { const m = tx.month || tx.date?.slice(0, 7) || '기타'; if (!acc[m]) acc[m] = []; acc[m].push(tx); return acc }, {})
                  return filtered.length === 0 ? (
                    <p style={{ fontSize: 14, color: '#8B95A1', textAlign: 'center', padding: '20px 0' }}>내역이 없어요</p>
                  ) : Object.keys(byMonth).sort((a, b) => b.localeCompare(a)).map(month => (
                    <div key={month}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 8px' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: primary, whiteSpace: 'nowrap' }}>{month.replace(/^(\d{4})-0?(\d+)$/, '$1년 $2월')}</span>
                        <div style={{ flex: 1, height: 1, background: 'rgba(163,177,198,0.25)' }} />
                        <span style={{ fontSize: 11, color: '#8B95A1', whiteSpace: 'nowrap' }}>-{byMonth[month].filter(tx => tx.type === 'expense').reduce((s, tx) => s + (tx.amount || 0), 0).toLocaleString()}원</span>
                      </div>
                      {byMonth[month].sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(tx => (
                        <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(163,177,198,0.2)' }}>
                          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', marginRight: 8 }}>
                            <p style={{ fontSize: 14, color: '#191F28', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.title}</p>
                            <p style={{ fontSize: 11, color: '#8B95A1' }}>{tx.date} · {tx.category}</p>
                          </div>
                          <p style={{ fontSize: 14, fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap', color: tx.type === 'expense' ? '#ef4444' : '#22c55e' }}>
                            {tx.type === 'expense' ? '-' : '+'}{(tx.amount || 0).toLocaleString()}원
                          </p>
                        </div>
                      ))}
                    </div>
                  ))
                })()}
              </div>
            )}
          </div>

          {cardDetailTab === 'benefits' && (
            <div className="neu-card" style={{ padding: '12px 20px 36px', flexShrink: 0, '--neu-focus': primary + '59' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input id="benefitInput" className="neu-inset" placeholder="혜택 입력 (예: 스타벅스 10% 할인)"
                  style={{ ...neuInputStyle, flex: 1, padding: '11px 14px', borderRadius: 16, fontSize: 13, width: 'auto' }} />
                <button onClick={() => {
                  const val = document.getElementById('benefitInput').value.trim()
                  if (!val) return
                  const updated = cards.map(c => c.id === displayCard.id ? { ...c, benefits: [...(c.benefits || []), val] } : c)
                  setCards(updated); saveToFirestore({ cards: updated })
                  setSelectedCard(prev => ({ ...prev, benefits: [...(prev.benefits || []), val] }))
                  document.getElementById('benefitInput').value = ''
                }} className="neu-btn" style={{ padding: '11px 16px', borderRadius: 16, color: primary, fontSize: 13, fontWeight: 600 }}>추가</button>
              </div>
            </div>
          )}
        </div>
      </BottomSheet>

      {/* 계좌 내역 바텀시트 */}
      {(() => {
        const accTxns = allTxns.filter(tx => tx.payment === displayAccount.name || tx.toAccount === displayAccount.name)
        const availableMonths = [...new Set(accTxns.map(tx => tx.month || tx.date?.slice(0, 7) || ''))].filter(Boolean).sort((a, b) => b.localeCompare(a))
        const filtered = accountHistoryMonth ? accTxns.filter(tx => (tx.month || tx.date?.slice(0, 7)) === accountHistoryMonth) : accTxns
        const byMonth = filtered.reduce((acc, tx) => { const m = tx.month || tx.date?.slice(0, 7) || '기타'; if (!acc[m]) acc[m] = []; acc[m].push(tx); return acc }, {})
        return (
          <BottomSheet open={!!selectedAccount} onClose={() => setSelectedAccount(null)} maxOpacity={0.4} background="transparent" zIndex={400}>
            <div className="neu-page" style={{ width: '100%', borderRadius: '28px 28px 0 0', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
              <div className="neu-card" style={{ borderRadius: '28px 28px 0 0', padding: '20px 20px 18px', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <p style={{ fontSize: 17, fontWeight: 700, color: '#191F28' }}>{displayAccount.name}</p>
                  <button onClick={() => setSelectedAccount(null)} aria-label="닫기" className="neu-btn" style={{ borderRadius: 8, padding: '4px 10px', color: '#8B95A1', fontSize: 14 }}>✕</button>
                </div>
                {displayAccount.number && (<p style={{ fontSize: 13, color: '#8B95A1', letterSpacing: 1 }}>{maskAccountNumber(displayAccount.number)}</p>)}
              </div>

              <div style={{ padding: '12px 16px 12px', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
                  <NeuChip selected={accountHistoryMonth === null} activeColor={primary} onClick={() => setAccountHistoryMonth(null)} style={{ fontSize: 12, padding: '6px 14px' }}>전체</NeuChip>
                  {availableMonths.map(m => (
                    <NeuChip key={m} selected={accountHistoryMonth === m} activeColor={primary} onClick={() => setAccountHistoryMonth(m)} style={{ fontSize: 12, padding: '6px 14px' }}>
                      {m.replace(/^(\d{4})-0?(\d+)$/, '$1년 $2월')}
                    </NeuChip>
                  ))}
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 36px' }}>
                {accTxns.length === 0 ? (
                  <p style={{ fontSize: 14, color: '#8B95A1', textAlign: 'center', padding: '24px 0' }}>이 계좌와 연동된 내역이 없어요</p>
                ) : filtered.length === 0 ? (
                  <p style={{ fontSize: 14, color: '#8B95A1', textAlign: 'center', padding: '24px 0' }}>내역이 없어요</p>
                ) : Object.keys(byMonth).sort((a, b) => b.localeCompare(a)).map(month => (
                  <div key={month}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 8px' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: primary, whiteSpace: 'nowrap' }}>{month.replace(/^(\d{4})-0?(\d+)$/, '$1년 $2월')}</span>
                      <div style={{ flex: 1, height: 1, background: 'rgba(163,177,198,0.25)' }} />
                      <span style={{ fontSize: 11, color: '#8B95A1', whiteSpace: 'nowrap' }}>-{byMonth[month].filter(tx => tx.type === 'expense').reduce((s, tx) => s + (tx.amount || 0), 0).toLocaleString()}원</span>
                    </div>
                    {byMonth[month].sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(tx => (
                      <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(163,177,198,0.2)' }}>
                        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', marginRight: 8 }}>
                          <p style={{ fontSize: 14, color: '#191F28', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.title}</p>
                          <p style={{ fontSize: 11, color: '#8B95A1' }}>{tx.date} · {tx.category}</p>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap', color: tx.type === 'expense' ? '#ef4444' : tx.type === 'income' ? '#22c55e' : '#8B95A1' }}>
                          {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : ''}{(tx.amount || 0).toLocaleString()}원
                        </p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </BottomSheet>
        )
      })()}

      {/* 대출 추가/수정 */}
      {(() => {
        const isEdit = !!editingLoan
        const monthlyInterest = calcMonthlyInterest(loanForm.remainingPrincipal, loanForm.rate, loanForm.rateType)
        const isValid = !!loanForm.name && !!loanForm.principal && !!loanForm.remainingPrincipal && !!loanForm.startDate
        return (
          <BottomSheet variant="full" showHandle={false} background={NEU_BG}
            open={showAddLoan || isEdit}
            onClose={() => { if (isEdit) { setEditingLoan(null); setLoanForm(EMPTY_LOAN) } else { setShowAddLoan(false); setLoanForm(EMPTY_LOAN) } }}>
            <div className="neu-page" style={{ display: 'flex', flexDirection: 'column', height: '100%', '--neu-focus': primary + '59' }}>
              <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 24px 16px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => { if (isEdit) { setEditingLoan(null); setLoanForm(EMPTY_LOAN) } else { setShowAddLoan(false); setLoanForm(EMPTY_LOAN) } }} aria-label="뒤로가기" className="neu-btn"
                    style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <BackIcon />
                  </button>
                  <p style={{ fontSize: 18, fontWeight: 700, color: '#191F28' }}>{isEdit ? '대출 수정' : '대출 추가'}</p>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 40px', WebkitOverflowScrolling: 'touch' }}>
                <div className="neu-card" style={{ borderRadius: 22, padding: 20, marginBottom: 16 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', marginBottom: 16, letterSpacing: 0.5, textTransform: 'uppercase' }}>필수 항목</p>
                  {[
                    { label: '대출 이름', key: 'name', placeholder: '예: 국민은행 신용대출', type: 'text' },
                    { label: '대출 원금', key: 'principal', placeholder: '예: 10000000', type: 'number' },
                    { label: '잔여 원금', key: 'remainingPrincipal', placeholder: '예: 7500000', type: 'number' },
                    { label: '대출 일자', key: 'startDate', placeholder: '', type: 'date' },
                  ].map(({ label, key, placeholder, type }, i, arr) => (
                    <div key={key} style={{ marginBottom: i < arr.length - 1 ? 18 : 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#191F28', marginBottom: 8 }}>{label} <span style={{ color: '#FF5A5F' }}>*</span></p>
                      <input className="neu-inset" style={{ ...neuInputStyle, height: 52 }} type={type} placeholder={placeholder}
                        value={loanForm[key]} onChange={e => setLoanForm(f => ({ ...f, [key]: e.target.value }))} />
                    </div>
                  ))}
                </div>

                <div className="neu-card" style={{ borderRadius: 22, padding: 20, marginBottom: 16 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', marginBottom: 16, letterSpacing: 0.5, textTransform: 'uppercase' }}>선택 항목</p>
                  <div style={{ marginBottom: 18 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#191F28', marginBottom: 8 }}>금리</p>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <input className="neu-inset" style={{ ...neuInputStyle, height: 52, paddingRight: 36 }} type="number" placeholder="예: 4.5"
                          value={loanForm.rate} onChange={e => setLoanForm(f => ({ ...f, rate: e.target.value }))} />
                        <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#8B95A1', fontWeight: 600 }}>%</span>
                      </div>
                      <div className="neu-inset" style={{ display: 'flex', borderRadius: 12, padding: 3, gap: 2 }}>
                        {[{ val: 'simple', label: '단리' }, { val: 'compound', label: '복리' }].map(opt => {
                          const sel = loanForm.rateType === opt.val
                          return (
                            <button key={opt.val} onClick={() => setLoanForm(f => ({ ...f, rateType: opt.val }))} className={sel ? 'neu-btn' : ''}
                              style={{ padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: sel ? 700 : 500, color: sel ? primary : '#8B95A1', background: sel ? undefined : 'transparent' }}>
                              {opt.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    {loanForm.rate && loanForm.remainingPrincipal && (
                      <div className="neu-inset" style={{ marginTop: 12, borderRadius: 14, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ fontSize: 13, color: '#8B95A1', fontWeight: 500 }}>예상 월 이자 ({loanForm.rateType === 'simple' ? '단리' : '복리'})</p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: primary }}>₩ {fmt(monthlyInterest)}</p>
                      </div>
                    )}
                  </div>
                  {[
                    { label: '월 상환액', key: 'monthlyPayment', placeholder: '예: 500000', type: 'number' },
                    { label: '상환일', key: 'paymentDay', placeholder: '예: 25', type: 'number' },
                    { label: '만기일', key: 'maturityDate', placeholder: '', type: 'date' },
                  ].map(({ label, key, placeholder, type }, i, arr) => (
                    <div key={key} style={{ marginBottom: i < arr.length - 1 ? 18 : 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#191F28', marginBottom: 8 }}>{label}</p>
                      <input className="neu-inset" style={{ ...neuInputStyle, height: 52 }} type={type} placeholder={placeholder}
                        value={loanForm[key]} onChange={e => setLoanForm(f => ({ ...f, [key]: e.target.value }))} />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: '12px 20px', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)', flexShrink: 0 }}>
                <button onClick={isEdit ? handleSaveLoan : handleAddLoan} disabled={!isValid} className="neu-btn"
                  style={{ width: '100%', height: 56, borderRadius: 16, color: isValid ? primary : '#8B95A1', fontSize: 16, fontWeight: 700, cursor: isValid ? 'pointer' : 'not-allowed' }}>
                  {isEdit ? '저장하기' : '추가하기'}
                </button>
              </div>
            </div>
          </BottomSheet>
        )
      })()}

      {/* 대출 상세 */}
      {(() => {
        const loan = displayLoan || {}
        const monthlyInterest = calcMonthlyInterest(loan.remainingPrincipal, loan.rate, loan.rateType)
        const totalWithInterest = (loan.remainingPrincipal || 0) + (loan.rate ? monthlyInterest : 0)
        const sortedTxns = [...loanRepaymentTxns].sort((a, b) => (a.date || '').localeCompare(b.date || ''))
        const repaymentsFromTxns = sortedTxns.map((r, i) => ({
          date: r.date, daysElapsed: r.daysElapsed != null ? r.daysElapsed : null, amount: r.amount,
          cumulativeAmount: sortedTxns.slice(0, i + 1).reduce((s, t) => s + (t.amount || 0), 0)
        }))
        const repaid = repaymentsFromTxns.reduce((s, r) => s + r.amount, 0)
        const progress = loan.principal > 0 ? Math.min((repaid / loan.principal) * 100, 100) : 0
        const repayments = loanDetailSort === 'desc' ? [...repaymentsFromTxns].reverse() : repaymentsFromTxns

        return (
          <BottomSheet variant="full" showHandle={false} background={NEU_BG} open={!!selectedLoan} onClose={() => setSelectedLoan(null)}>
            <div className="neu-page" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 20px 16px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <button onClick={() => setSelectedLoan(null)} aria-label="뒤로가기" className="neu-btn"
                    style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <BackIcon />
                  </button>
                  <p style={{ fontSize: 17, fontWeight: 700, color: '#191F28' }}>{loan.name}</p>
                  <button onClick={() => {
                    setLoanForm({ name: loan.name, principal: String(loan.principal), remainingPrincipal: String(loan.remainingPrincipal), startDate: loan.startDate, rate: loan.rate != null ? String(loan.rate) : '', rateType: loan.rateType || 'simple', monthlyPayment: loan.monthlyPayment != null ? String(loan.monthlyPayment) : '', paymentDay: loan.paymentDay != null ? String(loan.paymentDay) : '', maturityDate: loan.maturityDate || '' })
                    setEditingLoan(loan); setSelectedLoan(null)
                  }} className="neu-btn" style={{ borderRadius: 10, padding: '6px 14px', fontSize: 13, fontWeight: 600, color: '#191F28', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#191F28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    수정
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: 20, WebkitOverflowScrolling: 'touch' }}>
                <div className="neu-card" style={{ borderRadius: 24, padding: '24px 20px', marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div>
                      <p style={{ fontSize: 12, color: '#8B95A1', marginBottom: 6 }}>잔여 대출금 {loan.rate ? '(이자 포함)' : ''}</p>
                      <p style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-1px', lineHeight: 1.1, color: '#FF5A5F' }}>-{fmt(totalWithInterest)}원</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 12, color: '#8B95A1', marginBottom: 6 }}>잔여 원금</p>
                      <p style={{ fontSize: 18, fontWeight: 700, color: '#191F28' }}>{fmt(loan.remainingPrincipal)}원</p>
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: '#8B95A1' }}>상환 진행률</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: primary }}>{Math.round(progress)}%</span>
                    </div>
                    <div className="neu-inset" style={{ height: 6, borderRadius: 9999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${progress}%`, background: primary, borderRadius: 9999, transition: 'width 0.6s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      <span style={{ fontSize: 11, color: '#8B95A1' }}>누적 상환 {fmt(repaid)}원</span>
                      <span style={{ fontSize: 11, color: '#8B95A1' }}>원금 {fmt(loan.principal)}원</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                    {loan.rate != null && <div><p style={{ fontSize: 11, color: '#8B95A1', marginBottom: 2 }}>금리</p><p style={{ fontSize: 13, fontWeight: 600, color: '#191F28' }}>연 {loan.rate}% ({loan.rateType === 'simple' ? '단리' : '복리'})</p></div>}
                    {loan.monthlyPayment && <div><p style={{ fontSize: 11, color: '#8B95A1', marginBottom: 2 }}>월 상환액</p><p style={{ fontSize: 13, fontWeight: 600, color: '#191F28' }}>{fmt(loan.monthlyPayment)}원</p></div>}
                    {loan.paymentDay && <div><p style={{ fontSize: 11, color: '#8B95A1', marginBottom: 2 }}>상환일</p><p style={{ fontSize: 13, fontWeight: 600, color: '#191F28' }}>매월 {loan.paymentDay}일</p></div>}
                    {loan.startDate && <div><p style={{ fontSize: 11, color: '#8B95A1', marginBottom: 2 }}>대출일자</p><p style={{ fontSize: 13, fontWeight: 600, color: '#191F28' }}>{loan.startDate}</p></div>}
                    {loan.maturityDate && <div><p style={{ fontSize: 11, color: '#8B95A1', marginBottom: 2 }}>만기일</p><p style={{ fontSize: 13, fontWeight: 600, color: '#191F28' }}>{loan.maturityDate}</p></div>}
                    {loan.rate != null && <div><p style={{ fontSize: 11, color: '#8B95A1', marginBottom: 2 }}>예상 월 이자</p><p style={{ fontSize: 13, fontWeight: 600, color: '#191F28' }}>{fmt(monthlyInterest)}원</p></div>}
                  </div>
                </div>

                <div className="neu-card" style={{ borderRadius: 20, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#191F28' }}>상환 내역</p>
                    <div className="neu-inset" style={{ display: 'flex', borderRadius: 10, padding: 3 }}>
                      {[{ val: 'desc', label: '최신순' }, { val: 'asc', label: '오래된순' }].map(opt => {
                        const sel = loanDetailSort === opt.val
                        return (
                          <button key={opt.val} onClick={() => setLoanDetailSort(opt.val)} className={sel ? 'neu-card' : ''}
                            style={{ padding: '5px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: sel ? 700 : 400, color: sel ? '#191F28' : '#8B95A1', background: sel ? undefined : 'transparent' }}>
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  {loadingRepayments ? (
                    <p style={{ fontSize: 14, color: '#8B95A1', textAlign: 'center', padding: '20px 0' }}>불러오는 중...</p>
                  ) : repayments.length === 0 ? (
                    <p style={{ fontSize: 14, color: '#8B95A1', textAlign: 'center', padding: '20px 0' }}>아직 상환 내역이 없어요</p>
                  ) : (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1.3fr', gap: 4, padding: '8px 0', borderBottom: '1.5px solid rgba(163,177,198,0.3)', marginBottom: 4 }}>
                        {['상환일자', '경과일수', '상환액', '누적 상환액'].map(h => (
                          <p key={h} style={{ fontSize: 11, fontWeight: 600, color: '#8B95A1', textAlign: h !== '상환일자' ? 'right' : 'left' }}>{h}</p>
                        ))}
                      </div>
                      {repayments.map((r, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1.3fr', gap: 4, padding: '10px 0', borderBottom: i < repayments.length - 1 ? '1px solid rgba(163,177,198,0.18)' : 'none', alignItems: 'center' }}>
                          <p style={{ fontSize: 13, color: '#191F28', fontWeight: 500 }}>{r.date}</p>
                          <p style={{ fontSize: 13, color: '#8B95A1', textAlign: 'right' }}>{r.daysElapsed != null ? `${r.daysElapsed}일` : '-'}</p>
                          <p style={{ fontSize: 13, color: '#FF5A5F', fontWeight: 600, textAlign: 'right' }}>{fmt(r.amount)}</p>
                          <p style={{ fontSize: 13, color: primary, fontWeight: 700, textAlign: 'right' }}>{fmt(r.cumulativeAmount)}</p>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                <button onClick={() => handleDeleteLoan(loan.id)} className="neu-btn"
                  style={{ width: '100%', marginTop: 16, padding: 14, borderRadius: 16, color: '#FF5A5F', fontSize: 14, fontWeight: 600 }}>
                  대출 삭제
                </button>
              </div>
            </div>
          </BottomSheet>
        )
      })()}

      {/* 카드 삭제 확인 */}
      <BottomSheet open={!!deleteConfirmCard} onClose={() => setDeleteConfirmCard(null)} blur={3} background={NEU_BG} zIndex={1000}>
        <div style={{ padding: '40px 24px calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#191F28', marginBottom: 10 }}>카드를 삭제할까요?</p>
          <p style={{ fontSize: 14, color: '#8B95A1', lineHeight: 1.65, marginBottom: 28 }}>이 카드와 연결된 정보는 유지되지만<br />카드 관리 목록에서는 제거됩니다.</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setDeleteConfirmCard(null)} className="neu-btn" style={{ flex: 1, height: 52, borderRadius: 16, color: '#191F28', fontSize: 16, fontWeight: 600 }}>취소</button>
            <button onClick={() => confirmDeleteCard(deleteConfirmCard.id)} className="neu-btn" style={{ flex: 1, height: 52, borderRadius: 16, color: '#FF5A5F', fontSize: 16, fontWeight: 700 }}>삭제</button>
          </div>
        </div>
      </BottomSheet>

      {/* Undo Snackbar */}
      <FixedPortal>
        <div style={{
          position: 'fixed', bottom: 'calc(95px + env(safe-area-inset-bottom, 0px))', left: 16, right: 16, zIndex: 900,
          transform: undoSnackbar ? 'translateY(0)' : 'translateY(120px)',
          opacity: undoSnackbar ? 1 : 0,
          transition: undoSnackbar ? 'transform 280ms cubic-bezier(0.16,1,0.3,1), opacity 220ms ease-out' : 'transform 180ms cubic-bezier(0.4,0,1,1), opacity 180ms ease-in',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#191F28', borderRadius: 16, padding: '14px 16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
          pointerEvents: undoSnackbar ? 'auto' : 'none',
        }}>
          <span style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>카드가 삭제되었습니다.</span>
          <button onClick={handleUndo} className="pressable" style={{ background: 'none', border: 'none', cursor: 'pointer', color: primary, fontSize: 14, fontWeight: 700, padding: '4px 8px', flexShrink: 0 }}>실행 취소</button>
        </div>
      </FixedPortal>
    </div>
  )
}
