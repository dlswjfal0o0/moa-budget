import { useTheme } from '../contexts/ThemeContext'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore'
import BottomNav from '../components/BottomNav'

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
    const updated = [...fixedExpenses, { id: Date.now(), title: newFixed.title, amount: Number(newFixed.amount), dueDate: newFixed.dueDate, done: false }]
    saveFixed(updated)
    setNewFixed({ title: '', amount: '', dueDate: '' })
    setShowAddFixed(false)
  }

  const handleToggleFixed = (id) => {
    const updated = fixedExpenses.map(f => f.id === id ? { ...f, done: !f.done } : f)
    saveFixed(updated)
  }

  const handleDeleteFixed = (id) => {
    const updated = fixedExpenses.filter(f => f.id !== id)
    saveFixed(updated)
  }

  const fmt = n => n.toLocaleString('ko-KR')
  const byDate = transactions.reduce((acc, t) => {
    if (!acc[t.date]) acc[t.date] = { expense: 0, income: 0 }
    if (t.type === 'expense') acc[t.date].expense += t.amount
    else acc[t.date].income += t.amount
    return acc
  }, {})

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const days = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const weekExpense = transactions.filter(t => t.type === 'expense' && t.date >= weekAgo && t.date <= todayStr).reduce((s, t) => s + t.amount, 0)
  const weekIncome = transactions.filter(t => t.type === 'income' && t.date >= weekAgo && t.date <= todayStr).reduce((s, t) => s + t.amount, 0)
  const selectedDateStr = selectedDate ? `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(selectedDate).padStart(2,'0')}` : null
  const selectedTxs = selectedDateStr ? transactions.filter(t => t.date === selectedDateStr) : []

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: '1.5px solid #e8e8e8', fontSize: 14, outline: 'none',
    background: '#fafafa', color: '#111', boxSizing: 'border-box'
  }

  return (
    <div
      style={{ background: themeData.bg, minHeight: '100vh', paddingBottom: 80 }}
      className={themeData.bgClass}
    >
      <div style={{ background: themeData.card, padding: '48px 20px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button onClick={() => { if (viewMonth === 0) { setViewYear(y => y-1); setViewMonth(11) } else setViewMonth(m => m-1) }}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#666', padding: '4px 8px' }}>‹</button>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>{viewYear}년 {viewMonth + 1}월</p>
          <button onClick={() => { if (viewMonth === 11) { setViewYear(y => y+1); setViewMonth(0) } else setViewMonth(m => m+1) }}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#666', padding: '4px 8px' }}>›</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 8 }}>
          {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
            <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: i === 0 ? '#ef4444' : i === 6 ? themeData.primary : '#888', padding: '4px 0' }}>{d}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
          {days.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />
            const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
            const data = byDate[dateStr]
            const isToday = dateStr === todayStr
            const isSelected = day === selectedDate
            const dow = (firstDay + day - 1) % 7
            return (
              <div key={day} onClick={() => setSelectedDate(day === selectedDate ? null : day)}
                style={{ padding: '6px 2px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                  background: isSelected ? '#EEF2FF' : 'transparent',
                  border: isSelected ? `1.5px solid ${themeData.primary}` : '1.5px solid transparent' }}>
                <p style={{ fontSize: 13, fontWeight: isToday ? 700 : 400, color: isToday ? themeData.primary : dow === 0 ? '#ef4444' : dow === 6 ? themeData.primary : '#111', marginBottom: 2 }}>
                  {isToday ? '●' : day}
                </p>
                {data?.income > 0 && <p style={{ fontSize: 8, color: '#22c55e', lineHeight: 1.2 }}>+{data.income.toLocaleString()}</p>}
                {data?.expense > 0 && <p style={{ fontSize: 8, color: '#ef4444', lineHeight: 1.2 }}>-{data.expense.toLocaleString()}</p>}
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {selectedDate && (
          <div style={{ background: themeData.card, borderRadius: 16, padding: '16px', marginBottom: 16 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 12 }}>{viewMonth + 1}월 {selectedDate}일</p>
            {selectedTxs.length === 0 ? (
              <p style={{ fontSize: 14, color: '#bbb', textAlign: 'center', padding: '12px 0' }}>내역이 없어요</p>
            ) : (
              selectedTxs.map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f8f8f8' }}>
                  <div>
                    <p style={{ fontSize: 14, color: '#111', marginBottom: 2 }}>{t.title}</p>
                    <p style={{ fontSize: 12, color: '#bbb' }}>{t.time} · {t.category} · {t.payment || '기타'}</p>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: t.type === 'expense' ? '#ef4444' : '#22c55e' }}>
                    {t.type === 'expense' ? '-' : '+'}{fmt(t.amount)}원
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, background: themeData.card, borderRadius: 16, padding: '16px' }}>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>이번 주 지출</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#ef4444' }}>-{fmt(weekExpense)}원</p>
          </div>
          <div style={{ flex: 1, background: themeData.card, borderRadius: 16, padding: '16px' }}>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>이번 주 수입</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#22c55e' }}>+{fmt(weekIncome)}원</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, background: themeData.card, borderRadius: 16, padding: '16px' }}>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{viewMonth + 1}월 지출</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#ef4444' }}>-{fmt(totalExpense)}원</p>
          </div>
          <div style={{ flex: 1, background: themeData.card, borderRadius: 16, padding: '16px' }}>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{viewMonth + 1}월 수입</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#22c55e' }}>+{fmt(totalIncome)}원</p>
          </div>
        </div>

        <div style={{ background: themeData.card, borderRadius: 16, padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>고정지출</p>
            <button onClick={() => setShowAddFixed(true)}
              style={{ background: themeData.primary, border: 'none', borderRadius: 8, padding: '5px 12px', color: '#fff', fontSize: 12, cursor: 'pointer' }}>
              + 추가
            </button>
          </div>

          {fixedExpenses.length === 0 && !showAddFixed && (
            <p style={{ fontSize: 14, color: '#bbb', textAlign: 'center', padding: '12px 0' }}>고정지출을 추가해보세요</p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[...fixedExpenses]
                .sort((a, b) => {
                    const da = parseInt(a.dueDate?.split('-')[2] || '99')
                    const db = parseInt(b.dueDate?.split('-')[2] || '99')
                    return da - db
                })
                .map(f => {
                    const dayNum = f.dueDate ? parseInt(f.dueDate.split('-')[2]) : null
                    return (
                        <div key={f.id} style={{ background: f.done ? '#fafafa' : themeData.bg || '#f8f8f8', borderRadius: 14, padding: '12px 14px', border: f.done ? '1.5px solid #f0f0f0' : `1.5px solid ${themeData.primary}22` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                <input type="checkbox" checked={f.done} onChange={() => handleToggleFixed(f.id)}
                                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: themeData.primary, marginTop: 2 }} />
                                <button onClick={() => handleDeleteFixed(f.id)}
                                    style={{ background: 'none', border: 'none', color: '#ddd', fontSize: 14, cursor: 'pointer', padding: 0 }}>✕</button>
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 600, color: f.done ? '#bbb' : '#111', textDecoration: f.done ? 'line-through' : 'none', marginBottom: 4 }}>
                                {f.title}
                            </p>
                            {dayNum && (
                                <p style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>매월 {dayNum}일</p>
                            )}
                            <p style={{ fontSize: 15, fontWeight: 700, color: f.done ? '#bbb' : '#ef4444' }}>
                                -{fmt(f.amount)}원
                            </p>
                        </div>
                    )
                })}
        </div>

          {showAddFixed && (
            <div style={{ background: '#f8f8f8', borderRadius: 12, padding: '14px', marginTop: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input style={inputStyle} placeholder="항목명 (예: 월세, 넷플릭스)" value={newFixed.title} onChange={e => setNewFixed(f => ({ ...f, title: e.target.value }))} />
                <input style={inputStyle} type="number" placeholder="금액" value={newFixed.amount} onChange={e => setNewFixed(f => ({ ...f, amount: e.target.value }))} />
                <input style={inputStyle} type="date" placeholder="납부일 (선택)" value={newFixed.dueDate} onChange={e => setNewFixed(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button onClick={() => setShowAddFixed(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid #e8e8e8', background: themeData.card, cursor: 'pointer', fontSize: 13 }}>취소</button>
                <button onClick={handleAddFixed} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: themeData.primary, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>추가</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}