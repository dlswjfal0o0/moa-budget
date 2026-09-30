// 고정지출 월별 버전 관리
//
// 고정지출을 추가/수정/삭제하면 "그 달부터" 적용되고, 이전 달은 기존 데이터를 유지한다.
// 한 항목(id)의 데이터 구조:
//   - 최상위 title/amount/dueDate/category/payment/autoRegister: 최초(기본) 버전
//   - startMonth: 이 달부터 존재 (없으면 과거 전체에 존재 — 기존 데이터 호환)
//   - endMonth:   이 달부터 삭제됨 (없으면 계속 존재)
//   - versions:   [{ from: 'YYYY-MM', ...변경된 필드 }] from 오름차순. 해당 달 이후 덮어쓰는 값
//   - doneMonths / autoRegisteredMonths: 월별 체크 상태 (버전과 무관하게 항목 단위로 유지)

export const VERSIONED_FIELDS = ['title', 'amount', 'dueDate', 'category', 'payment', 'autoRegister']

export const toMonthKey = (year, monthIndex) => {
  const d = new Date(year, monthIndex, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const pickVersioned = (src) =>
  Object.fromEntries(VERSIONED_FIELDS.filter(k => k in src).map(k => [k, src[k]]))

// monthKey 달에 적용되는 고정지출 값. 그 달에 존재하지 않으면 null
export const resolveFixedForMonth = (f, monthKey) => {
  if (f.startMonth && monthKey < f.startMonth) return null
  if (f.endMonth && monthKey >= f.endMonth) return null
  let resolved = { ...f }
  for (const v of f.versions || []) {
    if (v.from > monthKey) break
    resolved = { ...resolved, ...pickVersioned(v) }
  }
  return resolved
}

export const fixedListForMonth = (list, monthKey) =>
  (list || []).map(f => resolveFixedForMonth(f, monthKey)).filter(Boolean)

// monthKey 달부터 존재하는 새 항목
export const createFixed = (data, monthKey) => ({
  id: Date.now(), ...pickVersioned(data),
  startMonth: monthKey, doneMonths: [], autoRegisteredMonths: []
})

// monthKey 달부터 data 값으로 변경 (이전 달은 기존 값 유지, 그 달 이후의 기존 변경분은 대체)
export const editFixedFromMonth = (f, data, monthKey) => {
  const next = pickVersioned(data)
  if (f.startMonth && monthKey <= f.startMonth) {
    // 시작 달(또는 그 이전)에서 수정 → 이전 달에 보존할 데이터가 없으므로 기본값 자체를 교체
    return { ...f, ...next, versions: [] }
  }
  const kept = (f.versions || []).filter(v => v.from < monthKey)
  return { ...f, versions: [...kept, { from: monthKey, ...next }] }
}

// monthKey 달부터 삭제. 이전 달에 남길 데이터가 없으면 null(완전 삭제)
export const deleteFixedFromMonth = (f, monthKey) => {
  if (f.startMonth && monthKey <= f.startMonth) return null
  const endMonth = f.endMonth && f.endMonth < monthKey ? f.endMonth : monthKey
  return {
    ...f, endMonth,
    versions: (f.versions || []).filter(v => v.from < endMonth),
    doneMonths: (f.doneMonths || []).filter(m => m < endMonth),
    autoRegisteredMonths: (f.autoRegisteredMonths || []).filter(m => m < endMonth),
  }
}
