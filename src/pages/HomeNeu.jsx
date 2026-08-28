import { PieChart, Pie, Cell, Tooltip } from 'recharts'
import BottomSheet from '../components/BottomSheet'
import LoadError from '../components/LoadError'
import { TipIcon } from './Home'

const NEU_BG = '#EAEEF3'

function NeuPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="neu-card" style={{ borderRadius: 12, padding: '8px 14px' }}>
      <p style={{ fontSize: 11, color: '#8B95A1', marginBottom: 4 }}>{payload[0].name}</p>
      <p style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>{payload[0].value.toLocaleString()}원</p>
    </div>
  )
}

const neuInputStyle = {
  width: '100%', padding: '14px 16px', borderRadius: 14,
  border: 'none', fontSize: 15, outline: 'none', color: '#191F28', boxSizing: 'border-box',
}

// 예산 추가/수정 시트의 공용 폼 (뉴모피즘 스타일)
function BudgetForm({ data, setData, categories, primary, onCancel, onSubmit, submitLabel, title }) {
  return (
    <div style={{ padding: '40px 24px calc(env(safe-area-inset-bottom, 0px) + 32px)', '--neu-focus': primary + '59' }}>
      <p style={{ fontSize: 20, fontWeight: 700, color: '#191F28', marginBottom: 24 }}>{title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#191F28', marginBottom: 8 }}>예산 이름</p>
          <input className="neu-inset" style={neuInputStyle} placeholder="예: 식비, 전체 생활비" value={data.label} onChange={e => setData(d => ({ ...d, label: e.target.value }))} />
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#191F28', marginBottom: 8 }}>금액</p>
          <input className="neu-inset" style={neuInputStyle} type="number" placeholder="예: 300000" value={data.amount} onChange={e => setData(d => ({ ...d, amount: e.target.value }))} />
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#191F28', marginBottom: 8 }}>기간</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input className="neu-inset" style={{ ...neuInputStyle, flex: 1 }} type="date" value={data.startDate} onChange={e => setData(d => ({ ...d, startDate: e.target.value }))} />
            <span style={{ color: '#8B95A1', fontSize: 15 }}>~</span>
            <input className="neu-inset" style={{ ...neuInputStyle, flex: 1 }} type="date" value={data.endDate} onChange={e => setData(d => ({ ...d, endDate: e.target.value }))} />
          </div>
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#191F28', marginBottom: 8 }}>반복</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['none', '없음'], ['monthly', '매달'], ['period', '기간 설정']].map(([val, label]) => {
              const selected = (data.repeat || 'none') === val
              return (
                <button key={val} onClick={() => setData(d => ({ ...d, repeat: val }))}
                  className={`neu-chip${selected ? ' selected' : ''}`}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 12,
                    color: selected ? primary : '#8B95A1', fontSize: 13, fontWeight: selected ? 700 : 500 }}>
                  {label}
                </button>
              )
            })}
          </div>
          {data.repeat === 'period' && (
            <input className="neu-inset" style={{ ...neuInputStyle, marginTop: 10 }} type="date" value={data.repeatUntil}
              onChange={e => setData(d => ({ ...d, repeatUntil: e.target.value }))} />
          )}
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#191F28', marginBottom: 8 }}>카테고리 <span style={{ fontSize: 12, color: '#8B95A1', fontWeight: 400 }}>(미선택 시 전체 반영)</span></p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {categories.map(cat => {
              const selected = (data.categories || []).includes(cat)
              return (
                <button key={cat} onClick={() => setData(d => ({
                  ...d,
                  categories: selected ? (d.categories || []).filter(c => c !== cat) : [...(d.categories || []), cat]
                }))} className={`neu-chip${selected ? ' selected' : ''}`}
                  style={{ padding: '7px 14px', borderRadius: 12, color: selected ? primary : '#8B95A1', fontSize: 13, fontWeight: selected ? 700 : 500 }}>
                  {cat}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
        <button onClick={onCancel} className="neu-btn"
          style={{ flex: 1, height: 56, borderRadius: 16, color: '#8B95A1', fontSize: 16, fontWeight: 600 }}>취소</button>
        <button onClick={onSubmit} className="neu-btn"
          style={{ flex: 2, height: 56, borderRadius: 16, color: primary, fontSize: 16, fontWeight: 700 }}>{submitLabel}</button>
      </div>
    </div>
  )
}

export default function HomeNeu({
  loadError, themeData, now, fmt, totalIncome, totalExpense, budgets, budgetsWithStats,
  showAddBudget, setShowAddBudget, newBudget, setNewBudget, allExpenseCategories,
  handleAddBudget, editingBudgetId, setEditingBudgetId, editBudgetData, setEditBudgetData, handleSaveBudget,
  expandedBudgetEditId, setExpandedBudgetEditId, expandedTipIds, setExpandedTipIds,
  loadingInsightId, getAiInsight, saveBudgets, upcomingPayments, categoryData, colorMap,
  transactions, navigate,
}) {
  const primary = themeData.primary

  return (
    <div className="neu-page" style={{ minHeight: '100vh', paddingBottom: 'calc(95px + env(safe-area-inset-bottom, 0px))' }}>
      {loadError && (
        <div style={{ padding: '12px 20px 0' }}>
          <LoadError message={loadError} onRetry={() => window.location.reload()} />
        </div>
      )}

      {/* 헤더 — 뉴모피즘 잔액 카드 */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 20px 0' }}>
        <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 4, fontWeight: 500 }}>{now.getFullYear()}년 {now.getMonth() + 1}월</p>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#191F28', marginBottom: 16 }}>이번 달 현황</p>
        <div className="neu-card" style={{ borderRadius: 24, padding: '24px 24px' }}>
          <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 8, fontWeight: 500 }}>이번 달 잔액</p>
          <p style={{ fontSize: 34, fontWeight: 700, marginBottom: 20, letterSpacing: '-1px', lineHeight: 1.1, color: primary }}>
            {fmt(totalIncome - totalExpense)}원
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="neu-inset" style={{ flex: 1, borderRadius: 16, padding: '12px 16px' }}>
              <p style={{ fontSize: 12, color: '#8B95A1', marginBottom: 4, fontWeight: 500 }}>수입</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#2ECC71' }}>+{fmt(totalIncome)}원</p>
            </div>
            <div className="neu-inset" style={{ flex: 1, borderRadius: 16, padding: '12px 16px' }}>
              <p style={{ fontSize: 12, color: '#8B95A1', marginBottom: 4, fontWeight: 500 }}>지출</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#FF5A5F' }}>-{fmt(totalExpense)}원</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '28px 20px 0' }}>
        {/* 예산 관리 */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#191F28' }}>예산 관리</p>
            <button onClick={() => setShowAddBudget(true)} className="neu-btn"
              style={{ borderRadius: 12, padding: '7px 16px', color: primary, fontSize: 13, fontWeight: 700 }}>+ 추가</button>
          </div>

          {budgetsWithStats.length === 0 ? (
            <p style={{ fontSize: 14, color: '#8B95A1', textAlign: 'center', padding: '16px 0' }}>예산을 추가해보세요</p>
          ) : (
            budgetsWithStats.map(b => {
              const { spent, pct, exceeded, color, aiText } = b
              return (
                <div key={b.id} className="neu-card" style={{ marginBottom: 16, borderRadius: 22, overflow: 'hidden' }}>
                  <div style={{ padding: '20px 20px 16px', cursor: 'pointer' }}
                    onClick={() => setExpandedBudgetEditId(expandedBudgetEditId === b.id ? null : b.id)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#191F28' }}>{b.label}</span>
                        {exceeded && <span style={{ fontSize: 11, background: '#FFF1F1', color: '#FF5A5F', borderRadius: 12, padding: '3px 8px', fontWeight: 600 }}>초과</span>}
                        {(b.repeat === 'monthly' || b.repeat === 'period') && (
                          <span style={{ fontSize: 11, background: primary + '15', color: primary, borderRadius: 12, padding: '3px 8px', fontWeight: 600 }}>
                            {b.repeat === 'monthly' ? '매달 반복' : '반복 중'}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 12, color: '#8B95A1' }}>{b.startDate?.slice(5).replace('-', '/')} ~ {b.endDate?.slice(5).replace('-', '/')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div className="neu-inset" style={{ position: 'relative', flexShrink: 0, width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="60" height="60" viewBox="0 0 60 60" style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(163,177,198,0.25)" strokeWidth="7" />
                          <circle cx="30" cy="30" r="24" fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 24} strokeDashoffset={2 * Math.PI * 24 * (1 - pct / 100)}
                            style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
                        </svg>
                        <p style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color }}>{Math.round(pct)}%</p>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 12, color: '#8B95A1', marginBottom: 4 }}>이번 달 사용</p>
                        <p style={{ fontSize: 20, fontWeight: 700, color: '#191F28', marginBottom: 4 }}>{fmt(spent)}원</p>
                        <p style={{ fontSize: 13, fontWeight: 600, color: exceeded ? '#FF5A5F' : '#2ECC71' }}>
                          {exceeded ? `${fmt(spent - b.amount)}원 초과` : `잔여 ${fmt(b.amount - spent)}원`}
                        </p>
                      </div>
                    </div>
                    {aiText && (() => {
                      const ai = typeof aiText === 'string' ? { status: 'good', summary: aiText, tips: [] } : aiText
                      const sc = {
                        danger: { color: '#FF5A5F', dot: '#FF5A5F' },
                        warning: { color: '#F59E0B', dot: '#F59E0B' },
                        good: { color: primary, dot: primary },
                      }[ai.status] || { color: primary, dot: primary }
                      const tips = Array.isArray(ai.tips) ? ai.tips.slice(0, 3) : []
                      return (
                        <div style={{ marginTop: 14 }} onClick={e => e.stopPropagation()}>
                          <div className="neu-inset" style={{ borderRadius: 14, padding: '13px 14px', marginBottom: tips.length > 0 ? 10 : 0, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: sc.dot, flexShrink: 0, marginTop: 5 }} />
                            <p style={{ fontSize: 13, color: '#191F28', lineHeight: 1.65 }}>{ai.summary}</p>
                          </div>
                          {tips.map((tip, i) => {
                            const tipKey = `${b.id}-${i}`
                            const isOpen = !!expandedTipIds[tipKey]
                            return (
                              <div key={i} className="neu-card" style={{ borderRadius: 16, marginBottom: i < tips.length - 1 ? 8 : 0, overflow: 'hidden' }}>
                                <button
                                  onClick={e => { e.stopPropagation(); setExpandedTipIds(prev => ({ ...prev, [tipKey]: !prev[tipKey] })) }}
                                  style={{ width: '100%', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', minHeight: 52, WebkitTapHighlightColor: 'transparent' }}>
                                  <div className="neu-inset" style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <TipIcon type={tip.icon} color={primary} />
                                  </div>
                                  <p style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#191F28', textAlign: 'left', lineHeight: 1.3 }}>{tip.title}</p>
                                  <div style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.22s ease', flexShrink: 0 }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9CDD4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                  </div>
                                </button>
                                <div style={{ maxHeight: isOpen ? '300px' : '0px', overflow: 'hidden', transition: 'max-height 0.25s ease' }}>
                                  <div className="neu-inset" style={{ padding: '12px 16px 14px' }}>
                                    <p style={{ fontSize: 14, color: '#191F28', lineHeight: 1.65 }}>{tip.detail}</p>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })()}
                    <button onClick={e => { e.stopPropagation(); getAiInsight(b, spent) }} disabled={loadingInsightId === b.id}
                      className="neu-btn" style={{ width: '100%', marginTop: 12, borderRadius: 12, padding: '10px 0', color: primary, fontSize: 13, fontWeight: 600 }}>
                      {loadingInsightId === b.id ? '분석 중...' : aiText ? '🔄 다시 분석' : '✨ AI 조언 보기'}
                    </button>
                  </div>
                  {expandedBudgetEditId === b.id && (
                    <div className="neu-inset" style={{ display: 'flex' }}>
                      <button onClick={e => { e.stopPropagation(); setEditingBudgetId(b.id); setEditBudgetData({ label: b.label, startDate: b.startDate, endDate: b.endDate, amount: String(b.amount), categories: b.categories || [], repeat: b.repeat || 'none', repeatUntil: b.repeatUntil || '' }); setExpandedBudgetEditId(null) }}
                        style={{ flex: 1, padding: '14px', border: 'none', background: 'none', color: '#8B95A1', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        수정
                      </button>
                      <button onClick={e => { e.stopPropagation(); saveBudgets(budgets.filter(x => x.id !== b.id)); setExpandedBudgetEditId(null) }}
                        style={{ flex: 1, padding: '14px', border: 'none', background: 'none', color: '#FF5A5F', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* 다가오는 결제 */}
        {upcomingPayments.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#191F28', marginBottom: 16 }}>다가오는 결제</p>
            <div className="neu-card" style={{ borderRadius: 22, padding: '8px 16px' }}>
              {upcomingPayments.map((f, i) => {
                const urgency = f.daysLeft <= 3 ? '#FF5A5F' : f.daysLeft <= 7 ? '#F59E0B' : themeData.primary
                return (
                  <div key={f.id || i} style={{ padding: '12px 4px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: i < upcomingPayments.length - 1 ? '1px solid rgba(163,177,198,0.2)' : 'none' }}>
                    <div className="neu-inset" style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={urgency} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.title}</p>
                      <p style={{ fontSize: 13, color: '#8B95A1' }}>매월 {f.dueDay}일</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#FF5A5F', marginBottom: 6 }}>-{fmt(f.amount)}원</p>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: urgency, borderRadius: 9999, padding: '3px 9px' }}>
                        {f.daysLeft === 0 ? 'D-Day' : `D-${f.daysLeft}`}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 카테고리별 지출 */}
        <div className="neu-card" style={{ borderRadius: 22, padding: '20px', marginBottom: 32 }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#191F28', marginBottom: 20 }}>카테고리별 지출</p>
          {categoryData.length === 0 ? (
            <p style={{ fontSize: 15, color: '#8B95A1', textAlign: 'center', padding: '24px 0' }}>아직 지출 내역이 없어요</p>
          ) : (
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <div className="neu-inset" style={{ position: 'relative', flexShrink: 0, width: 140, height: 140, borderRadius: '50%' }}>
                <PieChart width={140} height={140} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie data={categoryData} cx={70} cy={70} innerRadius={42} outerRadius={64} dataKey="value" paddingAngle={3} startAngle={90} endAngle={-270}>
                    {categoryData.map((entry, i) => <Cell key={i} fill={colorMap[entry.name] || '#C9CDD4'} />)}
                  </Pie>
                  <Tooltip content={<NeuPieTooltip />} wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }} />
                </PieChart>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <p style={{ fontSize: 11, color: '#8B95A1', marginBottom: 3 }}>총 지출</p>
                  <p style={{ fontSize: totalExpense >= 10000000 ? 10 : 13, fontWeight: 700, color: '#191F28', whiteSpace: 'nowrap' }}>
                    {totalExpense >= 10000 ? `${Math.round(totalExpense / 10000)}만원` : `${fmt(totalExpense)}원`}
                  </p>
                </div>
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                {categoryData.slice(0, 6).map((c, i) => {
                  const pct = totalExpense > 0 ? Math.round(c.value / totalExpense * 100) : 0
                  const color = colorMap[c.name] || '#C9CDD4'
                  return (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                          <span style={{ fontSize: 13, color: '#191F28', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                        </div>
                        <span style={{ fontSize: 12, color: '#8B95A1', fontWeight: 600, marginLeft: 4, flexShrink: 0 }}>{pct}%</span>
                      </div>
                      <div className="neu-inset" style={{ height: 6, borderRadius: 9999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 9999, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* 최근 내역 */}
        <div className="neu-card" style={{ borderRadius: 22, padding: '20px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#191F28' }}>최근 내역</p>
            <span onClick={() => navigate('/ledger')} style={{ fontSize: 14, color: primary, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>전체보기 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg></span>
          </div>
          {transactions.length === 0 ? (
            <p style={{ fontSize: 15, color: '#8B95A1', textAlign: 'center', padding: '24px 0' }}>아직 내역이 없어요</p>
          ) : (
            [...transactions].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5).map((t, i, arr) => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(163,177,198,0.2)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <div className="neu-inset" style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {t.type === 'expense' ? '💸' : '💰'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 500, color: '#191F28', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                    <p style={{ fontSize: 13, color: '#8B95A1' }}>{t.date} · {t.category}</p>
                  </div>
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: t.type === 'expense' ? '#FF5A5F' : '#2ECC71', flexShrink: 0, whiteSpace: 'nowrap', marginLeft: 12 }}>
                  {t.type === 'expense' ? '-' : '+'}{fmt(t.amount)}원
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 예산 추가 bottom sheet */}
      <BottomSheet open={showAddBudget} maxOpacity={0.4} background={NEU_BG}
        onClose={() => { setShowAddBudget(false); setNewBudget({ label: '', startDate: '', endDate: '', amount: '', categories: [], repeat: 'none', repeatUntil: '' }) }}>
        <BudgetForm data={newBudget} setData={setNewBudget} categories={allExpenseCategories} primary={primary}
          title="예산 추가" submitLabel="추가"
          onCancel={() => { setShowAddBudget(false); setNewBudget({ label: '', startDate: '', endDate: '', amount: '', categories: [], repeat: 'none', repeatUntil: '' }) }}
          onSubmit={handleAddBudget} />
      </BottomSheet>

      {/* 예산 수정 bottom sheet */}
      <BottomSheet open={!!editingBudgetId} background={NEU_BG} onClose={() => setEditingBudgetId(null)}>
        <BudgetForm data={editBudgetData} setData={setEditBudgetData} categories={allExpenseCategories} primary={primary}
          title="예산 수정" submitLabel="저장"
          onCancel={() => setEditingBudgetId(null)}
          onSubmit={handleSaveBudget} />
      </BottomSheet>
    </div>
  )
}
