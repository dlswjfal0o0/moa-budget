import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'

// 약관/개인정보처리방침은 웹에 배포된 페이지를 연다. 앱 번들 안의 상대 경로(/terms.html)를
// 새 창으로 열면 Capacitor가 Safari에 https://localhost/terms.html을 넘겨 열리지 않는다.
const WEB_BASE = 'https://moa-budget.vercel.app'
export const TERMS_URL = `${WEB_BASE}/terms.html`
export const PRIVACY_URL = `${WEB_BASE}/privacy.html`

// 앱에서는 Safari로 나가지 않고 앱 위에 인앱 브라우저(SFSafariViewController)로 띄운다 —
// 닫으면 보던 화면(결제 화면 등)으로 그대로 돌아온다. 웹에서는 새 탭으로 연다.
export function openLink(url) {
  if (Capacitor.isNativePlatform()) {
    Browser.open({ url, presentationStyle: 'popover' })
  } else {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}
