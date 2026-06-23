import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'

export default function YearMonthPicker({ viewYear, viewMonth, onConfirm, onClose }) {
  const { themeData } = useTheme()
  const [selYear, setSelYear] = useState(viewYear)
  const [selMonth, setSelMonth] = useState(viewMonth + 1)

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  const item = (selected) => ({
    padding: '11px 0', textAlign: 'center', fontSize: 17,
    fontWeight: selected ? 700 : 400,
    color: selected ? themeData.primary : '#bbb',
    background: selected ? themeData.primary + '18' : 'transparent',
    borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s', margin: '1px 4px',
  })

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'flex-end' }}
      onClick={onClose}>
      <div style={{ width: '100%', background: '#fff', borderRadius: '24px 24px 0 0', padding: '16px 20px calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ width: 36, height: 4, borderRadius: 99, background: '#e0e0e0', margin: '0 auto 14px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', fontSize: 15, cursor: 'pointer', padding: '4px 8px' }}>취소</button>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#111' }}>{selYear}년 {selMonth}월</span>
          <button onClick={() => { onConfirm(selYear, selMonth - 1); onClose() }}
            style={{ background: 'none', border: 'none', color: themeData.primary, fontSize: 15, fontWeight: 700, cursor: 'pointer', padding: '4px 8px' }}>확인</button>
        </div>
        <div style={{ display: 'flex' }}>
          <div style={{ flex: 1, height: 240, overflowY: 'auto' }}>
            <p style={{ fontSize: 11, color: '#ccc', textAlign: 'center', marginBottom: 4 }}>YEAR</p>
            {years.map(y => <div key={y} onClick={() => setSelYear(y)} style={item(selYear === y)}>{y}년</div>)}
          </div>
          <div style={{ width: 1, background: '#f0f0f0', margin: '0 4px' }} />
          <div style={{ flex: 1, height: 240, overflowY: 'auto' }}>
            <p style={{ fontSize: 11, color: '#ccc', textAlign: 'center', marginBottom: 4 }}>MONTH</p>
            {months.map(m => <div key={m} onClick={() => setSelMonth(m)} style={item(selMonth === m)}>{m}월</div>)}
          </div>
        </div>
      </div>
    </div>
  )
}