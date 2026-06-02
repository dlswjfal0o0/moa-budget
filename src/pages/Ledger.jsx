import { useTheme } from '../contexts/ThemeContext'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection, query, where, getDocs,
  addDoc, updateDoc, deleteDoc, doc, orderBy,
  getDoc, setDoc
} from 'firebase/firestore'
import BottomNav from '../components/BottomNav'

import { CATEGORY_COLORS, CATEGORY_ICONS, DEFAULT_CATEGORIES } from '../styles/theme'
import { inputStyle, pageWrapper, cardStyle, pillBtn, fabStyle, overlay, bottomSheet, navBanner, navBannerBtn, navBannerText, fullscreenForm, fullscreenHeader } from '../styles/styles'

const toDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
const today = () => toDateStr(new Date())

const getWeekStart = (baseDate, startDay) => {
  const d = new Date(baseDate)
  const day = d.getDay()
  const diff = startDay === 1 ? (day === 0 ? -6 : 1 - day) : -day
  d.setDate(d.getDate() + diff)
  return d
}

const Toggle = ({ on, onChange }) => (
  <div onClick={() => onChange(!on)} style={{ width: 44, height: 26, borderRadius: 13, background: on ? themeData.primary : '#ddd', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
    <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: on ? 21 : 3, transition: 'left 0.2s' }} />
  </div>
)

export default function Ledger() {
  const { themeData, themeName } = useTheme()
  const navigate = useNavigate()
  const now = new Date()
  const [user, setUser] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [tab, setTab] = useState('전체')
  const [period, setPeriod] = useState('월간')
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [swipedId, setSwipedId] = useState(null)
  const [weekStartDay, setWeekStartDay] = useState(1)
  const [weekOffset, setWeekOffset] = useState(0)
  const [sortOrder, setSortOrder] = useState('desc')
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [rolloverBudget, setRolloverBudget] = useState(false)
  const [catTab, setCatTab] = useState('expense')
  const [newCatName, setNewCatName] = useState('')
  const [userPayments, setUserPayments] = useState(['현금', '계좌이체'])
  const [form, setForm] = useState({ type: 'expense', title: '', amount: '', category: '식비', date: today(), time: '12:00', memo: '', payment: '카드' })
  const touchStartX = useRef(null)
  const [showUtilities, setShowUtilities] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      if (!u) navigate('/auth', { replace: true })
      else {
        setUser(u)
        const snap = await getDoc(doc(db, 'users', u.uid))
        if (snap.exists()) {
          const data = snap.data()
          if (data.categories) setCategories({ ...DEFAULT_CATEGORIES, ...data.categories })
          if (data.rolloverBudget !== undefined) setRolloverBudget(data.rolloverBudget)
          
          if (snap.data().showUtilities !== undefined) setShowUtilities(snap.data().showUtilities)
        }
      }
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!user) return
    fetchTransactions()
    // 결제수단 로드
    getDoc(doc(db, 'users', user.uid)).then(snap => {
        if (snap.exists()) {
            const data = snap.data()
            const methods = []
            if (data.cards) data.cards.forEach(c => methods.push(c.name))
            if (data.accounts) data.accounts.forEach(a => methods.push(a.name))
            methods.push('현금', '계좌이체')
            setUserPayments([...new Set(methods)])
        }
    })
  }, [user])

  const fetchTransactions = async () => {
    const q = query(collection(db, 'transactions'), where('uid', '==', user.uid), orderBy('date', 'desc'))
    const snap = await getDocs(q)
    setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  const saveUserData = async (updates) => {
    if (!user) return
    await setDoc(doc(db, 'users', user.uid), updates, { merge: true })
  }

  const handleAddCategory = () => {
    if (!newCatName.trim()) return
    const updated = { ...categories, [catTab]: [...categories[catTab], newCatName.trim()] }
    setCategories(updated)
    saveUserData({ categories: updated })
    setNewCatName('')
  }

  const handleDeleteCategory = (type, cat) => {
    const updated = { ...categories, [type]: categories[type].filter(c => c !== cat) }
    setCategories(updated)
    saveUserData({ categories: updated })
  }

  const handleToggleRollover = (val) => {
    setRolloverBudget(val)
    saveUserData({ rolloverBudget: val })
  }

  const getWeekRange = () => {
    const base = new Date()
    base.setDate(base.getDate() + weekOffset * 7)
    const start = getWeekStart(base, weekStartDay)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return { start: toDateStr(start), end: toDateStr(end) }
  }

  const weekRange = getWeekRange()

  const formatWeekLabel = () => {
    const { start, end } = weekRange
    const s = new Date(start), e = new Date(end)
    return `${s.getMonth()+1}/${s.getDate()} ~ ${e.getMonth()+1}/${e.getDate()}`
  }

  const prevMonth = () => { if (viewMonth === 0) { setViewYear(y => y-1); setViewMonth(11) } else setViewMonth(m => m-1) }
  const nextMonth = () => { if (viewMonth === 11) { setViewYear(y => y+1); setViewMonth(0) } else setViewMonth(m => m+1) }

  const getFiltered = () => {
    let filtered = [...transactions]
    if (period === '주간') {
      filtered = filtered.filter(t => t.date >= weekRange.start && t.date <= weekRange.end)
    } else if (period === '월간') {
      const monthStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}`
      filtered = filtered.filter(t => t.date?.startsWith(monthStr))
    } else if (period === '직접' && customStart && customEnd) {
      filtered = filtered.filter(t => t.date >= customStart && t.date <= customEnd)
    }
    if (tab === '소비') filtered = filtered.filter(t => t.type === 'expense')
    if (tab === '수입') filtered = filtered.filter(t => t.type === 'income')
    filtered.sort((a, b) => {
      const aKey = `${a.date} ${a.time || '00:00'}`
      const bKey = `${b.date} ${b.time || '00:00'}`
      return sortOrder === 'desc' ? bKey.localeCompare(aKey) : aKey.localeCompare(bKey)
    })
    return filtered
  }

  const handleSubmit = async () => {
    if (!form.title || !form.amount) return alert('제목과 금액을 입력해주세요.')
    const monthDate = new Date(form.date)
    const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth()+1).padStart(2,'0')}`
    const data = { ...form, amount: Number(form.amount), uid: user.uid, month: monthStr, createdAt: new Date().toISOString() }
    if (editItem) {
      await updateDoc(doc(db, 'transactions', editItem.id), data)
    } else {
      await addDoc(collection(db, 'transactions'), data)
    }
    setShowForm(false)
    setEditItem(null)
    setForm({ type: 'expense', title: '', amount: '', category: categories.expense[0] || '기타', date: today(), time: '12:00', memo: '', payment: '카드' })
    fetchTransactions()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('삭제할까요?')) return
    await deleteDoc(doc(db, 'transactions', id))
    setSelectedId(null); setSwipedId(null)
    fetchTransactions()
  }

  const handleEdit = (t) => {
    setEditItem(t)
    setForm({ type: t.type, title: t.title, amount: String(t.amount), category: t.category, date: t.date, time: t.time || '12:00', memo: t.memo || '', payment: t.payment || '카드' })
    setShowForm(true); setSelectedId(null)
  }

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e, id) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx < -60) setSwipedId(id)
    else if (dx > 30) setSwipedId(null)
  }

  const filtered = getFiltered()
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const fmt = n => n.toLocaleString('ko-KR')

  const periodBtn = (p) => ({
    padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
    background: period === p ? themeData.primary : '#f0f0f0',
    color: period === p ? '#fff' : '#666', fontSize: 13, fontWeight: 500
  })


  const dateGroups = filtered.reduce((acc, t) => {
    const d = t.date || '날짜 없음'
    if (!acc[d]) acc[d] = []
    acc[d].push(t)
    return acc
  }, {})

  const sortedDates = Object.keys(dateGroups).sort((a, b) =>
    sortOrder === 'desc' ? b.localeCompare(a) : a.localeCompare(b)
  )

  return (
    <div
      style={{ background: themeData.bg, minHeight: '100vh', paddingBottom: 80 }}
      className={themeData.bgClass}
    >
      {/* 헤더 */}
      <div style={{ background: themeData.card, padding: '48px 20px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#111' }}>가계부</p>
          <button onClick={() => setShowSettings(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#888' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {['주간', '월간', '직접'].map(p => (
            <button key={p} onClick={() => { setPeriod(p); setWeekOffset(0) }} style={periodBtn(p)}>{p}</button>
          ))}
        </div>

        {period === '주간' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8f8f8', borderRadius: 10, padding: '8px 12px', marginBottom: 10 }}>
            <button onClick={() => setWeekOffset(o => o-1)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#666', padding: '0 8px' }}>‹</button>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#111' }}>{formatWeekLabel()}</p>
            <button onClick={() => setWeekOffset(o => o+1)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#666', padding: '0 8px' }}>›</button>
          </div>
        )}

        {period === '월간' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8f8f8', borderRadius: 10, padding: '8px 12px', marginBottom: 10 }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#666', padding: '0 8px' }}>‹</button>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#111' }}>{viewYear}년 {viewMonth + 1}월</p>
            <button onClick={nextMonth} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#666', padding: '0 8px' }}>›</button>
          </div>
        )}

        {period === '직접' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
              style={{ flex: 1, padding: '8px 10px', borderRadius: 10, border: '1.5px solid #e8e8e8', fontSize: 13, outline: 'none' }} />
            <span style={{ display: 'flex', alignItems: 'center', color: '#888', fontSize: 13 }}>~</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
              style={{ flex: 1, padding: '8px 10px', borderRadius: 10, border: '1.5px solid #e8e8e8', fontSize: 13, outline: 'none' }} />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {['전체', '소비', '수입'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', background: tab === t ? '#111' : '#f0f0f0', color: tab === t ? '#fff' : '#666', fontSize: 13, fontWeight: 500 }}>{t}</button>
            ))}
          </div>
          <button onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f0f0f0', border: 'none', borderRadius: 20, padding: '6px 12px', fontSize: 12, color: '#666', cursor: 'pointer' }}>
            {sortOrder === 'desc' ? '↓ 최신순' : '↑ 오래된순'}
          </button>
        </div>
      </div>

      {/* 합계 */}
      <div style={{ display: 'flex', gap: 12, padding: '16px 16px 0' }}>
        <div style={{ flex: 1, background: themeData.card, borderRadius: 12, padding: '12px 16px' }}>
          <p style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>지출</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#ef4444' }}>-{fmt(totalExpense)}원</p>
        </div>
        <div style={{ flex: 1, background: themeData.card, borderRadius: 12, padding: '12px 16px' }}>
          <p style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>수입</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>+{fmt(totalIncome)}원</p>
        </div>
      </div>

      {/* 내역 리스트 */}
      <div style={{ padding: '16px' }}>
        {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#bbb', fontSize: 14 }}>
              내역이 없어요
            </div>
        ) : (
            sortedDates.map(date => (
                <div key={date}>
                    {/* 날짜 구분선 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0 8px' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#aaa', whiteSpace: 'nowrap' }}>
                            {date.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$2/$3')}
                        </span>
                        <div style={{ flex: 1, height: 0.5, background: '#e8e8e8' }} />
                        <span style={{ fontSize: 11, whiteSpace: 'nowrap', display: 'flex', gap: 6 }}>
                            {dateGroups[date].some(t => t.type === 'expense') && (
                                <span style={{ color: '#ef4444' }}>
                                    -{dateGroups[date].filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0).toLocaleString()}원
                                </span>
                            )}
                            {dateGroups[date].some(t => t.type === 'expense') && dateGroups[date].some(t => t.type === 'income') && (
                                <span style={{ color: '#ddd' }}>·</span>
                            )}
                            {dateGroups[date].some(t => t.type === 'income') && (
                                <span style={{ color: '#22c55e' }}>
                                    +{dateGroups[date].filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0).toLocaleString()}원
                                </span>
                            )}
                        </span>
                    </div>

                    {/* 해당 날짜 거래 목록 */}
                    {dateGroups[date].map(t => (
                        <div key={t.id} style={{ position: 'relative', marginBottom: 8, borderRadius: 12, overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 70, background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                onClick={() => handleDelete(t.id)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                    <path d="M10 11v6"/><path d="M14 11v6"/>
                                </svg>
                            </div>
                        <div
                            onTouchStart={handleTouchStart}
                            onTouchEnd={e => handleTouchEnd(e, t.id)}
                            onClick={() => { setSelectedId(selectedId === t.id ? null : t.id); setSwipedId(null) }}
                            style={{ background: '#fff', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
                                transform: swipedId === t.id ? 'translateX(-70px)' : 'translateX(0)',
                                transition: 'transform 0.25s ease', position: 'relative', zIndex: 1, cursor: 'pointer', borderRadius: 12 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: (CATEGORY_COLORS[t.category] || '#B0B0B0') + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>
                                {CATEGORY_ICONS[t.category] || '📦'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 14, fontWeight: 500, color: '#111', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                                <p style={{ fontSize: 11, color: '#bbb' }}>{t.time} · {t.category} · {t.payment || '현금'}</p>
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: t.type === 'expense' ? '#ef4444' : '#22c55e', flexShrink: 0 }}>
                                {t.type === 'expense' ? '-' : '+'}{fmt(t.amount)}원
                            </p>
                        </div>
                        {selectedId === t.id && (
                            <div style={{ background: '#fff', borderTop: '1px solid #f5f5f5', display: 'flex', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
                                <button onClick={() => handleEdit(t)} style={{ flex: 1, padding: '10px', border: 'none', background: '#F0F0FF', color: themeData.primary, fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    수정
                                </button>
                                <button onClick={() => handleDelete(t.id)} style={{ flex: 1, padding: '10px', border: 'none', background: '#FFF0F0', color: '#ef4444', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                                    삭제
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        ))
    )}
      </div>

      {/* 추가 버튼 */}
      <button onClick={() => { setEditItem(null); setForm({ type: 'expense', title: '', amount: '', category: categories.expense[0] || '기타', date: today(), time: '12:00', memo: '', payment: '카드' }); setShowForm(true) }}
        style={{ position: 'fixed', bottom: 90, right: 'calc(50% - 215px + 16px)', width: 52, height: 52, borderRadius: '50%', background: themeData.primary, border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer', boxShadow: `0 4px 12px ${themeData.primary}66` }}>+</button>

      {/* 설정 모달 */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: themeData.card, borderRadius: '20px 20px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 430, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>가계부 설정</p>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888' }}>✕</button>
            </div>

            <p style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 10 }}>주 시작 요일</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[{ label: '월요일부터', val: 1 }, { label: '일요일부터', val: 0 }].map(opt => (
                <button key={opt.val} onClick={() => setWeekStartDay(opt.val)}
                  style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: weekStartDay === opt.val ? themeData.primary : '#f0f0f0', color: weekStartDay === opt.val ? '#fff' : '#666' }}>{opt.label}</button>
              ))}
            </div>

            <p style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 10 }}>정렬 순서</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[{ label: '↓ 최신순', val: 'desc' }, { label: '↑ 오래된순', val: 'asc' }].map(opt => (
                <button key={opt.val} onClick={() => setSortOrder(opt.val)}
                  style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: sortOrder === opt.val ? themeData.primary : '#f0f0f0', color: sortOrder === opt.val ? '#fff' : '#666' }}>{opt.label}</button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderTop: '1px solid #f0f0f0', marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 3 }}>잔여 예산 이월</p>
                <p style={{ fontSize: 12, color: '#888' }}>남은 예산을 다음 달로 이월</p>
              </div>
              <Toggle on={rolloverBudget} onChange={handleToggleRollover} />
            </div>

            <p style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 10 }}>카테고리 관리</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {[{ label: '지출', val: 'expense' }, { label: '수입', val: 'income' }].map(opt => (
                <button key={opt.val} onClick={() => setCatTab(opt.val)}
                  style={{ flex: 1, padding: '8px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: catTab === opt.val ? themeData.primary : '#f0f0f0', color: catTab === opt.val ? '#fff' : '#666' }}>{opt.label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {categories[catTab].map(cat => (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f0f0f0', borderRadius: 20, padding: '5px 8px 5px 12px' }}>
                  <span style={{ fontSize: 13, color: '#333' }}>{CATEGORY_ICONS[cat] || ''} {cat}</span>
                  <button onClick={() => handleDeleteCategory(catTab, cat)} style={{ background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: 16, padding: '0 2px', lineHeight: 1 }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="새 카테고리 이름"
                style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e8e8e8', fontSize: 13, outline: 'none', background: '#fafafa' }}
                onKeyDown={e => e.key === 'Enter' && handleAddCategory()} />
              <button onClick={handleAddCategory} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: themeData.primary, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>추가</button>
            </div>
            {/* 구분선 */}
            <div style={{ height: 1, background: '#f0f0f0', margin: '20px 0 16px' }} />

            {/* 분석 공과금 탭 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>분석 공과금 탭</p>
                    <p style={{ fontSize: 12, color: '#888', marginTop: 3 }}>분석 화면에 공과금 탭을 추가해요</p>
                </div>
                <div onClick={async () => {
                    const next = !showUtilities
                    setShowUtilities(next)
                    if (user) await setDoc(doc(db, 'users', user.uid), { showUtilities: next }, { merge: true })
                }} style={{ width: 46, height: 26, borderRadius: 13, background: showUtilities ? (themeData?.primary || '#4F46E5') : '#e0e0e0', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: showUtilities ? 22 : 2, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                </div>
            </div>
          </div>
        </div>
      )}

      {/* 전체화면 입력 폼 */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: themeData.card, zIndex: 200, overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '48px 20px 16px', borderBottom: '1px solid #f0f0f0', background: themeData.card, position: 'sticky', top: 0, zIndex: 10 }}>
            <button onClick={() => { setShowForm(false); setEditItem(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 12, padding: 4, color: '#333' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
            </button>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>{editItem ? '내역 수정' : '내역 추가'}</p>
          </div>

          <div style={{ padding: '20px 20px 60px' }}>
            <div style={{ display: 'flex', background: '#f0f0f0', borderRadius: 12, padding: 4, marginBottom: 24 }}>
              {['expense', 'income'].map(type => (
                <button key={type} onClick={() => setForm(f => ({ ...f, type, category: type === 'expense' ? categories.expense[0] : categories.income[0] }))}
                  style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 500, background: form.type === type ? '#fff' : 'transparent', color: form.type === type ? '#111' : '#888' }}>
                  {type === 'expense' ? '지출' : '수입'}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>금액</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, borderBottom: `2px solid ${themeData.primary}`, paddingBottom: 8 }}>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0"
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 32, fontWeight: 700, color: '#111', background: 'transparent' }} />
                <span style={{ fontSize: 20, fontWeight: 600, color: '#888' }}>원</span>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>제목</p>
              <input style={inputStyle} placeholder="어디에 썼나요?" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>

            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>카테고리</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {categories[form.type === 'expense' ? 'expense' : 'income'].map(cat => (
                  <button key={cat} onClick={() => setForm(f => ({ ...f, category: cat }))}
                    style={{ padding: '8px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, background: form.category === cat ? themeData.primary : '#f0f0f0', color: form.category === cat ? '#fff' : '#666' }}>
                    {CATEGORY_ICONS[cat] || ''} {cat}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>결제수단</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {userPayments.map(p => (
                        <button key={p} onClick={() => setForm(f => ({ ...f, payment: p }))}
                            style={{ padding: '8px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13,
                                background: form.payment === p ? themeData.primary : '#f0f0f0',
                                color: form.payment === p ? '#fff' : '#666' }}>{p}</button>
                    ))}
                </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>날짜 및 시간</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <input style={{ ...inputStyle, flex: 1 }} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                <input style={{ ...inputStyle, flex: 1 }} type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>메모</p>
              <textarea value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
                placeholder="메모를 입력하세요 (선택)"
                style={{ ...inputStyle, height: 80, resize: 'none', lineHeight: 1.6 }} />
            </div>

            <button onClick={handleSubmit} style={{ width: '100%', padding: '16px', borderRadius: 14, background: themeData.primary, color: '#fff', border: 'none', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
              {editItem ? '수정 완료' : '추가하기'}
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}