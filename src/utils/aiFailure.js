// 서버/파싱 실패 문구를 사용자용 안내로 바꾼다. 기술적인 원문(Claude 오류, 연결 오류 등)은 노출하지 않는다.
export function describeFailure(raw) {
  const t = raw || ''
  if (t.includes('사용 횟수')) {
    return { icon: 'limit', title: '오늘 분석 횟수를 모두 썼어요', desc: '하루에 분석할 수 있는 횟수가 정해져 있어요. 내일 다시 시도해주세요.', retry: false }
  }
  if (t.includes('로그인')) {
    return { icon: 'lock', title: '로그인이 필요해요', desc: '다시 로그인한 뒤 분석해주세요.', retry: false }
  }
  return { icon: 'error', title: '분석을 완료하지 못했어요', desc: '일시적인 문제일 수 있어요. 잠시 후 다시 시도해주세요.', retry: true }
}
