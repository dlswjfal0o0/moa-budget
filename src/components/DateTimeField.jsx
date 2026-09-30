// 날짜/시간 입력 필드. 네이티브 date/time input은 iOS WKWebView와 Chrome이 모양을 제각각
// 그리고(iOS는 padding/border 무시, 빈 값이면 빈 칸) 앱 디자인과 어긋나므로, 값은 직접 그리고
// 투명한 네이티브 input(.dt-tap-overlay)을 위에 덮어 탭하면 시스템 피커만 뜨게 한다.
// style/className은 입력창 박스(div)에 그대로 적용된다.

const formatDate = (v) => v.replace(/(\d{4})-(\d{2})-(\d{2})/, '$1. $2. $3.')

const formatTime = (time) => {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const period = h < 12 ? '오전' : '오후'
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${period} ${hour}:${String(m).padStart(2, '0')}`
}

export default function DateTimeField({ type = 'date', value, onChange, placeholder = '', disabled, className, style, ariaLabel }) {
  const text = value ? (type === 'time' ? formatTime(value) : formatDate(value)) : placeholder
  return (
    <div className={['dt-field', className].filter(Boolean).join(' ')}
      style={{ position: 'relative', display: 'flex', alignItems: 'center', ...style }}>
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: value ? undefined : '#B0B8C1' }}>
        {text || ' '}
      </span>
      <input type={type} className="dt-tap-overlay" value={value || ''} onChange={onChange} disabled={disabled}
        aria-label={ariaLabel || placeholder || undefined}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: disabled ? 'default' : 'pointer' }} />
    </div>
  )
}
