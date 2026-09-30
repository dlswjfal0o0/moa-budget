// 지갑에서 카드와 지폐가 번갈아 빠져나왔다 들어가는 로딩 아이콘.
// 카드/지폐는 지갑 앞판 뒤에 그려서, 아래로 내려가면 지갑 안으로 쏙 들어간 것처럼 보인다.
// 움직임은 index.css의 .ai-wallet-* 키프레임이 담당한다.
function WalletLoader({ color, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" style={{ display: 'block', flexShrink: 0, overflow: 'visible' }}>
      {/* 지폐 */}
      <g className="ai-wallet-bill">
        <rect x="8" y="9" width="24" height="14" rx="2" fill={color} opacity="0.3" />
        <circle cx="20" cy="16" r="3.2" fill="none" stroke={color} strokeWidth="1.4" opacity="0.7" />
      </g>
      {/* 카드 */}
      <g className="ai-wallet-card">
        <rect x="11" y="7" width="22" height="14" rx="2.5" fill={color} opacity="0.62" />
        <rect x="11" y="10.5" width="22" height="2.6" fill="#fff" opacity="0.55" />
      </g>
      {/* 지갑 몸통 + 똑딱이 */}
      <rect x="4" y="17" width="32" height="19" rx="5" fill={color} />
      <rect x="25" y="23" width="11" height="7" rx="3.5" fill="#fff" opacity="0.9" />
      <circle cx="29" cy="26.5" r="1.4" fill={color} />
    </svg>
  )
}

// AI 분석 로딩 표시. (파일/컴포넌트 이름은 기존 호출부 호환을 위해 유지)
// - label 없음: 지갑 아이콘만 표시
// - label 있음: 지갑 + 빛이 훑고 지나가는 문구
export default function ThinkingOrbs({ color = '#4F46E5', size = 36, label, fontSize = 15 }) {
  if (!label) {
    return <span role="status" aria-label="AI가 분석하고 있어요" style={{ display: 'inline-flex' }}><WalletLoader color={color} size={size} /></span>
  }
  return (
    <span role="status" style={{ display: 'inline-flex', alignItems: 'center', gap: size >= 32 ? 12 : 8, '--orb-color': color }}>
      <WalletLoader color={color} size={size} />
      <span className="thinking-orbs-text" style={{ fontSize }}>{label}</span>
    </span>
  )
}
