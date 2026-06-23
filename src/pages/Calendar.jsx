import { useTheme } from '../contexts/ThemeContext'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs, doc, getDoc, setDoc, addDoc } from 'firebase/firestore'
import BottomNav from '../components/BottomNav'
import YearMonthPicker from '../components/YearMonthPicker'
import { inputStyle } from '../styles/styles'
import { DEFAULT_CATEGORIES } from '../styles/theme'
import { useCards } from '../contexts/CardsContext'

export default function Calendar() {
  const { themeData, themeName } = useTheme()
  const { cards } = useCards()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [fixedExpenses, setFixedExpenses] = useState([])
  const [showAddFixed, setShowAddFixed] = useState(false)
  const EMPTY_FIXED = { title: '', amount: '', dueDate: '', category: '기타', payment: '현금', autoRegister: true }
  const [newFixed, setNewFixed] = useState(EMPTY_FIXED)
  const [expandedFixedId, setExpandedFixedId] = useState(null)
  const [editingFixedId, setEditingFixedId] = useState(null)
  const [editFixedData, setEditFixedData] = useState(EMPTY_FIXED)
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES.expense)
  const [userAccounts, setUserAccounts] = useState([])
  const [userCards, setUserCards] = useState([])
  const [showCardSelector, setShowCardSelector] = useState(false)
  const [showAccountSelector, setShowAccountSelector] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState(null)
  const [showYMPicker, setShowYMPicker] = useState(false)

  useEffect(() => {
    const isDemo = localStorage.getItem('moa_demo_mode') === 'true'
    if (isDemo) {
      try { const a = localStorage.getItem('moa_accounts'); if (a) setUserAccounts(JSON.parse(a)) } catch {}
      try { const c = localStorage.getItem('moa_cards'); if (c) setUserCards(JSON.parse(c)) } catch {}
      const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`
      try { const t = localStorage.getItem(`moa_txns_${monthStr}`); if (t) setTransactions(JSON.parse(t)) } catch {}
      setFixedExpenses([
        { id: 1,  title: '월세',             amount: 550000, dueDate: '2026-06-05', category: '주거',        payment: '신한은행',        autoRegister: true,  doneMonths: [], autoRegisteredMonths: [] },
        { id: 2,  title: '넷플릭스',         amount: 17000,  dueDate: '2026-06-03', category: '구독',        payment: 'KB국민 신용카드', autoRegister: true,  doneMonths: [], autoRegisteredMonths: [] },
        { id: 3,  title: '헬스장',           amount: 80000,  dueDate: '2026-06-11', category: '스포츠/레저', payment: 'KB국민 신용카드', autoRegister: false, doneMonths: [], autoRegisteredMonths: [] },
        { id: 4,  title: '전세자금대출 이자', amount: 285000, dueDate: '2026-06-25', category: '금융',       payment: '신한은행',        autoRegister: true,  doneMonths: [], autoRegisteredMonths: [] },
        { id: 5,  title: '자동차 할부',       amount: 280000, dueDate: '2026-06-10', category: '교통',       payment: 'KB국민 신용카드', autoRegister: true,  doneMonths: [], autoRegisteredMonths: [] },
        { id: 6,  title: '유튜브 프리미엄',   amount: 14900,  dueDate: '2026-06-18', category: '구독',       payment: 'KB국민 신용카드', autoRegister: true,  doneMonths: [], autoRegisteredMonths: [] },
        { id: 7,  title: '실손보험',          amount: 32000,  dueDate: '2026-06-22', category: '의료/건강',  payment: '신한은행',        autoRegister: true,  doneMonths: [], autoRegisteredMonths: [] },
      ])
      return
    }
    const unsub = onAuthStateChanged(auth, async u => {
      if (!u) navigate('/auth', { replace: true })
      else {
        setUser(u)
        const snap = await getDoc(doc(db, 'users', u.uid))
        const data = snap.exists() ? snap.data() : {}

        // Load categories
        if (data.categories?.expense?.length > 0) setCategories(data.categories.expense)

        // Load cards
        if (data.cards?.length > 0) setUserCards(data.cards)

        // Load accounts (same source as MyPage: data.accounts array with `name` field)
        if (data.accounts?.length > 0) setUserAccounts(data.accounts)

        // Auto-register fixed expenses for the current real month
        const fixedList = data.fixedExpenses || []
        const nowDate = new Date()
        const todayDay = nowDate.getDate()
        const nowMonthKey = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, '0')}`
        const promises = []
        const processed = fixedList.map(f => {
          if (!f.autoRegister || !f.dueDate) return f
          const dueDay = parseInt(f.dueDate.split('-')[2])
          if (isNaN(dueDay) || todayDay < dueDay) return f
          const registeredMonths = f.autoRegisteredMonths || []
          if (registeredMonths.includes(nowMonthKey)) return f
          const dueDateStr = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`
          promises.push(addDoc(collection(db, 'transactions'), {
            uid: u.uid, month: nowMonthKey, type: 'expense',
            title: f.title, amount: f.amount,
            category: f.category || '기타', payment: f.payment || '현금',
            date: dueDateStr, time: '00:00', memo: '고정지출 자동 등록',
            isAutoRegistered: true, createdAt: new Date().toISOString()
          }))
          return { ...f, autoRegisteredMonths: [...registeredMonths, nowMonthKey] }
        })
        if (promises.length > 0) {
          await Promise.all(promises)
          await setDoc(doc(db, 'users', u.uid), { fixedExpenses: processed }, { merge: true })
          setRefreshTrigger(t => t + 1)
        }
        setFixedExpenses(processed)
      }
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!user) return
    const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`
    const q = query(collection(db, 'transactions'), where('uid', '==', user.uid), where('month', '==', monthStr))
    getDocs(q).then(snap => setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [user, viewYear, viewMonth, refreshTrigger])

  const saveFixed = async (updated) => {
    setFixedExpenses(updated)
    if (user) await setDoc(doc(db, 'users', user.uid), { fixedExpenses: updated }, { merge: true })
  }

  const handleAddFixed = () => {
    if (!newFixed.title || !newFixed.amount) return
    const updated = [...fixedExpenses, {
      id: Date.now(), title: newFixed.title, amount: Number(newFixed.amount), dueDate: newFixed.dueDate,
      category: newFixed.category || '기타', payment: newFixed.payment || '현금',
      autoRegister: newFixed.autoRegister, doneMonths: [], autoRegisteredMonths: []
    }]
    saveFixed(updated)
    setNewFixed(EMPTY_FIXED)
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

  const handleSaveFixed = () => {
    if (!editFixedData.title || !editFixedData.amount) return
    const updated = fixedExpenses.map(f => f.id === editingFixedId ? {
      ...f, title: editFixedData.title, amount: Number(editFixedData.amount), dueDate: editFixedData.dueDate,
      category: editFixedData.category || '기타', payment: editFixedData.payment || '현금',
      autoRegister: editFixedData.autoRegister
    } : f)
    saveFixed(updated)
    setEditingFixedId(null)
  }

  const fmt = n => n.toLocaleString('ko-KR')
  const accNames = userAccounts.map(a => a.name).filter(Boolean)
  const showLoan = localStorage.getItem('moa_showLoan') === 'true'
  const getCreditCard = (p) => cards.find(c => c.name === p && c.cardType === 'credit')
  const isCreditExcluded = (t) => {
    if (t.cardBilling) {
      const card = getCreditCard(t.payment)
      return card?.creditTracking !== 'billing'
    }
    const card = getCreditCard(t.payment)
    return card?.creditTracking === 'billing'
  }

  const byDate = transactions.reduce((acc, t) => {
    if (!acc[t.date]) acc[t.date] = { expense: 0, income: 0 }
    if (t.type === 'expense' && !isCreditExcluded(t) && (!showLoan || !t.isLoan)) acc[t.date].expense += t.amount
    else if (t.type === 'income' && (!showLoan || !t.isLoan)) acc[t.date].income += t.amount
    return acc
  }, {})

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const days = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  const totalExpense = transactions.filter(t => t.type === 'expense' && !isCreditExcluded(t) && (!showLoan || !t.isLoan)).reduce((s, t) => s + t.amount, 0)
  const totalIncome = transactions.filter(t => t.type === 'income' && (!showLoan || !t.isLoan)).reduce((s, t) => s + t.amount, 0)
  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const weekExpense = transactions.filter(t => t.type === 'expense' && !isCreditExcluded(t) && (!showLoan || !t.isLoan) && t.date >= weekAgo && t.date <= todayStr).reduce((s, t) => s + t.amount, 0)
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

      {/* ── 고정: 캘린더만 ── */}
      <div style={{ flexShrink: 0, background: '#fff', padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 24px 12px', borderBottom: '1px solid #F2F4F6' }}>
          {/* 월 네비게이션 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <button onClick={() => { if (viewMonth === 0) { setViewYear(y => y-1); setViewMonth(11) } else setViewMonth(m => m-1) }}
              style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#8B95A1', padding: '4px 8px' }}>‹</button>
            <p onClick={() => setShowYMPicker(true)}
              style={{ fontSize: 18, fontWeight: 700, color: '#191F28', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              {viewYear}년 {viewMonth + 1}월 <span style={{ fontSize: 13, color: '#C9CDD4' }}>▾</span>
            </p>
            <button onClick={() => { if (viewMonth === 11) { setViewYear(y => y+1); setViewMonth(0) } else setViewMonth(m => m+1) }}
              style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#8B95A1', padding: '4px 8px' }}>›</button>
          </div>

          {/* 요일 헤더 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
            {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
              <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: i === 0 ? '#FF5A5F' : i === 6 ? themeData.primary : '#8B95A1', padding: '2px 0' }}>{d}</div>
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
                    padding: '5px 2px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                    background: isSelected ? '#EEF2FF' : isFixedDay ? `${themeData.primary}22` : 'transparent',
                    border: isSelected ? `1.5px solid ${themeData.primary}` : '1.5px solid transparent'
                  }}>
                  {/* 날짜 숫자 — 항상 자리 차지 */}
                  <p style={{ fontSize: 13, fontWeight: isToday ? 700 : 400, color: isToday ? themeData.primary : dow === 0 ? '#FF5A5F' : dow === 6 ? themeData.primary : '#191F28', marginBottom: 2 }}>
                    {isToday ? '●' : day}
                  </p>
                  {/* 수입 — 없어도 자리 유지 */}
                  <p style={{ fontSize: 8, color: '#2ECC71', lineHeight: 1.2, visibility: data?.income > 0 ? 'visible' : 'hidden' }}>
                    +{data?.income > 0 ? data.income.toLocaleString() : '0'}
                  </p>
                  {/* 지출 — 없어도 자리 유지 */}
                  <p style={{ fontSize: 8, color: '#FF5A5F', lineHeight: 1.2, visibility: data?.expense > 0 ? 'visible' : 'hidden' }}>
                    -{data?.expense > 0 ? data.expense.toLocaleString() : '0'}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

      {/* ── 스크롤 영역: 날짜 내역 + 요약 + 고정지출 ── */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>

        {/* 선택한 날짜 내역 */}
        {selectedDate && (
          <div style={{ background: themeData.card, margin: '12px 16px 0', borderRadius: 20, padding: '14px 16px' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: themeData.text || '#191F28', marginBottom: 16 }}>{viewMonth + 1}월 {selectedDate}일</p>
            {selectedTxs.length === 0 ? (
              <p style={{ fontSize: 14, color: '#C9CDD4', textAlign: 'center', padding: '8px 0' }}>내역이 없어요</p>
            ) : (
              selectedTxs.map((t, idx) => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: idx < selectedTxs.length - 1 ? '1px solid #F2F4F6' : 'none' }}>
                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', marginRight: 8 }}>
                    <p style={{ fontSize: 14, color: '#191F28', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                    <p style={{ fontSize: 12, color: '#C9CDD4' }}>{t.time} · {t.category} · {t.payment || '기타'}</p>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap', color: t.creditCardBilling ? '#FF5A5F' : (t.type === 'expense' && isCreditExcluded(t)) ? '#C9CDD4' : (showLoan && t.isLoan) ? (t.type === 'expense' ? '#fca5a5' : '#86efac') : t.type === 'expense' ? '#FF5A5F' : '#2ECC71' }}>
                    {t.type === 'expense' ? '-' : '+'}{fmt(t.amount)}원
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* 이번 주 / 이번 달 수입·지출 요약 */}
        <div style={{ padding: '12px 20px 0' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1, background: themeData.card, borderRadius: 20, padding: '13px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 12, color: '#8B95A1', marginBottom: 3 }}>이번 주 지출</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#FF5A5F' }}>-{fmt(weekExpense)}원</p>
            </div>
            <div style={{ flex: 1, background: themeData.card, borderRadius: 20, padding: '13px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 12, color: '#8B95A1', marginBottom: 3 }}>이번 주 수입</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#2ECC71' }}>+{fmt(weekIncome)}원</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, background: themeData.card, borderRadius: 20, padding: '13px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 12, color: '#8B95A1', marginBottom: 3 }}>{viewMonth + 1}월 지출</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#FF5A5F' }}>-{fmt(totalExpense)}원</p>
            </div>
            <div style={{ flex: 1, background: themeData.card, borderRadius: 20, padding: '13px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 12, color: '#8B95A1', marginBottom: 3 }}>{viewMonth + 1}월 수입</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#2ECC71' }}>+{fmt(totalIncome)}원</p>
            </div>
          </div>
        </div>

        {/* ── 고정지출 ── */}
        <div style={{ margin: '12px 16px 0', borderRadius: 20, overflow: 'hidden' }}>

          {/* 고정지출 헤더 */}
          <div style={{
            background: '#fff',
            padding: '14px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #F2F4F6'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: themeData.text || '#191F28' }}>고정지출</p>
              {fixedExpenses.length > 0 && (
                <span style={{ fontSize: 11, color: '#8B95A1', background: '#F2F4F6', borderRadius: 9999, padding: '3px 9px', fontWeight: 700 }}>
                  {fixedExpenses.length}개 · 월 {fmt(fixedTotal)}원
                </span>
              )}
            </div>
            <button onClick={() => setShowAddFixed(true)}
              style={{ background: themeData.primary, border: 'none', borderRadius: 12, padding: '7px 16px', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
              + 추가
            </button>
          </div>

          {/* 고정지출 목록 */}
          <div style={{ background: '#fff', padding: '8px 14px 14px' }}>
            {fixedExpenses.length === 0 && (
              <p style={{ fontSize: 14, color: '#C9CDD4', textAlign: 'center', padding: '20px 0' }}>고정지출을 추가해보세요</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sortedFixed.map(f => {
                const dayNum = f.dueDate ? parseInt(f.dueDate.split('-')[2]) : null
                const isDone = (f.doneMonths || []).includes(currentMonthKey)
                return (
                  <div key={f.id} style={{ borderRadius: 20, border: isDone ? `1.5px solid #F2F4F6` : `1.5px solid ${themeData.primary}33`, overflow: 'hidden', background: isDone ? '#F7F8FA' : '#fff' }}>
                    <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                      onClick={() => setExpandedFixedId(expandedFixedId === f.id ? null : f.id)}>
                      <input type="checkbox" checked={isDone} onChange={e => { e.stopPropagation(); handleToggleFixed(f.id) }}
                        style={{ width: 20, height: 20, cursor: 'pointer', accentColor: themeData.primary, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: isDone ? '#C9CDD4' : '#191F28', textDecoration: isDone ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {f.title}
                        </p>
                        {dayNum && <p style={{ fontSize: 12, color: '#8B95A1', marginTop: 2 }}>매월 {dayNum}일</p>}
                      </div>
                      <p style={{ fontSize: 15, fontWeight: 700, color: isDone ? '#C9CDD4' : '#FF5A5F', flexShrink: 0 }}>
                        -{fmt(f.amount)}원
                      </p>
                    </div>
                    {expandedFixedId === f.id && (
                      <div style={{ display: 'flex', borderTop: '1px solid #F2F4F6' }}>
                        <button onClick={() => {
                          setEditingFixedId(f.id)
                          setEditFixedData({ title: f.title, amount: String(f.amount), dueDate: f.dueDate || '', category: f.category || '기타', payment: f.payment || '현금', autoRegister: f.autoRegister !== false })
                          setExpandedFixedId(null)
                        }} style={{ flex: 1, padding: '14px', border: 'none', background: isDone ? '#F7F8FA' : '#fff', color: '#8B95A1', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          수정
                        </button>
                        <div style={{ width: 1, background: '#F2F4F6' }} />
                        <button onClick={() => { handleDeleteFixed(f.id); setExpandedFixedId(null) }}
                          style={{ flex: 1, padding: '14px', border: 'none', background: isDone ? '#F7F8FA' : '#fff', color: '#FF5A5F', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      </div>{/* ── 스크롤 영역 끝 ── */}

      {/* ── 결제수단 드롭다운 helper (edit/add 공용) ── */}
      {/* 고정지출 수정 — 바텀시트 */}
      {editingFixedId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => { setEditingFixedId(null); setShowCardSelector(false); setShowAccountSelector(false) }}>
          <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: '#fff', borderRadius: '28px 28px 0 0', maxHeight: '90dvh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}>
            {/* 고정 헤더 */}
            <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: '#E5E8EB', margin: '0 auto 18px' }} />
              <p style={{ fontSize: 18, fontWeight: 700, color: '#191F28', marginBottom: 16 }}>고정지출 수정</p>
            </div>
            {/* 스크롤 영역 */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '0 24px 8px', WebkitOverflowScrolling: 'touch' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 6, fontWeight: 600 }}>항목명</p>
                  <input style={inputStyle} placeholder="예: 월세, 넷플릭스" value={editFixedData.title} onChange={e => setEditFixedData(d => ({ ...d, title: e.target.value }))} />
                </div>
                <div>
                  <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 6, fontWeight: 600 }}>금액</p>
                  <input style={inputStyle} type="number" placeholder="0" value={editFixedData.amount} onChange={e => setEditFixedData(d => ({ ...d, amount: e.target.value }))} />
                </div>
                <div>
                  <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 6, fontWeight: 600 }}>납부일 (선택)</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input style={{ ...inputStyle, flex: 1 }} type="number" min="1" max="31" placeholder="매월 며칠? (예: 10)"
                      value={editFixedData.dueDate ? parseInt(editFixedData.dueDate.split('-')[2]) : ''}
                      onChange={e => {
                        const day = e.target.value
                        if (!day) { setEditFixedData(d => ({ ...d, dueDate: '' })); return }
                        const d2 = Math.min(31, Math.max(1, parseInt(day)))
                        const n = new Date()
                        setEditFixedData(d => ({ ...d, dueDate: `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(d2).padStart(2,'0')}` }))
                      }} />
                    <span style={{ fontSize: 14, color: '#8B95A1', whiteSpace: 'nowrap' }}>일</span>
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 8, fontWeight: 600 }}>카테고리</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {categories.map(cat => (
                      <button key={cat} onClick={() => setEditFixedData(d => ({ ...d, category: cat }))}
                        style={{ padding: '10px 4px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 13,
                          background: editFixedData.category === cat ? themeData.primary : '#F2F4F6',
                          color: editFixedData.category === cat ? '#fff' : '#191F28',
                          fontWeight: editFixedData.category === cat ? 700 : 500, textAlign: 'center' }}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                {/* 결제수단 — 가계부와 동일 */}
                <div>
                  <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 8, fontWeight: 600 }}>결제수단</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                    <button onClick={() => { setEditFixedData(d => ({ ...d, payment: '현금' })); setShowCardSelector(false); setShowAccountSelector(false) }}
                      style={{ padding: '8px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer', fontSize: 13,
                        background: editFixedData.payment === '현금' ? themeData.primary : '#F2F4F6',
                        color: editFixedData.payment === '현금' ? '#fff' : '#8B95A1' }}>현금</button>
                    <button onClick={() => { setShowAccountSelector(s => !s); setShowCardSelector(false) }}
                      style={{ padding: '8px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer', fontSize: 13,
                        background: accNames.includes(editFixedData.payment) ? themeData.primary : '#F2F4F6',
                        color: accNames.includes(editFixedData.payment) ? '#fff' : '#8B95A1' }}>
                      {accNames.includes(editFixedData.payment) ? `이체 (${editFixedData.payment})` : '이체 ▾'}
                    </button>
                    <button onClick={() => { setShowCardSelector(s => !s); setShowAccountSelector(false) }}
                      style={{ padding: '8px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer', fontSize: 13,
                        background: userCards.some(c => c.name === editFixedData.payment) ? themeData.primary : '#F2F4F6',
                        color: userCards.some(c => c.name === editFixedData.payment) ? '#fff' : '#8B95A1' }}>
                      {userCards.some(c => c.name === editFixedData.payment) ? `카드 (${editFixedData.payment})` : '카드 ▾'}
                    </button>
                  </div>
                  {showAccountSelector && accNames.length > 0 && (
                    <div style={{ background: '#F8F8F8', borderRadius: 16, padding: '10px 12px', marginBottom: 4 }}>
                      <p style={{ fontSize: 11, color: '#aaa', marginBottom: 8 }}>어떤 계좌에서 이체했나요?</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {accNames.map(acc => (
                          <button key={acc} onClick={() => { setEditFixedData(d => ({ ...d, payment: acc })); setShowAccountSelector(false) }}
                            style={{ padding: '8px 14px', borderRadius: 9999, border: `1px solid ${editFixedData.payment === acc ? 'transparent' : '#E8E8E8'}`, cursor: 'pointer', fontSize: 13,
                              background: editFixedData.payment === acc ? themeData.primary : '#fff',
                              color: editFixedData.payment === acc ? '#fff' : '#555' }}>{acc}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {showCardSelector && userCards.length > 0 && (
                    <div style={{ background: '#F8F8F8', borderRadius: 16, padding: '10px 12px', marginBottom: 4 }}>
                      <p style={{ fontSize: 11, color: '#aaa', marginBottom: 8 }}>어떤 카드로 결제했나요?</p>
                      {userCards.some(c => c.cardType === 'credit') && (
                        <>
                          <p style={{ fontSize: 10, color: '#bbb', marginBottom: 6, fontWeight: 600 }}>신용카드</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                            {userCards.filter(c => c.cardType === 'credit').map(card => (
                              <button key={card.id || card.name} onClick={() => { setEditFixedData(d => ({ ...d, payment: card.name })); setShowCardSelector(false) }}
                                style={{ padding: '8px 14px', borderRadius: 9999, border: `1px solid ${editFixedData.payment === card.name ? 'transparent' : '#E8E8E8'}`, cursor: 'pointer', fontSize: 13,
                                  background: editFixedData.payment === card.name ? themeData.primary : '#fff',
                                  color: editFixedData.payment === card.name ? '#fff' : '#555' }}>{card.name}</button>
                            ))}
                          </div>
                        </>
                      )}
                      {userCards.some(c => c.cardType === 'debit') && (
                        <>
                          {userCards.some(c => c.cardType === 'credit') && <div style={{ height: 1, background: '#E0E0E0', margin: '4px 0 10px' }} />}
                          <p style={{ fontSize: 10, color: '#bbb', marginBottom: 6, fontWeight: 600 }}>체크카드</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                            {userCards.filter(c => c.cardType === 'debit').map(card => (
                              <button key={card.id || card.name} onClick={() => { setEditFixedData(d => ({ ...d, payment: card.name })); setShowCardSelector(false) }}
                                style={{ padding: '8px 14px', borderRadius: 9999, border: `1px solid ${editFixedData.payment === card.name ? 'transparent' : '#E8E8E8'}`, cursor: 'pointer', fontSize: 13,
                                  background: editFixedData.payment === card.name ? themeData.primary : '#fff',
                                  color: editFixedData.payment === card.name ? '#fff' : '#555' }}>{card.name}</button>
                            ))}
                          </div>
                        </>
                      )}
                      {userCards.filter(c => !c.cardType).length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {userCards.filter(c => !c.cardType).map(card => (
                            <button key={card.id || card.name} onClick={() => { setEditFixedData(d => ({ ...d, payment: card.name })); setShowCardSelector(false) }}
                              style={{ padding: '8px 14px', borderRadius: 9999, border: `1px solid ${editFixedData.payment === card.name ? 'transparent' : '#E8E8E8'}`, cursor: 'pointer', fontSize: 13,
                                background: editFixedData.payment === card.name ? themeData.primary : '#fff',
                                color: editFixedData.payment === card.name ? '#fff' : '#555' }}>{card.name}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* 가계부 자동 등록 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderTop: '1px solid #F2F4F6' }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#191F28' }}>가계부 자동 등록</p>
                    <p style={{ fontSize: 12, color: '#8B95A1', marginTop: 2 }}>납부일에 가계부에 자동으로 등록돼요</p>
                  </div>
                  <button onClick={() => setEditFixedData(d => ({ ...d, autoRegister: !d.autoRegister }))}
                    style={{ width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                      background: editFixedData.autoRegister ? themeData.primary : '#E5E8EB', transition: 'background 0.2s',
                      position: 'relative', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 3, left: editFixedData.autoRegister ? 21 : 3, width: 20, height: 20,
                      borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </button>
                </div>
              </div>
            </div>
            {/* 고정 푸터 */}
            <div style={{ padding: '12px 24px', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)', flexShrink: 0, borderTop: '1px solid #F2F4F6' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setEditingFixedId(null); setShowCardSelector(false); setShowAccountSelector(false) }}
                  style={{ flex: 1, height: 56, borderRadius: 16, border: '1.5px solid #E5E8EB', background: '#fff', cursor: 'pointer', fontSize: 15, color: '#8B95A1' }}>취소</button>
                <button onClick={handleSaveFixed}
                  style={{ flex: 2, height: 56, borderRadius: 16, border: 'none', background: themeData.primary, color: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>저장</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 고정지출 추가 — 바텀시트 팝업 */}
      {showAddFixed && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => { setShowAddFixed(false); setNewFixed(EMPTY_FIXED); setShowCardSelector(false); setShowAccountSelector(false) }}>
          <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: '#fff', borderRadius: '28px 28px 0 0', maxHeight: '90dvh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}>
            {/* 고정 헤더 */}
            <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: '#E5E8EB', margin: '0 auto 18px' }} />
              <p style={{ fontSize: 18, fontWeight: 700, color: '#191F28', marginBottom: 16 }}>고정지출 추가</p>
            </div>
            {/* 스크롤 영역 */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '0 24px 8px', WebkitOverflowScrolling: 'touch' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 6, fontWeight: 600 }}>항목명</p>
                  <input style={inputStyle} placeholder="예: 월세, 넷플릭스" value={newFixed.title} onChange={e => setNewFixed(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div>
                  <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 6, fontWeight: 600 }}>금액</p>
                  <input style={inputStyle} type="number" placeholder="0" value={newFixed.amount} onChange={e => setNewFixed(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 6, fontWeight: 600 }}>납부일 (선택)</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input style={{ ...inputStyle, flex: 1 }} type="number" min="1" max="31" placeholder="매월 며칠? (예: 10)"
                      value={newFixed.dueDate ? parseInt(newFixed.dueDate.split('-')[2]) : ''}
                      onChange={e => {
                        const day = e.target.value
                        if (!day) { setNewFixed(f => ({ ...f, dueDate: '' })); return }
                        const d = Math.min(31, Math.max(1, parseInt(day)))
                        const n = new Date()
                        setNewFixed(f => ({ ...f, dueDate: `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}` }))
                      }} />
                    <span style={{ fontSize: 14, color: '#8B95A1', whiteSpace: 'nowrap' }}>일</span>
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 8, fontWeight: 600 }}>카테고리</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {categories.map(cat => (
                      <button key={cat} onClick={() => setNewFixed(f => ({ ...f, category: cat }))}
                        style={{ padding: '10px 4px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 13,
                          background: newFixed.category === cat ? themeData.primary : '#F2F4F6',
                          color: newFixed.category === cat ? '#fff' : '#191F28',
                          fontWeight: newFixed.category === cat ? 700 : 500, textAlign: 'center' }}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                {/* 결제수단 — 가계부와 동일 */}
                <div>
                  <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 8, fontWeight: 600 }}>결제수단</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                    <button onClick={() => { setNewFixed(f => ({ ...f, payment: '현금' })); setShowCardSelector(false); setShowAccountSelector(false) }}
                      style={{ padding: '8px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer', fontSize: 13,
                        background: newFixed.payment === '현금' ? themeData.primary : '#F2F4F6',
                        color: newFixed.payment === '현금' ? '#fff' : '#8B95A1' }}>현금</button>
                    <button onClick={() => { setShowAccountSelector(s => !s); setShowCardSelector(false) }}
                      style={{ padding: '8px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer', fontSize: 13,
                        background: accNames.includes(newFixed.payment) ? themeData.primary : '#F2F4F6',
                        color: accNames.includes(newFixed.payment) ? '#fff' : '#8B95A1' }}>
                      {accNames.includes(newFixed.payment) ? `이체 (${newFixed.payment})` : '이체 ▾'}
                    </button>
                    <button onClick={() => { setShowCardSelector(s => !s); setShowAccountSelector(false) }}
                      style={{ padding: '8px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer', fontSize: 13,
                        background: userCards.some(c => c.name === newFixed.payment) ? themeData.primary : '#F2F4F6',
                        color: userCards.some(c => c.name === newFixed.payment) ? '#fff' : '#8B95A1' }}>
                      {userCards.some(c => c.name === newFixed.payment) ? `카드 (${newFixed.payment})` : '카드 ▾'}
                    </button>
                  </div>
                  {showAccountSelector && accNames.length > 0 && (
                    <div style={{ background: '#F8F8F8', borderRadius: 16, padding: '10px 12px', marginBottom: 4 }}>
                      <p style={{ fontSize: 11, color: '#aaa', marginBottom: 8 }}>어떤 계좌에서 이체했나요?</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {accNames.map(acc => (
                          <button key={acc} onClick={() => { setNewFixed(f => ({ ...f, payment: acc })); setShowAccountSelector(false) }}
                            style={{ padding: '8px 14px', borderRadius: 9999, border: `1px solid ${newFixed.payment === acc ? 'transparent' : '#E8E8E8'}`, cursor: 'pointer', fontSize: 13,
                              background: newFixed.payment === acc ? themeData.primary : '#fff',
                              color: newFixed.payment === acc ? '#fff' : '#555' }}>{acc}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {showCardSelector && userCards.length > 0 && (
                    <div style={{ background: '#F8F8F8', borderRadius: 16, padding: '10px 12px', marginBottom: 4 }}>
                      <p style={{ fontSize: 11, color: '#aaa', marginBottom: 8 }}>어떤 카드로 결제했나요?</p>
                      {userCards.some(c => c.cardType === 'credit') && (
                        <>
                          <p style={{ fontSize: 10, color: '#bbb', marginBottom: 6, fontWeight: 600 }}>신용카드</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                            {userCards.filter(c => c.cardType === 'credit').map(card => (
                              <button key={card.id || card.name} onClick={() => { setNewFixed(f => ({ ...f, payment: card.name })); setShowCardSelector(false) }}
                                style={{ padding: '8px 14px', borderRadius: 9999, border: `1px solid ${newFixed.payment === card.name ? 'transparent' : '#E8E8E8'}`, cursor: 'pointer', fontSize: 13,
                                  background: newFixed.payment === card.name ? themeData.primary : '#fff',
                                  color: newFixed.payment === card.name ? '#fff' : '#555' }}>{card.name}</button>
                            ))}
                          </div>
                        </>
                      )}
                      {userCards.some(c => c.cardType === 'debit') && (
                        <>
                          {userCards.some(c => c.cardType === 'credit') && <div style={{ height: 1, background: '#E0E0E0', margin: '4px 0 10px' }} />}
                          <p style={{ fontSize: 10, color: '#bbb', marginBottom: 6, fontWeight: 600 }}>체크카드</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                            {userCards.filter(c => c.cardType === 'debit').map(card => (
                              <button key={card.id || card.name} onClick={() => { setNewFixed(f => ({ ...f, payment: card.name })); setShowCardSelector(false) }}
                                style={{ padding: '8px 14px', borderRadius: 9999, border: `1px solid ${newFixed.payment === card.name ? 'transparent' : '#E8E8E8'}`, cursor: 'pointer', fontSize: 13,
                                  background: newFixed.payment === card.name ? themeData.primary : '#fff',
                                  color: newFixed.payment === card.name ? '#fff' : '#555' }}>{card.name}</button>
                            ))}
                          </div>
                        </>
                      )}
                      {userCards.filter(c => !c.cardType).length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {userCards.filter(c => !c.cardType).map(card => (
                            <button key={card.id || card.name} onClick={() => { setNewFixed(f => ({ ...f, payment: card.name })); setShowCardSelector(false) }}
                              style={{ padding: '8px 14px', borderRadius: 9999, border: `1px solid ${newFixed.payment === card.name ? 'transparent' : '#E8E8E8'}`, cursor: 'pointer', fontSize: 13,
                                background: newFixed.payment === card.name ? themeData.primary : '#fff',
                                color: newFixed.payment === card.name ? '#fff' : '#555' }}>{card.name}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* 가계부 자동 등록 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderTop: '1px solid #F2F4F6' }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#191F28' }}>가계부 자동 등록</p>
                    <p style={{ fontSize: 12, color: '#8B95A1', marginTop: 2 }}>납부일에 가계부에 자동으로 등록돼요</p>
                  </div>
                  <button onClick={() => setNewFixed(f => ({ ...f, autoRegister: !f.autoRegister }))}
                    style={{ width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                      background: newFixed.autoRegister ? themeData.primary : '#E5E8EB', transition: 'background 0.2s',
                      position: 'relative', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 3, left: newFixed.autoRegister ? 21 : 3, width: 20, height: 20,
                      borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </button>
                </div>
              </div>
            </div>
            {/* 고정 푸터 */}
            <div style={{ padding: '12px 24px', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)', flexShrink: 0, borderTop: '1px solid #F2F4F6' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setShowAddFixed(false); setNewFixed(EMPTY_FIXED); setShowCardSelector(false); setShowAccountSelector(false) }}
                  style={{ flex: 1, height: 56, borderRadius: 16, border: '1.5px solid #E5E8EB', background: '#fff', cursor: 'pointer', fontSize: 15, color: '#8B95A1' }}>취소</button>
                <button onClick={handleAddFixed}
                  style={{ flex: 2, height: 56, borderRadius: 16, border: 'none', background: themeData.primary, color: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>추가</button>
              </div>
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
