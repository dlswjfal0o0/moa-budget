// AI 분석 스타일(공감적 ↔ 이성적) 5단계 슬라이더. 온보딩과 MY 설정에서 공용으로 사용.
const LEVEL_LABELS = ['매우 공감적', '공감적', '균형형', '이성적', '매우 이성적']

export default function AIStyleSlider({ value, onChange, primary }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1' }}>공감적</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1' }}>이성적</span>
      </div>
      <input
        type="range" min="1" max="5" step="1" value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: primary, cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
        {LEVEL_LABELS.map((label, i) => {
          const level = i + 1
          const active = level === value
          return (
            <span key={level} style={{
              fontSize: 11, fontWeight: active ? 700 : 500,
              color: active ? primary : '#C9CDD4',
              flex: level === 1 || level === 5 ? '0 0 auto' : 1,
              textAlign: level === 1 ? 'left' : level === 5 ? 'right' : 'center',
              transition: 'color 0.15s',
            }}>
              {label}
            </span>
          )
        })}
      </div>
    </div>
  )
}
