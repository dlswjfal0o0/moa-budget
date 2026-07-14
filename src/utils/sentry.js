import * as Sentry from '@sentry/react'

// VITE_SENTRY_DSN이 없으면(기본 상태) 아무 것도 하지 않는다 — 계정/키가 준비되면
// Vercel 환경변수에 VITE_SENTRY_DSN만 추가하면 바로 수집이 시작된다.
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
  })
}

// Sentry.captureException은 init 전에 호출돼도 에러 없이 무시되므로
// 호출부에서 매번 DSN 여부를 확인할 필요가 없다.
export { Sentry }
