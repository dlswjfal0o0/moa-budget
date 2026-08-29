import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import FixedPortal from '../components/FixedPortal'
import LoadError from '../components/LoadError'
import { UtilityIcon, UtilityChart } from './Analysis'
import { getColoredShadow } from '../utils/neuColors'

const UTILITY_STYLES = {
  관리비: { color: '#6B7280' },
  수도세: { color: '#3B82F6' },
  전기세: { color: '#F59E0B' },
  가스비: { color: '#F97316' },
}

function NeuBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="neu-card" style={{ borderRadius: 12, padding: '8px 14px' }}>
      <p style={{ fontSize: 11, color: '#8B95A1', marginBottom: 4 }}>{label}일</p>
      <p style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>-{payload[0].value.toLocaleString()}원</p>
    </div>
  )
}

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
  padding: '14px 16px', borderRadius: 14, border: 'none', fontSize: 15, outline: 'none',
  color: '#191F28', boxSizing: 'border-box', width: '100%',
}

export default function AnalysisNeu(props) {
  const {
    showUtilities, loadError,
    viewMonth, viewYear, setViewYear, setViewMonth,
    monthSlideDir, triggerMonthSlide,
    activeAnalysisTab, setActiveAnalysisTab,
    primary, primaryLight, fmt,
    totalExpense, totalIncome, lastTotalExpense, lastTotalIncome, expenseDiff, incomeDiff,
    dailyData, maxExpense,
    categoryData, colorMap,
    aiFeedbackData, aiFeedbackRaw, loadingAi, getAiFeedback,
    expenses,
    expandedPayments, setExpandedPayments,
    utilities, utilityTypes,
    currentMonthTotal, prevMonthTotal, utilityTotalDiff,
    expandedUtilities, toggleUtility,
    utilityAI, loadingUtilityAI, getUtilityAI,
    showAddUtility, setShowAddUtility,
    editingUtility, setEditingUtility,
    newUtility, setNewUtility, saveUtilities,
  } = props
  const coloredShadow = getColoredShadow(primary)

  return (
    <div className="neu-page" style={{ minHeight: '100vh', paddingBottom: 'calc(95px + env(safe-area-inset-bottom, 0px))' }}>

      {loadError && (
        <div style={{ padding: '12px 20px 0' }}>
          <LoadError message={loadError} onRetry={() => window.location.reload()} />
        </div>
      )}

      {/* 헤더 */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => { triggerMonthSlide('prev'); if (viewMonth === 0) { setViewYear(y => y-1); setViewMonth(11) } else setViewMonth(m => m-1) }} aria-label="이전 달"
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#8B95A1', padding: '4px 8px' }}>‹</button>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#191F28',
            animation: monthSlideDir === 'prev' ? 'slideContentRight 260ms ease' : monthSlideDir === 'next' ? 'slideContentLeft 260ms ease' : undefined }}>
            {viewYear}년 {viewMonth + 1}월 분석
          </p>
          <button onClick={() => { triggerMonthSlide('next'); if (viewMonth === 11) { setViewYear(y => y+1); setViewMonth(0) } else setViewMonth(m => m+1) }} aria-label="다음 달"
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#8B95A1', padding: '4px 8px' }}>›</button>
        </div>
      </div>

      {/* 탭 */}
      {showUtilities && (
        <div style={{ padding: '12px 20px 0' }}>
          <div className="neu-inset" style={{ display: 'flex', borderRadius: 9999, padding: 4 }}>
            {['소비', '공과금'].map(tab => (
              <button key={tab} onClick={() => setActiveAnalysisTab(tab)}
                style={{ flex: 1, padding: '10px', borderRadius: 9999, border: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: activeAnalysisTab === tab ? 700 : 500,
                  background: activeAnalysisTab === tab ? primary : 'transparent',
                  boxShadow: activeAnalysisTab === tab ? coloredShadow.raisedSm : 'none',
                  color: activeAnalysisTab === tab ? '#fff' : '#8B95A1' }}>
                {tab}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 소비 탭 ── */}
      {(!showUtilities || activeAnalysisTab === '소비') && (
        <div style={{ padding: '16px 20px' }}>

          {/* 지난 달 대비 */}
          <div className="neu-card" style={{ borderRadius: 20, padding: 16, marginBottom: 16 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28', marginBottom: 16 }}>지난 달 대비</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="neu-inset" style={{ flex: 1, borderRadius: 20, padding: 14 }}>
                <p style={{ fontSize: 12, color: '#8B95A1', marginBottom: 4 }}>지출</p>
                <p style={{ fontSize: 17, fontWeight: 700, color: '#FF5A5F' }}>{fmt(totalExpense)}원</p>
                {lastTotalExpense > 0 && (
                  <p style={{ fontSize: 12, marginTop: 6, color: expenseDiff > 0 ? '#FF5A5F' : '#2ECC71', fontWeight: 600 }}>
                    {expenseDiff > 0 ? '↑' : '↓'} {fmt(Math.abs(expenseDiff))}원 {expenseDiff > 0 ? '증가' : '감소'}
                  </p>
                )}
              </div>
              <div className="neu-inset" style={{ flex: 1, borderRadius: 20, padding: 14 }}>
                <p style={{ fontSize: 12, color: '#8B95A1', marginBottom: 4 }}>수입</p>
                <p style={{ fontSize: 17, fontWeight: 700, color: '#2ECC71' }}>{fmt(totalIncome)}원</p>
                {lastTotalIncome > 0 && (
                  <p style={{ fontSize: 12, marginTop: 6, color: incomeDiff > 0 ? '#2ECC71' : '#FF5A5F', fontWeight: 600 }}>
                    {incomeDiff > 0 ? '↑' : '↓'} {fmt(Math.abs(incomeDiff))}원 {incomeDiff > 0 ? '증가' : '감소'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 일별 지출 */}
          <div className="neu-card" style={{ borderRadius: 20, padding: 16, marginBottom: 16 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28', marginBottom: 16 }}>일별 지출</p>
            {dailyData.every(d => d.amount === 0) ? (
              <p style={{ fontSize: 14, color: '#8B95A1', textAlign: 'center', padding: '20px 0' }}>지출 내역이 없어요</p>
            ) : (
              <>
                <div className="neu-inset" style={{ borderRadius: 16, padding: '12px 8px' }}>
                  <ResponsiveContainer width="100%" height={170}>
                    <BarChart data={dailyData} margin={{ top: 4, right: 12, left: 10, bottom: 0 }}>
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#8B95A1' }} tickLine={false} axisLine={false} interval={4} />
                      <YAxis tick={{ fontSize: 10, fill: '#8B95A1' }} tickLine={false} axisLine={false}
                        tickFormatter={v => {
                          if (v === 0) return ''
                          if (v >= 10000) return `${Math.round(v / 10000)}만`
                          if (v >= 1000) return `${Math.round(v / 1000)}천`
                          return `${v}`
                        }} />
                      <Tooltip content={<NeuBarTooltip />} wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }} />
                      <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                        {dailyData.map((entry, i) => (
                          <Cell key={i} fill={entry.amount > 0 && entry.amount === maxExpense ? primary : 'rgba(163,177,198,0.45)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {maxExpense > 0 && (() => {
                  const maxDay = dailyData.find(d => d.amount === maxExpense)
                  return (
                    <p style={{ fontSize: 12, color: '#8B95A1', textAlign: 'center', marginTop: 10 }}>
                      최고 지출일: <span style={{ color: primary, fontWeight: 700 }}>{maxDay?.day}일</span> (-{fmt(maxExpense)}원)
                    </p>
                  )
                })()}
              </>
            )}
          </div>

          {/* 카테고리별 지출 */}
          <div className="neu-card" style={{ borderRadius: 20, padding: 16, marginBottom: 16 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28', marginBottom: 16 }}>카테고리별 지출</p>
            {categoryData.length === 0 ? (
              <p style={{ fontSize: 14, color: '#8B95A1', textAlign: 'center', padding: '20px 0' }}>지출 내역이 없어요</p>
            ) : (
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div className="neu-inset" style={{ position: 'relative', flexShrink: 0, width: 130, height: 130, borderRadius: '50%' }}>
                  <PieChart width={130} height={130} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Pie data={categoryData} cx={65} cy={65} innerRadius={38} outerRadius={60} dataKey="value" paddingAngle={3} startAngle={90} endAngle={-270}>
                      {categoryData.map((entry, i) => <Cell key={i} fill={colorMap[entry.name] || '#B0B0B0'} />)}
                    </Pie>
                    <Tooltip content={<NeuPieTooltip />} wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }} />
                  </PieChart>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <p style={{ fontSize: 9, color: '#8B95A1', marginBottom: 1 }}>총 지출</p>
                    <p style={{ fontSize: totalExpense >= 10000000 ? 9 : 11, fontWeight: 700, color: '#191F28', whiteSpace: 'nowrap' }}>
                      {totalExpense >= 10000 ? `${Math.round(totalExpense / 10000)}만원` : `${fmt(totalExpense)}원`}
                    </p>
                  </div>
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  {categoryData.slice(0, 7).map((c, i) => {
                    const pct = totalExpense > 0 ? Math.round(c.value / totalExpense * 100) : 0
                    const color = colorMap[c.name] || '#B0B0B0'
                    return (
                      <div key={i} style={{ marginBottom: 7 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                            <span style={{ fontSize: 11, color: '#191F28', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                          </div>
                          <span style={{ fontSize: 11, color: '#8B95A1', fontWeight: 600, marginLeft: 4, flexShrink: 0 }}>{pct}%</span>
                        </div>
                        <div className="neu-inset" style={{ height: 5, borderRadius: 9999, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 9999, transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* AI 소비 분석 */}
          <div className="neu-card" style={{ borderRadius: 20, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28' }}>AI 소비 분석</p>
              <button onClick={getAiFeedback} disabled={loadingAi}
                style={{ padding: '7px 16px', borderRadius: 9999, border: 'none', background: loadingAi ? '#E5E8EB' : primary, color: loadingAi ? '#8B95A1' : '#fff', boxShadow: loadingAi ? 'none' : coloredShadow.raisedSm, fontSize: 13, fontWeight: 500, cursor: loadingAi ? 'not-allowed' : 'pointer' }}>
                {loadingAi ? '분석 중...' : '✨ AI 분석'}
              </button>
            </div>
            {loadingAi && (
              <div style={{ textAlign: 'center', padding: '28px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🤔</div>
                <p style={{ fontSize: 14, color: '#8B95A1' }}>AI가 소비 패턴을 분석하고 있어요...</p>
                <p style={{ fontSize: 12, color: '#8B95A1', marginTop: 4 }}>잠시만 기다려주세요</p>
              </div>
            )}
            {!loadingAi && !aiFeedbackData && !aiFeedbackRaw && (
              <p style={{ fontSize: 14, color: '#8B95A1', textAlign: 'center', padding: '20px 0' }}>
                AI 분석 버튼을 눌러 소비 패턴을 확인해보세요
              </p>
            )}
            {aiFeedbackData && (() => {
              const rc = {
                good:    { color: '#2ECC71', label: '소비 우등생이에요 🌟' },
                warning: { color: '#f59e0b', label: '지출 관리가 필요해요 ⚠️' },
                danger:  { color: '#FF5A5F', label: '지출이 너무 많아요 🚨' },
              }[aiFeedbackData.rating] || { color: '#22c55e', label: '분석 완료' }

              const levelColors = ['#FF5A5F', '#f97316', '#eab308', '#2ECC71', '#f59e0b']
              const levelNames = ['위험', '주의', '보통', '양호', '우수']
              const filledCount = Math.min(5, Math.max(1, Math.ceil((aiFeedbackData.score || 50) / 20)))

              return (
                <>
                  {/* 점수 카드 */}
                  <div className="neu-inset" style={{ borderRadius: 16, padding: 16, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div className="neu-card" style={{ width: 60, height: 60, borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: rc.color, fontSize: 20, fontWeight: 700, lineHeight: 1 }}>{aiFeedbackData.score}</span>
                      <span style={{ color: '#8B95A1', fontSize: 10 }}>점</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: rc.color, marginBottom: 4 }}>{rc.label}</p>
                      <p style={{ fontSize: 13, color: '#8B95A1', lineHeight: 1.5, marginBottom: 8 }}>{aiFeedbackData.summary}</p>
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                        {levelColors.map((color, i) => (
                          <div key={i} style={{ width: 15, height: 15, borderRadius: '50%', background: i < filledCount ? color : 'rgba(163,177,198,0.35)', transition: 'background 0.3s' }} />
                        ))}
                        <span style={{ fontSize: 11, color: '#8B95A1', marginLeft: 4 }}>{levelNames[filledCount - 1]}</span>
                      </div>
                    </div>
                  </div>

                  {/* 절감 포인트 */}
                  {aiFeedbackData.cuts?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#191F28', marginBottom: 8 }}>💡 절감 포인트</p>
                      {aiFeedbackData.cuts.map((cut, i) => (
                        <div key={i} className="neu-inset" style={{ borderRadius: 14, padding: '10px 12px', marginBottom: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: primary, background: primaryLight, padding: '2px 10px', borderRadius: 9999 }}>{cut.category}</span>
                            {cut.save > 0 && <span style={{ fontSize: 12, fontWeight: 600, color: '#22c55e' }}>최대 {fmt(cut.save)}원 절약</span>}
                          </div>
                          <p style={{ fontSize: 13, color: '#8B95A1', lineHeight: 1.5 }}>{typeof cut.tip === 'string' ? cut.tip : String(cut.tip ?? '')}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 이상 지출 */}
                  {aiFeedbackData.unusual?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#191F28', marginBottom: 8 }}>🚨 이상 지출 감지</p>
                      {aiFeedbackData.unusual.map((u, i) => (
                        <div key={i} className="neu-inset" style={{ borderRadius: 14, padding: '10px 12px', marginBottom: 6, display: 'flex', gap: 8 }}>
                          <span style={{ fontSize: 16, flexShrink: 0 }}>⚡</span>
                          <p style={{ fontSize: 13, color: '#8B95A1', lineHeight: 1.5 }}>{typeof u === 'string' ? u : (u?.tip || u?.reason || u?.description || u?.message || JSON.stringify(u))}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 절감 목표 */}
                  {aiFeedbackData.saving_goal > 0 && (
                    <div className="neu-inset" style={{ borderRadius: 16, padding: '12px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: '#191F28' }}>🎯 이번 달 절감 목표</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#22c55e' }}>{fmt(aiFeedbackData.saving_goal)}원</span>
                    </div>
                  )}

                  {/* 응원 메시지 */}
                  {aiFeedbackData.message && (
                    <div className="neu-inset" style={{ textAlign: 'center', padding: 14, borderRadius: 16 }}>
                      <p style={{ fontSize: 14, color: primary, fontWeight: 500 }}>{aiFeedbackData.message}</p>
                    </div>
                  )}
                </>
              )
            })()}
            {aiFeedbackRaw && (
              <div className="neu-inset" style={{ borderRadius: 16, padding: 14 }}>
                <p style={{ fontSize: 14, color: '#191F28', lineHeight: 1.7 }}>{aiFeedbackRaw}</p>
              </div>
            )}
          </div>

          {/* 결제수단별 지출 */}
          <div className="neu-card" style={{ borderRadius: 20, padding: 16, marginBottom: 16 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28', marginBottom: 16 }}>결제수단별 지출</p>
            {expenses.length === 0 ? (
              <p style={{ fontSize: 14, color: '#8B95A1', textAlign: 'center', padding: '20px 0' }}>내역이 없어요</p>
            ) : (() => {
              const userAccounts = (() => { try { return JSON.parse(localStorage.getItem('moa_accounts') || '[]').map(a => a.name) } catch { return [] } })()
              const isCardPayment = p => p !== '현금' && p !== '계좌이체' && !userAccounts.includes(p)
              const isTransferPayment = p => p === '계좌이체' || userAccounts.includes(p)
              const cardExps = expenses.filter(t => isCardPayment(t.payment || '카드'))
              const transferExps = expenses.filter(t => isTransferPayment(t.payment || ''))
              const cashExps = expenses.filter(t => (t.payment || '') === '현금')
              const cardTotal = cardExps.reduce((s, t) => s + t.amount, 0)
              const transferTotal = transferExps.reduce((s, t) => s + t.amount, 0)
              const cashTotal = cashExps.reduce((s, t) => s + t.amount, 0)
              const grandTotal = cardTotal + transferTotal + cashTotal

              const byCard = cardExps.reduce((acc, t) => { const k = t.payment || '카드'; acc[k] = (acc[k] || 0) + t.amount; return acc }, {})
              const byAccount = transferExps.reduce((acc, t) => { const k = t.payment || '이체'; acc[k] = (acc[k] || 0) + t.amount; return acc }, {})
              const byCash = { '현금': cashTotal }

              const cardIconSvg = (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
              )
              const transferIconSvg = (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                </svg>
              )
              const cashIconSvg = (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>
                </svg>
              )

              const PaymentRow = ({ groupKey, icon, label, amount, detail }) => {
                if (amount === 0) return null
                const isExpanded = expandedPayments.has(groupKey)
                const pct = grandTotal > 0 ? Math.round(amount / grandTotal * 100) : 0
                return (
                  <div style={{ borderBottom: '1px solid rgba(163,177,198,0.25)' }}>
                    <div onClick={() => setExpandedPayments(prev => { const next = new Set(prev); next.has(groupKey) ? next.delete(groupKey) : next.add(groupKey); return next })}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 0', cursor: 'pointer' }}>
                      <div className="neu-inset" style={{ width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {icon}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#191F28' }}>{label}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: primary, background: `${primary}18`, padding: '2px 8px', borderRadius: 9999 }}>{pct}%</span>
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#191F28', textAlign: 'right' }}>{fmt(amount)}원</span>
                      <span style={{ fontSize: 15, color: '#8B95A1', marginLeft: 4, display: 'inline-block', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>›</span>
                    </div>
                    {isExpanded && (
                      <div style={{ paddingLeft: 46, paddingBottom: 10 }}>
                        {Object.entries(detail).filter(([,v]) => v > 0).sort(([,a],[,b]) => b - a).map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0' }}>
                            <span style={{ fontSize: 13, color: '#8B95A1' }}>{k}</span>
                            <span style={{ fontSize: 13, color: '#191F28', fontWeight: 500 }}>{fmt(v)}원</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <div>
                  <PaymentRow groupKey="card" icon={cardIconSvg} label="카드" amount={cardTotal} detail={byCard} />
                  <PaymentRow groupKey="transfer" icon={transferIconSvg} label="이체" amount={transferTotal} detail={byAccount} />
                  <PaymentRow groupKey="cash" icon={cashIconSvg} label="현금" amount={cashTotal} detail={byCash} />
                </div>
              )
            })()}
          </div>

        </div>
      )}

      {/* ── 공과금 탭 ── */}
      {showUtilities && activeAnalysisTab === '공과금' && (
        <div style={{ padding: '16px 20px 100px' }}>

          {/* 총합 배너 */}
          <div style={{ background: primary, borderRadius: 20, padding: '18px 20px', marginBottom: 16, boxShadow: coloredShadow.drop }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 4 }}>이번 달 공과금 합계</p>
            <p style={{ fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: prevMonthTotal > 0 || currentMonthTotal === 0 ? 6 : 0 }}>
              {fmt(currentMonthTotal)}원
            </p>
            {prevMonthTotal > 0 && (
              <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                전월 대비 {utilityTotalDiff > 0 ? '+' : ''}{fmt(utilityTotalDiff)}원 {utilityTotalDiff > 0 ? '증가' : '감소'}
              </p>
            )}
            {currentMonthTotal === 0 && (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>이번 달 공과금을 입력해주세요</p>
            )}
          </div>

          {/* 공과금 카드 */}
          {utilityTypes.map(type => {
            const ustyle = UTILITY_STYLES[type] || { color: '#8B95A1' }
            const cur = utilities.find(u => u.type === type && u.year === viewYear && u.month === viewMonth + 1)
            const lm = viewMonth === 0 ? { year: viewYear - 1, month: 12 } : { year: viewYear, month: viewMonth }
            const prev = utilities.find(u => u.type === type && u.year === lm.year && u.month === lm.month)
            const diff = cur && prev ? cur.amount - prev.amount : null
            const isExpand = expandedUtilities.has(type)

            return (
              <div key={type} style={{ marginBottom: 12 }}>
                <div className="neu-card" style={{ borderRadius: 20, overflow: 'hidden' }}>
                  <div style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="neu-inset" style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <UtilityIcon type={type} color={ustyle.color} size={20} />
                        </div>
                        <div>
                          <p style={{ fontSize: 15, fontWeight: 700, color: '#191F28' }}>{type}</p>
                          {cur?.day && <p style={{ fontSize: 12, color: '#8B95A1' }}>매월 {cur.day}일</p>}
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleUtility(type) }} aria-label="공과금 수정"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: isExpand ? primary : '#8B95A1', padding: 4, lineHeight: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    </div>

                    {cur ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
                          <p style={{ fontSize: 22, fontWeight: 700, color: '#191F28' }}>{fmt(cur.amount)}원</p>
                          <div style={{ textAlign: 'right' }}>
                            {diff !== null ? (
                              <>
                                <p style={{ fontSize: 13, fontWeight: 600, color: diff > 0 ? '#f97316' : '#2ECC71' }}>
                                  {diff > 0 ? '↑' : '↓'} {diff > 0 ? '+' : ''}{fmt(diff)}원
                                </p>
                                <p style={{ fontSize: 11, color: '#8B95A1' }}>전월 {fmt(prev.amount)}원</p>
                              </>
                            ) : (
                              <span style={{ fontSize: 11, background: `${primary}18`, color: primary, padding: '3px 10px', borderRadius: 9999, fontWeight: 600 }}>첫 등록</span>
                            )}
                          </div>
                        </div>
                        <UtilityChart type={type} utilities={utilities} primary={primary} viewYear={viewYear} viewMonth={viewMonth} />
                      </>
                    ) : (
                      <p style={{ fontSize: 13, color: '#8B95A1', textAlign: 'center', padding: '12px 0' }}>이번 달 데이터가 없어요</p>
                    )}
                  </div>
                </div>

                {isExpand && (
                  <div className="neu-card" style={{ display: 'flex', borderRadius: 20, overflow: 'hidden', marginTop: 8 }}>
                    {cur ? (
                      <>
                        <button onClick={() => {
                          setNewUtility({ type, amount: cur.amount, day: cur.day || '' })
                          setEditingUtility(cur.id)
                          setShowAddUtility(true)
                          toggleUtility(type)
                        }} style={{ flex: 1, padding: '13px', border: 'none', background: 'none', color: '#8B95A1', fontSize: 13, cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          수정
                        </button>
                        <button onClick={() => { saveUtilities(utilities.filter(u => u.id !== cur.id)); toggleUtility(type) }}
                          style={{ flex: 1, padding: '13px', border: 'none', background: 'none', color: '#ef4444', fontSize: 13, cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                          삭제
                        </button>
                      </>
                    ) : (
                      <button onClick={() => {
                        setNewUtility({ type, amount: '', day: '' })
                        setEditingUtility(null)
                        setShowAddUtility(true)
                        toggleUtility(type)
                      }} style={{ flex: 1, padding: '13px', border: 'none', background: 'none', color: primary, fontSize: 13, cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        추가
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* AI 공과금 분석 */}
          <div className="neu-card" style={{ borderRadius: 20, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28' }}>AI 공과금 분석</p>
              <button onClick={getUtilityAI} disabled={loadingUtilityAI}
                style={{ padding: '7px 16px', borderRadius: 9999, border: 'none', background: loadingUtilityAI ? '#E5E8EB' : primary, color: loadingUtilityAI ? '#8B95A1' : '#fff', boxShadow: loadingUtilityAI ? 'none' : coloredShadow.raisedSm, fontSize: 13, cursor: loadingUtilityAI ? 'not-allowed' : 'pointer' }}>
                {loadingUtilityAI ? '분석 중...' : '✨ AI 분석'}
              </button>
            </div>
            {!utilityAI && !loadingUtilityAI && <p style={{ fontSize: 13, color: '#8B95A1', textAlign: 'center', padding: '12px 0' }}>AI가 전월·전년도와 비교 분석해드려요</p>}
            {loadingUtilityAI && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ fontSize: 14, color: '#8B95A1' }}>공과금 패턴을 분석하고 있어요...</p>
              </div>
            )}
            {utilityAI && (
              <div>
                {utilityAI.items?.map((item, i) => {
                  const type = item.type
                  const ustyle = UTILITY_STYLES[type] || { color: '#8B95A1' }
                  const cur = utilities.find(u => u.type === type && u.year === viewYear && u.month === viewMonth + 1)
                  const lm = viewMonth === 0 ? { year: viewYear - 1, month: 12 } : { year: viewYear, month: viewMonth }
                  const prev = utilities.find(u => u.type === type && u.year === lm.year && u.month === lm.month)
                  const diff = cur && prev ? cur.amount - prev.amount : null
                  const isUp = diff !== null ? diff > 0 : item.status === 'up'
                  const badgeColor = isUp ? '#f97316' : '#22c55e'
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < utilityAI.items.length - 1 ? '1px solid rgba(163,177,198,0.25)' : 'none' }}>
                      <div className="neu-inset" style={{ width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <UtilityIcon type={type} color={ustyle.color} size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#191F28' }}>{type}</span>
                          {diff !== null && (
                            <span style={{ fontSize: 11, fontWeight: 600, color: badgeColor, background: `${badgeColor}18`, padding: '2px 8px', borderRadius: 9999 }}>
                              {isUp ? '↑' : '↓'} {diff > 0 ? '+' : ''}{fmt(diff)}원
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 12, color: '#8B95A1', lineHeight: 1.45 }}>{item.comment}</p>
                      </div>
                    </div>
                  )
                })}

                {utilityAI.overall && (
                  <div className="neu-inset" style={{ borderRadius: 16, padding: '12px 14px', marginTop: utilityAI.items?.length ? 12 : 0, marginBottom: 10 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: primary, lineHeight: 1.6 }}>{utilityAI.overall}</p>
                  </div>
                )}

                {utilityAI.tip && (
                  <div className="neu-inset" style={{ borderRadius: 16, padding: '12px 14px' }}>
                    <p style={{ fontSize: 13, color: '#16a34a', lineHeight: 1.6 }}>💡 {utilityAI.tip}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 추가/수정 모달 */}
          {showAddUtility && (
            <FixedPortal>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', zIndex: 999 }}
              onClick={() => setShowAddUtility(false)}>
              <div className="neu-page" style={{ width: '100%', maxWidth: 430, margin: '0 auto', borderRadius: '28px 28px 0 0', padding: '28px 24px calc(env(safe-area-inset-bottom, 0px) + 40px)', '--neu-focus': primary + '59' }} onClick={e => e.stopPropagation()}>
                <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(163,177,198,0.4)', margin: '0 auto 20px' }} />
                <p style={{ fontSize: 16, fontWeight: 700, color: '#191F28', marginBottom: 16 }}>{newUtility.type} 입력</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  <input type="number" placeholder="금액 (원)" value={newUtility.amount} className="neu-inset"
                    onChange={e => setNewUtility(p => ({ ...p, amount: e.target.value }))}
                    style={neuInputStyle} />
                  <input type="number" placeholder="납부일 (예: 15)" min="1" max="31" value={newUtility.day} className="neu-inset"
                    onChange={e => setNewUtility(p => ({ ...p, day: e.target.value }))}
                    style={neuInputStyle} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setShowAddUtility(false)} className="neu-btn"
                    style={{ flex: 1, height: 56, borderRadius: 16, fontSize: 15, color: '#8B95A1' }}>취소</button>
                  <button onClick={() => {
                    if (!newUtility.amount) return alert('금액을 입력해주세요.')
                    const entry = { id: editingUtility || Date.now(), type: newUtility.type, amount: Number(newUtility.amount), day: newUtility.day, year: viewYear, month: viewMonth + 1 }
                    const filtered = utilities.filter(u => !(u.type === newUtility.type && u.year === viewYear && u.month === viewMonth + 1))
                    saveUtilities([...filtered, entry])
                    setShowAddUtility(false); setEditingUtility(null)
                  }} style={{ flex: 1, height: 56, borderRadius: 16, border: 'none', background: primary, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: coloredShadow.raised }}>저장</button>
                </div>
              </div>
            </div>
            </FixedPortal>
          )}

        </div>
      )}
    </div>
  )
}
