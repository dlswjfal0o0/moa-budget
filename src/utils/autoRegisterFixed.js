import { resolveFixedForMonth, toMonthKey } from './fixedExpenses'

// 자동 등록을 마치면 보내는 이벤트 — 이미 열려 있는 화면(홈·가계부·캘린더)이 거래/고정지출을 다시 읽게 한다
export const FIXED_AUTO_REGISTERED_EVENT = 'moa-fixed-auto-registered'

// 한 번도 자동 등록한 적 없는 항목은 이번 달만 등록한다. 무료 사용자였다가 구독한 경우 등에
// 과거 몇 달치가 한꺼번에 들어가는 걸 막기 위해서다. 놓친 달 채우기는 아래 최대 개월 수로 제한한다.
const MAX_BACKFILL_MONTHS = 12

const nextMonthKey = (key) => {
  const [y, m] = key.split('-').map(Number)
  return toMonthKey(y, m) // monthIndex m == 다음 달
}

// 결제일이 그 달에 없으면(예: 31일인데 2월) 그 달 마지막 날로 등록한다
const dueDateInMonth = (monthKey, dueDay) => {
  const [y, m] = monthKey.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  return `${monthKey}-${String(Math.min(dueDay, lastDay)).padStart(2, '0')}`
}

// 고정지출 목록에서 지금 등록해야 하는 거래와, 등록 기록이 반영된 새 목록을 계산한다(부수효과 없음).
// - 마지막으로 자동 등록한 달 다음 달부터 이번 달까지 빠진 달을 채운다(앱을 한동안 안 연 경우)
// - 이번 달은 결제일이 지났을 때만, 지난달들은 결제일과 무관하게 등록한다
// - 사용자가 직접 체크(doneMonths)한 달은 이미 거래가 만들어졌으므로 건너뛴다
// - 체크는 사용자가 직접 하는 확인 표시라서, 자동 등록해도 체크(doneMonths)는 건드리지 않는다
export function planAutoRegistration(fixedList, now = new Date()) {
  const nowMonthKey = toMonthKey(now.getFullYear(), now.getMonth())
  const transactions = []

  const updated = (fixedList || []).map(raw => {
    const registered = raw.autoRegisteredMonths || []
    const done = raw.doneMonths || []
    const lastRegistered = registered.filter(m => m < nowMonthKey).sort().pop()

    let from = lastRegistered ? nextMonthKey(lastRegistered) : nowMonthKey
    const earliest = toMonthKey(now.getFullYear(), now.getMonth() - MAX_BACKFILL_MONTHS)
    if (from < earliest) from = earliest

    const newMonths = []
    for (let m = from; m <= nowMonthKey; m = nextMonthKey(m)) {
      if (registered.includes(m) || done.includes(m)) continue
      const f = resolveFixedForMonth(raw, m) // 그 달에 적용되는 버전 기준
      if (!f || !f.autoRegister || !f.dueDate) continue
      const dueDay = parseInt(f.dueDate.split('-')[2])
      if (isNaN(dueDay)) continue
      if (m === nowMonthKey && now.getDate() < dueDay) continue
      transactions.push({
        month: m, type: 'expense',
        title: f.title, amount: f.amount,
        category: f.category || '기타', payment: f.payment || '현금',
        date: dueDateInMonth(m, dueDay), time: '00:00', memo: '고정지출 자동 등록',
        isAutoRegistered: true, fixedExpenseId: String(f.id),
      })
      newMonths.push(m)
    }
    if (newMonths.length === 0) return raw
    // 이중 등록은 autoRegisteredMonths로 막는다
    return { ...raw, autoRegisteredMonths: [...registered, ...newMonths] }
  })

  return { transactions, updated }
}
