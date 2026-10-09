import { useTheme } from '../contexts/ThemeContext'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs, doc, getDoc, setDoc, addDoc, deleteDoc } from 'firebase/firestore'
import LoadError from '../components/LoadError'
import AmountInput from '../components/AmountInput'
import YearMonthPicker from '../components/YearMonthPicker'
import LockedFeature from '../components/LockedFeature'
import PaywallModal from '../components/PaywallModal'
import { inputStyle } from '../styles/styles'
import { DEFAULT_CATEGORIES } from '../styles/theme'
import { useCards } from '../contexts/CardsContext'
import { useSettings } from '../contexts/SettingsContext'
import { useIsPro } from '../contexts/PurchasesContext'
import { syncPaymentNotifications } from '../utils/paymentNotifications'
import { FIXED_AUTO_REGISTERED_EVENT } from '../utils/autoRegisterFixed'
import { toMonthKey, resolveFixedForMonth, fixedListForMonth, createFixed, editFixedFromMonth, deleteFixedFromMonth } from '../utils/fixedExpenses'
import CalendarNeu from './CalendarNeu'
import FitText from '../components/FitText'

export default function Calendar() {
  const { themeData, neumorphism } = useTheme()
  const { cards } = useCards()
  const settings = useSettings()
  const isPro = useIsPro()
  const [showPaywall, setShowPaywall] = useState(false)
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
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    const isDemo = localStorage.getItem('moa_demo_mode') === 'true'
    if (isDemo) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      try { const a = localStorage.getItem('moa_accounts'); if (a) setUserAccounts(JSON.parse(a)) } catch { /* ignore */ }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      try { const c = localStorage.getItem('moa_cards'); if (c) setUserCards(JSON.parse(c)) } catch { /* ignore */ }
      // 거래 내역은 아래 데모 전용 effect가 월별로 불러온다
      // eslint-disable-next-line react-hooks/set-state-in-effect
      try { const f = localStorage.getItem('moa_fixed_expenses'); setFixedExpenses(f ? JSON.parse(f) : []) } catch { setFixedExpenses([]) }
      return
    }
    const unsub = onAuthStateChanged(auth, async u => {
      if (!u) {
        // 세션 복원이 아직 안 끝난 상태에서 첫 콜백이 null로 먼저 올 수 있다 —
        // 실제로 로그아웃된 게 맞는지 authStateReady()로 한 번 더 확인한다.
        await auth.authStateReady()
        u = auth.currentUser
      }
      if (!u) navigate('/auth', { replace: true })
      else {
        setUser(u)
        try {
          const snap = await getDoc(doc(db, 'users', u.uid))
          const data = snap.exists() ? snap.data() : {}

          // Load categories
          if (data.categories?.expense?.length > 0) setCategories(data.categories.expense)

          // Load cards
          if (data.cards?.length > 0) setUserCards(data.cards)

          // Load accounts (same source as MyPage: data.accounts array with `name` field)
          if (data.accounts?.length > 0) setUserAccounts(data.accounts)

          // 결제일 자동 등록은 앱 전체에서 FixedExpenseAutoRegister가 처리한다(끝나면 아래 이벤트로 다시 읽음)
          setFixedExpenses(data.fixedExpenses || [])
        } catch (err) {
          console.error('[Calendar] 사용자 데이터 로딩 실패', err)
          setLoadError('데이터를 불러오지 못했어요.')
        }
      }
    })
    return unsub
  }, [])

  // 자동 등록이 끝나면 체크 상태(고정지출)와 거래를 다시 읽는다 — 오래된 목록으로 저장해 등록 기록을 덮어쓰지 않도록
  useEffect(() => {
    if (!user) return
    const reload = () => {
      getDoc(doc(db, 'users', user.uid))
        .then(snap => { setFixedExpenses(snap.exists() ? snap.data().fixedExpenses || [] : []) })
        .catch(err => console.error('[Calendar] 고정지출 다시 읽기 실패', err))
      setRefreshTrigger(t => t + 1)
    }
    window.addEventListener(FIXED_AUTO_REGISTERED_EVENT, reload)
    return () => window.removeEventListener(FIXED_AUTO_REGISTERED_EVENT, reload)
  }, [user])

  useEffect(() => {
    if (!user) return
    const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`
    const q = query(collection(db, 'transactions'), where('uid', '==', user.uid), where('month', '==', monthStr))
    getDocs(q).then(snap => setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(err => {
        console.error('[Calendar] 거래내역 로딩 실패', err)
        setLoadError('거래내역을 불러오지 못했어요.')
      })
  }, [user, viewYear, viewMonth, refreshTrigger])

  // 데모 모드는 user가 없어 위 effect가 돌지 않으므로, 보고 있는 달의 로컬 시드 거래를 읽는다(월 이동·고정지출 체크 시 다시 읽음)
  useEffect(() => {
    if (localStorage.getItem('moa_demo_mode') !== 'true') return
    const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try { setTransactions(JSON.parse(localStorage.getItem(`moa_txns_${monthStr}`) || '[]')) } catch { setTransactions([]) }
  }, [viewYear, viewMonth, refreshTrigger])

  useEffect(() => {
    syncPaymentNotifications({
      fixedExpenses,
      settings: {
        notifyPaymentEnabled: settings?.notifyPaymentEnabled,
        notifyPaymentTime: settings?.notifyPaymentTime,
        notifyNightConsent: settings?.notifyNightConsent,
      },
      isPro,
    })
  }, [fixedExpenses, isPro, settings?.notifyPaymentEnabled, settings?.notifyPaymentTime, settings?.notifyNightConsent])

  const saveFixed = async (updated) => {
    setFixedExpenses(updated)
    if (localStorage.getItem('moa_demo_mode') === 'true') localStorage.setItem('moa_fixed_expenses', JSON.stringify(updated))
    if (user) await setDoc(doc(db, 'users', user.uid), { fixedExpenses: updated }, { merge: true })
  }

  const handleAddFixed = () => {
    if (!newFixed.title || !newFixed.amount) return
    // 보고 있는 달부터 존재 (이전 달에는 표시되지 않음)
    const updated = [...fixedExpenses, createFixed({
      title: newFixed.title, amount: Number(newFixed.amount), dueDate: newFixed.dueDate,
      category: newFixed.category || '기타', payment: newFixed.payment || '현금',
      autoRegister: newFixed.autoRegister
    }, toMonthKey(viewYear, viewMonth))]
    saveFixed(updated)
    setNewFixed(EMPTY_FIXED)
    setShowAddFixed(false)
  }

  const handleToggleFixed = async (id) => {
    const monthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`
    const raw = fixedExpenses.find(x => x.id === id)
    const f = raw && resolveFixedForMonth(raw, monthKey) // 보고 있는 달에 적용되는 버전 기준
    const isDemo = localStorage.getItem('moa_demo_mode') === 'true'
    if (!f || (!user && !isDemo)) return
    const doneMonths = f.doneMonths || []
    const isDone = doneMonths.includes(monthKey)
    // 체크는 사용자가 직접 하는 '확인' 표시다. 자동 등록된 달은 가계부 내역이 체크와 무관하게
    // 들어가 있으므로, 체크를 꺼도 그 내역은 지우지 않는다(자동 등록이 아닌 달만 체크와 함께 추가/삭제)
    const autoRegistered = (raw.autoRegisteredMonths || []).includes(monthKey)

    if (isDemo) {
      // 데모 모드: Firestore 대신 로컬 시드 거래에 같은 형태로 추가/삭제
      const txKey = `moa_txns_${monthKey}`
      let txns = []
      try { txns = JSON.parse(localStorage.getItem(txKey) || '[]') } catch { /* 빈 목록으로 시작 */ }
      if (!isDone) {
        if (!txns.some(t => t.fixedExpenseId === String(f.id))) {
          const dueDay = f.dueDate ? parseInt(f.dueDate.split('-')[2]) : 1
          const dateStr = `${monthKey}-${String(isNaN(dueDay) ? 1 : dueDay).padStart(2, '0')}`
          txns = [...txns, {
            id: `demo-fixed-${f.id}-${monthKey}`, uid: 'demo', month: monthKey, type: 'expense',
            title: f.title, amount: f.amount,
            category: f.category || '기타', payment: f.payment || '현금',
            date: dateStr, time: '00:00', memo: '고정지출',
            fixedExpenseId: String(f.id), isAutoRegistered: true, createdAt: new Date().toISOString()
          }]
        }
      } else if (!autoRegistered) {
        txns = txns.filter(t => t.fixedExpenseId !== String(f.id))
      }
      localStorage.setItem(txKey, JSON.stringify(txns))
      setRefreshTrigger(t => t + 1)
    } else if (!isDone) {
      // 체크 ON → 가계부에 내역 추가
      // 자동 등록 등으로 이미 동일 고정지출 내역이 있으면 중복 추가하지 않음
      const dupQ = query(collection(db, 'transactions'),
        where('uid', '==', user.uid),
        where('month', '==', monthKey),
        where('fixedExpenseId', '==', String(f.id))
      )
      const dupSnap = await getDocs(dupQ)
      if (dupSnap.empty) {
        const dueDay = f.dueDate ? parseInt(f.dueDate.split('-')[2]) : 1
        const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(isNaN(dueDay) ? 1 : dueDay).padStart(2, '0')}`
        await addDoc(collection(db, 'transactions'), {
          uid: user.uid, month: monthKey, type: 'expense',
          title: f.title, amount: f.amount,
          category: f.category || '기타', payment: f.payment || '현금',
          date: dateStr, time: '00:00', memo: '고정지출',
          fixedExpenseId: String(f.id), isAutoRegistered: true, createdAt: new Date().toISOString()
        })
        setRefreshTrigger(t => t + 1)
      }
    } else if (!autoRegistered) {
      // 체크 OFF → 가계부에서 해당 내역 삭제 (자동 등록된 달은 위 주석대로 유지)
      const q = query(collection(db, 'transactions'),
        where('uid', '==', user.uid),
        where('month', '==', monthKey),
        where('fixedExpenseId', '==', String(f.id))
      )
      const snap = await getDocs(q)
      await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'transactions', d.id))))
      setRefreshTrigger(t => t + 1)
    }

    const updated = fixedExpenses.map(x => {
      if (x.id !== id) return x
      return { ...x, doneMonths: isDone ? doneMonths.filter(m => m !== monthKey) : [...doneMonths, monthKey] }
    })
    saveFixed(updated)
  }

  const handleDeleteFixed = (id) => {
    // 보고 있는 달부터 삭제 (이전 달은 기존 데이터 유지)
    const monthKey = toMonthKey(viewYear, viewMonth)
    const updated = fixedExpenses
      .map(f => f.id === id ? deleteFixedFromMonth(f, monthKey) : f)
      .filter(Boolean)
    saveFixed(updated)
  }

  const handleSaveFixed = () => {
    if (!editFixedData.title || !editFixedData.amount) return
    // 보고 있는 달부터 변경 (이전 달은 기존 데이터 유지)
    const updated = fixedExpenses.map(f => f.id === editingFixedId ? editFixedFromMonth(f, {
      title: editFixedData.title, amount: Number(editFixedData.amount), dueDate: editFixedData.dueDate,
      category: editFixedData.category || '기타', payment: editFixedData.payment || '현금',
      autoRegister: editFixedData.autoRegister
    }, toMonthKey(viewYear, viewMonth)) : f)
    saveFixed(updated)
    setEditingFixedId(null)
  }

  const fmt = n => n.toLocaleString('ko-KR')
  const accNames = userAccounts.map(a => a.name).filter(Boolean)
  const showLoan = localStorage.getItem('moa_showLoan') === 'true'
  const getCreditCard = (p) => cards.find(c => c.name === p && c.cardType === 'credit')
  const isCreditExcluded = (t) => {
    // 홈에서 자동 기재한 신용카드 대금: 카드 사용이 이미 지출로 잡히는 경우(Pro 아님 / 지출 모드) 이중 집계 방지
    if (t.billingCardId) {
      if (!isPro) return true
      return cards.find(c => c.id === t.billingCardId)?.creditTracking !== 'billing'
    }
    if (!isPro) return false // Pro 아니면 대금 기준 추적을 적용하지 않고 항상 지출로 집계
    if (t.cardBilling) {
      const card = getCreditCard(t.payment)
      return card?.creditTracking !== 'billing'
    }
    const card = getCreditCard(t.payment)
    return card?.creditTracking === 'billing'
  }

  const byDate = transactions.reduce((acc, t) => {
    if (t.mergedInto || t.isHidden) return acc
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

  const totalExpense = transactions.filter(t => !t.mergedInto && !t.isHidden && t.type === 'expense' && !isCreditExcluded(t) && (!showLoan || !t.isLoan)).reduce((s, t) => s + t.amount, 0)
  const totalIncome = transactions.filter(t => !t.mergedInto && !t.isHidden && t.type === 'income' && (!showLoan || !t.isLoan)).reduce((s, t) => s + t.amount, 0)
  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const weekExpense = transactions.filter(t => !t.mergedInto && !t.isHidden && t.type === 'expense' && !isCreditExcluded(t) && (!showLoan || !t.isLoan) && t.date >= weekAgo && t.date <= todayStr).reduce((s, t) => s + t.amount, 0)
  const weekIncome = transactions.filter(t => !t.mergedInto && !t.isHidden && t.type === 'income' && (!showLoan || !t.isLoan) && t.date >= weekAgo && t.date <= todayStr).reduce((s, t) => s + t.amount, 0)
  const selectedDateStr = selectedDate ? `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(selectedDate).padStart(2,'0')}` : null
  const selectedTxs = selectedDateStr ? transactions.filter(t => !t.mergedInto && !t.isHidden && t.date === selectedDateStr) : []
  const currentMonthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`
  // 보고 있는 달에 적용되는 고정지출만 (월별 버전 반영)
  const monthFixed = fixedListForMonth(fixedExpenses, currentMonthKey)
  const fixedDueDays = monthFixed
    .filter(f => !(f.doneMonths || []).includes(currentMonthKey))
    .map(f => f.dueDate ? parseInt(f.dueDate.split('-')[2]) : null)
    .filter(Boolean)

  // 고정지출 뱃지용 총액
  const fixedTotal = monthFixed.reduce((s, f) => s + f.amount, 0)

  const sortedFixed = [...monthFixed].sort((a, b) => {
    const da = parseInt(a.dueDate?.split('-')[2] || '99')
    const db_ = parseInt(b.dueDate?.split('-')[2] || '99')
    return da - db_
  })

  if (neumorphism) {
    return (
      <>
      <CalendarNeu
        themeData={themeData} loadError={loadError}
        setShowPaywall={setShowPaywall}
        viewYear={viewYear} setViewYear={setViewYear} viewMonth={viewMonth} setViewMonth={setViewMonth}
        showYMPicker={showYMPicker} setShowYMPicker={setShowYMPicker}
        days={days} firstDay={firstDay} byDate={byDate} todayStr={todayStr}
        selectedDate={selectedDate} setSelectedDate={setSelectedDate}
        fixedDueDays={fixedDueDays}
        selectedTxs={selectedTxs} isCreditExcluded={isCreditExcluded} showLoan={showLoan}
        weekExpense={weekExpense} weekIncome={weekIncome} totalExpense={totalExpense} totalIncome={totalIncome}
        fmt={fmt}
        fixedExpenses={monthFixed} fixedTotal={fixedTotal} sortedFixed={sortedFixed} currentMonthKey={currentMonthKey}
        setShowAddFixed={setShowAddFixed}
        expandedFixedId={expandedFixedId} setExpandedFixedId={setExpandedFixedId}
        handleToggleFixed={handleToggleFixed} handleDeleteFixed={handleDeleteFixed}
        setEditingFixedId={setEditingFixedId} setEditFixedData={setEditFixedData}
        editingFixedId={editingFixedId} editFixedData={editFixedData} handleSaveFixed={handleSaveFixed}
        showAddFixed={showAddFixed} newFixed={newFixed} setNewFixed={setNewFixed} EMPTY_FIXED={EMPTY_FIXED} handleAddFixed={handleAddFixed}
        categories={categories} accNames={accNames} userCards={userCards}
        showCardSelector={showCardSelector} setShowCardSelector={setShowCardSelector}
        showAccountSelector={showAccountSelector} setShowAccountSelector={setShowAccountSelector}
      />
      {showPaywall && <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} />}
      </>
    )
  }

  return (
    <div style={{
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: themeData.bg
    }}>

      {loadError && (
        <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
          <LoadError message={loadError} onRetry={() => window.location.reload()} />
        </div>
      )}

      {/* ── 고정: 캘린더만 ── */}
      <div style={{ flexShrink: 0, background: '#fff', padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 24px 12px', borderBottom: '1px solid #F2F4F6' }}>
          {/* 월 네비게이션 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <button onClick={() => { if (viewMonth === 0) { setViewYear(y => y-1); setViewMonth(11) } else setViewMonth(m => m-1) }} aria-label="이전 달"
              style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#8B95A1', padding: '4px 8px' }}>‹</button>
            <p onClick={() => setShowYMPicker(true)}
              style={{ fontSize: 18, fontWeight: 700, color: '#191F28', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              {viewYear}년 {viewMonth + 1}월 <span style={{ fontSize: 13, color: '#C9CDD4' }}>▾</span>
            </p>
            <button onClick={() => { if (viewMonth === 11) { setViewYear(y => y+1); setViewMonth(0) } else setViewMonth(m => m+1) }} aria-label="다음 달"
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
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: 'calc(95px + env(safe-area-inset-bottom, 0px))' }}>

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
                    <FitText>{t.type === 'expense' ? '-' : '+'}{fmt(t.amount)}원</FitText>
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
              <p style={{ fontSize: 15, fontWeight: 700, color: '#FF5A5F' }}><FitText>-{fmt(weekExpense)}원</FitText></p>
            </div>
            <div style={{ flex: 1, background: themeData.card, borderRadius: 20, padding: '13px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 12, color: '#8B95A1', marginBottom: 3 }}>이번 주 수입</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#2ECC71' }}><FitText>+{fmt(weekIncome)}원</FitText></p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, background: themeData.card, borderRadius: 20, padding: '13px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 12, color: '#8B95A1', marginBottom: 3 }}>{viewMonth + 1}월 지출</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#FF5A5F' }}><FitText>-{fmt(totalExpense)}원</FitText></p>
            </div>
            <div style={{ flex: 1, background: themeData.card, borderRadius: 20, padding: '13px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 12, color: '#8B95A1', marginBottom: 3 }}>{viewMonth + 1}월 수입</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#2ECC71' }}><FitText>+{fmt(totalIncome)}원</FitText></p>
            </div>
          </div>
        </div>

        {/* ── 고정지출 ── */}
        {!isPro ? (
          <div style={{ margin: '12px 16px 0' }}>
            <LockedFeature
              title="고정지출 & 다가오는 결제"
              description={"반복되는 고정지출을 등록하고,\n결제일 전날 알림까지 받아보세요."}
              onPress={() => setShowPaywall(true)}
            />
          </div>
        ) : (
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
              {monthFixed.length > 0 && (
                <span style={{ fontSize: 11, color: '#8B95A1', background: '#F2F4F6', borderRadius: 9999, padding: '3px 9px', fontWeight: 700 }}>
                  {monthFixed.length}개 · 월 {fmt(fixedTotal)}원
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
            {monthFixed.length === 0 && (
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
                      <span className="checkbox-box" style={{ marginTop: 0, width: 22, height: 22 }}
                        onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={isDone} aria-label={isDone ? `${f.title} 완료 해제` : `${f.title} 완료 처리`}
                          onChange={() => handleToggleFixed(f.id)} />
                        <span className="checkbox-visual" aria-hidden="true"
                          style={isDone ? { background: themeData.primary, borderColor: themeData.primary, borderRadius: 7 } : { borderRadius: 7 }}>
                          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                            <path d="M1 5L4.5 8.5L11 1.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: isDone ? '#C9CDD4' : '#191F28', textDecoration: isDone ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {f.title}
                        </p>
                        {(dayNum || f.payment) && (
                          <p style={{ fontSize: 12, color: '#8B95A1', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {[dayNum ? `매월 ${dayNum}일` : null, f.payment || null].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                      <p style={{ fontSize: 15, fontWeight: 700, color: isDone ? '#C9CDD4' : '#FF5A5F', flexShrink: 0 }}>
                        <FitText>-{fmt(f.amount)}원</FitText>
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
        )}

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
                  <AmountInput style={inputStyle} placeholder="0" value={editFixedData.amount} onChange={v => setEditFixedData(d => ({ ...d, amount: v }))} />
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
                  <button onClick={() => setEditFixedData(d => ({ ...d, autoRegister: !d.autoRegister }))} aria-label="가계부 자동 등록" aria-pressed={editFixedData.autoRegister}
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
                  <AmountInput style={inputStyle} placeholder="0" value={newFixed.amount} onChange={v => setNewFixed(f => ({ ...f, amount: v }))} />
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
                  <button onClick={() => setNewFixed(f => ({ ...f, autoRegister: !f.autoRegister }))} aria-label="가계부 자동 등록" aria-pressed={newFixed.autoRegister}
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
      <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  )
}
