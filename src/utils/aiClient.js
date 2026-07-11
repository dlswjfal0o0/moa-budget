// /api/ai 호출 공통 헬퍼. 로그인한 사용자의 Firebase ID 토큰을 Authorization 헤더로 함께 보낸다.
// (서버가 토큰을 검증하지 않으면 누구나 이 엔드포인트를 직접 호출해 API 키 크레딧을 소모할 수 있어 필수.)
import { auth } from '../firebase/config'

// iOS(Capacitor) 앱은 capacitor://localhost에서 로드되므로 상대경로(/api/ai)로는
// 배포된 백엔드에 닿지 않는다. 항상 절대 URL로 호출한다 — 웹 배포에서도 동일 도메인이라 문제없다.
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://moa-budget.vercel.app'

export async function callAI(body) {
  const user = auth.currentUser
  if (!user) {
    return { content: [{ text: '로그인이 필요해요.' }] }
  }
  const idToken = await user.getIdToken()
  const res = await fetch(`${API_BASE}/api/ai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  })
  return res.json()
}
