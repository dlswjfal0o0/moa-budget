import ThinkingOrbs from './ThinkingOrbs'
import FitText from './FitText'

// AI 소비 분석 카드 본문. 일반/뉴모피즘 분석 화면이 같은 레이아웃을 공유한다.
// 파스텔 테마는 카드 배경·글자색이 테마마다 달라서, 본문/보조 글자색은 테마 text에 투명도를 줘 만든다.
//
// 설정의 "AI 분석 스타일"(1 매우 공감적 ~ 5 매우 이성적)에 맞춰 카드의 톤도 바꾼다.
// - warm(1~2): 조언을 말풍선처럼, 응원 메시지를 앞쪽에 크게
// - balanced(3): 번호 목록 + 카테고리 지출 대비 절감 비율
// - data(4~5): 표처럼 촘촘하게, 숫자(지출·절감액·비율) 우선, 감정 메시지는 숨김

const GREEN = '#12A150'
const LEVEL_NAMES = ['위험', '주의', '보통', '양호', '우수']

const RATING_COLORS = { good: GREEN, warning: '#E08600', danger: '#F04452' }
const RATING_LABELS = {
  warm:     { good: '정말 잘하고 있어요', warning: '조금만 신경 써볼까요?', danger: '이번 달은 지출이 많았어요' },
  balanced: { good: '소비 우등생이에요', warning: '지출 관리가 필요해요', danger: '지출이 많은 편이에요' },
  data:     { good: '안정적인 소비', warning: '지출 관리 필요', danger: '지출 과다' },
}
const ADVICE_TITLES = { warm: '이렇게 해보면 어때요?', balanced: '아낄 수 있는 곳', data: '절감 포인트' }
const STYLE_NAMES = ['매우 공감적', '공감적', '균형형', '이성적', '매우 이성적'] // AIStyleSlider와 동일

function styleMode(level) {
  if (level <= 2) return 'warm'
  if (level >= 4) return 'data'
  return 'balanced'
}

function toText(v) {
  if (typeof v === 'string') return v
  return v?.tip || v?.reason || v?.description || v?.message || String(v ?? '')
}

// 서버/파싱 실패 문구를 사용자용 안내로 바꾼다. 기술적인 원문(Claude 오류, 연결 오류 등)은 노출하지 않는다.
function describeFailure(raw) {
  const t = raw || ''
  if (t.includes('사용 횟수')) {
    return { icon: 'limit', title: '오늘 분석 횟수를 모두 썼어요', desc: '하루에 분석할 수 있는 횟수가 정해져 있어요. 내일 다시 시도해주세요.', retry: false }
  }
  if (t.includes('로그인')) {
    return { icon: 'lock', title: '로그인이 필요해요', desc: '다시 로그인한 뒤 분석해주세요.', retry: false }
  }
  return { icon: 'error', title: '분석을 완료하지 못했어요', desc: '일시적인 문제일 수 있어요. 잠시 후 다시 시도해주세요.', retry: true }
}

function FailureIcon({ kind, color }) {
  const p = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (kind === 'limit') return <svg {...p}><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>
  if (kind === 'lock') return <svg {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
  return <svg {...p}><circle cx="12" cy="12" r="9" /><line x1="12" y1="7.5" x2="12" y2="13" /><line x1="12" y1="16.5" x2="12.01" y2="16.5" /></svg>
}

function PreviewIcon({ kind, color }) {
  const p = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (kind === 'score') return <svg {...p}><path d="M4 16a8 8 0 1 1 16 0" /><line x1="12" y1="16" x2="15.5" y2="10.5" /><circle cx="12" cy="16" r="1.2" fill={color} /></svg>
  if (kind === 'save') return <svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M14.8 9.2c-.5-.8-1.5-1.3-2.8-1.3-1.7 0-2.8.8-2.8 2s1.1 1.7 2.8 2.1 2.8.9 2.8 2.1-1.1 2-2.8 2c-1.3 0-2.3-.5-2.8-1.3" /><line x1="12" y1="6" x2="12" y2="7.9" /><line x1="12" y1="16.1" x2="12" y2="18" /></svg>
  return <svg {...p}><polyline points="3 17 9 11 13 15 21 7" /><polyline points="15 7 21 7 21 13" /></svg>
}

function ScoreRing({ score, color, track, size = 68 }) {
  const stroke = 6
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.min(100, Math.max(0, Number(score) || 0)) / 100
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.22,1,0.36,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'baseline', justifyContent: 'center', paddingTop: size / 2 - 13 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1, letterSpacing: '-0.02em' }}>{score ?? '-'}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color, marginLeft: 1 }}>점</span>
      </div>
    </div>
  )
}

function SectionTitle({ children, color, right }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color, letterSpacing: '-0.01em' }}>{children}</p>
      {right}
    </div>
  )
}

// 카테고리 지출 대비 절감액 막대. 지출액을 모르면 그리지 않는다.
function SaveBar({ save, spend, track, height = 4 }) {
  if (!(spend > 0) || !(save > 0)) return null
  const pct = Math.min(100, (save / spend) * 100)
  return (
    <div style={{ height, borderRadius: height, background: track, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', borderRadius: height, background: GREEN }} />
    </div>
  )
}

export default function AiConsumptionReport({
  data, raw, loading, saved, onAnalyze,
  primary, primaryLight, text = '#191F28', fmt,
  styleLevel = 3, categorySpend = {}, showAdvice = true, hasData = true,
  month, totalExpense = 0, lastTotalExpense = 0,
  neumorphism = false, coloredShadow,
}) {
  const mode = styleMode(styleLevel)
  const body = `${text}D9`   // 본문 — 충분한 대비를 유지하면서 제목보다 한 톤 낮게
  const muted = `${text}8C`  // 보조 설명
  const divider = neumorphism ? 'rgba(163,177,198,0.3)' : `${text}14`
  const track = neumorphism ? 'rgba(163,177,198,0.35)' : `${text}12`
  const panel = neumorphism ? { className: 'neu-inset', style: {} } : { style: { background: `${text}08` } }
  const tinted = neumorphism ? { className: 'neu-inset', style: {} } : { style: { background: `${primary}0F` } }

  const ratingColor = data ? (RATING_COLORS[data.rating] || primary) : primary
  const ratingLabel = data ? (RATING_LABELS[mode][data.rating] || '분석 완료') : ''
  const level = data ? Math.min(5, Math.max(1, Math.ceil((Number(data.score) || 50) / 20))) : 0
  const cuts = Array.isArray(data?.cuts) ? data.cuts.filter(c => c && (c.category || c.tip)) : []
  const unusual = Array.isArray(data?.unusual) ? data.unusual.map(toText).filter(Boolean) : []
  const goal = Number(data?.saving_goal) > 0 ? Number(data.saving_goal) : 0
  const message = data?.message ? toText(data.message) : ''
  const failure = !loading && raw ? describeFailure(raw) : null
  const isEmpty = !loading && !data && !raw
  const previews = [
    { kind: 'score', label: '소비 점수' },
    showAdvice && { kind: 'save', label: '아낄 수 있는 곳' },
    { kind: 'trend', label: '평소와 다른 지출' },
  ].filter(Boolean)

  return (
    <>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: data || failure || loading ? 18 : 12 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: text }}>AI 소비 분석</p>
        {saved && !loading ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: primary, background: neumorphism ? undefined : primaryLight, padding: '6px 11px', borderRadius: 9999 }}
            className={neumorphism ? 'neu-inset' : undefined}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            분석 완료
          </span>
        ) : isEmpty ? (
          <span style={{ fontSize: 12, fontWeight: 600, color: muted, background: neumorphism ? undefined : `${text}0A`, padding: '5px 10px', borderRadius: 9999, whiteSpace: 'nowrap' }}
            className={neumorphism ? 'neu-inset' : undefined}>
            {STYLE_NAMES[Math.min(5, Math.max(1, styleLevel)) - 1]} 스타일
          </span>
        ) : !failure && (
          <button onClick={onAnalyze} disabled={loading}
            style={{ padding: '8px 16px', borderRadius: 9999, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', flexShrink: 0,
              background: loading ? 'rgba(0,0,0,0.08)' : primary, color: loading ? muted : '#fff', fontSize: 13, fontWeight: 600,
              boxShadow: neumorphism && !loading ? coloredShadow?.raisedSm : undefined }}>
            {loading ? '분석 중...' : '✨ AI 분석'}
          </button>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '24px 0 28px' }}>
          <ThinkingOrbs color={primary} size={40} label="소비 패턴을 분석하는 중...." />
        </div>
      )}

      {/* 분석 전: 받게 될 결과 미리보기 + 시작 버튼 */}
      {isEmpty && (
        <div>
          <p style={{ fontSize: 18, fontWeight: 800, color: text, letterSpacing: '-0.03em', lineHeight: 1.35, wordBreak: 'keep-all' }}>
            {month ? `${month}월 소비, ` : '이번 달 소비, '}<span style={{ color: primary }}>AI가 짚어드릴게요</span>
          </p>
          <p style={{ fontSize: 13.5, color: muted, lineHeight: 1.55, marginTop: 4, wordBreak: 'keep-all' }}>
            지난달과 비교해 어디에 많이 썼는지, 무엇이 달라졌는지 알려드려요.
          </p>

          {/* 이번 달 실제 수치 — 분석 전에도 내 데이터가 반영된 카드처럼 보이도록 */}
          {hasData && (() => {
            const diffPct = lastTotalExpense > 0 ? Math.round(((totalExpense - lastTotalExpense) / lastTotalExpense) * 100) : null
            const up = diffPct !== null && diffPct > 0
            const diffColor = diffPct === null || diffPct === 0 ? muted : up ? '#F04452' : GREEN
            return (
              <div {...panel} style={{ ...panel.style, borderRadius: 14, padding: '12px 14px', marginTop: 14, display: 'flex', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, color: muted, marginBottom: 2 }}>이번 달 지출</p>
                  <p style={{ fontSize: 17, fontWeight: 800, color: text, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}><FitText>{fmt(totalExpense)}원</FitText></p>
                </div>
                <div style={{ width: 1, alignSelf: 'stretch', background: divider, margin: '0 14px' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, color: muted, marginBottom: 2 }}>지난달 대비</p>
                  <p style={{ fontSize: 17, fontWeight: 800, color: diffColor, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                    {diffPct === null ? '비교 없음' : diffPct === 0 ? '변화 없음' : `${up ? '▲' : '▼'} ${Math.abs(diffPct)}%`}
                  </p>
                </div>
              </div>
            )
          })()}
          <p style={{ fontSize: 12, fontWeight: 700, color: muted, marginTop: 18, marginBottom: 8 }}>분석하면 알 수 있어요</p>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${previews.length}, 1fr)`, gap: 8 }}>
            {previews.map(pv => (
              <div key={pv.kind} {...panel} style={{ ...panel.style, borderRadius: 14, padding: '14px 6px 12px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: neumorphism ? undefined : primaryLight }}
                  className={neumorphism ? 'neu-card' : undefined}>
                  <PreviewIcon kind={pv.kind} color={primary} />
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: body, textAlign: 'center', lineHeight: 1.35, wordBreak: 'keep-all' }}>{pv.label}</span>
              </div>
            ))}
          </div>
          <button onClick={onAnalyze} disabled={!hasData}
            style={{ width: '100%', height: 50, marginTop: 16, borderRadius: 14, border: 'none',
              cursor: hasData ? 'pointer' : 'not-allowed', fontSize: 15, fontWeight: 700,
              background: hasData ? primary : `${text}14`, color: hasData ? '#fff' : muted,
              boxShadow: neumorphism && hasData ? coloredShadow?.raisedSm : undefined }}>
            {hasData ? '✨ 이번 달 소비 분석하기' : '분석할 지출 내역이 없어요'}
          </button>
          <p style={{ fontSize: 12, color: muted, lineHeight: 1.5, marginTop: 10, textAlign: 'center', wordBreak: 'keep-all' }}>
            {hasData ? '같은 내역으로는 언제 봐도 같은 분석 결과를 보여드려요.' : '이번 달 지출을 기록하면 분석할 수 있어요.'}
          </p>
        </div>
      )}

      {/* 실패 안내 */}
      {failure && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '8px 8px 4px' }}>
          <div {...panel} style={{ ...panel.style, width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FailureIcon kind={failure.icon} color={failure.icon === 'error' ? '#F04452' : muted} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, color: text, marginTop: 14, letterSpacing: '-0.02em' }}>{failure.title}</p>
          <p style={{ fontSize: 14, color: muted, lineHeight: 1.6, marginTop: 6, maxWidth: 260, wordBreak: 'keep-all' }}>{failure.desc}</p>
          {failure.retry && (
            <button onClick={onAnalyze}
              style={{ marginTop: 16, padding: '11px 22px', borderRadius: 9999, border: 'none', cursor: 'pointer',
                background: primary, color: '#fff', fontSize: 14, fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', gap: 6,
                boxShadow: neumorphism ? coloredShadow?.raisedSm : undefined }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              다시 시도
            </button>
          )}
        </div>
      )}

      {!loading && data && (
        <div>
          {/* 점수 + 등급 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <ScoreRing score={data.score} color={ratingColor} track={track} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: text, letterSpacing: '-0.02em', lineHeight: 1.35 }}>{ratingLabel}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                {LEVEL_NAMES.map((_, i) => (
                  <span key={i} style={{ width: 18, height: 5, borderRadius: 3, background: i < level ? ratingColor : track }} />
                ))}
                <span style={{ fontSize: 12, fontWeight: 600, color: ratingColor, marginLeft: 6 }}>{LEVEL_NAMES[level - 1]}</span>
              </div>
            </div>
          </div>

          {/* 요약 */}
          {data.summary && (
            <p style={{ fontSize: 15, color: body, lineHeight: 1.7, marginTop: 16, wordBreak: 'keep-all' }}>{toText(data.summary)}</p>
          )}

          {/* 공감형: 응원 메시지를 요약 바로 아래 말풍선으로 */}
          {mode === 'warm' && message && (
            <div {...tinted} style={{ ...tinted.style, borderRadius: '4px 16px 16px 16px', padding: '12px 14px', marginTop: 12 }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: body, lineHeight: 1.65, wordBreak: 'keep-all' }}>{message}</p>
            </div>
          )}

          {/* 조언 */}
          {(cuts.length > 0 || goal > 0) && (
            <div style={{ marginTop: 24 }}>
              <SectionTitle color={muted}
                right={mode === 'data' && goal > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: muted }}>목표 <b style={{ color: GREEN, fontSize: 13, whiteSpace: 'nowrap' }}>{fmt(goal)}원</b></span>
                )}>
                {ADVICE_TITLES[mode]}
              </SectionTitle>

              {/* 절감 목표 배너 (data 모드는 제목 옆 숫자로 대체) */}
              {goal > 0 && mode !== 'data' && (
                <div {...panel} style={{ ...panel.style, borderRadius: 14, padding: '14px 16px', marginBottom: 12,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 12, color: muted, marginBottom: 2 }}>{mode === 'warm' ? '아래 방법을 실천하면' : '이번 달 절감 목표'}</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: body }}>{mode === 'warm' ? '이만큼 아낄 수 있어요' : `${cuts.length}가지 방법으로`}</p>
                  </div>
                  <span style={{ fontSize: 20, fontWeight: 800, color: GREEN, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}><FitText>{fmt(goal)}원</FitText></span>
                </div>
              )}

              {/* warm: 말풍선 카드 */}
              {mode === 'warm' && cuts.map((cut, i) => (
                <div key={i} {...tinted} style={{ ...tinted.style, borderRadius: 16, padding: '14px 16px', marginTop: i === 0 ? 0 : 8 }}>
                  <p style={{ fontSize: 15, color: body, lineHeight: 1.65, wordBreak: 'keep-all' }}>{toText(cut.tip)}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                    {cut.category && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: primary, background: neumorphism ? undefined : '#fff', padding: '3px 10px', borderRadius: 9999 }}
                        className={neumorphism ? 'neu-card' : undefined}>{cut.category}</span>
                    )}
                    {cut.save > 0 && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: GREEN }}>약 {fmt(cut.save)}원 아낄 수 있어요</span>
                    )}
                  </div>
                </div>
              ))}

              {/* balanced: 번호 목록 + 지출 대비 절감 비율 */}
              {mode === 'balanced' && cuts.map((cut, i) => {
                const spend = categorySpend[cut.category]
                return (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 0', borderTop: i === 0 ? 'none' : `1px solid ${divider}` }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, fontSize: 12, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: primary }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: text }}>{cut.category}</span>
                        {cut.save > 0 && <span style={{ fontSize: 14, fontWeight: 700, color: GREEN, whiteSpace: 'nowrap' }}>−{fmt(cut.save)}원</span>}
                      </div>
                      {spend > 0 && cut.save > 0 && (
                        <div style={{ margin: '8px 0 10px' }}>
                          <SaveBar save={cut.save} spend={spend} track={track} />
                          <p style={{ fontSize: 12, color: muted, marginTop: 5 }}>이번 달 {cut.category} {fmt(spend)}원 중 {Math.round((cut.save / spend) * 100)}%</p>
                        </div>
                      )}
                      <p style={{ fontSize: 14, color: body, lineHeight: 1.65, marginTop: spend > 0 && cut.save > 0 ? 0 : 6, wordBreak: 'keep-all' }}>{toText(cut.tip)}</p>
                    </div>
                  </div>
                )
              })}

              {/* data: 표 형태 */}
              {mode === 'data' && cuts.length > 0 && (
                <div {...panel} style={{ ...panel.style, borderRadius: 14, padding: '4px 14px' }}>
                  {cuts.map((cut, i) => {
                    const spend = categorySpend[cut.category]
                    const rate = spend > 0 && cut.save > 0 ? Math.round((cut.save / spend) * 100) : null
                    return (
                      <div key={i} style={{ padding: '12px 0', borderTop: i === 0 ? 'none' : `1px solid ${divider}` }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: text, flex: 1, minWidth: 0 }}>{cut.category}</span>
                          {spend > 0 && <span style={{ fontSize: 12, color: muted, fontVariantNumeric: 'tabular-nums' }}><FitText>{fmt(spend)}원</FitText></span>}
                          {cut.save > 0 && <span style={{ fontSize: 14, fontWeight: 700, color: GREEN, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>−{fmt(cut.save)}원</span>}
                          {rate !== null && <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, background: `${GREEN}14`, padding: '2px 6px', borderRadius: 6, fontVariantNumeric: 'tabular-nums' }}>{rate}%</span>}
                        </div>
                        {rate !== null && <div style={{ marginTop: 8 }}><SaveBar save={cut.save} spend={spend} track={track} height={3} /></div>}
                        <p style={{ fontSize: 13.5, color: body, lineHeight: 1.6, marginTop: 8, wordBreak: 'keep-all' }}>{toText(cut.tip)}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* 평소와 다른 지출 */}
          {unusual.length > 0 && (
            <div style={{ marginTop: 22 }}>
              <SectionTitle color={muted}>평소와 다른 지출</SectionTitle>
              {unusual.map((u, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderTop: i === 0 ? 'none' : `1px solid ${divider}` }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E08600', flexShrink: 0, marginTop: 9 }} />
                  <p style={{ fontSize: 14, color: body, lineHeight: 1.65, wordBreak: 'keep-all' }}>{u}</p>
                </div>
              ))}
            </div>
          )}

          {/* 균형형: 한마디는 맨 아래에. (공감형은 위에 표시, 이성형은 감정 표현이라 생략) */}
          {mode === 'balanced' && message && (
            <p style={{ fontSize: 14, fontWeight: 500, color: body, lineHeight: 1.65, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${divider}`, wordBreak: 'keep-all' }}>
              {message}
            </p>
          )}

          {saved && (
            <p style={{ fontSize: 12, color: muted, lineHeight: 1.5, marginTop: 16, wordBreak: 'keep-all' }}>
              같은 내역으로는 같은 분석을 보여드려요. 이번 달 내역이 바뀌면 다시 분석할 수 있어요.
            </p>
          )}
        </div>
      )}
    </>
  )
}
