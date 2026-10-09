import ThinkingOrbs from './ThinkingOrbs'
import FitText from './FitText'
import { FailureIcon, PreviewIcon } from './AiConsumptionReport'
import { describeFailure } from '../utils/aiFailure'

// AI 공과금 분석 카드 본문. 'AI 소비 분석'(AiConsumptionReport)과 같은 흐름을 따른다:
// 분석 전 미리보기(이번 달 수치 + 알 수 있는 것 + 큰 시작 버튼) → 분석 중 → 결과 / 실패 안내,
// 저장된 결과면 헤더에 '분석 완료' 표시. 일반/뉴모피즘 분석 화면이 같은 레이아웃을 공유한다.

const GREEN = '#12A150'
const UP = '#F97316'

export default function AiUtilityReport({
  data, raw, loading, saved, onAnalyze,
  primary, primaryLight, text = '#191F28', fmt,
  showAdvice = true, hasData = true,
  month, currentTotal = 0, prevTotal = 0,
  itemDiffs = {}, utilityStyles = {}, UtilityIcon,
  neumorphism = false, coloredShadow,
}) {
  const body = `${text}D9`
  const muted = `${text}8C`
  const divider = neumorphism ? 'rgba(163,177,198,0.3)' : `${text}14`
  const panel = neumorphism ? { className: 'neu-inset', style: {} } : { style: { background: `${text}08` } }
  const tinted = neumorphism ? { className: 'neu-inset', style: {} } : { style: { background: `${primary}0F` } }

  const items = Array.isArray(data?.items) ? data.items.filter(it => it && it.type) : []
  const failure = !loading && raw ? describeFailure(raw) : null
  const isEmpty = !loading && !data && !raw
  const previews = [
    { kind: 'trend', label: '항목별 증감' },
    { kind: 'reason', label: '늘고 줄어든 이유' },
    showAdvice && { kind: 'save', label: '아낄 수 있는 방법' },
  ].filter(Boolean)

  return (
    <>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: data || failure || loading ? 18 : 12 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: text }}>AI 공과금 분석</p>
        {saved && !loading ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: primary, background: neumorphism ? undefined : primaryLight, padding: '6px 11px', borderRadius: 9999 }}
            className={neumorphism ? 'neu-inset' : undefined}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            분석 완료
          </span>
        ) : !isEmpty && !failure && (
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
          <ThinkingOrbs color={primary} size={40} label="공과금 패턴을 비교하는 중...." />
        </div>
      )}

      {/* 분석 전: 받게 될 결과 미리보기 + 시작 버튼 */}
      {isEmpty && (
        <div>
          <p style={{ fontSize: 18, fontWeight: 800, color: text, letterSpacing: '-0.03em', lineHeight: 1.35, wordBreak: 'keep-all' }}>
            {month ? `${month}월 공과금, ` : '이번 달 공과금, '}<span style={{ color: primary }}>AI가 짚어드릴게요</span>
          </p>
          <p style={{ fontSize: 13.5, color: muted, lineHeight: 1.55, marginTop: 4, wordBreak: 'keep-all' }}>
            전월·전년도와 비교해 어떤 항목이 늘고 줄었는지, 왜 그런지 알려드려요.
          </p>

          {hasData && (() => {
            const diffPct = prevTotal > 0 ? Math.round(((currentTotal - prevTotal) / prevTotal) * 100) : null
            const up = diffPct !== null && diffPct > 0
            const diffColor = diffPct === null || diffPct === 0 ? muted : up ? '#F04452' : GREEN
            return (
              <div {...panel} style={{ ...panel.style, borderRadius: 14, padding: '12px 14px', marginTop: 14, display: 'flex', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, color: muted, marginBottom: 2 }}>이번 달 공과금</p>
                  <p style={{ fontSize: 17, fontWeight: 800, color: text, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}><FitText>{fmt(currentTotal)}원</FitText></p>
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
            {hasData ? '✨ 이번 달 공과금 분석하기' : '분석할 공과금이 없어요'}
          </button>
          <p style={{ fontSize: 12, color: muted, lineHeight: 1.5, marginTop: 10, textAlign: 'center', wordBreak: 'keep-all' }}>
            {hasData ? '같은 내역으로는 언제 봐도 같은 분석 결과를 보여드려요.' : '위에서 이번 달 공과금을 입력하면 분석할 수 있어요.'}
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
          {/* 총평 */}
          {data.overall && (
            <p style={{ fontSize: 15, color: body, lineHeight: 1.7, wordBreak: 'keep-all' }}>{data.overall}</p>
          )}

          {/* 항목별 */}
          {items.length > 0 && (
            <div style={{ marginTop: data.overall ? 20 : 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: muted, marginBottom: 4 }}>항목별 분석</p>
              {items.map((item, i) => {
                const ustyle = utilityStyles[item.type] || { color: muted }
                const diff = itemDiffs[item.type] ?? null
                const isUp = diff !== null ? diff > 0 : item.status === 'up'
                const badgeColor = isUp ? UP : GREEN
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 0', borderTop: i === 0 ? 'none' : `1px solid ${divider}` }}>
                    <div {...(neumorphism ? { className: 'neu-inset' } : {})}
                      style={{ width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        background: neumorphism ? undefined : ustyle.bg }}>
                      {UtilityIcon && <UtilityIcon type={item.type} color={ustyle.color} size={18} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: text }}>{item.type}</span>
                        {diff !== null && diff !== 0 && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: badgeColor, background: `${badgeColor}18`, padding: '2px 8px', borderRadius: 9999, whiteSpace: 'nowrap' }}>
                            {isUp ? '↑' : '↓'} {diff > 0 ? '+' : ''}{fmt(diff)}원
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 14, color: body, lineHeight: 1.65, wordBreak: 'keep-all' }}>{item.comment}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* 절약 제안 */}
          {data.tip && (
            <div {...tinted} style={{ ...tinted.style, borderRadius: 16, padding: '14px 16px', marginTop: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: GREEN, marginBottom: 4 }}>아낄 수 있는 방법</p>
              <p style={{ fontSize: 14, color: body, lineHeight: 1.65, wordBreak: 'keep-all' }}>{data.tip}</p>
            </div>
          )}

          {saved && (
            <p style={{ fontSize: 12, color: muted, lineHeight: 1.5, marginTop: 16, wordBreak: 'keep-all' }}>
              같은 내역으로는 같은 분석을 보여드려요. 이번 달 공과금이 바뀌면 다시 분석할 수 있어요.
            </p>
          )}
        </div>
      )}
    </>
  )
}
