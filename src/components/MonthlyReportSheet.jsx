import { useEffect, useState } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { db } from '../firebase/config'
import { getCategoryColors } from '../styles/theme'
import BottomSheet from './BottomSheet'
import { callAI } from '../utils/aiClient'
import { getDeterminismParams, hashForSeed } from '../utils/aiPrompt'

// 월간 리포트 AI 캐시 버전. 프롬프트/스키마를 바꾸면 이 값을 올려 과거 캐시를 무효화한다.
const AI_CACHE_VERSION = 3
const RECOMMENDED_SAVINGS_RATE = 20

// AI 응답에서 순수 JSON만 추출 (앞뒤 설명/코드블록/추론 텍스트 제거)
function extractJson(text) {
  const stripped = text.replace(/```json\n?|```/g, '').trim()
  const start = stripped.indexOf('{')
  const end = stripped.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) return stripped.slice(start, end + 1)
  return stripped
}

// 한자(CJK) 등 한글 이외 잘못된 문자를 제거하는 안전망 (모델이 실수로 뱉는 깨진 글자 방지)
function stripHanja(s) {
  return typeof s === 'string'
    ? s.replace(/[㐀-鿿豈-﫿぀-ヿ]/g, '').replace(/[ \t]{2,}/g, ' ').trim()
    : s
}
function sanitizeDeep(obj) {
  if (typeof obj === 'string') return stripHanja(obj)
  if (Array.isArray(obj)) return obj.map(sanitizeDeep)
  if (obj && typeof obj === 'object') {
    const o = {}
    for (const k in obj) o[k] = sanitizeDeep(obj[k])
    return o
  }
  return obj
}
// 카테고리별 텍스트 요약 (AI 프롬프트용) — 데이터 없으면 '없음'
function catText(byCategory, fmt) {
  return Object.entries(byCategory || {}).map(([c, a]) => `${c}: ${fmt(a)}원`).join(', ') || '없음'
}

function DailyBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '8px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', border: '1px solid #f0f0f0' }}>
      <p style={{ fontSize: 11, color: '#5B6572', marginBottom: 4 }}>{label}일</p>
      <p style={{ fontSize: 14, fontWeight: 700, color: '#FF5A5F' }}>-{payload[0].value.toLocaleString()}원</p>
    </div>
  )
}

// 카테고리별 금액 목록(가로 바) — 지출/수입 공용
function CategoryList({ items, total, fmt, textColor, textSecondary }) {
  const colorMap = getCategoryColors(items.map(([name]) => name))
  return (
    <div>
      {items.map(([name, amount]) => {
        const pct = total > 0 ? Math.round((amount / total) * 100) : 0
        const color = colorMap[name] || '#B0B0B0'
        return (
          <div key={name} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
              </div>
              <span style={{ fontSize: 12, color: textSecondary, fontWeight: 600, marginLeft: 4, flexShrink: 0 }}>{fmt(amount)}원 · {pct}%</span>
            </div>
            <div style={{ height: 6, background: `${color}22`, borderRadius: 9999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 9999, transition: 'width 0.6s cubic-bezier(0.22, 1, 0.36, 1)' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// 저축률 반원 게이지 — Home.jsx의 예산 사용률 게이지(_BudgetCard)와 동일한 아크 방식을 그대로 재사용해
// 앱 전체에서 "퍼센트 진행률"은 항상 같은 모양으로 보이게 한다. 20% 이상 양호, 0~20% 보통, 마이너스 주의.
function SavingsRateRing({ rate }) {
  const clamped = Math.max(0, Math.min(rate, 100))
  const color = rate >= RECOMMENDED_SAVINGS_RATE ? '#2ECC71' : rate >= 0 ? '#f59e0b' : '#FF5A5F'
  return (
    <div style={{ position: 'relative', width: 100, height: 56, flexShrink: 0 }}>
      <svg width="100" height="56" viewBox="0 0 100 56">
        {/* 트랙을 현재 상태 색의 옅은 톤으로 — 채워지지 않은 구간도 같은 색 계열이라 전체 아크에서 상태가 읽힌다 */}
        <path d="M 8 50 A 42 42 0 0 1 92 50" fill="none" stroke={`${color}22`} strokeWidth="11" strokeLinecap="round" />
        <path d="M 8 50 A 42 42 0 0 1 92 50" fill="none" stroke={color} strokeWidth="11" strokeLinecap="round"
          strokeDasharray={Math.PI * 42} strokeDashoffset={Math.PI * 42 * (1 - clamped / 100)}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.22, 1, 0.36, 1)' }} />
      </svg>
      <span style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', fontSize: 15, fontWeight: 700, color, whiteSpace: 'nowrap' }}>
        {rate.toFixed(1)}%
      </span>
    </div>
  )
}

const TABS = [
  { key: 'summary', label: '요약' },
  { key: 'category', label: '카테고리' },
  { key: 'insight', label: '인사이트' },
]

/**
 * 월간(전월) 수입/지출 AI 리포트 시트. 요약/카테고리/인사이트 3탭 구조.
 * - mode="auto": Home에서 "이번 달 첫 방문"에 자동으로 열림. summaryInput으로 받은 전월 집계 데이터를 AI로 분석하고, 저장 버튼 제공.
 * - mode="saved": Analysis 탭에서 이미 저장된 리포트를 눌렀을 때 열림. savedReport를 그대로 보여주며 AI 호출/저장 버튼 없음.
 */
export default function MonthlyReportSheet({
  open,
  onClose,
  mode,
  year,
  month, // 0-indexed (Date.getMonth() 규칙)
  themeData,
  fmt,
  user,
  aiCache,
  persistAiCache,
  summaryInput,
  aiAnalysisStyle,
  aiShowAdvice,
  savedReport,
  onSaved,
}) {
  const [activeTab, setActiveTab] = useState('summary')
  const [data, setData] = useState(null)
  const [raw, setRaw] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const primary = themeData?.primary || '#4F46E5'
  const primaryLight = themeData?.primaryLight || '#EEF2FF'
  const textColor = themeData?.text || '#191F28'
  // 앱이 지원하는 6개 테마의 카드 배경 전부에서 WCAG AA(4.5:1) 이상을 만족하는 보조 텍스트 색.
  // 기존 #8B95A1/#C9CDD4는 흰 배경 기준으로도 각각 3.0:1/1.6:1로 미달이었다.
  const textSecondary = '#5B6572'
  const cacheKey = `${year}-${month + 1}`
  const details = mode === 'saved' ? savedReport?.details : summaryInput?.details

  async function generate() {
    const { totalIncome, totalExpense, byCategory, lastTotalIncome, lastTotalExpense, details: d } = summaryInput
    const byCat = catText(byCategory, fmt)
    const incomeByCat = catText(d?.incomeByCategory, fmt)
    const prevByCat = catText(d?.prevByCategory, fmt)
    const prevPrevByCat = catText(d?.prevPrevByCategory, fmt)
    const net = totalIncome - totalExpense
    const lastNet = lastTotalIncome - lastTotalExpense
    const savingsRateVal = totalIncome > 0 ? (net / totalIncome) * 100 : null
    const topDayText = d?.topDay
      ? `${month + 1}월 ${d.topDay.day}일에 ${fmt(d.topDay.amount)}원으로 가장 많이 지출했습니다 (${d.topDay.items.map(it => `${it.title || it.category}`).join(', ')}).`
      : '특별히 지출이 몰린 날은 없었습니다.'
    const budgetText = d?.budgetsSummary?.length > 0
      ? d.budgetsSummary.map(b => `${b.label}: 목표 ${fmt(b.amount)}원 중 ${fmt(b.spent)}원 사용 (${b.pct}%)`).join(' / ')
      : '설정된 예산 없음'
    const fixedText = d?.fixedExpenseItems?.length > 0
      ? `${d.fixedExpenseItems.length}건, 총 ${fmt(d.fixedTotal)}원 (${d.fixedExpenseItems.map(f => f.title).join(', ')})`
      : '없음'
    const savingsRateText = savingsRateVal !== null ? `${savingsRateVal.toFixed(1)}% (권장 저축률 ${RECOMMENDED_SAVINGS_RATE}% 기준)` : '수입이 없어 계산 불가'
    // 데이터 시그니처: 동일 데이터 + 동일 설정(스타일/조언)이면 계정에 저장된 결과를 그대로 사용 → 매번 결과가 달라지지 않음
    const sig = hashForSeed(JSON.stringify({ v: AI_CACHE_VERSION, totalIncome, totalExpense, byCat, incomeByCat, prevByCat, prevPrevByCat, lastTotalIncome, lastTotalExpense, topDayText, budgetText, fixedText, savingsRateText, y: year, m: month, style: aiAnalysisStyle, advice: aiShowAdvice }))
    const cached = aiCache?.monthly?.[cacheKey]
    if (cached && cached.sig === sig && cached.data) { setData(cached.data); setRaw(''); return }
    setLoading(true); setData(null); setRaw('')
    try {
      const adviceContentRule = aiShowAdvice
        ? '\n- cuts는 지출 상위 카테고리 위주로 최소 1개, 최대 3개 작성하세요. 각 조언(tip)은 서로 내용이 겹치지 않게, 해당 카테고리에 딱 맞는 서로 다른 구체적 방법을 제시하세요.\n- save는 각 카테고리 지출액을 고려한 현실적인 정수 금액으로, 카테고리마다 다르게 산정하세요.\n- saving_goal은 다음 달을 위한 현실적인 절감 목표 금액을 제시하세요.'
        : ''
      const schema = aiShowAdvice
        ? '{"rating":"good|warning|danger 중 하나","score":0~100 정수,"summary":"수입과 지출을 함께 근거로 한 이번 달 결산 요약 2~3문장","insights":["서로 다른 관점의 평가 문장 2~5개"],"cuts":[{"category":"카테고리명","tip":"카테고리별로 서로 다른 구체적 조언 (청유형)","save":정수}],"unusual":["평소와 다른 수입/지출이 있으면 구체적으로, 없으면 빈 배열"],"saving_goal":정수,"message":"응원 메시지"}'
        : '{"rating":"good|warning|danger 중 하나","score":0~100 정수,"summary":"수입과 지출을 함께 근거로 한 이번 달 결산 요약 2~3문장","insights":["서로 다른 관점의 평가 문장 2~5개"],"unusual":["평소와 다른 수입/지출이 있으면 구체적으로, 없으면 빈 배열"],"message":"응원 메시지"}'
      const result = await callAI({
        max_tokens: 1400, ...getDeterminismParams(),
        domain: 'monthly', styleLevel: aiAnalysisStyle, showAdvice: aiShowAdvice,
        messages: [{
          role: 'user', content:
            `${year}년 ${month + 1}월 한 달 결산 데이터를 분석해 JSON으로만 응답해주세요.\n\n` +
            `이번 달 총 수입 ${fmt(totalIncome)}원, 총 지출 ${fmt(totalExpense)}원, 순이익 ${fmt(net)}원, 저축률 ${savingsRateText}\n` +
            `이번 달 카테고리별 지출: ${byCat}\n` +
            `전월 카테고리별 지출: ${prevByCat}\n` +
            `전전월 카테고리별 지출: ${prevPrevByCat}\n` +
            `카테고리별 수입: ${incomeByCat}\n` +
            `${topDayText}\n` +
            `예산 현황: ${budgetText}\n` +
            `등록된 고정지출: ${fixedText}\n` +
            `전월 총 수입 ${fmt(lastTotalIncome)}원, 총 지출 ${fmt(lastTotalExpense)}원, 순이익 ${fmt(lastNet)}원\n\n` +
            `[JSON 필드 규칙]\n- summary는 이번 달 수입과 지출을 함께 근거로 삼아 전체 결산을 요약하세요. 전월 대비 변화(금액이나 비중)를 언급하세요.\n` +
            `- insights는 "이번 달 카테고리별 지출/전월/전전월" 3개월 데이터, 고정지출 현황, 저축률(권장 ${RECOMMENDED_SAVINGS_RATE}% 대비), 예산 현황 등 서로 다른 관점에서 실제 수치를 근거로 작성하세요. 3개월 연속 증가/감소 같은 추세는 데이터가 실제로 그렇게 보일 때만 언급하고, 근거 없는 항목은 만들지 마세요.${adviceContentRule}\n` +
            `- summary, insights, unusual, message는 "-입니다/-습니다"로 끝나는 구어체 존댓말로 작성하세요. 예: "이번 달은 지난달보다 12만원 더 저축했습니다".\n` +
            `- 문어체(-다, -하였다, -되었다, -이다) 금지. 한자, 영어, 일본어 등 한글 이외의 문자 절대 금지.\n\n` +
            `응답 형식(이 형식 그대로만, 값은 위 규칙대로 새로 작성):\n${schema}`
        }]
      })
      const text = extractJson(result.content?.[0]?.text || '')
      if (!text) { setRaw('응답이 비어있어요. 잠시 후 다시 시도해주세요.'); setLoading(false); return }
      try {
        const parsed = sanitizeDeep(JSON.parse(text))
        setData(parsed)
        persistAiCache?.('monthly', cacheKey, sig, parsed)
      } catch { setRaw(stripHanja(text)) }
    } catch { setRaw('AI 분석을 불러오는 데 실패했어요.') }
    setLoading(false)
  }

  async function handleSave() {
    if (!data || !user || saving) return
    setSaving(true)
    const totals = mode === 'saved'
      ? savedReport?.totals
      : { income: summaryInput.totalIncome, expense: summaryInput.totalExpense, net: summaryInput.totalIncome - summaryInput.totalExpense }
    const report = { data, totals, details: details || null, savedAt: Date.now() }
    try {
      await setDoc(doc(db, 'users', user.uid), { monthlyReports: { [cacheKey]: report } }, { merge: true })
      setSaved(true)
      onSaved?.(cacheKey, report)
    } catch {
      alert('저장에 실패했어요. 잠시 후 다시 시도해주세요.')
    }
    setSaving(false)
  }

  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 리포트를 새로 열 때마다 첫 탭(요약)으로 되돌린다
    setActiveTab('summary')
    if (mode === 'saved') {
      setData(savedReport?.data || null)
      setRaw('')
      setSaved(true)
      return
    }
    if (mode === 'auto' && summaryInput) {
      setSaved(false)
      generate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, cacheKey])

  const totals = mode === 'saved' ? savedReport?.totals : (summaryInput && {
    income: summaryInput.totalIncome, expense: summaryInput.totalExpense, net: summaryInput.totalIncome - summaryInput.totalExpense,
  })
  // 순이익 = 수입 - 지출(totals.net과 동일), 순잔액 = 순이익에서 고정지출을 제한, 실제 자유롭게 쓸 수 있는 돈
  const netBalance = totals ? totals.net - (details?.fixedTotal || 0) : null
  const savingsRate = totals?.income > 0 ? (totals.net / totals.income) * 100 : null

  const rc = {
    good: { color: '#2ECC71', label: '이번 달 결산 우수해요 🌟' },
    warning: { color: '#f59e0b', label: '이번 달 결산 주의가 필요해요 ⚠️' },
    danger: { color: '#FF5A5F', label: '이번 달 지출이 많았어요 🚨' },
  }[data?.rating] || { color: '#22c55e', label: '분석 완료' }
  const levelColors = ['#FF5A5F', '#f97316', '#eab308', '#2ECC71', '#f59e0b']
  const levelNames = ['위험', '주의', '보통', '양호', '우수']
  const filledCount = Math.min(5, Math.max(1, Math.ceil((data?.score || 50) / 20)))

  const maxDaily = details?.dailyData?.length ? Math.max(...details.dailyData.map(d => d.amount)) : 0
  const expenseCategoryEntries = details?.byCategory
    ? Object.entries(details.byCategory).sort((a, b) => b[1] - a[1]).slice(0, 6)
    : []
  const incomeCategoryEntries = details?.incomeByCategory
    ? Object.entries(details.incomeByCategory).sort((a, b) => b[1] - a[1]).slice(0, 4)
    : []

  // 카드 radius 20 — 앱 전역에서 섹션 카드에 쓰는 값(Home.jsx/Analysis.jsx). 16은 카드 "안쪽"의 강조 블록(목표/응원 메시지 등) 전용으로 남겨둔다.
  const card = { background: themeData?.card || '#fff', borderRadius: 20, padding: '16px', marginBottom: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }
  const cardTitle = { fontSize: 14, fontWeight: 600, color: textColor, marginBottom: 12 }
  const statCard = { minWidth: 0, background: themeData?.card || '#fff', borderRadius: 20, padding: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }
  const statLabel = { fontSize: 12, color: textSecondary, marginBottom: 4 }
  const statValue = { fontSize: 16, fontWeight: 700, overflowWrap: 'anywhere' }

  return (
    <BottomSheet open={open} onClose={onClose} maxOpacity={0.45}>
      <div style={{ padding: '20px 20px calc(24px + env(safe-area-inset-bottom, 0px))' }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: textColor, marginBottom: 4, marginTop: 8 }}>
          📅 {year}년 {month + 1}월 리포트
        </p>
        <p style={{ fontSize: 13, color: textSecondary, marginBottom: 16 }}>AI가 분석한 지난 한 달 수입·지출 결산이에요</p>

        {/* 탭 (iOS 세그먼트 스타일 — Analysis.jsx의 activeAnalysisTab 패턴 재사용) */}
        <div style={{ display: 'flex', background: '#F2F4F6', borderRadius: 9999, padding: 3, marginBottom: 16 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{ flex: 1, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 9px', borderRadius: 9999, border: 'none', cursor: 'pointer',
                fontSize: 13.5, fontWeight: activeTab === t.key ? 700 : 500,
                background: activeTab === t.key ? primary : 'transparent',
                color: activeTab === t.key ? '#fff' : textSecondary,
                transition: 'background 0.15s cubic-bezier(0.22, 1, 0.36, 1), color 0.15s cubic-bezier(0.22, 1, 0.36, 1)' }}>
              {t.label}
              {t.key === 'insight' && loading && (
                <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: activeTab === t.key ? '#fff' : primary, marginLeft: 5, verticalAlign: 'middle' }} />
              )}
            </button>
          ))}
        </div>

        {/* ===== 요약 ===== */}
        {activeTab === 'summary' && (
          <>
            {totals && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div style={statCard}>
                  <p style={statLabel}>수입</p>
                  <p style={{ ...statValue, color: '#2ECC71' }}>{fmt(totals.income)}원</p>
                </div>
                <div style={statCard}>
                  <p style={statLabel}>지출</p>
                  <p style={{ ...statValue, color: '#FF5A5F' }}>{fmt(totals.expense)}원</p>
                </div>
                <div style={statCard}>
                  <p style={statLabel}>순이익</p>
                  <p style={{ ...statValue, color: totals.net < 0 ? '#FF5A5F' : textColor }}>{fmt(totals.net)}원</p>
                </div>
                <div style={statCard}>
                  <p style={statLabel}>순잔액</p>
                  <p style={{ ...statValue, color: netBalance < 0 ? '#FF5A5F' : textColor }}>{fmt(netBalance)}원</p>
                </div>
              </div>
            )}

            {savingsRate !== null && (
              <div style={card}>
                <p style={cardTitle}>저축률</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <SavingsRateRing rate={savingsRate} />
                  <p style={{ fontSize: 12, color: textSecondary, lineHeight: 1.5 }}>권장 저축률 {RECOMMENDED_SAVINGS_RATE}% 대비 {savingsRate >= RECOMMENDED_SAVINGS_RATE ? '양호한' : savingsRate >= 0 ? '조금 아쉬운' : '주의가 필요한'} 수준이에요.</p>
                </div>
              </div>
            )}

            {/* 일별 지출 */}
            {details?.dailyData?.length > 0 && (
              <div style={card}>
                <p style={cardTitle}>일별 지출</p>
                {maxDaily === 0 ? (
                  <p style={{ fontSize: 13, color: textSecondary, textAlign: 'center', padding: '12px 0' }}>지출 내역이 없어요</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={130}>
                      <BarChart data={details.dailyData} margin={{ top: 0, right: 0, left: 10, bottom: 0 }} barCategoryGap="30%">
                        <XAxis dataKey="day" tick={{ fontSize: 9, fill: textSecondary }} tickLine={false} axisLine={{ stroke: '#F2F4F6' }} interval={4} />
                        <YAxis hide />
                        <Tooltip content={<DailyBarTooltip />} wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }} cursor={{ fill: `${primary}0D` }} />
                        <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={16}>
                          {details.dailyData.map((entry, i) => (
                            <Cell key={i} fill={entry.amount > 0 && entry.amount === maxDaily ? primary : `${textColor}1F`} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    {details.topDay && (
                      <div style={{ marginTop: 8, paddingTop: 10, borderTop: '1px solid #F2F4F6' }}>
                        <p style={{ fontSize: 12.5, color: textColor, marginBottom: 6 }}>
                          최고 지출일 <span style={{ color: primary, fontWeight: 700 }}>{month + 1}월 {details.topDay.day}일</span> · <span style={{ fontWeight: 700 }}>{fmt(details.topDay.amount)}원</span>
                        </p>
                        {details.topDay.items.map((it, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: textSecondary, padding: '3px 0' }}>
                            <span>{it.title || it.category}{it.title ? ` · ${it.category}` : ''}</span>
                            <span>{fmt(it.amount)}원</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* 예산 관리 결과 */}
            {details?.budgetsSummary?.length > 0 && (
              <div style={{ ...card, marginBottom: 0 }}>
                <p style={cardTitle}>예산 관리 결과</p>
                {details.budgetsSummary.map((b, i) => {
                  const exceeded = b.spent > b.amount
                  const barColor = exceeded ? '#FF5A5F' : b.pct >= 80 ? '#f59e0b' : primary
                  return (
                    <div key={i} style={{ marginBottom: i < details.budgetsSummary.length - 1 ? 14 : 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: textColor }}>{b.label}</span>
                        <span style={{ fontSize: 12, color: exceeded ? '#FF5A5F' : textSecondary, fontWeight: 600 }}>
                          {fmt(b.spent)}원 / {fmt(b.amount)}원 ({b.pct}%)
                        </span>
                      </div>
                      <div style={{ height: 6, background: `${barColor}22`, borderRadius: 9999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(b.pct, 100)}%`, background: barColor, borderRadius: 9999, transition: 'width 0.6s cubic-bezier(0.22, 1, 0.36, 1)' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ===== 카테고리 ===== */}
        {activeTab === 'category' && (
          <>
            {(expenseCategoryEntries.length > 0 || incomeCategoryEntries.length > 0) && (
              <div style={card}>
                {expenseCategoryEntries.length > 0 && (
                  <div style={{ marginBottom: incomeCategoryEntries.length > 0 ? 16 : 0 }}>
                    <p style={cardTitle}>카테고리별 지출</p>
                    <CategoryList items={expenseCategoryEntries} total={totals?.expense || 0} fmt={fmt} textColor={textColor} textSecondary={textSecondary} />
                  </div>
                )}
                {incomeCategoryEntries.length > 0 && (
                  <div>
                    <p style={cardTitle}>카테고리별 수입</p>
                    <CategoryList items={incomeCategoryEntries} total={totals?.income || 0} fmt={fmt} textColor={textColor} textSecondary={textSecondary} />
                  </div>
                )}
              </div>
            )}

            {(details?.fixedExpenseItems?.length > 0 || details?.fixedTotal > 0) && (
              <div style={{ ...card, marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <p style={{ ...cardTitle, marginBottom: 0 }}>고정지출 현황</p>
                  <span style={{ fontSize: 14, fontWeight: 700, color: textColor }}>{fmt(details.fixedTotal)}원</span>
                </div>
                {details.fixedExpenseItems?.length > 0 ? details.fixedExpenseItems.map((f, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '7px 0', borderTop: i > 0 ? '1px solid #F2F4F6' : 'none' }}>
                    <span style={{ color: textColor }}>{f.title}</span>
                    <span style={{ color: textSecondary, fontWeight: 600 }}>{fmt(f.amount)}원</span>
                  </div>
                )) : (
                  <p style={{ fontSize: 13, color: textSecondary, textAlign: 'center', padding: '8px 0' }}>등록된 고정지출이 없어요</p>
                )}
              </div>
            )}
          </>
        )}

        {/* ===== 인사이트 ===== */}
        {activeTab === 'insight' && (
          <>
            {loading && (
              <div style={{ textAlign: 'center', padding: '28px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🤔</div>
                <p style={{ fontSize: 14, color: textSecondary }}>AI가 이번 달 결산을 분석하고 있어요...</p>
                <p style={{ fontSize: 12, color: textSecondary, marginTop: 4 }}>잠시만 기다려주세요</p>
              </div>
            )}

            {data && (
              <div style={card}>
                <p style={cardTitle}>최종 점수</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: rc.color, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: '#fff', fontSize: 20, fontWeight: 700, lineHeight: 1 }}>{data.score}</span>
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>점</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: rc.color, marginBottom: 4 }}>{rc.label}</p>
                    <p style={{ fontSize: 13, color: textSecondary, lineHeight: 1.5, marginBottom: 8 }}>{data.summary}</p>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                      {levelColors.map((color, i) => (
                        <div key={i} style={{ width: 15, height: 15, borderRadius: '50%', background: i < filledCount ? color : '#e5e7eb', transition: 'background 0.3s cubic-bezier(0.22, 1, 0.36, 1)' }} />
                      ))}
                      <span style={{ fontSize: 11, color: textSecondary, marginLeft: 4 }}>{levelNames[filledCount - 1]}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {raw && (
              <div style={{ background: primaryLight, borderRadius: 16, padding: '14px', marginBottom: 14 }}>
                <p style={{ fontSize: 14, color: textColor, lineHeight: 1.7 }}>{raw}</p>
              </div>
            )}

            {data?.insights?.length > 0 && (
              <div style={card}>
                <p style={cardTitle}>해당 월 평가</p>
                {data.insights.map((ins, i) => (
                  <div key={i} style={{ display: 'flex', gap: 9, padding: '8px 0', borderTop: i > 0 ? '1px solid #F2F4F6' : 'none' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: primary, marginTop: 7, flexShrink: 0 }} />
                    <p style={{ fontSize: 13, color: textColor, lineHeight: 1.6 }}>{typeof ins === 'string' ? ins : String(ins)}</p>
                  </div>
                ))}
              </div>
            )}

            {data && (data.cuts?.length > 0 || data.saving_goal > 0 || data.message) && (
              <div style={card}>
                <p style={cardTitle}>다음 달을 위한 제안</p>

                {data.cuts?.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: textColor, marginBottom: 8 }}>💡 절감 포인트</p>
                    {data.cuts.map((cut, i) => (
                      <div key={i} style={{ background: '#f8f8f8', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: primary, background: primaryLight, padding: '2px 10px', borderRadius: 9999 }}>{cut.category}</span>
                          {cut.save > 0 && <span style={{ fontSize: 12, fontWeight: 600, color: '#22c55e' }}>최대 {fmt(cut.save)}원 절약</span>}
                        </div>
                        <p style={{ fontSize: 13, color: textSecondary, lineHeight: 1.5 }}>{typeof cut.tip === 'string' ? cut.tip : String(cut.tip ?? '')}</p>
                      </div>
                    ))}
                  </div>
                )}

                {data.saving_goal > 0 && (
                  <div style={{ background: '#F0FFF4', borderRadius: 16, padding: '12px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: textColor }}>🎯 절감 목표</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#22c55e' }}>{fmt(data.saving_goal)}원</span>
                  </div>
                )}

                {data.message && (
                  <div style={{ textAlign: 'center', padding: '14px', background: primaryLight, borderRadius: 16 }}>
                    <p style={{ fontSize: 14, color: primary, fontWeight: 500 }}>{data.message}</p>
                  </div>
                )}
              </div>
            )}

            {data?.unusual?.length > 0 && (
              <div style={{ ...card, marginBottom: 0 }}>
                <p style={cardTitle}>🚨 특이사항</p>
                {data.unusual.map((u, i) => (
                  <div key={i} style={{ display: 'flex', gap: 9, padding: '8px 0', borderTop: i > 0 ? '1px solid #F2F4F6' : 'none' }}>
                    <span style={{ fontSize: 14, lineHeight: '20px', flexShrink: 0 }}>⚡</span>
                    <p style={{ fontSize: 13, color: textColor, lineHeight: 1.6 }}>{typeof u === 'string' ? u : (u?.tip || u?.reason || u?.description || u?.message || JSON.stringify(u))}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {mode === 'auto' && data && (
          <button onClick={handleSave} disabled={saved || saving}
            style={{ width: '100%', marginTop: 16, padding: '14px', borderRadius: 14, border: 'none', cursor: saved || saving ? 'default' : 'pointer',
              background: saved ? '#e5e7eb' : primary, color: saved ? textSecondary : '#fff', fontSize: 15, fontWeight: 700 }}>
            {saved ? '저장됨 ✓' : saving ? '저장 중...' : '이 리포트 저장하기'}
          </button>
        )}
      </div>
    </BottomSheet>
  )
}
