import { useTheme } from '../contexts/ThemeContext'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore'
import BottomNav from '../components/BottomNav'
import YearMonthPicker from '../components/YearMonthPicker'

export default function Calendar() {
  const { themeData, themeName } = useTheme()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [fixedExpenses, setFixedExpenses] = useState([])
  const [showAddFixed, setShowAddFixed] = useState(false)
  const [newFixed, setNewFixed] = useState({ title: '', amount: '', dueDate: '' })
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState(null)
  const [showYMPicker, setShowYMPicker] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      if (!u) navigate('/auth', { replace: true })
      else {
        setUser(u)
        const snap = await getDoc(doc(db, 'users', u.uid))
        if (snap.exists() && snap.data().fixedExpenses) setFixedExpenses(snap.data().fixedExpenses)
      }
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!user) return
    const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`
    const q = query(collection(db, 'transactions'), where('uid', '==', user.uid), where('month', '==', monthStr))
    getDocs(q).then(snap => setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [user, viewYear, viewMonth])

  const saveFixed = async (updated) => {
    setFixedExpenses(updated)
    if (user) await setDoc(doc(db, 'users', user.uid), { fixedExpenses: updated }, { merge: true })
  }

  const handleAddFixed = () => {
    if (!newFixed.title || !newFixed.amount) return
    const updated = [...fixedExpenses, { id: Date.now(), title: newFixed.title, amount: Number(newFixed.amount), dueDate: newFixed.dueDate, doneMonths: [] }]
    saveFixed(updated)
    setNewFixed({ title: '', amount: '', dueDate: '' })
    setShowAddFixed(false)
  }

  const handleToggleFixed = (id) => {
    const monthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`
    const updated = fixedExpenses.map(f => {
      if (f.id !== id) return f
      const doneMonths = f.doneMonths || []
      const isDone = doneMonths.includes(monthKey)
      return { ...f, doneMonths: isDone ? doneMonths.filter(m => m !== monthKey) : [...doneMonths, monthKey] }
    })
    saveFixed(updated)
  }

  const handleDeleteFixed = (id) => {
    const updated = fixedExpenses.filter(f => f.id !== id)
    saveFixed(updated)
  }

  const fmt = n => n.toLocaleString('ko-KR')
  const showLoan = localStorage.getItem('moa_showLoan') === 'true'
  const cards = JSON.parse(localStorage.getItem('moa_cards') || '[]')
  const isCredit = (p) => cards.some(c => c.name === p && c.cardType === 'credit')

  const byDate = transactions.reduce((acc, t) => {
    if (!acc[t.date]) acc[t.date] = { expense: 0, income: 0 }
    if (t.type === 'expense' && !t.cardBilling && !isCredit(t.payment) && (!showLoan || !t.isLoan)) acc[t.date].expense += t.amount
    else if (t.type === 'income' && (!showLoan || !t.isLoan)) acc[t.date].income += t.amount
    return acc
  }, {})

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const days = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  const totalExpense = transactions.filter(t => t.type === 'expense' && !t.cardBilling && !isCredit(t.payment) && (!showLoan || !t.isLoan)).reduce((s, t) => s + t.amount, 0)
  const totalIncome = transactions.filter(t => t.type === 'income' && (!showLoan || !t.isLoan)).reduce((s, t) => s + t.amount, 0)
  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const weekExpense = transactions.filter(t => t.type === 'expense' && !t.cardBilling && !isCredit(t.payment) && (!showLoan || !t.isLoan) && t.date >= weekAgo && t.date <= todayStr).reduce((s, t) => s + t.amount, 0)
  const weekIncome = transactions.filter(t => t.type === 'income' && (!showLoan || !t.isLoan) && t.date >= weekAgo && t.date <= todayStr).reduce((s, t) => s + t.amount, 0)
  const selectedDateStr = selectedDate ? `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(selectedDate).padStart(2,'0')}` : null
  const selectedTxs = selectedDateStr ? transactions.filter(t => t.date === selectedDateStr) : []
  const currentMonthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`
  const fixedDueDays = fixedExpenses
    .filter(f => !(f.doneMonths || []).includes(currentMonthKey))
    .map(f => f.dueDate ? parseInt(f.dueDate.split('-')[2]) : null)
    .filter(Boolean)

  // 고정지출 뱃지용 총액
  const fixedTotal = fixedExpenses.reduce((s, f) => s + f.amount, 0)

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: '1.5px solid #e8e8e8', fontSize: 14, outline: 'none',
    background: '#fafafa', color: '#111', boxSizing: 'border-box'
  }

  const sortedFixed = [...fixedExpenses].sort((a, b) => {
    const da = parseInt(a.dueDate?.split('-')[2] || '99')
    const db_ = parseInt(b.dueDate?.split('-')[2] || '99')
    return da - db_
  })

  return (
    <div style={{
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: themeData.bg
    }}>

      {/* ── 상단 고정 영역 ── */}
      <div style={{ flexShrink: 0 }}>

        {/* 캘린더 — 흰 배경 */}
        <div style={{
          background: '#fff',
          padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 20px 12px'
        }}>
          {/* 월 네비게이션 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <button onClick={() => { if (viewMonth === 0) { setViewYear(y => y-1); setViewMonth(11) } else setViewMonth(m => m-1) }}
              style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#666', padding: '4px 8px' }}>‹</button>
            <p onClick={() => setShowYMPicker(true)}
              style={{ fontSize: 18, fontWeight: 700, color: '#111', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              {viewYear}년 {viewMonth + 1}월 <span style={{ fontSize: 13, color: '#bbb' }}>▾</span>
            </p>
            <button onClick={() => { if (viewMonth === 11) { setViewYear(y => y+1); setViewMonth(0) } else setViewMonth(m => m+1) }}
              style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#666', padding: '4px 8px' }}>›</button>
          </div>

          {/* 요일 헤더 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
            {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
              <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: i === 0 ? '#ef4444' : i === 6 ? themeData.primary : '#888', padding: '2px 0' }}>{d}</div>
            ))}
          </div>

          {/* 날짜 그리드 — 셀 높이 고정 (항상 수입/지출 자리 확보) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {days.map((day, i) => {
              if (!day) return (
                <div key={`empty-${i}`} style={{ padding: '5px 2px' }}>
                  <p style={{ fontSize: 13, marginBottom: 2, visibility: 'hidden' }}>0</p>
                  <p style={{ fontSize: 8, lineHeight: 1.2, visibility: 'hidden' }}>0</p>
                  <p style={{ fontSize: 8, lineHeight: 1.2, visibility: 'hidden' }}>0</p>
                </div>
              )
              const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
              const data = byDate[dateStr]
              const isToday = dateStr === todayStr
              const isSelected = day === selectedDate
              const dow = (firstDay + day - 1) % 7
              const isFixedDay = fixedDueDays.includes(day)
              return (
                <div key={day} onClick={() => setSelectedDate(day === selectedDate ? null : day)}
                  style={{
                    padding: '5px 2px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                    background: isSelected ? '#EEF2FF' : isFixedDay ? `${themeData.primary}22` : 'transparent',
                    border: isSelected ? `1.5px solid ${themeData.primary}` : '1.5px solid transparent'
                  }}>
                  {/* 날짜 숫자 — 항상 자리 차지 */}
                  <p style={{ fontSize: 13, fontWeight: isToday ? 700 : 400, color: isToday ? themeData.primary : dow === 0 ? '#ef4444' : dow === 6 ? themeData.primary : '#111', marginBottom: 2 }}>
                    {isToday ? '●' : day}
                  </p>
                  {/* 수입 — 없어도 자리 유지 */}
                  <p style={{ fontSize: 8, color: '#22c55e', lineHeight: 1.2, visibility: data?.income > 0 ? 'visible' : 'hidden' }}>
                    +{data?.income > 0 ? data.income.toLocaleString() : '0'}
                  </p>
                  {/* 지출 — 없어도 자리 유지 */}
                  <p style={{ fontSize: 8, color: '#ef4444', lineHeight: 1.2, visibility: data?.expense > 0 ? 'visible' : 'hidden' }}>
                    -{data?.expense > 0 ? data.expense.toLocaleString() : '0'}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* 선택한 날짜 내역 */}
        {selectedDate && (
          <div style={{ background: themeData.card, margin: '12px 16px 0', borderRadius: 16, padding: '14px 16px' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 10 }}>{viewMonth + 1}월 {selectedDate}일</p>
            {selectedTxs.length === 0 ? (
              <p style={{ fontSize: 14, color: '#bbb', textAlign: 'center', padding: '8px 0' }}>내역이 없어요</p>
            ) : (
              selectedTxs.map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #f8f8f8' }}>
                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', marginRight: 8 }}>
                    <p style={{ fontSize: 14, color: '#111', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                    <p style={{ fontSize: 12, color: '#bbb' }}>{t.time} · {t.category} · {t.payment || '기타'}</p>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap', color: t.creditCardBilling ? '#ef4444' : (t.cardBilling || isCredit(t.payment)) ? '#bbb' : (showLoan && t.isLoan) ? (t.type === 'expense' ? '#fca5a5' : '#86efac') : t.type === 'expense' ? '#ef4444' : '#22c55e' }}>
                    {t.type === 'expense' ? '-' : '+'}{fmt(t.amount)}원
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* 이번 주 / 이번 달 수입·지출 요약 */}
        <div style={{ padding: '12px 16px 0' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1, background: themeData.card, borderRadius: 14, padding: '13px 14px' }}>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 3 }}>이번 주 지출</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#ef4444' }}>-{fmt(weekExpense)}원</p>
            </div>
            <div style={{ flex: 1, background: themeData.card, borderRadius: 14, padding: '13px 14px' }}>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 3 }}>이번 주 수입</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#22c55e' }}>+{fmt(weekIncome)}원</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, background: themeData.card, borderRadius: 14, padding: '13px 14px' }}>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 3 }}>{viewMonth + 1}월 지출</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#ef4444' }}>-{fmt(totalExpense)}원</p>
            </div>
            <div style={{ flex: 1, background: themeData.card, borderRadius: 14, padding: '13px 14px' }}>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 3 }}>{viewMonth + 1}월 수입</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#22c55e' }}>+{fmt(totalIncome)}원</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 고정지출 — 독립 스크롤 ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0,
        margin: '12px 16px 0',
        borderRadius: '16px 16px 0 0'
      }}>

        {/* 고정지출 헤더 — 고정 */}
        <div style={{
          flexShrink: 0,
          background: '#fff',
          borderRadius: '16px 16px 0 0',
          padding: '14px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #f5f5f5'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>고정지출</p>
            {fixedExpenses.length > 0 && (
              <span style={{
                fontSize: 12, color: '#666',
                background: '#f2f4f7',
                borderRadius: 20,
                padding: '2px 10px',
                fontWeight: 500
              }}>
                {fixedExpenses.length}개 · 월 {fmt(fixedTotal)}원
              </span>
            )}
          </div>
          <button onClick={() => setShowAddFixed(true)}
            style={{ background: themeData.primary, border: 'none', borderRadius: 8, padding: '5px 12px', color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
            + 추가
          </button>
        </div>

        {/* 고정지출 목록 — 독립 스크롤 */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          background: '#fff',
          borderRadius: '0 0 16px 16px',
          padding: '8px 14px',
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))'
        }}>
          {fixedExpenses.length === 0 && (
            <p style={{ fontSize: 14, color: '#bbb', textAlign: 'center', padding: '20px 0' }}>고정지출을 추가해보세요</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sortedFixed.map(f => {
              const dayNum = f.dueDate ? parseInt(f.dueDate.split('-')[2]) : null
              const isDone = (f.doneMonths || []).includes(currentMonthKey)
              return (
                <div key={f.id} style={{
                  background: isDone ? '#fafafa' : '#fff',
                  borderRadius: 14,
                  padding: '14px 16px',
                  border: isDone ? '1.5px solid #f0f0f0' : `1.5px solid ${themeData.primary}33`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}>
                  {/* 체크박스 */}
                  <input type="checkbox" checked={isDone} onChange={() => handleToggleFixed(f.id)}
                    style={{ width: 20, height: 20, cursor: 'pointer', accentColor: themeData.primary, flexShrink: 0 }} />
                  {/* 제목 + 날짜 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: isDone ? '#bbb' : '#111', textDecoration: isDone ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.title}
                    </p>
                    {dayNum && (
                      <p style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>매월 {dayNum}일</p>
                    )}
                  </div>
                  {/* 금액 */}
                  <p style={{ fontSize: 15, fontWeight: 700, color: isDone ? '#bbb' : '#ef4444', flexShrink: 0 }}>
                    -{fmt(f.amount)}원
                  </p>
                  {/* 삭제 */}
                  <button onClick={() => handleDeleteFixed(f.id)}
                    style={{ background: 'none', border: 'none', color: '#ccc', fontSize: 16, cursor: 'pointer', padding: 0, flexShrink: 0 }}>✕</button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 고정지출 추가 — 바텀시트 팝업 */}
      {showAddFixed && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => { setShowAddFixed(false); setNewFixed({ title: '', amount: '', dueDate: '' }) }}>
          <div
            style={{ width: '100%', background: '#fff', borderRadius: '20px 20px 0 0', padding: '20px 20px calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, borderRadius: 99, background: '#e0e0e0', margin: '0 auto 20px' }} />
            <p style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 20 }}>고정지출 추가</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <p style={{ fontSize: 13, color: '#888', marginBottom: 6, fontWeight: 500 }}>항목명</p>
                <input style={inputStyle} placeholder="예: 월세, 넷플릭스" value={newFixed.title} onChange={e => setNewFixed(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <p style={{ fontSize: 13, color: '#888', marginBottom: 6, fontWeight: 500 }}>금액</p>
                <input style={inputStyle} type="number" placeholder="0" value={newFixed.amount} onChange={e => setNewFixed(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div>
                <p style={{ fontSize: 13, color: '#888', marginBottom: 6, fontWeight: 500 }}>납부일 (선택)</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    type="number" min="1" max="31"
                    placeholder="매월 며칠? (예: 10)"
                    value={newFixed.dueDate ? parseInt(newFixed.dueDate.split('-')[2]) : ''}
                    onChange={e => {
                      const day = e.target.value
                      if (!day) { setNewFixed(f => ({ ...f, dueDate: '' })); return }
                      const d = Math.min(31, Math.max(1, parseInt(day)))
                      const n = new Date()
                      const dueDate = `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
                      setNewFixed(f => ({ ...f, dueDate }))
                    }}
                  />
                  <span style={{ fontSize: 14, color: '#888', whiteSpace: 'nowrap' }}>일</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button
                onClick={() => { setShowAddFixed(false); setNewFixed({ title: '', amount: '', dueDate: '' }) }}
                style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1.5px solid #e8e8e8', background: '#fff', cursor: 'pointer', fontSize: 15, color: '#555' }}>
                취소
              </button>
              <button
                onClick={handleAddFixed}
                style={{ flex: 2, padding: '14px', borderRadius: 12, border: 'none', background: themeData.primary, color: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>
                추가
              </button>
            </div>
          </div>
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
      <BottomNav />
    </div>
  )
}
