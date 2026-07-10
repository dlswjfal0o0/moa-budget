// 설정 화면용 토글
export default function SToggle({ on, onChange, primary }) {
  return (
    <div onClick={() => onChange(!on)}
      style={{ width: 48, height: 28, borderRadius: 9999, background: on ? primary : '#ddd', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: on ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
    </div>
  )
}
