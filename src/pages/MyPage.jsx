import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase/config'
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth'
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'
import BottomNav from '../components/BottomNav'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { THEMES } from '../styles/theme'
import { inputStyle } from '../styles/styles'
import { useTheme } from '../contexts/ThemeContext'

export default function MyPage() {
  const navigate = useNavigate()
  const fileRef = useRef()
  const { themeName, setThemeName, themeData: t } = useTheme()
  const [selectedCard, setSelectedCard] = useState(null)
  const [cardDetailTab, setCardDetailTab] = useState('benefits')
  const [cardHistoryMonth, setCardHistoryMonth] = useState(null)
  const [cardTransactions, setCardTransactions] = useState([])
  const [user, setUser] = useState(null)
  const [nickname, setNickname] = useState(() => localStorage.getItem('moa_nickname') || '')
  const [editingNick, setEditingNick] = useState(false)
  const [profileImg, setProfileImg] = useState(() => localStorage.getItem('moa_profileImg') || null)
  const [showSettings, setShowSettings] = useState(false)
  const [cards, setCards] = useState(() => {
    try { const c = localStorage.getItem('moa_cards'); return c ? JSON.parse(c) : [] } catch { return [] }
  })
  const [accounts, setAccounts] = useState(() => {
    try { const a = localStorage.getItem('moa_accounts'); return a ? JSON.parse(a) : [] } catch { return [] }
  })
  const [cash, setCash] = useState(() => {
    const c = localStorage.getItem('moa_cash'); return c !== null && c !== '' ? Number(c) : ''
  })
  const [editingCash, setEditingCash] = useState(false)
  const [cashInput, setCashInput] = useState('')
  const [editingAccountId, setEditingAccountId] = useState(null)
  const [editAccountData, setEditAccountData] = useState({})
  const [showAddCard, setShowAddCard] = useState(false)
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [newCard, setNewCard] = useState({ cardType: 'debit', name: '', limit: '', cardNumber: '', expiry: '', linkedAccount: '', billingDay: '' })
  const [newAccount, setNewAccount] = useState({ name: '', balance: '', number: '' })
  const [exporting, setExporting] = useState(false)
  const [showUpdates, setShowUpdates] = useState(false)
  const [expandedVersion, setExpandedVersion] = useState(null)
  const [allTxns, setAllTxns] = useState([])
  const [editingCardId, setEditingCardId] = useState(null)
  const [editCardData, setEditCardData] = useState({})
  const [expandedAccountHistoryId, setExpandedAccountHistoryId] = useState(null)
  const [expandedCardId, setExpandedCardId] = useState(null)
  const [showAccountNumbers, setShowAccountNumbers] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      if (!u) navigate('/auth', { replace: true })
      else {
        setUser(u)
        setNickname(u.displayName || u.email?.split('@')[0] || '사용자')
        localStorage.setItem('moa_nickname', u.displayName || u.email?.split('@')[0] || '사용자')

        if (u.photoURL) {
            setProfileImg(u.photoURL)
            localStorage.setItem('moa_profileImg', u.photoURL)
        }

        const snap = await getDoc(doc(db, 'users', u.uid))
        if (snap.exists()) {
            const data = snap.data()
            if (data.theme) setThemeName(data.theme)
            if (data.cards) {
                setCards(data.cards)
                localStorage.setItem('moa_cards', JSON.stringify(data.cards))
            }
            if (data.accounts) {
                setAccounts(data.accounts)
                localStorage.setItem('moa_accounts', JSON.stringify(data.accounts))
            }
            if (data.cash !== undefined) {
                setCash(data.cash)
                setCashInput(String(data.cash))
                localStorage.setItem('moa_cash', String(data.cash))
            }
            if (data.profileImg) {
                setProfileImg(data.profileImg)
                localStorage.setItem('moa_profileImg', data.profileImg)
            }
            // 전체 거래내역 fetch (계좌 잔액 자동 연동)
            const txSnap = await getDocs(query(collection(db, 'transactions'), where('uid', '==', u.uid)))
            setAllTxns(txSnap.docs.map(d => d.data()))
        }
      }
    })
    return unsub
  }, [])                       // ← 첫 번째 useEffect 여기서 닫기

  useEffect(() => {            // ← 별도 useEffect
    localStorage.setItem('moa_cards', JSON.stringify(cards))
  }, [cards])

  useEffect(() => {            // ← 별도 useEffect
    localStorage.setItem('moa_accounts', JSON.stringify(accounts))
  }, [accounts])

  const saveToFirestore = async (updates) => {
    if (!user) return
    await setDoc(doc(db, 'users', user.uid), updates, { merge: true })
  }

  const handleNicknameSave = async () => {
    await updateProfile(auth.currentUser, { displayName: nickname })
    setEditingNick(false)
  }

  const handleProfileImg = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const base64 = ev.target.result
      setProfileImg(base64)
      await saveToFirestore({ profileImg: base64 })
    }
    reader.readAsDataURL(file)
  }

  const handleThemeChange = (name) => {
    setThemeName(name)
    saveToFirestore({ theme: name })
  }

  const handleCashSave = () => {
    const currentAmount = Number(cashInput)
    let net = 0
    try {
        net = allTxns.reduce((s, t) => {
            if (t.type === 'expense' && t.payment === '현금') return s - (t.amount || 0)
            if (t.type === 'income' && t.payment === '현금') return s + (t.amount || 0)
            if (t.type === 'transfer') {
                if (t.payment === '현금') return s - (t.amount || 0)
                if (t.toAccount === '현금') return s + (t.amount || 0)
            }
            return s
        }, 0)
    } catch { net = 0 }
    const baseBalance = currentAmount - net
    setCash(baseBalance)
    saveToFirestore({ cash: baseBalance })
    setEditingCash(false)
  }

  const handleAddCard = () => {
    if (!newCard.name) return
    const updated = [...cards, {
        id: Date.now(),
        cardType: newCard.cardType || 'debit',
        name: newCard.name,
        limit: Number(newCard.limit) || 0,
        used: 0,
        cardNumber: newCard.cardNumber || '',
        expiry: newCard.expiry || '',
        linkedAccount: newCard.linkedAccount || '',
        billingDay: newCard.billingDay ? Number(newCard.billingDay) : null,
        benefits: [],
    }]
    setCards(updated); saveToFirestore({ cards: updated })
    setNewCard({ cardType: 'debit', name: '', limit: '', cardNumber: '', expiry: '', linkedAccount: '', billingDay: '' })
    setShowAddCard(false)
  }

  const handleDeleteCard = (id) => {
    const updated = cards.filter(c => c.id !== id)
    setCards(updated); saveToFirestore({ cards: updated })
  }

  const handleSaveCard = () => {
    const updated = cards.map(c => c.id === editingCardId
        ? { ...c,
            cardType: editCardData.cardType || c.cardType,
            name: editCardData.name,
            cardNumber: editCardData.cardNumber,
            expiry: editCardData.expiry,
            linkedAccount: editCardData.linkedAccount,
            limit: Number(editCardData.limit) || 0,
            billingDay: editCardData.billingDay ? Number(editCardData.billingDay) : null,
          }
        : c)
    setCards(updated); saveToFirestore({ cards: updated })
    setEditingCardId(null)
  }

  const handleAddAccount = () => {
    if (!newAccount.name || !newAccount.balance) return
    const updated = [...accounts, { id: Date.now(), name: newAccount.name, balance: Number(newAccount.balance), number: newAccount.number || '' }]
    setAccounts(updated); saveToFirestore({ accounts: updated })
    setNewAccount({ name: '', balance: '', number: '' }); setShowAddAccount(false)
  }

  const handleDeleteAccount = (id) => {
    const updated = accounts.filter(a => a.id !== id)
    setAccounts(updated); saveToFirestore({ accounts: updated })
  }
  
  const handleEditAccount = (acc) => {
    setEditingAccountId(acc.id)
    setEditAccountData({ name: acc.name, balance: String(getAccountBalance(acc)), number: acc.number || '' })
  }

  const handleSaveAccount = () => {
    const origAcc = accounts.find(a => a.id === editingAccountId)
    let net = 0
    try {
      net = allTxns.reduce((s, t) => {
        if (t.type === 'expense' && t.payment === origAcc.name) return s - (t.amount || 0)
        if (t.type === 'income' && t.payment === origAcc.name) return s + (t.amount || 0)
        if (t.type === 'transfer') {
          if (t.payment === origAcc.name) return s - (t.amount || 0)
          if (t.toAccount === origAcc.name) return s + (t.amount || 0)
        }
        // 카드 대금: 결제수단이 카드 이름인 경우 → 연동 계좌에서 차감
        if (t.cardBilling && t.payment !== origAcc.name) {
          const linkedCard = cards.find(c => c.name === t.payment && c.linkedAccount === origAcc.name)
          if (linkedCard) return s - (t.amount || 0)
        }
        return s
      }, 0)
    } catch { net = 0 }
    const newBaseBalance = Number(editAccountData.balance) - net
    const updated = accounts.map(a => a.id === editingAccountId
        ? { ...a, name: editAccountData.name, balance: newBaseBalance, number: editAccountData.number }
        : a)
    setAccounts(updated); saveToFirestore({ accounts: updated }); setEditingAccountId(null)
  }

  const exportToExcel = async () => {
    if (!user) return
    setExporting(true)
    try {
      const q = query(collection(db, 'transactions'), where('uid', '==', user.uid))
      const snap = await getDocs(q)
      const txs = snap.docs.map(d => d.data()).sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      const data = txs.map(tx => ({
        '날짜': tx.date || '', '시간': tx.time || '',
        '구분': tx.type === 'expense' ? '지출' : '수입',
        '제목': tx.title || '', '카테고리': tx.category || '',
        '결제수단': tx.payment || '',
        '금액': tx.type === 'expense' ? -(tx.amount || 0) : (tx.amount || 0),
        '메모': tx.memo || '',
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '가계부')
      XLSX.writeFile(wb, 'moa_가계부.xlsx')
    } catch (e) { alert('엑셀 내보내기 실패: ' + e.message) }
    setExporting(false)
  }

  const exportToPDF = async () => {
    if (!user) return
    setExporting(true)
    try {
      const q = query(collection(db, 'transactions'), where('uid', '==', user.uid))
      const snap = await getDocs(q)
      const txs = snap.docs.map(d => d.data()).sort((a, b) => (a.date || '').localeCompare(b.date || ''))

      const div = document.createElement('div')
      div.style.cssText = 'padding:24px;background:#fff;font-family:sans-serif;width:720px;position:fixed;top:-9999px;left:-9999px;'
      div.innerHTML = `
        <h2 style="margin-bottom:4px;font-size:20px">모아 가계부</h2>
        <p style="color:#888;font-size:12px;margin-bottom:16px">${user.email} · 총 ${txs.length}건</p>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead>
            <tr style="background:#f0f0f0">
              <th style="padding:8px;text-align:left;border:1px solid #ddd">날짜</th>
              <th style="padding:8px;text-align:left;border:1px solid #ddd">제목</th>
              <th style="padding:8px;text-align:left;border:1px solid #ddd">카테고리</th>
              <th style="padding:8px;text-align:right;border:1px solid #ddd">금액</th>
            </tr>
          </thead>
          <tbody>
            ${txs.map(tx => `
              <tr>
                <td style="padding:7px 8px;border:1px solid #eee">${tx.date || ''}</td>
                <td style="padding:7px 8px;border:1px solid #eee">${tx.title || ''}</td>
                <td style="padding:7px 8px;border:1px solid #eee">${tx.category || ''}</td>
                <td style="padding:7px 8px;border:1px solid #eee;text-align:right;color:${tx.type === 'expense' ? '#ef4444' : '#22c55e'};font-weight:600">
                  ${tx.type === 'expense' ? '-' : '+'}${(tx.amount || 0).toLocaleString()}원
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
      document.body.appendChild(div)
      const canvas = await html2canvas(div, { scale: 2, useCORS: true })
      document.body.removeChild(div)

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfW = pdf.internal.pageSize.getWidth()
      const pdfH = pdf.internal.pageSize.getHeight()
      const imgH = (canvas.height * pdfW) / canvas.width
      let remaining = imgH, pos = 0

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, pos, pdfW, imgH)
      remaining -= pdfH
      while (remaining > 0) {
        pos -= pdfH; pdf.addPage()
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, pos, pdfW, imgH)
        remaining -= pdfH
      }
      pdf.save('moa_가계부.pdf')
    } catch (e) { alert('PDF 내보내기 실패: ' + e.message) }
    setExporting(false)
  }

  const fmt = n => Number(n).toLocaleString('ko-KR')
  const maskAccountNumber = (num) => {
    if (!num) return ''
    const digits = num.replace(/[\s-]/g, '')
    if (digits.length <= 4) return '****'
    const parts = num.trim().split(/[\s-]/)
    if (parts.length >= 3) return `${parts[0]} **** ${parts[parts.length - 1]}`
    return num.slice(0, 4) + ' **** ' + num.slice(-4)
  }
  const totalCardUsed = cards.reduce((s, card) => s + getCardUsed(card), 0)
  const getAccountBalance = (account) => {
    try {
      const net = allTxns.reduce((s, t) => {
        if (t.type === 'expense' && t.payment === account.name) return s - (t.amount || 0)
        if (t.type === 'income' && t.payment === account.name) return s + (t.amount || 0)
        if (t.type === 'transfer') {
          if (t.payment === account.name) return s - (t.amount || 0)
          if (t.toAccount === account.name) return s + (t.amount || 0)
        }
        // 카드 대금: 결제수단이 카드 이름인 경우 → 연동 계좌에서 차감
        if (t.cardBilling && t.payment !== account.name) {
          const linkedCard = cards.find(c => c.name === t.payment && c.linkedAccount === account.name)
          if (linkedCard) return s - (t.amount || 0)
        }
        return s
      }, 0)
      return account.balance + net
    } catch { return account.balance }
  }
  const getBalanceAtMonthEnd = (account, year, month) => {
    const lastDayStr = `${year}-${String(month).padStart(2,'0')}-${String(new Date(year, month, 0).getDate()).padStart(2,'0')}`
    try {
        const net = allTxns.reduce((s, t) => {
            if (!t.date || t.date > lastDayStr) return s
            if (t.type === 'expense' && t.payment === account.name) return s - (t.amount || 0)
            if (t.type === 'income' && t.payment === account.name) return s + (t.amount || 0)
            if (t.type === 'transfer') {
                if (t.payment === account.name) return s - (t.amount || 0)
                if (t.toAccount === account.name) return s + (t.amount || 0)
            }
            if (t.cardBilling && t.payment !== account.name) {
                const linkedCard = cards.find(c => c.name === t.payment && c.linkedAccount === account.name)
                if (linkedCard) return s - (t.amount || 0)
            }
            return s
        }, 0)
        return account.balance + net
    } catch { return account.balance }
  }
  const getCashBalance = () => {
    try {
        const net = allTxns.reduce((s, t) => {
            if (t.type === 'expense' && t.payment === '현금') return s - (t.amount || 0)
            if (t.type === 'income' && t.payment === '현금') return s + (t.amount || 0)
            if (t.type === 'transfer') {
                if (t.payment === '현금') return s - (t.amount || 0)
                if (t.toAccount === '현금') return s + (t.amount || 0)
            }
            return s
        }, 0)
        return Number(cash || 0) + net
    } catch { return Number(cash || 0) }
  }
  const getCardUsed = (card) => {
    try {
        const now = new Date()
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        const allTxns = []
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key?.startsWith('moa_txns_')) {
                const txns = JSON.parse(localStorage.getItem(key) || '[]')
                allTxns.push(...txns)
            }
        }
        return allTxns
            .filter(t => t.payment === card.name && t.type === 'expense' && !t.creditCardBilling && (t.month || t.date?.slice(0, 7)) === currentMonth)
            .reduce((s, t) => s + (t.amount || 0), 0)
    } catch { return card.used || 0 }
  }
  const totalAsset = accounts.reduce((s, a) => s + getAccountBalance(a), 0) + getCashBalance()

  const smallBtn = (onClick, label, bg, color) => (
    <button onClick={onClick} style={{ background: bg, border: 'none', borderRadius: 8, padding: '5px 12px', color, fontSize: 12, cursor: 'pointer' }}>{label}</button>
  )

  return (
    <div style={{ background: t.bg, minHeight: '100vh', paddingBottom: 80 }} className={themeName === 'pastel' ? 'theme-pastel-bg' : ''}>

      {/* 헤더 */}
      <div style={{ background: t.primary, padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
            <div onClick={() => fileRef.current.click()} style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.4)' }}>
                {profileImg ? <img src={profileImg} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#fff' }}>{nickname[0] || '?'}</span>}
              </div>
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleProfileImg} />
            <div style={{ flex: 1 }}>
              {editingNick ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input value={nickname} onChange={e => setNickname(e.target.value)}
                    style={{ ...inputStyle, background: 'rgba(255,255,255,0.9)', flex: 1, padding: '8px 12px' }} />
                  <button onClick={handleNicknameSave} style={{ background: 'rgba(255,255,255,0.3)', border: 'none', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 13, cursor: 'pointer' }}>저장</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <p style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{nickname}</p>
                  <button onClick={() => setEditingNick(true)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, padding: '3px 8px', color: '#fff', fontSize: 11, cursor: 'pointer' }}>수정</button>
                </div>
              )}
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{user?.email}</p>
            </div>
          </div>

          {/* 설정 아이콘 */}
          {!editingNick && (
            <button onClick={() => setShowSettings(true)}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* 총 자산 */}
        <div style={{ background: t.card, borderRadius: 16, padding: '16px', marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>총 자산</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <p style={{ fontSize: 28, fontWeight: 700, color: t.text || '#111' }}>{fmt(totalAsset)}원</p>
            {totalAsset < 0 && (
              <span style={{ fontSize: 11, background: '#fee2e2', color: '#ef4444', borderRadius: 20, padding: '3px 8px', fontWeight: 600, flexShrink: 0 }}>부채 초과</span>
            )}
          </div>
          <p style={{ fontSize: 12, color: '#aaa' }}>
            계좌 <span style={{ color: accounts.reduce((s,a) => s + getAccountBalance(a), 0) < 0 ? '#ef4444' : '#666' }}>{fmt(accounts.reduce((s,a) => s + getAccountBalance(a), 0))}원</span>
            {' · '}카드 <span style={{ color: '#666' }}>{fmt(totalCardUsed)}원</span>
            {' · '}현금 <span style={{ color: '#666' }}>{fmt(getCashBalance())}원</span>
          </p>
        </div>

        {/* 카드 */}
        <div style={{ background: t.card, borderRadius: 16, padding: '16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: t.text || '#111' }}>카드</p>
            {smallBtn(() => setShowAddCard(true), '+ 추가', t.primary, '#fff')}
          </div>
          {cards.map(card => {
            const cardUsed = getCardUsed(card)
            const pct = Math.min((cardUsed / (card.limit || 1)) * 100, 100)
            const achieved = card.limit > 0 && cardUsed >= card.limit

            // 일반 카드 아이템
            return (
              <div key={card.id} style={{ marginBottom: 10, background: t.card || '#fff', borderRadius: 14,
                border: `1.5px solid ${t.primary}18`, overflow: 'hidden' }}>
                {/* 카드 본문 – 탭하면 상세 모달 */}
                <div style={{ padding: '12px 14px', cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedCard(card)
                    setCardDetailTab('benefits')
                    const q2 = query(collection(db, 'transactions'), where('uid', '==', user.uid), where('payment', '==', card.name))
                    setCardHistoryMonth(null)
                    getDocs(q2).then(snap => setCardTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: t.text || '#111' }}>{card.name}</span>
                      <span style={{ fontSize: 10, background: card.cardType === 'credit' ? '#fee2e2' : '#e0f2fe', color: card.cardType === 'credit' ? '#ef4444' : '#0284c7', borderRadius: 20, padding: '2px 7px', fontWeight: 600 }}>
                        {card.cardType === 'credit' ? '신용' : '체크'}
                      </span>
                      {achieved && <span style={{ fontSize: 10, background: '#dcfce7', color: '#16a34a', borderRadius: 20, padding: '2px 7px', fontWeight: 600 }}>✓ 달성</span>}
                    </div>
                    <button onClick={e => {
                      e.stopPropagation()
                      setExpandedCardId(expandedCardId === card.id ? null : card.id)
                    }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: expandedCardId === card.id ? t.primary : '#bbb', padding: 4, lineHeight: 0, flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  </div>
                  {(card.billingDay || card.cardNumber) && (
                    <p style={{ fontSize: 11, color: '#bbb', marginBottom: 8 }}>
                      {card.billingDay ? `결제일 매월 ${card.billingDay}일` : ''}
                      {card.billingDay && card.cardNumber ? ' · ' : ''}
                      {card.cardNumber ? `**** ${card.cardNumber}` : ''}
                    </p>
                  )}
                  <p style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>이번 달 사용</p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: t.text || '#111', marginBottom: 6 }}>{fmt(cardUsed)}원</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: '#aaa' }}>목표 {fmt(card.limit || 0)}원</span>
                    {card.limit > 0 && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: achieved ? '#22c55e' : t.primary }}>
                        {achieved ? '✓ 달성' : `${Math.round(pct)}%`}
                      </span>
                    )}
                  </div>
                  <div style={{ background: '#f0f0f0', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, background: achieved ? '#22c55e' : t.primary, width: `${pct}%`, transition: 'width 0.3s' }} />
                  </div>
                </div>
                {/* 수정/삭제 펼침 행 */}
                {expandedCardId === card.id && (
                  <div style={{ display: 'flex', borderTop: '1px solid #f0f0f0' }}>
                    <button onClick={() => {
                      setEditingCardId(card.id)
                      setEditCardData({
                        cardType: card.cardType || 'debit',
                        name: card.name,
                        cardNumber: card.cardNumber || '',
                        expiry: card.expiry || '',
                        linkedAccount: card.linkedAccount || '',
                        limit: String(card.limit || ''),
                        billingDay: card.billingDay ? String(card.billingDay) : '',
                      })
                      setExpandedCardId(null)
                    }} style={{ flex: 1, padding: '11px', border: 'none', background: t.card || '#fff', color: '#555', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      수정
                    </button>
                    <div style={{ width: 1, background: '#f0f0f0' }} />
                    <button onClick={e => { e.stopPropagation(); handleDeleteCard(card.id) }}
                      style={{ flex: 1, padding: '11px', border: 'none', background: t.card || '#fff', color: '#ef4444', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                      삭제
                    </button>
                  </div>
                )}
              </div>
            )
          })}
          {showAddCard && (
            <div style={{ position: 'fixed', inset: 0, background: t.bg || '#f5f6f8', zIndex: 500, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 20px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => setShowAddCard(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#333', padding: 0, lineHeight: 1 }}>‹</button>
                  <p style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>카드 추가</p>
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0' }}>
                <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 12 }}>카드 종류</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[{ val: 'debit', label: '체크카드' }, { val: 'credit', label: '신용카드' }].map(opt => (
                      <button key={opt.val} onClick={() => setNewCard(c => ({ ...c, cardType: opt.val }))}
                        style={{ flex: 1, padding: '12px', borderRadius: 10,
                          border: `1.5px solid ${newCard.cardType === opt.val ? t.primary : '#e8e8e8'}`,
                          background: newCard.cardType === opt.val ? t.primary + '15' : '#fff',
                          color: newCard.cardType === opt.val ? t.primary : '#888',
                          fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{opt.label}</button>
                    ))}
                  </div>
                </div>
                <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 12 }}>
                  {[
                    { label: '카드 이름', req: true, placeholder: '예: 신한카드', key: 'name', type: 'text', extra: {} },
                    { label: '카드번호 끝 4자리', req: false, placeholder: '예: 1234', key: 'cardNumber', type: 'text', extra: { maxLength: 4 } },
                    { label: '유효기간', req: false, placeholder: 'MM/YY', key: 'expiry', type: 'text', extra: {} },
                    { label: '실적 목표 금액', req: false, placeholder: '예: 300000', key: 'limit', type: 'number', extra: {} },
                    { label: '결제일', req: false, placeholder: '예: 15', key: 'billingDay', type: 'number', extra: { min: '1', max: '31' } },
                  ].map(({ label, req, placeholder, key, type, extra }, i, arr) => (
                    <div key={key} style={{ marginBottom: i < arr.length - 1 ? 16 : 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 8 }}>{label}{req && <span style={{ color: '#ef4444' }}> *</span>}</p>
                      <input style={{ ...inputStyle }} type={type} placeholder={placeholder}
                        value={newCard[key]} onChange={e => setNewCard(c => ({ ...c, [key]: e.target.value }))} {...extra} />
                    </div>
                  ))}
                </div>
                <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 24 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 12 }}>연동 계좌 <span style={{ fontSize: 12, color: '#bbb', fontWeight: 400 }}>(선택)</span></p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {[{ id: '__none', name: '연동 계좌 없음' }, ...accounts].map(a => {
                      const sel = a.id === '__none' ? newCard.linkedAccount === '' : newCard.linkedAccount === a.name
                      return (
                        <button key={a.id} onClick={() => setNewCard(c => ({ ...c, linkedAccount: a.id === '__none' ? '' : a.name }))}
                          style={{ padding: '8px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 13, border: 'none',
                            background: sel ? t.primary + '22' : '#f0f0f0',
                            color: sel ? t.primary : '#666', fontWeight: sel ? 600 : 400 }}>{a.name}</button>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div style={{ padding: '12px 16px calc(env(safe-area-inset-bottom, 0px) + 16px)', background: '#fff', borderTop: '1px solid #f0f0f0', flexShrink: 0 }}>
                <button onClick={handleAddCard} style={{ width: '100%', padding: '16px', borderRadius: 14, background: t.primary, color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
                  추가하기
                </button>
              </div>
            </div>
          )}
          {editingCardId && (
            <div style={{ position: 'fixed', inset: 0, background: t.bg || '#f5f6f8', zIndex: 500, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 20px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => setEditingCardId(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#333', padding: 0, lineHeight: 1 }}>‹</button>
                  <p style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>카드 수정</p>
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0' }}>
                <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 12 }}>카드 종류</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[{ val: 'debit', label: '체크카드' }, { val: 'credit', label: '신용카드' }].map(opt => (
                      <button key={opt.val} onClick={() => setEditCardData(d => ({ ...d, cardType: opt.val }))}
                        style={{ flex: 1, padding: '12px', borderRadius: 10,
                          border: `1.5px solid ${editCardData.cardType === opt.val ? t.primary : '#e8e8e8'}`,
                          background: editCardData.cardType === opt.val ? t.primary + '15' : '#fff',
                          color: editCardData.cardType === opt.val ? t.primary : '#888',
                          fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{opt.label}</button>
                    ))}
                  </div>
                </div>
                <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 12 }}>
                  {[
                    { label: '카드 이름', req: true, placeholder: '예: 신한카드', key: 'name', type: 'text', extra: {} },
                    { label: '카드번호 끝 4자리', req: false, placeholder: '예: 1234', key: 'cardNumber', type: 'text', extra: { maxLength: 4 } },
                    { label: '유효기간', req: false, placeholder: 'MM/YY', key: 'expiry', type: 'text', extra: {} },
                    { label: '실적 목표 금액', req: false, placeholder: '예: 300000', key: 'limit', type: 'number', extra: {} },
                    { label: '결제일', req: false, placeholder: '예: 15', key: 'billingDay', type: 'number', extra: { min: '1', max: '31' } },
                  ].map(({ label, req, placeholder, key, type, extra }, i, arr) => (
                    <div key={key} style={{ marginBottom: i < arr.length - 1 ? 16 : 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 8 }}>{label}{req && <span style={{ color: '#ef4444' }}> *</span>}</p>
                      <input style={{ ...inputStyle }} type={type} placeholder={placeholder}
                        value={editCardData[key] || ''} onChange={e => setEditCardData(d => ({ ...d, [key]: e.target.value }))} {...extra} />
                    </div>
                  ))}
                </div>
                <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 24 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 12 }}>연동 계좌 <span style={{ fontSize: 12, color: '#bbb', fontWeight: 400 }}>(선택)</span></p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {[{ id: '__none', name: '연동 계좌 없음' }, ...accounts].map(a => {
                      const sel = a.id === '__none' ? editCardData.linkedAccount === '' : editCardData.linkedAccount === a.name
                      return (
                        <button key={a.id} onClick={() => setEditCardData(d => ({ ...d, linkedAccount: a.id === '__none' ? '' : a.name }))}
                          style={{ padding: '8px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 13, border: 'none',
                            background: sel ? t.primary + '22' : '#f0f0f0',
                            color: sel ? t.primary : '#666', fontWeight: sel ? 600 : 400 }}>{a.name}</button>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div style={{ padding: '12px 16px calc(env(safe-area-inset-bottom, 0px) + 16px)', background: '#fff', borderTop: '1px solid #f0f0f0', flexShrink: 0 }}>
                <button onClick={handleSaveCard} style={{ width: '100%', padding: '16px', borderRadius: 14, background: t.primary, color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
                  저장하기
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 계좌 */}
        <div style={{ background: t.card, borderRadius: 16, padding: '16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: t.text || '#111' }}>계좌</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => setShowAccountNumbers(!showAccountNumbers)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: showAccountNumbers ? t.primary : '#bbb', lineHeight: 0 }}>
                {showAccountNumbers ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                )}
              </button>
              {smallBtn(() => setShowAddAccount(true), '+ 추가', t.primary, '#fff')}
            </div>
          </div>
          {accounts.map(acc => (
            <div key={acc.id}>
              {editingAccountId === acc.id ? (
                <div style={{ background: '#f8f8f8', borderRadius: 12, padding: '12px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input style={inputStyle} placeholder="은행/계좌 이름" value={editAccountData.name} onChange={e => setEditAccountData(d => ({ ...d, name: e.target.value }))} />
                    <input style={inputStyle} type="number" placeholder="현재 잔액" value={editAccountData.balance} onChange={e => setEditAccountData(d => ({ ...d, balance: e.target.value }))} />
                    <input style={inputStyle} placeholder="계좌번호 (선택)" value={editAccountData.number} onChange={e => setEditAccountData(d => ({ ...d, number: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button onClick={() => setEditingAccountId(null)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid #e8e8e8', background: '#fff', cursor: 'pointer', fontSize: 13 }}>취소</button>
                    <button onClick={handleSaveAccount} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: t.primary, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>저장</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: expandedAccountHistoryId === acc.id ? 'none' : '1px solid #f8f8f8' }}>
                    <div>
                      <p style={{ fontSize: 14, color: t.text || '#333' }}>{acc.name}</p>
                      {acc.number && <p style={{ fontSize: 12, color: '#bbb', marginTop: 2 }}>{showAccountNumbers ? acc.number : maskAccountNumber(acc.number)}</p>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: t.text || '#111' }}>{fmt(getAccountBalance(acc))}원</p>
                      <button onClick={() => setExpandedAccountHistoryId(expandedAccountHistoryId === acc.id ? null : acc.id)}
                        style={{ background: '#f0f0f0', border: 'none', borderRadius: 6, padding: '3px 8px', color: '#888', fontSize: 11, cursor: 'pointer' }}>
                        {expandedAccountHistoryId === acc.id ? '▲' : '월별 ▾'}
                      </button>
                      <button onClick={() => handleEditAccount(acc)} style={{ background: t.primaryLight || '#EEF2FF', border: 'none', borderRadius: 6, padding: '3px 8px', color: t.primary, fontSize: 11, cursor: 'pointer' }}>수정</button>
                      <button onClick={() => handleDeleteAccount(acc.id)} style={{ background: 'none', border: 'none', color: '#ccc', fontSize: 16, cursor: 'pointer' }}>✕</button>
                    </div>
                  </div>
                  {expandedAccountHistoryId === acc.id && (() => {
                    const months = Array.from({ length: 6 }, (_, i) => {
                      const d = new Date()
                      d.setDate(1)
                      d.setMonth(d.getMonth() - (5 - i))
                      return { year: d.getFullYear(), month: d.getMonth() + 1, label: `${d.getMonth() + 1}월` }
                    })
                    const balances = months.map(m => getBalanceAtMonthEnd(acc, m.year, m.month))
                    const maxAbs = Math.max(...balances.map(b => Math.abs(b)), 1)
                    return (
                      <div style={{ background: '#f8f8f8', borderRadius: 10, padding: '12px', marginBottom: 8, borderBottom: '1px solid #f8f8f8' }}>
                        {/* 미니 바 차트 */}
                        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 52, marginBottom: 2 }}>
                          {balances.map((bal, i) => (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                              <div style={{ width: '100%', borderRadius: 3, background: bal < 0 ? '#fca5a5' : (t.primary + '88'), height: `${Math.max(4, Math.abs(bal) / maxAbs * 36)}px` }} />
                              <span style={{ fontSize: 9, color: '#bbb' }}>{months[i].label}</span>
                            </div>
                          ))}
                        </div>
                        {/* 최근 3개월 요약 */}
                        {balances.slice(-3).map((bal, i) => {
                          const m = months[months.length - 3 + i]
                          const now = new Date()
                          const isCurrent = now.getFullYear() === m.year && now.getMonth() + 1 === m.month
                          return (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderTop: '1px solid #efefef' }}>
                              <span style={{ fontSize: 12, color: isCurrent ? t.primary : '#888', fontWeight: isCurrent ? 600 : 400 }}>
                                {m.year} {m.month}월{isCurrent ? ' (이번 달)' : ''}
                              </span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: bal < 0 ? '#ef4444' : (t.text || '#111') }}>
                                {fmt(bal)}원
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </>
              )}
            </div>
          ))}
          {showAddAccount && (
            <div style={{ background: '#f8f8f8', borderRadius: 12, padding: '14px', marginTop: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input style={inputStyle} placeholder="은행/계좌 이름" value={newAccount.name} onChange={e => setNewAccount(a => ({ ...a, name: e.target.value }))} />
                <input style={inputStyle} type="number" placeholder="잔액" value={newAccount.balance} onChange={e => setNewAccount(a => ({ ...a, balance: e.target.value }))} />
                <input style={inputStyle} placeholder="계좌번호 (선택)" value={newAccount.number} onChange={e => setNewAccount(a => ({ ...a, number: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button onClick={() => setShowAddAccount(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid #e8e8e8', background: '#fff', cursor: 'pointer', fontSize: 13 }}>취소</button>
                <button onClick={handleAddAccount} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: t.primary, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>추가</button>
              </div>
            </div>
          )}
        </div>

        {/* 현금 */}
        <div style={{ background: t.card, borderRadius: 16, padding: '16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: t.text || '#111' }}>현금</p>
            {!editingCash && smallBtn(() => { setEditingCash(true); setCashInput(String(cash || '')) }, '수정', t.primaryLight || '#EEF2FF', t.primary)}
          </div>
          {editingCash ? (
            <div style={{ marginTop: 12 }}>
              <input type="number" value={cashInput} onChange={e => setCashInput(e.target.value)} style={inputStyle} placeholder="현금 잔액 입력" autoFocus />
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button onClick={() => setEditingCash(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid #e8e8e8', background: '#fff', cursor: 'pointer', fontSize: 13 }}>취소</button>
                <button onClick={handleCashSave} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: t.primary, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>저장</button>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 24, fontWeight: 700, color: t.text || '#111', marginTop: 8 }}>{fmt(getCashBalance())}원</p>
          )}
        </div>

      </div>

      {/* 설정 – 전체 화면 */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, background: t.bg || '#f5f6f8', zIndex: 300, display: 'flex', flexDirection: 'column' }}>
          {/* 헤더 */}
          <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 20px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#333', padding: 0, lineHeight: 1 }}>‹</button>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>설정</p>
            </div>
          </div>

          {/* 스크롤 영역 */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {/* 테마 – 3열 그리드 */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 14 }}>테마</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {Object.entries(THEMES).map(([key, val]) => (
                  <button key={key} onClick={() => handleThemeChange(key)}
                    style={{ padding: '12px 8px', borderRadius: 14, cursor: 'pointer', textAlign: 'center',
                      border: themeName === key ? `2px solid ${val.primary}` : '2px solid #f0f0f0',
                      background: themeName === key ? val.primary + '18' : '#fafafa' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: val.primary, margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {themeName === key && (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: themeName === key ? val.primary : '#555' }}>{val.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 데이터 내보내기 */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 14 }}>데이터 내보내기</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={exportToExcel} disabled={exporting}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, border: '1.5px solid #f0f0f0', background: '#fafafa', cursor: 'pointer' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                  </div>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#111', marginBottom: 2 }}>엑셀로 내보내기</p>
                    <p style={{ fontSize: 12, color: '#888' }}>전체 내역을 .xlsx 파일로 저장</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
                <button onClick={exportToPDF} disabled={exporting}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, border: '1.5px solid #f0f0f0', background: '#fafafa', cursor: 'pointer' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
                    </svg>
                  </div>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#111', marginBottom: 2 }}>PDF로 내보내기</p>
                    <p style={{ fontSize: 12, color: '#888' }}>전체 내역을 .pdf 파일로 저장</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
              {exporting && <p style={{ textAlign: 'center', color: '#888', fontSize: 13, marginTop: 12 }}>내보내는 중...</p>}
            </div>

            {/* 메뉴 */}
            <div style={{ background: '#fff', borderRadius: 16, marginBottom: 16, overflow: 'hidden' }}>
              <button onClick={() => window.open('https://gratis-corn-b7d.notion.site/moa-374125b81f2380b18331dce2355b06d3?source=copy_link', '_blank')}
                style={{ width: '100%', padding: '16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: t.primaryLight || '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                </div>
                <span style={{ flex: 1, fontSize: 14, color: '#333', textAlign: 'left' }}>이용 방법</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              <div style={{ height: 1, background: '#f5f5f5', margin: '0 16px' }} />
              <button onClick={() => setShowUpdates(true)}
                style={{ width: '100%', padding: '16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                </div>
                <span style={{ flex: 1, fontSize: 14, color: '#333', textAlign: 'left' }}>업데이트 내용</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              <div style={{ height: 1, background: '#f5f5f5', margin: '0 16px' }} />
              <button onClick={() => window.location.href = 'mailto:0o0moa030@gmail.com?subject=모아 앱 피드백'}
                style={{ width: '100%', padding: '16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                  </svg>
                </div>
                <span style={{ flex: 1, fontSize: 14, color: '#333', textAlign: 'left' }}>피드백</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>

          {/* 로그아웃 – 하단 고정 */}
          <div style={{ padding: '12px 16px calc(env(safe-area-inset-bottom, 0px) + 16px)', background: t.bg || '#f5f6f8', borderTop: '1px solid #f0f0f0', flexShrink: 0 }}>
            <button onClick={() => signOut(auth).then(() => {
              localStorage.removeItem('moa_logged_in')
              setShowSettings(false)
              navigate('/', { replace: true })
            })} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1.5px solid #fee2e2', background: 'transparent', color: '#ef4444', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              로그아웃
            </button>
          </div>
        </div>
      )}

      {/* 업데이트 내역 모달 */}
      {showUpdates && (
        <div style={{ position: 'fixed', inset: 0, background: '#fff', zIndex: 500, overflowY: 'auto' }}>
            <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 20px 40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                    <button onClick={() => setShowUpdates(false)}
                        style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#333', padding: 0 }}>‹</button>
                    <p style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>업데이트 내용</p>
                </div>

                {[
                    {
                        version: 'v1.4.0',
                        date: '2026.06.09',
                        changes: [
                            '[ 가계부 ] 대출 / 상환 기능 추가',
                            '[ 가계부 ] 내역 버그 수정',
                            '[ MY - 카드 정보 ] 실시간 사용 금액 연동 오류 수정',
                            '[ MY - 계좌 ] 기준 잔액 → 현재 잔액으로 수정 + 변경 가능',
                            '[ MY - 계좌 ] 가계부 내역과 자동 연동 → 자동 잔액 수정 기능 추가',
                        ]
                    },
                    {
                        version: 'v1.3.0',
                        date: '2026.06.06',
                        changes: [
                            '[ 가계부 ] 계좌 간 이체 기능 추가',
                            '[ 분석 ] AI 분석 오류 수정',
                            '[ MY - 카드 정보 ] 계좌 연동 선택 → 필수항목에서 배제',
                        ]
                    },
                    {
                        version: 'v1.2.0',
                        date: '2026.06.05',
                        changes: [
                            '[ 홈, 분석 ] 카테고리 원형 그래프 수정',
                            '[ 홈 ] 최근 내역 버그 수정',
                            '[ 캘린더 ] 고정지출, 카드대금, 내역 버그 수정',
                            '[ 가계부 ] 카드대금 내역 디자인 수정',
                            '[ 분석 ] 결제수단별 지출 → 카드 / 이체 및 결제 수단 세분화',
                            '[ MY - 계좌 ] 가계부 내역과 자동 연동 → 자동 잔액 수정 (직접 수정 가능) 기능 추가',
                        ]
                    },
                    {
                        version: 'v1.1.0',
                        date: '2026.06.04',
                        changes: [
                            '공과금 탭 설정 연동성 오류 수정',
                            '[ 가계부 ] “가스비”, “관리비” 등 공과금 목록 텍스트 자동 인식 → [ 분석 - 공과금 ] 자동 입력 기능 추가',
                            '[ MY - 카드 정보 ] 혜택 입력창 고정 + 내역 연/월 설정 기능 추가',
                            '[ MY - 설정 ] 이용 방법, 업데이트 사항, 피드백 탭 추가',
                            '[ 분석 ] 막대 그래프 수정',
                            '[ 분석 - 공과금 ] 가계부 연동 세부사항 수정 + 삭제 기능 추가',
                            '[ MY ] 카드 정보 UI 수정',
                            '[ MY ] 버그 수정',
                        ]
                    },
                    {
                        version: 'v1.0.0',
                        date: '2026.06.03',
                        changes: [
                            '모아 가계부 출시 🎉',
                        ]
                    },
                ].map((v, i) => {
                    const isOpen = expandedVersion === v.version
                    return (
                        <div key={i} style={{ marginBottom: 8 }}>
                            {/* 버전 헤더 - 클릭으로 열기/닫기 */}
                            <button
                                onClick={() => setExpandedVersion(isOpen ? null : v.version)}
                                style={{ width: '100%', background: isOpen ? '#f8f8f8' : '#fff', border: '1px solid #f0f0f0',
                                    borderRadius: isOpen ? '12px 12px 0 0' : 12, padding: '14px 16px', cursor: 'pointer',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{v.version}</span>
                                    <span style={{ fontSize: 12, color: '#aaa' }}>{v.date}</span>
                                </div>
                                <span style={{ fontSize: 13, color: '#bbb', transition: 'transform 0.2s',
                                    display: 'inline-block', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
                            </button>

                            {/* 변경 내용 - 펼쳐질 때만 표시 */}
                            {isOpen && (
                                <div style={{ background: '#f8f8f8', border: '1px solid #f0f0f0', borderTop: 'none',
                                    borderRadius: '0 0 12px 12px', padding: '12px 16px 16px' }}>
                                    {v.changes.map((c, j) => (
                                        <div key={j} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                                            <span style={{ fontSize: 13, color: '#bbb', flexShrink: 0 }}>•</span>
                                            <p style={{ fontSize: 14, color: '#444', lineHeight: 1.5 }}>{c}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
      )}

      {/* 카드 상세 모달 */}
      {selectedCard && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 400, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 430, maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                {/* 카드 헤더 */}
                <div style={{ background: t.primary, padding: '24px 20px 20px', borderRadius: '20px 20px 0 0', color: '#fff', flexShrink: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                        <p style={{ fontSize: 18, fontWeight: 700 }}>{selectedCard.name}</p>
                        <button onClick={() => setSelectedCard(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '4px 10px', color: '#fff', cursor: 'pointer', fontSize: 14 }}>✕</button>
                    </div>
                    <p style={{ fontSize: 18, letterSpacing: 4, marginBottom: 14, opacity: 0.9 }}>
                        **** **** **** {selectedCard.cardNumber || '****'}
                    </p>
                    <div style={{ display: 'flex', gap: 24 }}>
                        <div>
                            <p style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>유효기간</p>
                            <p style={{ fontSize: 13 }}>{selectedCard.expiry || '--/--'}</p>
                        </div>
                        {selectedCard.linkedAccount && (
                            <div>
                                <p style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>연동 계좌</p>
                                <p style={{ fontSize: 13 }}>{selectedCard.linkedAccount}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 혜택/내역 탭 */}
                <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
                    {[{ key: 'benefits', label: '혜택' }, { key: 'history', label: '내역' }].map(tab => (
                        <button key={tab.key} onClick={() => setCardDetailTab(tab.key)}
                            style={{ flex: 1, padding: '14px', border: 'none', background: 'none', cursor: 'pointer',
                                fontSize: 14, fontWeight: cardDetailTab === tab.key ? 600 : 400,
                                color: cardDetailTab === tab.key ? t.primary : '#888',
                                borderBottom: cardDetailTab === tab.key ? `2px solid ${t.primary}` : '2px solid transparent' }}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* 스크롤 콘텐츠 */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                    {cardDetailTab === 'benefits' ? (
                        <div>
                            {(selectedCard.benefits || []).length === 0 && (
                                <p style={{ fontSize: 14, color: '#bbb', textAlign: 'center', padding: '20px 0' }}>혜택을 추가해보세요</p>
                            )}
                            {(selectedCard.benefits || []).map((b, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f8f8f8' }}>
                                    <p style={{ fontSize: 14, color: '#333' }}>• {b}</p>
                                    <button onClick={() => {
                                        const updated = cards.map(c => c.id === selectedCard.id
                                            ? { ...c, benefits: c.benefits.filter((_, j) => j !== i) } : c)
                                        setCards(updated); saveToFirestore({ cards: updated })
                                        setSelectedCard(prev => ({ ...prev, benefits: prev.benefits.filter((_, j) => j !== i) }))
                                    }} style={{ background: 'none', border: 'none', color: '#ddd', cursor: 'pointer', fontSize: 16 }}>✕</button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div>
                            {/* 연/월 스크롤 선택 */}
                            {cardTransactions.length > 0 && (() => {
                                const availableMonths = [...new Set(
                                    cardTransactions.map(tx => tx.month || tx.date?.slice(0, 7) || '')
                                )].filter(Boolean).sort((a, b) => b.localeCompare(a))
                                return (
                                    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 4 }}>
                                        <button onClick={() => setCardHistoryMonth(null)}
                                            style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                                                background: cardHistoryMonth === null ? t.primary : '#f0f0f0',
                                                color: cardHistoryMonth === null ? '#fff' : '#666', fontSize: 12 }}>전체</button>
                                        {availableMonths.map(m => (
                                            <button key={m} onClick={() => setCardHistoryMonth(m)}
                                                style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                                                    background: cardHistoryMonth === m ? t.primary : '#f0f0f0',
                                                    color: cardHistoryMonth === m ? '#fff' : '#666', fontSize: 12 }}>
                                                {m.replace(/^(\d{4})-0?(\d+)$/, '$1년 $2월')}
                                            </button>
                                        ))}
                                    </div>
                                )
                            })()}

                            {/* 내역 목록 */}
                            {cardTransactions.length === 0 ? (
                                <p style={{ fontSize: 14, color: '#bbb', textAlign: 'center', padding: '20px 0' }}>이 카드로 결제한 내역이 없어요</p>
                            ) : (() => {
                                const filtered = cardHistoryMonth
                                    ? cardTransactions.filter(tx => (tx.month || tx.date?.slice(0, 7)) === cardHistoryMonth)
                                    : cardTransactions
                                const byMonth = filtered.reduce((acc, tx) => {
                                    const m = tx.month || tx.date?.slice(0, 7) || '기타'
                                    if (!acc[m]) acc[m] = []
                                    acc[m].push(tx)
                                    return acc
                                }, {})
                                return filtered.length === 0 ? (
                                    <p style={{ fontSize: 14, color: '#bbb', textAlign: 'center', padding: '20px 0' }}>내역이 없어요</p>
                                ) : Object.keys(byMonth).sort((a, b) => b.localeCompare(a)).map(month => (
                                    <div key={month}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 8px' }}>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: t.primary, whiteSpace: 'nowrap' }}>
                                                {month.replace(/^(\d{4})-0?(\d+)$/, '$1년 $2월')}
                                            </span>
                                            <div style={{ flex: 1, height: 0.5, background: '#e8e8e8' }} />
                                            <span style={{ fontSize: 11, color: '#bbb', whiteSpace: 'nowrap' }}>
                                                -{byMonth[month].filter(tx => tx.type === 'expense').reduce((s, tx) => s + (tx.amount || 0), 0).toLocaleString()}원
                                            </span>
                                        </div>
                                        {byMonth[month].sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(tx => (
                                            <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f8f8f8' }}>
                                                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', marginRight: 8 }}>
                                                    <p style={{ fontSize: 14, color: '#111', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.title}</p>
                                                    <p style={{ fontSize: 11, color: '#bbb' }}>{tx.date} · {tx.category}</p>
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

                {/* 혜택 입력 — 하단 고정 */}
                {cardDetailTab === 'benefits' && (
                    <div style={{ padding: '12px 20px 36px', borderTop: '1px solid #f0f0f0', background: '#fff', flexShrink: 0 }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input id="benefitInput" placeholder="혜택 입력 (예: 스타벅스 10% 할인)"
                                style={{ flex: 1, padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e8e8e8', fontSize: 13, outline: 'none', background: '#fafafa' }} />
                            <button onClick={() => {
                                const val = document.getElementById('benefitInput').value.trim()
                                if (!val) return
                                const updated = cards.map(c => c.id === selectedCard.id
                                    ? { ...c, benefits: [...(c.benefits || []), val] } : c)
                                setCards(updated); saveToFirestore({ cards: updated })
                                setSelectedCard(prev => ({ ...prev, benefits: [...(prev.benefits || []), val] }))
                                document.getElementById('benefitInput').value = ''
                            }} style={{ padding: '11px 16px', borderRadius: 10, border: 'none', background: t.primary, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>추가</button>
                        </div>
                    </div>
                )}

            </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}