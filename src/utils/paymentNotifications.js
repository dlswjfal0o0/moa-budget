import { LocalNotifications } from '@capacitor/local-notifications'

// 정보통신망법 시행령상 심야시간대(오후 9시~다음날 오전 8시) 발송 제한 기준
export const NIGHT_START = 21
export const NIGHT_END = 8

const SOURCE = 'moa-payment-reminder'

const isNative = () => {
  try { return window.Capacitor?.isNativePlatform?.() ?? false } catch { return false }
}

const parseTime = (timeStr) => {
  const [h, m] = (timeStr || '09:00').split(':').map(Number)
  return { hours: Number.isNaN(h) ? 9 : h, minutes: Number.isNaN(m) ? 0 : m }
}

// fixedExpenses의 id(Date.now() 기반, 13자리)를 local-notifications의 32bit int id로 변환
const hashToId = (id) => {
  const str = String(id)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0
  }
  return (Math.abs(hash) % 2000000000) + 1
}

export const isDoneForMonth = (fixedExpense, monthKey) =>
  (fixedExpense.doneMonths || []).includes(monthKey)

// 심야시간 동의가 없으면 21시~08시 발송분을 08시(당일 새벽분은 당일, 저녁분은 다음날)로 이월
export const applyNightPolicy = (date, nightConsent) => {
  if (!date || nightConsent) return date
  const hour = date.getHours()
  if (hour >= NIGHT_START) {
    const next = new Date(date)
    next.setDate(next.getDate() + 1)
    next.setHours(NIGHT_END, 0, 0, 0)
    return next
  }
  if (hour < NIGHT_END) {
    const next = new Date(date)
    next.setHours(NIGHT_END, 0, 0, 0)
    return next
  }
  return date
}

// 결제일 하루 전, 지정 시각의 다음 알림 발송 시점을 계산 (이미 이번 달분을 완료했으면 다음 달로)
export const computeReminderDate = (fixedExpense, timeStr, nightConsent, now = new Date()) => {
  const dueDay = parseInt(fixedExpense.dueDate?.split('-')[2], 10)
  if (Number.isNaN(dueDay)) return null
  const { hours, minutes } = parseTime(timeStr)

  let year = now.getFullYear()
  let month = now.getMonth()
  for (let i = 0; i < 3; i++) {
    const due = new Date(year, month, dueDay)
    const monthKey = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}`
    if (!isDoneForMonth(fixedExpense, monthKey)) {
      const candidate = applyNightPolicy(new Date(year, month, dueDay - 1, hours, minutes, 0, 0), nightConsent)
      if (candidate && candidate > now) return candidate
    }
    month += 1
  }
  return null
}

export const requestPaymentNotificationPermission = async () => {
  if (!isNative()) return true
  try {
    const result = await LocalNotifications.requestPermissions()
    return result.display === 'granted'
  } catch {
    return false
  }
}

// fixedExpenses/설정이 바뀔 때마다 예약된 결제 알림을 전부 취소하고 현재 상태 기준으로 재예약
export const syncPaymentNotifications = async ({ fixedExpenses, settings, isPro }) => {
  if (!isNative()) return
  try {
    const pending = await LocalNotifications.getPending()
    const ourIds = pending.notifications
      .filter(n => n.extra?.source === SOURCE)
      .map(n => n.id)
    if (ourIds.length > 0) {
      await LocalNotifications.cancel({ notifications: ourIds.map(id => ({ id })) })
    }

    if (!isPro || !settings?.notifyPaymentEnabled) return

    const now = new Date()
    const notifications = (fixedExpenses || [])
      .filter(f => f.dueDate)
      .map(f => {
        const reminder = computeReminderDate(f, settings.notifyPaymentTime, settings.notifyNightConsent, now)
        if (!reminder) return null
        return {
          id: hashToId(f.id),
          title: '내일 결제 예정',
          body: `${f.title} ${Number(f.amount || 0).toLocaleString('ko-KR')}원이 내일 결제될 예정이에요`,
          schedule: { at: reminder },
          extra: { source: SOURCE, fixedExpenseId: String(f.id) },
        }
      })
      .filter(Boolean)

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications })
    }
  } catch (err) {
    console.error('[paymentNotifications] 알림 동기화 실패', err)
  }
}
