import YearMonthPicker from '../components/YearMonthPicker'
import LoadError from '../components/LoadError'
import LockedFeature from '../components/LockedFeature'
import { getColoredShadow } from '../utils/neuColors'

const neuInputStyle = {
  width: '100%', padding: '14px 16px', borderRadius: 14, border: 'none',
  fontSize: 15, outline: 'none', color: '#191F28', boxSizing: 'border-box',
}

function NeuChip({ selected, onClick, children, activeColor, style }) {
  return (
    <button onClick={onClick} className={`neu-chip${selected ? ' selected' : ''}`}
      style={{ padding: '8px 14px', borderRadius: 9999, fontSize: 13, fontWeight: selected ? 700 : 500,
        color: selected ? (activeColor || '#191F28') : '#8B95A1', flexShrink: 0, ...style }}>
      {children}
    </button>
  )
}

// 고정지출 추가/수정 시트 공용 폼
function FixedExpenseForm({ title, data, setData, categories, accNames, userCards, primary,
  showCardSelector, setShowCardSelector, showAccountSelector, setShowAccountSelector, onCancel, onSubmit, submitLabel }) {
  const coloredShadow = getColoredShadow(primary)
  return (
    <div className="neu-page" style={{ width: '100%', maxWidth: 430, margin: '0 auto', borderRadius: '28px 28px 0 0', maxHeight: '90dvh', display: 'flex', flexDirection: 'column', '--neu-focus': primary + '59' }}
      onClick={e => e.stopPropagation()}>
      <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
        <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(163,177,198,0.4)', margin: '0 auto 18px' }} />
        <p style={{ fontSize: 18, fontWeight: 700, color: '#191F28', marginBottom: 16 }}>{title}</p>
      </div>
      <div style={{ overflowY: 'auto', flex: 1, padding: '0 24px 8px', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 6, fontWeight: 600 }}>항목명</p>
            <input className="neu-inset" style={neuInputStyle} placeholder="예: 월세, 넷플릭스" value={data.title} onChange={e => setData(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 6, fontWeight: 600 }}>금액</p>
            <input className="neu-inset" style={neuInputStyle} type="number" placeholder="0" value={data.amount} onChange={e => setData(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <div>
            <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 6, fontWeight: 600 }}>납부일 (선택)</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input className="neu-inset" style={{ ...neuInputStyle, flex: 1 }} type="number" min="1" max="31" placeholder="매월 며칠? (예: 10)"
                value={data.dueDate ? parseInt(data.dueDate.split('-')[2]) : ''}
                onChange={e => {
                  const day = e.target.value
                  if (!day) { setData(f => ({ ...f, dueDate: '' })); return }
                  const d2 = Math.min(31, Math.max(1, parseInt(day)))
                  const n = new Date()
                  setData(f => ({ ...f, dueDate: `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(d2).padStart(2, '0')}` }))
                }} />
              <span style={{ fontSize: 14, color: '#8B95A1', whiteSpace: 'nowrap' }}>일</span>
            </div>
          </div>
          <div>
            <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 8, fontWeight: 600 }}>카테고리</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {categories.map(cat => (
                <NeuChip key={cat} selected={data.category === cat} activeColor={primary}
                  onClick={() => setData(f => ({ ...f, category: cat }))} style={{ borderRadius: 12, padding: '10px 4px', textAlign: 'center' }}>
                  {cat}
                </NeuChip>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 8, fontWeight: 600 }}>결제수단</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              <NeuChip selected={data.payment === '현금'} activeColor={primary}
                onClick={() => { setData(f => ({ ...f, payment: '현금' })); setShowCardSelector(false); setShowAccountSelector(false) }}>현금</NeuChip>
              <NeuChip selected={accNames.includes(data.payment)} activeColor={primary}
                onClick={() => { setShowAccountSelector(s => !s); setShowCardSelector(false) }}>
                {accNames.includes(data.payment) ? `이체 (${data.payment})` : '이체 ▾'}
              </NeuChip>
              <NeuChip selected={userCards.some(c => c.name === data.payment)} activeColor={primary}
                onClick={() => { setShowCardSelector(s => !s); setShowAccountSelector(false) }}>
                {userCards.some(c => c.name === data.payment) ? `카드 (${data.payment})` : '카드 ▾'}
              </NeuChip>
            </div>
            {showAccountSelector && accNames.length > 0 && (
              <div className="neu-inset" style={{ borderRadius: 16, padding: '10px 12px', marginBottom: 4 }}>
                <p style={{ fontSize: 11, color: '#8B95A1', marginBottom: 8 }}>어떤 계좌에서 이체했나요?</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {accNames.map(acc => (
                    <NeuChip key={acc} selected={data.payment === acc} activeColor={primary}
                      onClick={() => { setData(f => ({ ...f, payment: acc })); setShowAccountSelector(false) }}>{acc}</NeuChip>
                  ))}
                </div>
              </div>
            )}
            {showCardSelector && userCards.length > 0 && (
              <div className="neu-inset" style={{ borderRadius: 16, padding: '10px 12px', marginBottom: 4 }}>
                <p style={{ fontSize: 11, color: '#8B95A1', marginBottom: 8 }}>어떤 카드로 결제했나요?</p>
                {userCards.some(c => c.cardType === 'credit') && (
                  <>
                    <p style={{ fontSize: 10, color: '#8B95A1', marginBottom: 6, fontWeight: 600 }}>신용카드</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                      {userCards.filter(c => c.cardType === 'credit').map(card => (
                        <NeuChip key={card.id || card.name} selected={data.payment === card.name} activeColor={primary}
                          onClick={() => { setData(f => ({ ...f, payment: card.name })); setShowCardSelector(false) }}>{card.name}</NeuChip>
                      ))}
                    </div>
                  </>
                )}
                {userCards.some(c => c.cardType === 'debit') && (
                  <>
                    {userCards.some(c => c.cardType === 'credit') && <div style={{ height: 1, background: 'rgba(163,177,198,0.25)', margin: '4px 0 10px' }} />}
                    <p style={{ fontSize: 10, color: '#8B95A1', marginBottom: 6, fontWeight: 600 }}>체크카드</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                      {userCards.filter(c => c.cardType === 'debit').map(card => (
                        <NeuChip key={card.id || card.name} selected={data.payment === card.name} activeColor={primary}
                          onClick={() => { setData(f => ({ ...f, payment: card.name })); setShowCardSelector(false) }}>{card.name}</NeuChip>
                      ))}
                    </div>
                  </>
                )}
                {userCards.filter(c => !c.cardType).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {userCards.filter(c => !c.cardType).map(card => (
                      <NeuChip key={card.id || card.name} selected={data.payment === card.name} activeColor={primary}
                        onClick={() => { setData(f => ({ ...f, payment: card.name })); setShowCardSelector(false) }}>{card.name}</NeuChip>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="neu-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 16 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#191F28' }}>가계부 자동 등록</p>
              <p style={{ fontSize: 12, color: '#8B95A1', marginTop: 2 }}>납부일에 가계부에 자동으로 등록돼요</p>
            </div>
            <button onClick={() => setData(f => ({ ...f, autoRegister: !f.autoRegister }))} aria-label="가계부 자동 등록" aria-pressed={data.autoRegister}
              className="neu-inset" style={{ width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
              <div className="neu-card" style={{ position: 'absolute', top: 2, left: data.autoRegister ? 20 : 2, width: 22, height: 22,
                borderRadius: '50%', transition: 'left 0.2s' }}>
                {data.autoRegister && <div style={{ position: 'absolute', inset: 0, margin: 'auto', width: 8, height: 8, borderRadius: '50%', background: primary }} />}
              </div>
            </button>
          </div>
        </div>
      </div>
      <div style={{ padding: '12px 24px', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} className="neu-btn" style={{ flex: 1, height: 56, borderRadius: 16, color: '#8B95A1', fontSize: 15 }}>취소</button>
          <button onClick={onSubmit} style={{ flex: 2, height: 56, borderRadius: 16, border: 'none', background: primary, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: coloredShadow.raised }}>{submitLabel}</button>
        </div>
      </div>
    </div>
  )
}

export default function CalendarNeu(props) {
  const {
    themeData, loadError,
    isPro, setShowPaywall,
    viewYear, setViewYear, viewMonth, setViewMonth,
    showYMPicker, setShowYMPicker,
    days, firstDay, byDate, todayStr,
    selectedDate, setSelectedDate,
    fixedDueDays,
    selectedTxs, isCreditExcluded, showLoan,
    weekExpense, weekIncome, totalExpense, totalIncome,
    fmt,
    fixedExpenses, fixedTotal, sortedFixed, currentMonthKey,
    setShowAddFixed,
    expandedFixedId, setExpandedFixedId,
    handleToggleFixed, handleDeleteFixed,
    setEditingFixedId, setEditFixedData,
    editingFixedId, editFixedData, handleSaveFixed,
    showAddFixed, newFixed, setNewFixed, EMPTY_FIXED, handleAddFixed,
    categories, accNames, userCards,
    showCardSelector, setShowCardSelector,
    showAccountSelector, setShowAccountSelector,
  } = props

  const primary = themeData.primary
  const coloredShadow = getColoredShadow(primary)

  return (
    <div className="neu-page" style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {loadError && (
        <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
          <LoadError message={loadError} onRetry={() => window.location.reload()} />
        </div>
      )}

      {/* ── 고정: 캘린더 ── */}
      <div style={{ flexShrink: 0, padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 20px 12px' }}>
        <div className="neu-card" style={{ borderRadius: 24, padding: '16px 16px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <button onClick={() => { if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) } else setViewMonth(m => m - 1) }} aria-label="이전 달"
              style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#8B95A1', padding: '4px 8px' }}>‹</button>
            <p onClick={() => setShowYMPicker(true)}
              style={{ fontSize: 18, fontWeight: 700, color: '#191F28', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              {viewYear}년 {viewMonth + 1}월 <span style={{ fontSize: 13, color: '#8B95A1' }}>▾</span>
            </p>
            <button onClick={() => { if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) } else setViewMonth(m => m + 1) }} aria-label="다음 달"
              style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#8B95A1', padding: '4px 8px' }}>›</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
            {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
              <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: i === 0 ? '#FF5A5F' : i === 6 ? primary : '#8B95A1', padding: '2px 0' }}>{d}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {days.map((day, i) => {
              if (!day) return (
                <div key={`empty-${i}`} style={{ padding: '5px 2px' }}>
                  <p style={{ fontSize: 13, marginBottom: 2, visibility: 'hidden' }}>0</p>
                  <p style={{ fontSize: 8, lineHeight: 1.2, visibility: 'hidden' }}>0</p>
                  <p style={{ fontSize: 8, lineHeight: 1.2, visibility: 'hidden' }}>0</p>
                </div>
              )
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const data = byDate[dateStr]
              const isToday = dateStr === todayStr
              const isSelected = day === selectedDate
              const dow = (firstDay + day - 1) % 7
              const isFixedDay = fixedDueDays.includes(day)
              return (
                <div key={day} onClick={() => setSelectedDate(day === selectedDate ? null : day)}
                  className={isSelected ? 'neu-inset' : ''}
                  style={{
                    padding: '5px 2px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                    background: !isSelected && isFixedDay ? `${primary}18` : undefined,
                  }}>
                  <p style={{ fontSize: 13, fontWeight: isToday ? 700 : 400, color: isToday ? primary : dow === 0 ? '#FF5A5F' : dow === 6 ? primary : '#191F28', marginBottom: 2 }}>
                    {isToday ? '●' : day}
                  </p>
                  <p style={{ fontSize: 8, color: '#2ECC71', lineHeight: 1.2, visibility: data?.income > 0 ? 'visible' : 'hidden' }}>
                    +{data?.income > 0 ? data.income.toLocaleString() : '0'}
                  </p>
                  <p style={{ fontSize: 8, color: '#FF5A5F', lineHeight: 1.2, visibility: data?.expense > 0 ? 'visible' : 'hidden' }}>
                    -{data?.expense > 0 ? data.expense.toLocaleString() : '0'}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── 스크롤 영역 ── */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: 'calc(95px + env(safe-area-inset-bottom, 0px))' }}>

        {selectedDate && (
          <div className="neu-card" style={{ margin: '12px 20px 0', borderRadius: 20, padding: '14px 16px' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28', marginBottom: 16 }}>{viewMonth + 1}월 {selectedDate}일</p>
            {selectedTxs.length === 0 ? (
              <p style={{ fontSize: 14, color: '#8B95A1', textAlign: 'center', padding: '8px 0' }}>내역이 없어요</p>
            ) : (
              selectedTxs.map((t, idx) => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: idx < selectedTxs.length - 1 ? '1px solid rgba(163,177,198,0.2)' : 'none' }}>
                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', marginRight: 8 }}>
                    <p style={{ fontSize: 14, color: '#191F28', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                    <p style={{ fontSize: 12, color: '#8B95A1' }}>{t.time} · {t.category} · {t.payment || '기타'}</p>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap', color: t.creditCardBilling ? '#FF5A5F' : (t.type === 'expense' && isCreditExcluded(t)) ? '#8B95A1' : (showLoan && t.isLoan) ? (t.type === 'expense' ? '#fca5a5' : '#86efac') : t.type === 'expense' ? '#FF5A5F' : '#2ECC71' }}>
                    {t.type === 'expense' ? '-' : '+'}{fmt(t.amount)}원
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* 이번 주 / 이번 달 요약 */}
        <div style={{ padding: '12px 20px 0' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <div className="neu-inset" style={{ flex: 1, borderRadius: 20, padding: '13px 14px' }}>
              <p style={{ fontSize: 12, color: '#8B95A1', marginBottom: 3 }}>이번 주 지출</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#FF5A5F' }}>-{fmt(weekExpense)}원</p>
            </div>
            <div className="neu-inset" style={{ flex: 1, borderRadius: 20, padding: '13px 14px' }}>
              <p style={{ fontSize: 12, color: '#8B95A1', marginBottom: 3 }}>이번 주 수입</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#2ECC71' }}>+{fmt(weekIncome)}원</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="neu-inset" style={{ flex: 1, borderRadius: 20, padding: '13px 14px' }}>
              <p style={{ fontSize: 12, color: '#8B95A1', marginBottom: 3 }}>{viewMonth + 1}월 지출</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#FF5A5F' }}>-{fmt(totalExpense)}원</p>
            </div>
            <div className="neu-inset" style={{ flex: 1, borderRadius: 20, padding: '13px 14px' }}>
              <p style={{ fontSize: 12, color: '#8B95A1', marginBottom: 3 }}>{viewMonth + 1}월 수입</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#2ECC71' }}>+{fmt(totalIncome)}원</p>
            </div>
          </div>
        </div>

        {/* ── 고정지출 ── */}
        {!isPro ? (
          <div style={{ margin: '12px 20px 0' }}>
            <LockedFeature
              title="고정지출 & 다가오는 결제"
              description="반복되는 고정지출을 등록하고, 결제일 전날 알림까지 받아보세요."
              onPress={() => setShowPaywall(true)}
            />
          </div>
        ) : (
        <div style={{ margin: '12px 20px 0' }}>
          <div className="neu-card" style={{ borderRadius: 20, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28' }}>고정지출</p>
              {fixedExpenses.length > 0 && (
                <span style={{ fontSize: 11, color: '#8B95A1', background: 'rgba(163,177,198,0.2)', borderRadius: 9999, padding: '3px 9px', fontWeight: 700 }}>
                  {fixedExpenses.length}개 · 월 {fmt(fixedTotal)}원
                </span>
              )}
            </div>
            <button onClick={() => setShowAddFixed(true)} style={{ background: primary, color: '#fff', border: 'none', borderRadius: 12, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: coloredShadow.raisedSm }}>
              + 추가
            </button>
          </div>

          {fixedExpenses.length === 0 && (
            <p style={{ fontSize: 14, color: '#8B95A1', textAlign: 'center', padding: '20px 0' }}>고정지출을 추가해보세요</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sortedFixed.map(f => {
              const dayNum = f.dueDate ? parseInt(f.dueDate.split('-')[2]) : null
              const isDone = (f.doneMonths || []).includes(currentMonthKey)
              return (
                <div key={f.id}>
                  <div className="neu-card" style={{ borderRadius: 20, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                    opacity: isDone ? 0.7 : 1 }}
                    onClick={() => setExpandedFixedId(expandedFixedId === f.id ? null : f.id)}>
                    <div role="checkbox" aria-checked={isDone} aria-label={isDone ? '완료 해제' : '완료 처리'}
                      onClick={e => { e.stopPropagation(); handleToggleFixed(f.id) }}
                      className={isDone ? 'neu-btn' : 'neu-inset'}
                      style={{ width: 22, height: 22, borderRadius: 7, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isDone && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: isDone ? '#8B95A1' : '#191F28', textDecoration: isDone ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.title}
                      </p>
                      {(dayNum || f.payment) && (
                        <p style={{ fontSize: 12, color: '#8B95A1', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {[dayNum ? `매월 ${dayNum}일` : null, f.payment || null].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: isDone ? '#8B95A1' : '#FF5A5F', flexShrink: 0 }}>
                      -{fmt(f.amount)}원
                    </p>
                  </div>
                  {expandedFixedId === f.id && (
                    <div className="neu-card" style={{ display: 'flex', borderRadius: 20, overflow: 'hidden', marginTop: 8 }}>
                      <button onClick={() => {
                        setEditingFixedId(f.id)
                        setEditFixedData({ title: f.title, amount: String(f.amount), dueDate: f.dueDate || '', category: f.category || '기타', payment: f.payment || '현금', autoRegister: f.autoRegister !== false })
                        setExpandedFixedId(null)
                      }} style={{ flex: 1, padding: '14px', border: 'none', background: 'none', color: '#8B95A1', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        수정
                      </button>
                      <button onClick={() => { handleDeleteFixed(f.id); setExpandedFixedId(null) }}
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
        </div>
        )}

      </div>

      {/* 고정지출 수정 */}
      {editingFixedId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => { setEditingFixedId(null); setShowCardSelector(false); setShowAccountSelector(false) }}>
          <FixedExpenseForm
            title="고정지출 수정" data={editFixedData} setData={setEditFixedData}
            categories={categories} accNames={accNames} userCards={userCards} primary={primary}
            showCardSelector={showCardSelector} setShowCardSelector={setShowCardSelector}
            showAccountSelector={showAccountSelector} setShowAccountSelector={setShowAccountSelector}
            onCancel={() => { setEditingFixedId(null); setShowCardSelector(false); setShowAccountSelector(false) }}
            onSubmit={handleSaveFixed} submitLabel="저장"
          />
        </div>
      )}

      {/* 고정지출 추가 */}
      {showAddFixed && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => { setShowAddFixed(false); setNewFixed(EMPTY_FIXED); setShowCardSelector(false); setShowAccountSelector(false) }}>
          <FixedExpenseForm
            title="고정지출 추가" data={newFixed} setData={setNewFixed}
            categories={categories} accNames={accNames} userCards={userCards} primary={primary}
            showCardSelector={showCardSelector} setShowCardSelector={setShowCardSelector}
            showAccountSelector={showAccountSelector} setShowAccountSelector={setShowAccountSelector}
            onCancel={() => { setShowAddFixed(false); setNewFixed(EMPTY_FIXED); setShowCardSelector(false); setShowAccountSelector(false) }}
            onSubmit={handleAddFixed} submitLabel="추가"
          />
        </div>
      )}

      {showYMPicker && (
        <YearMonthPicker
          viewYear={viewYear}
          viewMonth={viewMonth}
          onConfirm={(y, m) => { setViewYear(y); setViewMonth(m) }}
          onClose={() => setShowYMPicker(false)}
        />
      )}
    </div>
  )
}
