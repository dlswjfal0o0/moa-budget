import BottomSheet from '../components/BottomSheet'
import FixedPortal from '../components/FixedPortal'
import LoadError from '../components/LoadError'
import YearMonthPicker from '../components/YearMonthPicker'
import SToggle from '../components/SToggle'
import { getCategoryColor } from '../styles/theme'
import { CatIcon, BackIcon, guessIconKey } from './Ledger'
import { getColoredShadow } from '../utils/neuColors'

const NEU_BG = 'var(--neu-bg)'

const formatTime = (time) => {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const period = h < 12 ? '오전' : '오후'
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${period} ${hour}:${String(m).padStart(2, '0')}`
}

const neuInputStyle = {
  width: '100%', padding: '14px 16px', borderRadius: 14,
  border: 'none', fontSize: 15, outline: 'none', color: '#191F28', boxSizing: 'border-box',
}

// 필터/카테고리/결제수단 등 곳곳에서 반복되는 알약형 선택 버튼
function NeuChip({ selected, onClick, children, activeColor, style }) {
  return (
    <button onClick={onClick} className={`neu-chip${selected ? ' selected' : ''}`}
      style={{ padding: '8px 14px', borderRadius: 9999, fontSize: 13, fontWeight: selected ? 700 : 500,
        color: selected ? (activeColor || '#191F28') : '#8B95A1', flexShrink: 0, ...style }}>
      {children}
    </button>
  )
}

export default function LedgerNeu(props) {
  const {
    themeData, loadError,
    selectionMode, exitSelectionMode, selectedIds, setSelectedIds, filtered,
    showSearch, setShowSearch, searchQuery, setSearchQuery, searchCategory, setSearchCategory,
    allSearchCategories,
    hiddenTransactions, setShowHiddenView, showHiddenView,
    period, setPeriod, setWeekOffset,
    formatWeekLabel,
    viewMonth, viewYear, setShowYMPicker, showYMPicker,
    setViewYear, setViewMonth,
    prevMonth, nextMonth,
    customStart, setCustomStart, customEnd, setCustomEnd,
    totalExpense, totalIncome, fmt,
    tab, setTab,
    sortOrder, setSortOrder,
    dateGroups, sortedDates,
    isCreditExcluded, showLoan,
    expandedMergeId, setExpandedMergeId,
    selectedSubId, setSelectedSubId,
    selectedId, setSelectedId,
    swipedId, settleRow,
    setDeleteBtnEl, setRowEl,
    handleItemPointerDown, handleItemPointerMove, handleItemPointerEnd,
    handleSelectItem,
    handleDelete, handleEdit, handleHide, handleUnhide,
    txnExitId, newTxnId,
    transactions, categories,
    setEditItem, setForm, setShowForm, showForm,
    getMergedNet, getSelectedTxns,
    showMergeModal, setShowMergeModal,
    mergeTitle, setMergeTitle, handleMerge,
    deleteConfirmTxnId, setDeleteConfirmTxnId, confirmDeleteTxn,
    mergeUndoSnackbar, handleUndoMerge,
    txnUndoSnackbar, handleUndoTxn,
    editItem, form, handleSubmit, formSaveState,
    userCardsList, userAccountsList, userPayments,
    showCardSelector, setShowCardSelector,
    showAccountSelector, setShowAccountSelector,
    showCardBilling, loans,
    isPro,
  } = props

  const primary = themeData.primary
  const coloredShadow = getColoredShadow(primary)
  const submitColor = formSaveState === 'success' ? '#22c55e' : (form.type === 'expense' ? '#FF5A5F' : form.type === 'income' ? '#2ECC71' : primary)
  const submitShadow = getColoredShadow(submitColor)
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
  const emptyForm = () => ({ type: 'expense', title: '', amount: '', category: categories.expense[0] || '기타', date: today(), time: '12:00', memo: '', payment: '카드', cardBilling: false, toAccount: '', isLoan: false, creditCardBilling: false, loanId: '', daysElapsed: '', installmentMonths: '' })

  return (
    <div className="neu-page" style={{ minHeight: '100vh', paddingBottom: 'calc(95px + env(safe-area-inset-bottom, 0px))' }}>

      {showSearch && !isPro && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(25,31,40,0.72)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
          display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 24px 0' }}>
            <button onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchCategory(null) }} aria-label="뒤로가기"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#fff' }}>
              <BackIcon />
            </button>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '0 40px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <p style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>✨ 검색은 Pro 전용 기능이에요</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>Pro를 구독하면 내역을 검색할 수 있어요</p>
          </div>
        </div>
      )}

      {loadError && (
        <div style={{ padding: '12px 20px 0' }}>
          <LoadError message={loadError} onRetry={() => window.location.reload()} />
        </div>
      )}

      {/* ── 헤더 ── */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 20px 0', borderBottom: '1px solid rgba(163,177,198,0.25)' }}>

        {selectionMode ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingTop: 2 }}>
            <button onClick={exitSelectionMode}
              style={{ background: 'none', border: 'none', fontSize: 15, color: '#191F28', cursor: 'pointer', fontWeight: 500, padding: '4px 0' }}>
              취소
            </button>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#191F28' }}>{selectedIds.size}개 선택됨</p>
            <button onClick={() => {
              if (selectedIds.size === filtered.length) setSelectedIds(new Set())
              else setSelectedIds(new Set(filtered.map(t => t.id)))
            }} style={{ background: 'none', border: 'none', fontSize: 14, color: primary, cursor: 'pointer', fontWeight: 700, padding: '4px 0' }}>
              {selectedIds.size === filtered.length ? '전체 취소' : '전체 선택'}
            </button>
          </div>
        ) : showSearch ? (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <button onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchCategory(null) }} aria-label="뒤로가기"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#191F28', flexShrink: 0 }}>
                <BackIcon />
              </button>
              <div className="neu-inset" style={{ flex: 1, display: 'flex', alignItems: 'center', borderRadius: 14, padding: '0 14px', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B95A1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  autoFocus={isPro}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="내역 검색..."
                  style={{ flex: 1, border: 'none', background: 'transparent', padding: '11px 0', fontSize: 15, outline: 'none', color: '#191F28' }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} aria-label="검색어 지우기"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8B95A1', fontSize: 18, lineHeight: 1, padding: 2 }}>×</button>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
              <NeuChip selected={searchCategory === null} onClick={() => setSearchCategory(null)} activeColor={primary}>전체</NeuChip>
              {allSearchCategories.map(cat => (
                <NeuChip key={cat} selected={searchCategory === cat} onClick={() => setSearchCategory(searchCategory === cat ? null : cat)} activeColor={primary}>{cat}</NeuChip>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#191F28' }}>가계부</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {hiddenTransactions.length > 0 && (
                <button onClick={() => setShowHiddenView(true)} className="neu-chip"
                  style={{ padding: '6px 12px', borderRadius: 9999, color: '#8B95A1', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                  숨김 {hiddenTransactions.length}건
                </button>
              )}
              <button onClick={() => setShowSearch(true)} aria-label="검색" className="neu-btn"
                style={{ width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B95A1' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {showSearch ? null : <div className="neu-inset" style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 16, marginBottom: 16 }}>
          {['주간', '월간', '직접'].map(p => {
            const sel = period === p
            return (
              <button key={p} onClick={() => { setPeriod(p); setWeekOffset(0) }}
                style={{ flex: 1, borderRadius: 12, padding: '10px 0', textAlign: 'center', border: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: sel ? 700 : 500, color: sel ? '#fff' : '#8B95A1',
                  background: sel ? primary : 'transparent', boxShadow: sel ? coloredShadow.raisedSm : 'none' }}>{p}</button>
            )
          })}
        </div>}

        {!showSearch && period === '주간' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', marginBottom: 16 }}>
            <button onClick={() => setWeekOffset(o => o-1)} aria-label="이전 주" style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#8B95A1', padding: '0 4px', lineHeight: 1 }}>‹</button>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28' }}>{formatWeekLabel()}</p>
            <button onClick={() => setWeekOffset(o => o+1)} aria-label="다음 주" style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#8B95A1', padding: '0 4px', lineHeight: 1 }}>›</button>
          </div>
        )}
        {!showSearch && period === '월간' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', marginBottom: 16 }}>
            <button onClick={prevMonth} aria-label="이전 달" style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#8B95A1', padding: '0 4px', lineHeight: 1 }}>‹</button>
            <p onClick={() => setShowYMPicker(true)} style={{ fontSize: 16, fontWeight: 700, color: '#191F28', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              {viewYear}년 {viewMonth + 1}월 <span style={{ fontSize: 13, color: '#8B95A1' }}>▾</span>
            </p>
            <button onClick={nextMonth} aria-label="다음 달" style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#8B95A1', padding: '0 4px', lineHeight: 1 }}>›</button>
          </div>
        )}
        {!showSearch && period === '직접' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input type="date" className="neu-inset" value={customStart} onChange={e => setCustomStart(e.target.value)}
              style={{ flex: 1, padding: '8px 10px', borderRadius: 16, border: 'none', fontSize: 13, outline: 'none', color: '#191F28' }} />
            <span style={{ display: 'flex', alignItems: 'center', color: '#8B95A1', fontSize: 13 }}>~</span>
            <input type="date" className="neu-inset" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
              style={{ flex: 1, padding: '8px 10px', borderRadius: 16, border: 'none', fontSize: 13, outline: 'none', color: '#191F28' }} />
          </div>
        )}

        {/* 지출 / 수입 요약 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div className="neu-inset" style={{ flex: 1, borderRadius: 20, padding: '14px 16px' }}>
            <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 4 }}>지출</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#FF5A5F' }}>-{fmt(totalExpense)}원</p>
          </div>
          <div className="neu-inset" style={{ flex: 1, borderRadius: 20, padding: '14px 16px' }}>
            <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 4 }}>수입</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#2ECC71' }}>+{fmt(totalIncome)}원</p>
          </div>
        </div>

        {/* 필터 탭 + 정렬 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['전체', '소비', '수입', '이체'].map(t => (
              <NeuChip key={t} selected={tab === t} onClick={() => setTab(t)} activeColor="#191F28"
                style={{ borderRadius: 12, padding: '7px 14px' }}>{t}</NeuChip>
            ))}
          </div>
          <button onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
            style={{ background: 'none', border: 'none', color: '#8B95A1', fontSize: 13, cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 2 }}>
            {sortOrder === 'desc' ? '↓ 최신순' : '↑ 오래된순'}
          </button>
        </div>
      </div>

      {/* ── 선택 모드 힌트 배너 ── */}
      {selectionMode && (
        <div className="neu-inset" style={{ margin: '10px 20px 2px', borderRadius: 14, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
          <p style={{ fontSize: 13, color: primary, fontWeight: 600 }}>합칠 내역을 선택하세요</p>
        </div>
      )}

      {/* ── 내역 리스트 ── */}
      <div style={{ padding: '8px 20px', paddingBottom: selectionMode ? 'calc(96px + env(safe-area-inset-bottom, 0px))' : undefined }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#8B95A1', fontSize: 15 }}>내역이 없어요</div>
        ) : (
          sortedDates.map(date => (
            <div key={date}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 10px' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#8B95A1', whiteSpace: 'nowrap' }}>
                  {date.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$2/$3')}
                </span>
                <div style={{ flex: 1, height: 1, background: 'rgba(163,177,198,0.25)' }} />
                <span style={{ fontSize: 12, whiteSpace: 'nowrap', display: 'flex', gap: 8, fontWeight: 600 }}>
                  {dateGroups[date].some(t => t.type === 'expense' && !isCreditExcluded(t) && (!showLoan || !t.isLoan)) && (
                    <span style={{ color: '#FF5A5F' }}>-{dateGroups[date].filter(t => t.type === 'expense' && !isCreditExcluded(t) && (!showLoan || !t.isLoan)).reduce((s, t) => s + t.amount, 0).toLocaleString()}원</span>
                  )}
                  {(() => {
                    const grayAmt = dateGroups[date].filter(t => t.type === 'expense' && isCreditExcluded(t)).reduce((s, t) => s + t.amount, 0)
                    return grayAmt > 0 ? <span style={{ color: '#C9CDD4' }}>-{grayAmt.toLocaleString()}원</span> : null
                  })()}
                  {dateGroups[date].some(t => t.type === 'income' && (!showLoan || !t.isLoan)) && (
                    <span style={{ color: '#2ECC71' }}>+{dateGroups[date].filter(t => t.type === 'income' && (!showLoan || !t.isLoan)).reduce((s, t) => s + t.amount, 0).toLocaleString()}원</span>
                  )}
                </span>
              </div>

              {dateGroups[date].map(t => {
                const isMerged = !!t.isMerged
                const isSelected = selectedIds.has(t.id)
                const iconKey = t.type === 'transfer' ? 'transfer' : guessIconKey(t.category || '')
                const iconColor = t.type === 'transfer' ? '#888' : isMerged ? primary : getCategoryColor(t.category || '기타')
                const isExpanded = expandedMergeId === t.id

                // ── 합산 내역 아이템 ──────────────────────────
                if (isMerged) {
                  const amtColor = t.type === 'income' ? '#2ECC71' : t.type === 'expense' ? '#FF5A5F' : '#C9CDD4'
                  const amtPrefix = t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''
                  const cardRadius = 20
                  return (
                    <div key={t.id} style={{ marginBottom: 10 }}>
                      <div style={{ position: 'relative' }}>
                        <div
                          ref={setDeleteBtnEl(t.id)}
                          onClick={() => handleDelete(t.id)}
                          style={{ position: 'absolute', right: 13, top: '50%',
                            transform: `translateY(-50%) scale(${(!selectionMode && swipedId === t.id) ? 1 : 0.5})`,
                            opacity: (!selectionMode && swipedId === t.id) ? 1 : 0,
                            pointerEvents: (!selectionMode && swipedId === t.id) ? 'auto' : 'none',
                            width: 44, height: 44, borderRadius: '50%', background: '#ef4444',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(239,68,68,0.35)' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6"/><path d="M14 11v6"/>
                          </svg>
                        </div>
                        <div
                          ref={setRowEl(t.id)}
                          onClick={() => {
                            if (selectionMode) { handleSelectItem(t.id) }
                            else { setExpandedMergeId(isExpanded ? null : t.id); setSelectedSubId(null); if (swipedId === t.id) settleRow(t.id, false) }
                          }}
                          onPointerDown={e => handleItemPointerDown(e, t)}
                          onPointerMove={handleItemPointerMove}
                          onPointerUp={handleItemPointerEnd}
                          onPointerCancel={handleItemPointerEnd}
                          className="neu-card"
                          style={{ position: 'relative', borderRadius: cardRadius, overflow: 'hidden',
                            outline: isSelected ? `2px solid ${primary}` : 'none',
                            padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', minHeight: 68,
                            transform: (!selectionMode && swipedId === t.id) ? 'translateX(-70px)' : 'translateX(0)',
                            touchAction: 'pan-y' }}>
                          {selectionMode && (
                            <div className={isSelected ? 'neu-btn' : 'neu-inset'} style={{ width: 24, height: 24, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                            </div>
                          )}
                          <div className="neu-inset" style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                            </svg>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                              <p style={{ fontSize: 14, fontWeight: 600, color: '#191F28', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                              <span style={{ fontSize: 10, fontWeight: 600, color: primary, background: primary + '15', borderRadius: 9999, padding: '2px 7px', whiteSpace: 'nowrap', flexShrink: 0 }}>합산</span>
                            </div>
                            <p style={{ fontSize: 12, color: '#8B95A1' }}>{(t.mergedItems || []).length}건 묶음 {!selectionMode && (isExpanded ? '▲' : '▼')}</p>
                          </div>
                          <p style={{ fontSize: 15, fontWeight: 700, flexShrink: 0, color: amtColor }}>
                            {t.type === 'excluded' ? '0원 (미포함)' : `${amtPrefix}${fmt(t.amount)}원`}
                          </p>
                        </div>
                      </div>
                      {!selectionMode && isExpanded && (
                        <div style={{ marginTop: 8, padding: '0 2px' }}>
                          {(t.mergedItems || []).map((item, idx) => {
                            const subKey = `${t.id}_${item.id || idx}`
                            const isSubSel = selectedSubId === subKey
                            const subIconKey = item.type === 'transfer' ? 'transfer' : guessIconKey(item.category || '')
                            const subIconColor = item.type === 'transfer' ? '#888' : getCategoryColor(item.category || '기타')
                            return (
                              <div key={subKey} className="neu-card" style={{ borderRadius: 16, overflow: 'hidden', marginBottom: idx < t.mergedItems.length - 1 ? 8 : 0 }}>
                                <div
                                  onClick={() => setSelectedSubId(isSubSel ? null : subKey)}
                                  style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', minHeight: 60 }}>
                                  <div className="neu-inset" style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CatIcon cat={subIconKey} size={18} color={subIconColor} />
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 14, fontWeight: 600, color: '#191F28', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{item.title}</p>
                                    <p style={{ fontSize: 12, color: '#8B95A1' }}>
                                      {item.time ? `${item.time} · ` : ''}{item.category || '-'}
                                    </p>
                                  </div>
                                  <p style={{ fontSize: 14, fontWeight: 700, flexShrink: 0, color: item.type === 'income' ? '#2ECC71' : '#FF5A5F' }}>
                                    {item.type === 'income' ? '+' : '-'}{item.amount?.toLocaleString()}원
                                  </p>
                                </div>
                                {isSubSel && (
                                  <div style={{ borderTop: '1px solid rgba(163,177,198,0.3)' }}>
                                    <button
                                      onClick={() => {
                                        const fullTxn = transactions.find(tx => tx.id === item.id)
                                        if (fullTxn) { handleEdit(fullTxn); setSelectedSubId(null) }
                                      }}
                                      style={{ width: '100%', padding: '13px', border: 'none', background: 'none', color: '#8B95A1', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                      </svg>
                                      수정
                                    </button>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="neu-btn"
                            style={{ width: '100%', marginTop: 8, padding: '13px', borderRadius: 16, color: '#FF5A5F', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                            합산 내역 삭제
                          </button>
                        </div>
                      )}
                    </div>
                  )
                }

                // ── 일반 내역 아이템 ──────────────────────────
                const normalCardRadius = 20
                const rowTintStyle = t.creditCardBilling ? { background: '#F5E7E7' }
                  : showLoan && t.isLoan ? (t.type === 'expense' ? { background: '#F5E7E7' } : { background: '#E7EDE9' })
                  : (t.type === 'expense' && isCreditExcluded(t)) ? { background: '#E4E8ED' }
                  : {}
                return (
                  <div key={t.id} style={{
                    marginBottom: txnExitId === t.id ? 0 : 10,
                    maxHeight: txnExitId === t.id ? 0 : 300,
                    opacity: txnExitId === t.id ? 0 : 1,
                    overflow: txnExitId === t.id ? 'hidden' : 'visible',
                    transition: txnExitId === t.id ? 'opacity 250ms ease, max-height 250ms ease, margin-bottom 250ms ease' : undefined,
                    animation: newTxnId === t.id ? 'fadeSlideUp 250ms ease forwards' : undefined }}>
                    <div style={{ position: 'relative' }}>
                      <div
                        ref={setDeleteBtnEl(t.id)}
                        onClick={() => handleDelete(t.id)}
                        style={{ position: 'absolute', right: 13, top: '50%',
                          transform: `translateY(-50%) scale(${(!selectionMode && swipedId === t.id) ? 1 : 0.5})`,
                          opacity: (!selectionMode && swipedId === t.id) ? 1 : 0,
                          pointerEvents: (!selectionMode && swipedId === t.id) ? 'auto' : 'none',
                          width: 44, height: 44, borderRadius: '50%', background: '#ef4444',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(239,68,68,0.35)' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/>
                        </svg>
                      </div>
                      <div
                        ref={setRowEl(t.id)}
                        onPointerDown={e => handleItemPointerDown(e, t)}
                        onPointerMove={handleItemPointerMove}
                        onPointerUp={handleItemPointerEnd}
                        onPointerCancel={handleItemPointerEnd}
                        onClick={() => {
                          if (selectionMode) { handleSelectItem(t.id) }
                          else { setSelectedId(selectedId === t.id ? null : t.id); if (swipedId === t.id) settleRow(t.id, false) }
                        }}
                        className="neu-card"
                        style={{ position: 'relative', borderRadius: normalCardRadius, overflow: 'hidden',
                          outline: selectionMode && isSelected ? `2px solid ${primary}` : 'none',
                          padding: '14px 16px', display: 'flex', alignItems: 'center', gap: selectionMode ? 10 : 14,
                          transform: (!selectionMode && swipedId === t.id) ? 'translateX(-70px)' : 'translateX(0)',
                          touchAction: 'pan-y', cursor: 'pointer', minHeight: 68, ...rowTintStyle }}>
                        {selectionMode && (
                          <div className={isSelected ? 'neu-btn' : 'neu-inset'} style={{ width: 24, height: 24, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                          </div>
                        )}
                        <div className="neu-inset" style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CatIcon cat={iconKey} size={20} color={iconColor} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#191F28', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                            {t.isAutoRegistered && (
                              <span style={{ fontSize: 10, fontWeight: 600, color: '#8B95A1', background: 'rgba(163,177,198,0.2)', borderRadius: 9999, padding: '2px 6px', whiteSpace: 'nowrap', flexShrink: 0 }}>자동</span>
                            )}
                          </div>
                          <p style={{ fontSize: 12, color: '#8B95A1' }}>
                            {t.type === 'transfer'
                              ? `${t.time} · ${t.payment || '-'} → ${t.toAccount || '-'}`
                              : `${t.time} · ${t.category} · ${t.payment || '현금'}`}
                          </p>
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 700, flexShrink: 0,
                          color: t.type === 'transfer' ? '#8B95A1' : t.creditCardBilling ? '#FF5A5F' : (t.type === 'expense' && isCreditExcluded(t)) ? '#C9CDD4' : (showLoan && t.isLoan) ? (t.type === 'expense' ? '#FFAEAE' : '#86EFAC') : t.type === 'expense' ? '#FF5A5F' : '#2ECC71' }}>
                          {t.type === 'transfer' ? '↔' : t.type === 'expense' ? '-' : '+'}{fmt(t.amount)}원
                        </p>
                      </div>
                    </div>

                    {!selectionMode && selectedId === t.id && (
                      <div className="neu-card" style={{ display: 'flex', borderRadius: 20, overflow: 'hidden', marginTop: 8 }}>
                        <button onClick={() => handleEdit(t)}
                          style={{ flex: 1, padding: '14px', border: 'none', background: 'none', color: '#8B95A1', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          수정
                        </button>
                        <button onClick={() => handleHide(t.id)}
                          style={{ flex: 1, padding: '14px', border: 'none', background: 'none', color: '#8B95A1', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                          숨기기
                        </button>
                        <button onClick={() => handleDelete(t.id)}
                          style={{ flex: 1, padding: '14px', border: 'none', background: 'none', color: '#FF5A5F', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>

      {/* ── FAB ── */}
      {!selectionMode && (
        <FixedPortal>
        <button onClick={() => { setEditItem(null); setForm(emptyForm()); setShowForm(true) }} aria-label="내역 추가"
          style={{ position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 105px)', right: 20, width: 56, height: 56, borderRadius: 24, background: primary, color: '#fff', border: 'none', fontSize: 28, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: coloredShadow.raised }}>+</button>
        </FixedPortal>
      )}

      {/* ── 선택 모드 하단 액션 바 ── */}
      {selectionMode && (
        <FixedPortal>
        <div className="neu-card" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, borderRadius: '20px 20px 0 0', padding: '14px 20px', paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))', zIndex: 200, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, color: '#8B95A1', marginBottom: 2 }}>선택 합산</p>
            {(() => {
              const net = getMergedNet()
              return (
                <p style={{ fontSize: 18, fontWeight: 700, color: net < 0 ? '#FF5A5F' : net > 0 ? '#2ECC71' : '#191F28' }}>
                  {net > 0 ? '+' : ''}{net.toLocaleString()}원
                </p>
              )
            })()}
          </div>
          <div style={{ flex: 1 }}>
            <button
              onClick={() => selectedIds.size >= 2 && setShowMergeModal(true)}
              className={selectedIds.size >= 2 ? undefined : 'neu-inset'}
              style={{ width: '100%', height: 52, borderRadius: 16, border: 'none', fontSize: 15, fontWeight: 700, cursor: selectedIds.size >= 2 ? 'pointer' : 'not-allowed',
                background: selectedIds.size >= 2 ? primary : undefined,
                color: selectedIds.size >= 2 ? '#fff' : '#8B95A1',
                boxShadow: selectedIds.size >= 2 ? coloredShadow.raised : 'none' }}>
              {selectedIds.size < 2 ? '2개 이상 선택하세요' : `합치기 (${selectedIds.size}개)`}
            </button>
          </div>
        </div>
        </FixedPortal>
      )}

      {/* ── 내역 추가/수정 폼 ── */}
      <BottomSheet variant="full" open={showForm} showHandle={false} background={NEU_BG}
        onClose={() => { setShowForm(false); setEditItem(null) }}>
        <div className="neu-page" style={{ '--neu-focus': primary + '59', minHeight: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 24px 16px', borderBottom: '1px solid rgba(163,177,198,0.25)', position: 'sticky', top: 0, zIndex: 10, background: NEU_BG }}>
            <button onClick={() => { setShowForm(false); setEditItem(null) }} aria-label="뒤로가기" className="pressable" style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 12, padding: 4, color: '#191F28' }}><BackIcon /></button>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#191F28' }}>{editItem ? '내역 수정' : '내역 추가'}</p>
          </div>

          <div style={{ padding: '20px 24px 80px' }}>
            {/* 지출/수입/이체 탭 */}
            <div className="neu-inset" style={{ display: 'flex', borderRadius: 16, padding: 4, marginBottom: 20 }}>
              {[
                { type: 'expense', label: '지출' },
                { type: 'income', label: '수입' },
                { type: 'transfer', label: '↔ 이체' }
              ].map(({ type, label }) => (
                <button key={type}
                  onClick={() => setForm(f => ({ ...f, type, category: type === 'expense' ? categories.expense[0] : type === 'income' ? categories.income[0] : '이체', cardBilling: false, toAccount: '' }))}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: form.type === type ? 700 : 500,
                    background: form.type === type ? (type === 'expense' ? '#FF5A5F' : type === 'income' ? '#2ECC71' : primary) : 'transparent',
                    color: form.type === type ? '#fff' : '#8B95A1',
                    boxShadow: form.type === type ? getColoredShadow(type === 'expense' ? '#FF5A5F' : type === 'income' ? '#2ECC71' : primary).raisedSm : 'none' }}>
                  {label}
                </button>
              ))}
            </div>

            {/* 금액 */}
            <div className="neu-card" style={{ borderRadius: 20, padding: '20px 24px', marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 12, fontWeight: 600 }}>금액</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0"
                  style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontSize: 38, fontWeight: 700,
                    color: form.type === 'expense' ? '#FF5A5F' : form.type === 'income' ? '#2ECC71' : '#191F28',
                    background: 'transparent', letterSpacing: '-1px' }} />
                <span style={{ fontSize: 22, fontWeight: 600, color: '#8B95A1' }}>원</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                {[1000, 5000, 10000, 50000].map(amt => (
                  <button key={amt} onClick={() => setForm(f => ({ ...f, amount: String(Number(f.amount || 0) + amt) }))} className="neu-btn"
                    style={{ flex: 1, padding: '10px 0', borderRadius: 12, color: '#191F28', fontSize: 13, fontWeight: 600 }}>
                    +{amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* 제목 */}
            <div className="neu-card" style={{ borderRadius: 20, padding: '18px 20px', marginBottom: 12 }}>
              <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 10, fontWeight: 600 }}>제목</p>
              <input style={{ width: '100%', border: 'none', outline: 'none', fontSize: 16, color: '#191F28', background: 'transparent', boxSizing: 'border-box' }}
                placeholder={form.type === 'income' ? '어디서 받았나요?' : form.type === 'transfer' ? '이체 내용을 입력하세요' : '어디에 썼나요?'} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>

            {/* 카테고리 */}
            {form.type !== 'transfer' && (
              <div className="neu-card" style={{ borderRadius: 20, padding: '18px 20px', marginBottom: 12 }}>
                <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 14, fontWeight: 600 }}>카테고리</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {categories[form.type === 'expense' ? 'expense' : 'income'].map(cat => (
                    <NeuChip key={cat} selected={form.category === cat} onClick={() => setForm(f => ({ ...f, category: cat }))} activeColor={primary}
                      style={{ borderRadius: 12, padding: '12px 4px', textAlign: 'center' }}>
                      {cat}
                    </NeuChip>
                  ))}
                </div>
              </div>
            )}

            {/* 이체 정보 */}
            {form.type === 'transfer' && (
              <div className="neu-card" style={{ borderRadius: 20, padding: '18px 20px', marginBottom: 12 }}>
                <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 10, fontWeight: 600 }}>이체 정보</p>
                <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 8, fontWeight: 600 }}>출금 계좌</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  <NeuChip selected={form.payment === '현금'} onClick={() => setForm(f => ({ ...f, payment: '현금' }))} activeColor={primary}>현금</NeuChip>
                  {userAccountsList.length > 0 ? userAccountsList.map(a => (
                    <NeuChip key={a} selected={form.payment === a} onClick={() => setForm(f => ({ ...f, payment: a }))} activeColor={primary}>{a}</NeuChip>
                  )) : (
                    <input className="neu-inset" style={neuInputStyle} placeholder="출금 계좌" value={form.payment === '카드' ? '' : form.payment}
                      onChange={e => setForm(f => ({ ...f, payment: e.target.value }))} />
                  )}
                </div>
                <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 8, fontWeight: 600 }}>입금 계좌</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <NeuChip selected={form.toAccount === '현금'} onClick={() => setForm(f => ({ ...f, toAccount: '현금' }))} activeColor={primary}>현금</NeuChip>
                  {userAccountsList.length > 0 ? userAccountsList.map(a => (
                    <NeuChip key={a} selected={form.toAccount === a} onClick={() => setForm(f => ({ ...f, toAccount: a }))} activeColor={primary}>{a}</NeuChip>
                  )) : (
                    <input className="neu-inset" style={neuInputStyle} placeholder="입금 계좌" value={form.toAccount}
                      onChange={e => setForm(f => ({ ...f, toAccount: e.target.value }))} />
                  )}
                </div>
              </div>
            )}

            {/* 결제수단 */}
            {form.type !== 'transfer' && (
              <div className="neu-card" style={{ borderRadius: 20, padding: '18px 20px', marginBottom: 12 }}>
                <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 12, fontWeight: 600 }}>결제수단</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  {userPayments.map(p => (
                    <NeuChip key={p} selected={form.payment === p} activeColor={primary}
                      onClick={() => { setForm(f => ({ ...f, payment: p })); setShowCardSelector(false); setShowAccountSelector(false) }}>{p}</NeuChip>
                  ))}
                  {userAccountsList.length > 0 ? (
                    <NeuChip selected={userAccountsList.some(a => a === form.payment)} activeColor={primary}
                      onClick={() => { setShowAccountSelector(s => !s); setShowCardSelector(false) }}>
                      {userAccountsList.some(a => a === form.payment) ? `이체 (${form.payment})` : '이체 ▾'}
                    </NeuChip>
                  ) : (
                    <NeuChip selected={form.payment === '계좌이체'} activeColor={primary}
                      onClick={() => { setForm(f => ({ ...f, payment: '계좌이체' })); setShowCardSelector(false); setShowAccountSelector(false) }}>계좌이체</NeuChip>
                  )}
                  {userCardsList.length > 0 ? (
                    <NeuChip selected={userCardsList.some(c => c.name === form.payment)} activeColor={primary}
                      onClick={() => { setShowCardSelector(s => !s); setShowAccountSelector(false) }}>
                      {userCardsList.some(c => c.name === form.payment) ? `카드 (${form.payment})` : '카드 ▾'}
                    </NeuChip>
                  ) : (
                    <NeuChip selected={form.payment === '카드'} activeColor={primary}
                      onClick={() => { setForm(f => ({ ...f, payment: '카드' })); setShowCardSelector(false); setShowAccountSelector(false) }}>카드</NeuChip>
                  )}
                </div>

                {showAccountSelector && userAccountsList.length > 0 && (
                  <div className="neu-inset" style={{ borderRadius: 16, padding: '10px 12px', marginBottom: 4 }}>
                    <p style={{ fontSize: 11, color: '#8B95A1', marginBottom: 8 }}>어떤 계좌에서 이체했나요?</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {userAccountsList.map(account => (
                        <NeuChip key={account} selected={form.payment === account} activeColor={primary}
                          onClick={() => { setForm(f => ({ ...f, payment: account })); setShowAccountSelector(false) }}>{account}</NeuChip>
                      ))}
                    </div>
                  </div>
                )}

                {showCardSelector && userCardsList.length > 0 && (
                  <div className="neu-inset" style={{ borderRadius: 16, padding: '10px 12px', marginBottom: 4 }}>
                    <p style={{ fontSize: 11, color: '#8B95A1', marginBottom: 8 }}>어떤 카드로 결제했나요?</p>
                    {userCardsList.some(c => c.cardType === 'credit') && (
                      <>
                        <p style={{ fontSize: 10, color: '#8B95A1', marginBottom: 6, fontWeight: 600 }}>신용카드</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                          {userCardsList.filter(c => c.cardType === 'credit').map(card => (
                            <NeuChip key={card.id || card.name} selected={form.payment === card.name} activeColor={primary}
                              onClick={() => { setForm(f => ({ ...f, payment: card.name })); setShowCardSelector(false) }}>{card.name}</NeuChip>
                          ))}
                        </div>
                      </>
                    )}
                    {userCardsList.some(c => c.cardType === 'debit') && (
                      <>
                        {userCardsList.some(c => c.cardType === 'credit') && <div style={{ height: 1, background: 'rgba(163,177,198,0.25)', margin: '4px 0 10px' }} />}
                        <p style={{ fontSize: 10, color: '#8B95A1', marginBottom: 6, fontWeight: 600 }}>체크카드</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                          {userCardsList.filter(c => c.cardType === 'debit').map(card => (
                            <NeuChip key={card.id || card.name} selected={form.payment === card.name} activeColor={primary}
                              onClick={() => { setForm(f => ({ ...f, payment: card.name })); setShowCardSelector(false) }}>{card.name}</NeuChip>
                          ))}
                        </div>
                      </>
                    )}
                    {userCardsList.some(c => !c.cardType) && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {userCardsList.filter(c => !c.cardType).map(card => (
                          <NeuChip key={card.id || card.name} selected={form.payment === card.name} activeColor={primary}
                            onClick={() => { setForm(f => ({ ...f, payment: card.name })); setShowCardSelector(false) }}>{card.name}</NeuChip>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 할부 개월 */}
            {form.type === 'expense' && userCardsList.some(c => c.name === form.payment && c.cardType === 'credit') && (
              <div className="neu-card" style={{ borderRadius: 20, padding: '18px 20px', marginBottom: 12 }}>
                <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 12, fontWeight: 600 }}>할부 개월</p>
                <select value={form.installmentMonths || ''} onChange={e => setForm(f => ({ ...f, installmentMonths: e.target.value }))}
                  className="neu-inset" style={neuInputStyle}>
                  <option value="">일시불</option>
                  {Array.from({ length: 35 }, (_, i) => i + 2).map(m => (
                    <option key={m} value={m}>{m}개월</option>
                  ))}
                </select>
              </div>
            )}

            {/* 신용카드 대금 납부 */}
            {form.type === 'expense' && (
              <div className="neu-card" style={{ borderRadius: 20, padding: '16px 20px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28', marginBottom: 3 }}>신용카드 대금 납부</p>
                  <p style={{ fontSize: 13, color: '#8B95A1' }}>카드 실적 제외</p>
                </div>
                <SToggle on={form.creditCardBilling || false} onChange={val => setForm(f => ({ ...f, creditCardBilling: val }))} primary={primary} />
              </div>
            )}

            {/* 체크카드 소액 신용 대금 납부 */}
            {form.type === 'expense' && showCardBilling && (
              <div className="neu-card" style={{ borderRadius: 20, padding: '16px 20px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28', marginBottom: 3 }}>체크카드 소액 신용 대금 납부</p>
                  <p style={{ fontSize: 13, color: '#8B95A1' }}>지출 합계에서 제외</p>
                </div>
                <SToggle on={form.cardBilling || false} onChange={val => setForm(f => ({ ...f, cardBilling: val }))} primary={primary} />
              </div>
            )}

            {/* 대출 / 상환 - 수입 */}
            {form.type === 'income' && showLoan && (
              <div className="neu-card" style={{ borderRadius: 20, padding: '16px 20px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28', marginBottom: 3 }}>대출 / 상환</p>
                    <p style={{ fontSize: 13, color: '#8B95A1' }}>합계에서 제외</p>
                  </div>
                  <SToggle on={form.isLoan || false} onChange={val => setForm(f => ({ ...f, isLoan: val }))} primary={primary} />
                </div>
              </div>
            )}

            {/* 대출 / 상환 - 지출 */}
            {form.type === 'expense' && showLoan && (
              <div className="neu-card" style={{ borderRadius: 20, padding: '16px 20px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28', marginBottom: 3 }}>대출 / 상환</p>
                    <p style={{ fontSize: 13, color: '#8B95A1' }}>합계에서 제외</p>
                  </div>
                  <SToggle on={form.isLoan || false} onChange={val => setForm(f => ({ ...f, isLoan: val, loanId: '', daysElapsed: '' }))} primary={primary} />
                </div>
                {form.isLoan && loans.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#8B95A1', marginBottom: 8 }}>어떤 대출의 상환인가요?</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                      {loans.map(loan => (
                        <NeuChip key={loan.id} selected={form.loanId === String(loan.id)} activeColor={primary}
                          onClick={() => setForm(f => ({ ...f, loanId: String(loan.id) }))}>{loan.name}</NeuChip>
                      ))}
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#8B95A1', marginBottom: 8 }}>경과일수 <span style={{ fontWeight: 400 }}>(선택)</span></p>
                    <input type="number" placeholder="직전 상환일로부터 경과된 일수" className="neu-inset"
                      value={form.daysElapsed} onChange={e => setForm(f => ({ ...f, daysElapsed: e.target.value }))}
                      style={neuInputStyle} />
                  </div>
                )}
                {form.isLoan && loans.length === 0 && (
                  <p style={{ fontSize: 13, color: '#8B95A1', marginTop: 10 }}>MY에서 대출을 먼저 등록해주세요</p>
                )}
              </div>
            )}

            {/* 날짜 및 시간 */}
            <div className="neu-card" style={{ borderRadius: 20, padding: '18px 20px', marginBottom: 12 }}>
              <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 12, fontWeight: 600 }}>날짜 및 시간</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <div className="neu-inset" style={{ padding: '14px 0', borderRadius: 12, textAlign: 'center', fontSize: 15, fontWeight: 600, color: '#191F28' }}>
                    {form.date ? form.date.replace(/(\d{4})-(\d{2})-(\d{2})/, '$1. $2. $3.') : '날짜'}
                  </div>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }} />
                </div>
                <div style={{ flex: 1, position: 'relative' }}>
                  <div className="neu-inset" style={{ padding: '14px 0', borderRadius: 12, textAlign: 'center', fontSize: 15, fontWeight: 600, color: '#191F28' }}>
                    {formatTime(form.time)}
                  </div>
                  <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }} />
                </div>
              </div>
            </div>

            {/* 메모 */}
            <div className="neu-card" style={{ borderRadius: 20, padding: '18px 20px', marginBottom: 24 }}>
              <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 10, fontWeight: 600 }}>메모 (선택)</p>
              <textarea value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
                placeholder="메모를 입력하세요"
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: 15, color: '#191F28', background: 'transparent', resize: 'none', height: 80, lineHeight: 1.6, boxSizing: 'border-box' }} />
            </div>

            <button onClick={handleSubmit}
              disabled={!!formSaveState}
              style={{ width: '100%', height: 56, borderRadius: 16, border: 'none',
                background: submitColor, color: '#fff', boxShadow: submitShadow.raised,
                fontSize: 16, fontWeight: 700, cursor: formSaveState ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {formSaveState === 'loading' ? (
                <>
                  <div className="spin-loader" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', flexShrink: 0 }} />
                  저장 중...
                </>
              ) : formSaveState === 'success' ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  저장 완료
                </>
              ) : (
                editItem ? '수정 완료' : '추가하기'
              )}
            </button>
          </div>
        </div>
      </BottomSheet>

      {showYMPicker && (
        <YearMonthPicker
          viewYear={viewYear}
          viewMonth={viewMonth}
          onConfirm={(y, m) => { setViewYear(y); setViewMonth(m) }}
          onClose={() => setShowYMPicker(false)}
        />
      )}

      {/* ── 숨긴 내역 보기 ── */}
      <BottomSheet variant="full" open={showHiddenView} showHandle={false} background={NEU_BG}
        onClose={() => setShowHiddenView(false)}>
        <div>
          <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 24px 16px', borderBottom: '1px solid rgba(163,177,198,0.25)', position: 'sticky', top: 0, zIndex: 10, background: NEU_BG }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button onClick={() => setShowHiddenView(false)} aria-label="뒤로가기" className="pressable" style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 12, padding: 4, color: '#191F28' }}><BackIcon /></button>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#191F28' }}>숨긴 내역</p>
              <span style={{ marginLeft: 8, fontSize: 13, color: '#8B95A1', fontWeight: 500 }}>{hiddenTransactions.length}건</span>
            </div>
          </div>

          <div style={{ padding: '16px 24px 80px' }}>
            {hiddenTransactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 0', color: '#8B95A1', fontSize: 15 }}>숨긴 내역이 없어요</div>
            ) : (
              hiddenTransactions
                .sort((a, b) => b.date.localeCompare(a.date))
                .map(t => {
                  const iconKey = t.type === 'transfer' ? 'transfer' : guessIconKey(t.category || '')
                  const iconColor = t.type === 'transfer' ? '#888' : getCategoryColor(t.category || '기타')
                  return (
                    <div key={t.id} className="neu-card" style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 10 }}>
                      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, minHeight: 68 }}>
                        <div className="neu-inset" style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CatIcon cat={iconKey} size={20} color={iconColor} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#191F28', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{t.title}</p>
                          <p style={{ fontSize: 12, color: '#8B95A1' }}>
                            {t.date} · {t.type === 'transfer' ? `${t.payment} → ${t.toAccount}` : `${t.category} · ${t.payment || '현금'}`}
                          </p>
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 700, flexShrink: 0,
                          color: t.type === 'transfer' ? '#8B95A1' : t.type === 'income' ? '#2ECC71' : '#FF5A5F' }}>
                          {t.type === 'transfer' ? '↔' : t.type === 'income' ? '+' : '-'}{fmt(t.amount)}원
                        </p>
                      </div>
                      <div className="neu-inset">
                        <button onClick={() => handleUnhide(t.id)}
                          style={{ width: '100%', padding: '13px', border: 'none', background: 'none', color: primary, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                          </svg>
                          숨김 해제
                        </button>
                      </div>
                    </div>
                  )
                })
            )}
          </div>
        </div>
      </BottomSheet>

      {/* ── 합치기 모달 ── */}
      <BottomSheet open={showMergeModal} onClose={() => setShowMergeModal(false)} blur={3} background={NEU_BG}>
        <div style={{ padding: '40px 24px calc(env(safe-area-inset-bottom, 0px) + 24px)', '--neu-focus': primary + '59' }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#191F28', marginBottom: 20 }}>내역 합치기</p>

            <div className="neu-inset" style={{ borderRadius: 16, padding: '4px 16px', marginBottom: 20 }}>
              {getSelectedTxns().map((t, idx) => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0',
                  borderBottom: idx < getSelectedTxns().length - 1 ? '1px solid rgba(163,177,198,0.25)' : 'none' }}>
                  <p style={{ fontSize: 14, color: '#191F28', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 12 }}>{t.title}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, flexShrink: 0, color: t.type === 'income' ? '#2ECC71' : '#FF5A5F' }}>
                    {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}원
                  </p>
                </div>
              ))}
              {(() => {
                const net = getMergedNet()
                return (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 0 2px' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#191F28' }}>합산</p>
                    <p style={{ fontSize: 16, fontWeight: 700, color: net < 0 ? '#FF5A5F' : net > 0 ? '#2ECC71' : '#8B95A1' }}>
                      {net > 0 ? '+' : ''}{net.toLocaleString()}원{net === 0 ? ' (미포함)' : ''}
                    </p>
                  </div>
                )
              })()}
            </div>

            <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 10, fontWeight: 600 }}>합쳐질 내역 이름</p>
            <input
              className="neu-inset"
              value={mergeTitle}
              onChange={e => setMergeTitle(e.target.value)}
              placeholder={`합산 내역 (${selectedIds.size}건)`}
              style={{ width: '100%', padding: '14px 16px', borderRadius: 16, border: 'none', fontSize: 15, outline: 'none', boxSizing: 'border-box', color: '#191F28', marginBottom: 24 }}
            />

            <button onClick={handleMerge}
              style={{ width: '100%', height: 56, borderRadius: 16, border: 'none', background: primary, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: coloredShadow.raised }}>
              확인
            </button>
        </div>
      </BottomSheet>

      {/* ── 내역 삭제 확인 ── */}
      <BottomSheet open={!!deleteConfirmTxnId} onClose={() => setDeleteConfirmTxnId(null)} blur={3} background={NEU_BG} zIndex={210}>
        <div style={{ padding: '40px 24px calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#191F28', marginBottom: 10 }}>내역을 삭제할까요?</p>
            <p style={{ fontSize: 14, color: '#8B95A1', lineHeight: 1.65, marginBottom: 28 }}>삭제 후 5초 이내에 되돌릴 수 있어요.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteConfirmTxnId(null)} className="neu-btn"
                style={{ flex: 1, height: 52, borderRadius: 16, color: '#191F28', fontSize: 16, fontWeight: 600 }}>
                취소
              </button>
              <button onClick={() => confirmDeleteTxn(deleteConfirmTxnId)}
                style={{ flex: 1, height: 52, borderRadius: 16, border: 'none', background: '#FF5A5F', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: getColoredShadow('#FF5A5F').raised }}>
                삭제
              </button>
            </div>
        </div>
      </BottomSheet>

      {/* ── 합치기 Undo Snackbar ── */}
      <FixedPortal>
      <div style={{
        position: 'fixed', bottom: 'calc(95px + env(safe-area-inset-bottom, 0px))', left: 16, right: 16, zIndex: 400,
        transform: mergeUndoSnackbar ? 'translateY(0)' : 'translateY(120px)',
        opacity: mergeUndoSnackbar ? 1 : 0,
        transition: mergeUndoSnackbar
          ? 'transform 280ms cubic-bezier(0.16,1,0.3,1), opacity 220ms ease-out'
          : 'transform 180ms cubic-bezier(0.4,0,1,1), opacity 180ms ease-in',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#191F28', borderRadius: 16, padding: '14px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
        pointerEvents: mergeUndoSnackbar ? 'auto' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>내역이 합쳐졌습니다.</span>
        </div>
        <button onClick={handleUndoMerge} className="pressable"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: primary, fontSize: 14, fontWeight: 700, padding: '4px 8px', flexShrink: 0 }}>
          되돌리기
        </button>
      </div>
      </FixedPortal>

      {/* ── Undo Snackbar ── */}
      <FixedPortal>
      <div style={{
        position: 'fixed', bottom: 'calc(95px + env(safe-area-inset-bottom, 0px))', left: 16, right: 16, zIndex: 400,
        transform: txnUndoSnackbar ? 'translateY(0)' : 'translateY(120px)',
        opacity: txnUndoSnackbar ? 1 : 0,
        transition: txnUndoSnackbar
          ? 'transform 280ms cubic-bezier(0.16,1,0.3,1), opacity 220ms ease-out'
          : 'transform 180ms cubic-bezier(0.4,0,1,1), opacity 180ms ease-in',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#191F28', borderRadius: 16, padding: '14px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
        pointerEvents: txnUndoSnackbar ? 'auto' : 'none',
      }}>
        <span style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>내역이 삭제되었습니다.</span>
        <button onClick={handleUndoTxn} className="pressable"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: primary, fontSize: 14, fontWeight: 700, padding: '4px 8px', flexShrink: 0 }}>
          실행 취소
        </button>
      </div>
      </FixedPortal>
    </div>
  )
}
