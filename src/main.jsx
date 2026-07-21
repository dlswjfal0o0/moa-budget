import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import { CapacitorUpdater } from '@capgo/capacitor-updater'
import './index.css'
import App from './App.jsx'
import { initSentry } from './utils/sentry'

initSentry()

// Capgo OTA 번들 다운로드/적용 준비만 되어 있고, 실제로 캡고 계정을 만들고
// CLI로 앱을 등록/업로드하기 전까지는 아무 것도 하지 않는다(no-op).
// notifyAppReady()를 호출하지 않으면 캡고가 새 번들을 "부팅 실패"로 보고
// 자동으로 이전 번들로 되돌리므로(이미 계정을 붙이면), 네이티브에서는
// 항상 호출해 둔다. 계정/업로드 절차는 docs/ota-update-setup.md 참고.
if (Capacitor.isNativePlatform()) {
  CapacitorUpdater.notifyAppReady()
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('SW registered'))
      .catch(err => console.log('SW failed:', err))
  })
}