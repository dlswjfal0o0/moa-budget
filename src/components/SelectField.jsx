// 드롭다운 필드. 네이티브 select는 iOS WKWebView에서 padding을 무시해 높이가 낮아지고
// 화살표도 Chrome과 달라 보이므로, appearance를 끄고 화살표를 직접 그린다.
// style/className은 select 자체에 적용된다(다른 입력창과 같은 inputStyle을 그대로 넘기면 됨).
export default function SelectField({ style, className, children, ...props }) {
  return (
    <div style={{ position: 'relative' }}>
      <select {...props} className={className}
        style={{ ...style, appearance: 'none', WebkitAppearance: 'none', paddingRight: 40, cursor: 'pointer' }}>
        {children}
      </select>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B95A1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  )
}
