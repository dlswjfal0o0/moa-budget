import ThinkingOrbs from './ThinkingOrbs'

// AI 소비 분석 카드 본문. 일반/뉴모피즘 분석 화면이 같은 레이아웃을 공유한다.
// 파스텔 테마는 카드 배경·글자색이 테마마다 달라서, 본문/보조 글자색은 테마 text에 투명도를 줘 만든다.

const RATINGS = {
  good:    { color: '#12A150', label: '소비 우등생이에요' },
  warning: { color: '#E08600', label: '지출 관리가 필요해요' },
  danger:  { color: '#F04452', label: '지출이 많은 편이에요' },
}
const LEVEL_NAMES = ['위험', '주의', '보통', '양호', '우수']

function toText(v) {
  if (typeof v === 'string') return v
  return v?.tip || v?.reason || v?.description || v?.message || String(v ?? '')
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

function SectionTitle({ children, color }) {
  return <p style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 4, letterSpacing: '-0.01em' }}>{children}</p>
}

export default function AiConsumptionReport({
  data, raw, loading, saved, onAnalyze,
  primary, primaryLight, text = '#191F28', fmt,
  neumorphism = false, coloredShadow,
}) {
  const body = `${text}D9`   // 본문 — 충분한 대비를 유지하면서 제목보다 한 톤 낮게
  const muted = `${text}8C`  // 보조 설명
  const divider = neumorphism ? 'rgba(163,177,198,0.3)' : `${text}14`
  const track = neumorphism ? 'rgba(163,177,198,0.35)' : `${text}12`
  const panel = neumorphism ? { className: 'neu-inset' } : { style: { background: `${text}08` } }

  const rating = data ? (RATINGS[data.rating] || { color: primary, label: '분석 완료' }) : null
  const level = data ? Math.min(5, Math.max(1, Math.ceil((Number(data.score) || 50) / 20))) : 0
  const cuts = Array.isArray(data?.cuts) ? data.cuts.filter(c => c && (c.category || c.tip)) : []
  const unusual = Array.isArray(data?.unusual) ? data.unusual.map(toText).filter(Boolean) : []

  return (
    <>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: data || raw || loading ? 18 : 6 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: text }}>AI 소비 분석</p>
        {saved && !loading ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: primary, background: neumorphism ? undefined : primaryLight, padding: '6px 11px', borderRadius: 9999 }}
            className={neumorphism ? 'neu-inset' : undefined}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            분석 완료
          </span>
        ) : (
          <button onClick={onAnalyze} disabled={loading}
            style={{ padding: '8px 16px', borderRadius: 9999, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', flexShrink: 0,
              background: loading ? 'rgba(0,0,0,0.08)' : primary, color: loading ? muted : '#fff', fontSize: 13, fontWeight: 600,
              boxShadow: neumorphism && !loading ? coloredShadow?.raisedSm : undefined }}>
            {loading ? '분석 중...' : raw ? '다시 시도' : '✨ AI 분석'}
          </button>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '24px 0 28px' }}>
          <ThinkingOrbs color={primary} size={40} label="소비 패턴을 분석하는 중...." />
        </div>
      )}

      {!loading && !data && !raw && (
        <p style={{ fontSize: 14, color: muted, lineHeight: 1.6, padding: '4px 0 6px' }}>
          이번 달 지출을 지난달과 비교해 소비 패턴과 아낄 수 있는 곳을 알려드려요.
        </p>
      )}

      {!loading && raw && (
        <div {...panel} style={{ ...panel.style, borderRadius: 14, padding: '14px 16px' }}>
          <p style={{ fontSize: 14, color: body, lineHeight: 1.65 }}>{raw}</p>
        </div>
      )}

      {!loading && data && (
        <div>
          {/* 점수 + 등급 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <ScoreRing score={data.score} color={rating.color} track={track} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: text, letterSpacing: '-0.02em', lineHeight: 1.35 }}>{rating.label}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                {LEVEL_NAMES.map((_, i) => (
                  <span key={i} style={{ width: 18, height: 5, borderRadius: 3, background: i < level ? rating.color : track }} />
                ))}
                <span style={{ fontSize: 12, fontWeight: 600, color: rating.color, marginLeft: 6 }}>{LEVEL_NAMES[level - 1]}</span>
              </div>
            </div>
          </div>

          {/* 요약 */}
          {data.summary && (
            <p style={{ fontSize: 15, color: body, lineHeight: 1.7, marginTop: 16, wordBreak: 'keep-all' }}>{toText(data.summary)}</p>
          )}

          {/* 아낄 수 있는 곳 */}
          {cuts.length > 0 && (
            <div style={{ marginTop: 22 }}>
              <SectionTitle color={muted}>아낄 수 있는 곳</SectionTitle>
              {cuts.map((cut, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderTop: i === 0 ? 'none' : `1px solid ${divider}` }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1, fontSize: 12, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: primary, background: neumorphism ? undefined : primaryLight }}
                    className={neumorphism ? 'neu-inset' : undefined}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: text }}>{cut.category}</span>
                      {cut.save > 0 && <span style={{ fontSize: 13, fontWeight: 700, color: '#12A150', whiteSpace: 'nowrap' }}>-{fmt(cut.save)}원</span>}
                    </div>
                    <p style={{ fontSize: 14, color: body, lineHeight: 1.65, wordBreak: 'keep-all' }}>{toText(cut.tip)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 평소와 다른 지출 */}
          {unusual.length > 0 && (
            <div style={{ marginTop: cuts.length ? 10 : 22 }}>
              <SectionTitle color={muted}>평소와 다른 지출</SectionTitle>
              {unusual.map((u, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderTop: i === 0 ? 'none' : `1px solid ${divider}` }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E08600', flexShrink: 0, marginTop: 9 }} />
                  <p style={{ fontSize: 14, color: body, lineHeight: 1.65, wordBreak: 'keep-all' }}>{u}</p>
                </div>
              ))}
            </div>
          )}

          {/* 절감 목표 */}
          {data.saving_goal > 0 && (
            <div {...panel} style={{ ...panel.style, borderRadius: 14, padding: '14px 16px', marginTop: 14,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: body }}>이번 달 절감 목표</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#12A150', letterSpacing: '-0.02em' }}>{fmt(data.saving_goal)}원</span>
            </div>
          )}

          {/* 한마디 */}
          {data.message && (
            <p style={{ fontSize: 14, fontWeight: 500, color: body, lineHeight: 1.65, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${divider}`, wordBreak: 'keep-all' }}>
              {toText(data.message)}
            </p>
          )}

          {saved && (
            <p style={{ fontSize: 12, color: muted, lineHeight: 1.5, marginTop: 16 }}>
              같은 내역으로는 같은 분석을 보여드려요. 이번 달 내역이 바뀌면 다시 분석할 수 있어요.
            </p>
          )}
        </div>
      )}
    </>
  )
}
