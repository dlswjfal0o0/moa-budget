import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'

const isNative = () => {
  try { return window.Capacitor?.isNativePlatform?.() ?? false } catch { return false }
}

export const haptic = {
  /** 카드 선택 */
  selection: async () => {
    if (!isNative()) return
    try { await Haptics.selectionChanged() } catch { /* ignore */ }
  },

  /** 저장/추가/수정 성공, Undo 성공 */
  success: async () => {
    if (!isNative()) return
    try { await Haptics.notification({ type: NotificationType.Success }) } catch { /* ignore */ }
  },

  /** 카드 삭제 시작 */
  light: async () => {
    if (!isNative()) return
    try { await Haptics.impact({ style: ImpactStyle.Light }) } catch { /* ignore */ }
  },

  /** 유효성 검사 오류 */
  warning: async () => {
    if (!isNative()) return
    try { await Haptics.notification({ type: NotificationType.Warning }) } catch { /* ignore */ }
  },
}
