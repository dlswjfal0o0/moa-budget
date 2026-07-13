import { getSystemPrompt } from '../src/utils/aiPrompt.js'

// Firebase 프로젝트의 공개 Web API Key/프로젝트 ID. 비밀값이 아니며 src/firebase/config.js와 동일한 값.
// ID 토큰 검증(accounts:lookup)과 사용량 기록(Firestore REST)에만 사용하고, 검증/제한은 반드시 서버(여기)에서 수행한다.
const FIREBASE_WEB_API_KEY = 'AIzaSyBSeLYCOH2bL3KXKQby2-ty_y3E9n9msys'
const FIREBASE_PROJECT_ID = 'moa-budget'

// system 프롬프트는 클라이언트가 임의로 바꿀 수 없도록, 정해진 도메인 키만 허용한다.
const DOMAIN_LABELS = {
  budget: '예산 인사이트',
  consumption: '소비 분석',
  utility: '공과금 분석',
}

// 사용자 1인당 하루 호출 상한. 필요시 Vercel 환경변수로 조정 가능(코드 배포 없이).
const AI_DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT) || 50

async function verifyFirebaseIdToken(authHeader) {
  const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!idToken) return null

  const resp = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_WEB_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    },
  )
  if (!resp.ok) return null
  const data = await resp.json()
  return data.users?.[0]?.localId || null
}

// users/{uid} 문서의 aiUsage 필드로 하루 호출 횟수를 센다. 사용자 본인의 idToken으로
// Firestore REST를 호출하므로 firestore.rules(users/{uid} 소유자만 read/write)를 그대로 통과한다.
// 주의: 읽기→쓰기 사이 완벽한 원자성은 없고, 사용자가 자기 문서를 직접 수정하면 우회도 가능하다.
// (완전한 강제는 firebase-admin 서비스 계정이 필요 — 별도 범위)
async function checkAndBumpDailyUsage(uid, idToken) {
  const today = new Date().toISOString().slice(0, 10)
  const docUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${uid}`

  const getResp = await fetch(`${docUrl}?mask.fieldPaths=aiUsage`, {
    headers: { Authorization: `Bearer ${idToken}` },
  })

  let count = 0
  if (getResp.ok) {
    const doc = await getResp.json()
    const usage = doc.fields?.aiUsage?.mapValue?.fields
    if (usage?.date?.stringValue === today) {
      count = Number(usage.count?.integerValue || 0)
    }
  }

  // 남용 탐지용 로그. Vercel 함수 로그에서 uid로 검색해 특정 사용자가
  // 비정상적으로 많이 호출하는지(=count가 리셋되며 반복 급증) 확인할 수 있다.
  console.log(`[ai-usage] uid=${uid} date=${today} count=${count}`)

  if (count >= AI_DAILY_LIMIT) {
    console.warn(`[ai-usage-blocked] uid=${uid} date=${today} count=${count} limit=${AI_DAILY_LIMIT}`)
    return false
  }

  await fetch(`${docUrl}?updateMask.fieldPaths=aiUsage`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        aiUsage: {
          mapValue: {
            fields: {
              date: { stringValue: today },
              count: { integerValue: String(count + 1) },
            },
          },
        },
      },
    }),
  })

  return true
}

// iOS(Capacitor) 앱은 capacitor://localhost 같은 커스텀 스킴 오리진에서 이 절대 URL로 요청하므로
// 브라우저(WKWebView)의 CORS 프리플라이트(OPTIONS)를 통과해야 실제 POST가 나간다.
// 인증은 Origin이 아니라 Authorization 헤더의 Firebase ID 토큰으로 하므로 오리진을 넓게 허용해도 안전하다.
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

export default async function handler(req, res) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).end()

  const authHeader = req.headers.authorization
  const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const uid = await verifyFirebaseIdToken(authHeader)
  if (!uid || !idToken) {
    return res.status(401).json({ content: [{ text: '로그인이 필요해요.' }] })
  }

  const withinLimit = await checkAndBumpDailyUsage(uid, idToken)
  if (!withinLimit) {
    return res.status(429).json({ content: [{ text: '오늘 AI 분석 사용 횟수를 다 썼어요. 내일 다시 시도해주세요.' }] })
  }

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    return res.status(200).json({ content: [{ text: 'ANTHROPIC_API_KEY가 없어요.' }] })
  }

  const { messages, domain, styleLevel, showAdvice, temperature, max_tokens } = req.body || {}

  const domainLabel = DOMAIN_LABELS[domain]
  if (!domainLabel) {
    return res.status(400).json({ content: [{ text: '잘못된 요청이에요.' }] })
  }
  const safeStyleLevel = Number.isInteger(styleLevel) && styleLevel >= 1 && styleLevel <= 5 ? styleLevel : 3
  const safeShowAdvice = showAdvice === true
  const system = getSystemPrompt({ domain: domainLabel, styleLevel: safeStyleLevel, showAdvice: safeShowAdvice })
  const safeMaxTokens = Math.min(Number(max_tokens) || 1024, 2000)

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
        messages: [
          { role: 'user', content: messages?.[0]?.content || '' }
        ],
        max_tokens: safeMaxTokens,
        temperature: typeof temperature === 'number' ? temperature : 0.7
      })
    })

    const data = await response.json()
    const text = (data.content?.[0]?.text || '').trim()

    if (!text) {
      const reason = data.error?.message || JSON.stringify(data).slice(0, 200)
      return res.status(200).json({ content: [{ text: `Claude 오류: ${reason}` }] })
    }

    res.status(200).json({ content: [{ text }] })
  } catch (err) {
    res.status(200).json({ content: [{ text: `연결 오류: ${err.message}` }] })
  }
}
