import * as Sentry from '@sentry/node'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getSystemPrompt } from '../src/utils/aiPrompt.js'

// SENTRY_DSN이 없으면(기본 상태) 아무 것도 하지 않는다 — Vercel 환경변수에
// SENTRY_DSN만 추가하면 이 함수의 예외가 바로 Sentry로 올라간다.
if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.VERCEL_ENV || 'development' })
}

// system 프롬프트는 클라이언트가 임의로 바꿀 수 없도록, 정해진 도메인 키만 허용한다.
const DOMAIN_LABELS = {
  budget: '예산 인사이트',
  consumption: '소비 분석',
  utility: '공과금 분석',
}

// 사용자 1인당 하루 호출 상한. 필요시 Vercel 환경변수로 조정 가능(코드 배포 없이).
const AI_DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT) || 50
// 요청 본문(분석할 거래 요약)의 최대 길이. 앱이 보내는 프롬프트는 수천 자 수준이라 넉넉하게 잡되,
// 거대한 입력으로 토큰 비용을 키우는 호출은 막는다.
const MAX_INPUT_CHARS = Number(process.env.AI_MAX_INPUT_CHARS) || 20000

// 서비스 계정 키(JSON)는 Vercel 환경변수 FIREBASE_SERVICE_ACCOUNT에 둔다(원문 JSON 또는 base64).
// 사용 횟수는 이 권한으로만 기록한다 — 예전처럼 사용자 토큰으로 사용자 문서에 쓰면
// 사용자가 같은 권한으로 횟수를 0으로 되돌릴 수 있었다.
function getAdmin() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT
    if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT 환경변수가 없어요')
    const json = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8')
    initializeApp({ credential: cert(JSON.parse(json)) })
  }
  return { auth: getAuth(), db: getFirestore() }
}

// 하루 기준은 한국 시간 자정이다(UTC로 세면 오전 9시에 초기화된다)
const todayKST = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10)

// aiUsage/{uid}: 클라이언트는 읽기·쓰기 모두 불가(firestore.rules), 서버만 기록한다.
// 트랜잭션으로 읽고 올리므로 동시에 여러 요청을 보내도 한도를 넘길 수 없다.
async function checkAndBumpDailyUsage(db, uid) {
  const today = todayKST()
  const ref = db.collection('aiUsage').doc(uid)
  const { allowed, count } = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const data = snap.exists ? snap.data() : null
    const current = data?.date === today ? Number(data.count) || 0 : 0
    if (current >= AI_DAILY_LIMIT) return { allowed: false, count: current }
    tx.set(ref, { date: today, count: current + 1, updatedAt: new Date() })
    return { allowed: true, count: current + 1 }
  })

  // 남용 탐지용 로그. Vercel 함수 로그에서 uid로 검색할 수 있다.
  if (allowed) console.log(`[ai-usage] uid=${uid} date=${today} count=${count}`)
  else console.warn(`[ai-usage-blocked] uid=${uid} date=${today} count=${count} limit=${AI_DAILY_LIMIT}`)
  return allowed
}

// iOS(Capacitor) 앱은 capacitor://localhost 같은 커스텀 스킴 오리진에서 이 절대 URL로 요청하므로
// 브라우저(WKWebView)의 CORS 프리플라이트(OPTIONS)를 통과해야 실제 POST가 나간다.
// 인증은 Origin이 아니라 Authorization 헤더의 Firebase ID 토큰으로 하므로 오리진을 넓게 허용해도 안전하다.
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

const reply = (res, status, text) => res.status(status).json({ content: [{ text }] })

export default async function handler(req, res) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const authHeader = req.headers.authorization
    const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!idToken) return reply(res, 401, '로그인이 필요해요.')

    const { auth, db } = getAdmin()
    let uid
    try {
      uid = (await auth.verifyIdToken(idToken)).uid
    } catch {
      return reply(res, 401, '로그인이 필요해요.')
    }

    const { messages, domain, styleLevel, showAdvice, temperature, max_tokens } = req.body || {}
    const domainLabel = DOMAIN_LABELS[domain]
    if (!domainLabel) return reply(res, 400, '잘못된 요청이에요.')
    const content = typeof messages?.[0]?.content === 'string' ? messages[0].content : ''
    if (!content) return reply(res, 400, '잘못된 요청이에요.')
    if (content.length > MAX_INPUT_CHARS) return reply(res, 413, '분석할 내용이 너무 많아요. 기간을 줄여 다시 시도해주세요.')

    // 입력 검증을 통과한 요청만 횟수에 센다
    const withinLimit = await checkAndBumpDailyUsage(db, uid)
    if (!withinLimit) return reply(res, 429, '오늘 AI 분석 사용 횟수를 다 썼어요. 내일 다시 시도해주세요.')

    const key = process.env.ANTHROPIC_API_KEY
    if (!key) {
      Sentry.captureMessage('ANTHROPIC_API_KEY 미설정', 'error')
      await Sentry.flush(2000)
      return reply(res, 503, 'AI 분석을 잠시 사용할 수 없어요. 잠시 후 다시 시도해주세요.')
    }

    const safeStyleLevel = Number.isInteger(styleLevel) && styleLevel >= 1 && styleLevel <= 5 ? styleLevel : 3
    const safeShowAdvice = showAdvice === true
    const system = getSystemPrompt({ domain: domainLabel, styleLevel: safeStyleLevel, showAdvice: safeShowAdvice })
    const safeMaxTokens = Math.min(Math.max(Number(max_tokens) || 1024, 1), 2000)
    const safeTemperature = typeof temperature === 'number' && temperature >= 0 && temperature <= 1 ? temperature : 0.7

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          // 빠르고 저렴하면서도 한국어 품질이 우수한 모델. ANTHROPIC_MODEL 환경변수로 교체 가능.
          model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
          system,
          messages: [{ role: 'user', content }],
          max_tokens: safeMaxTokens,
          temperature: safeTemperature,
        })
      })

      const data = await response.json()
      const text = (data.content?.[0]?.text || '').trim()

      if (!text) {
        // 상세 원인(크레딧 부족 등 내부 정보)은 Sentry에만 남기고 사용자에게는 일반 문구만 보낸다
        const reason = data.error?.message || JSON.stringify(data).slice(0, 200)
        Sentry.captureMessage(`Claude 응답 비어있음: ${reason}`, 'warning')
        await Sentry.flush(2000)
        return reply(res, 502, 'AI 분석에 실패했어요. 잠시 후 다시 시도해주세요.')
      }

      return reply(res, 200, text)
    } catch (err) {
      Sentry.captureException(err)
      await Sentry.flush(2000)
      return reply(res, 502, 'AI 서버에 연결하지 못했어요. 잠시 후 다시 시도해주세요.')
    }
  } catch (err) {
    // 서비스 계정 미설정, 사용량 기록 실패 등 예상치 못한 실패 — 의도된 401/429/400 응답은 여기로 오지 않는다.
    Sentry.captureException(err)
    await Sentry.flush(2000)
    return reply(res, 500, '서버 오류가 발생했어요.')
  }
}
