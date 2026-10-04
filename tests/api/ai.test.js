// @vitest-environment node
/* global process */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// firebase-admin을 메모리 저장소로 대체한다 — 토큰 검증과 aiUsage 트랜잭션만 흉내 낸다
const store = new Map()
const verifyIdToken = vi.fn()
vi.mock('firebase-admin/app', () => ({ initializeApp: vi.fn(), getApps: () => [{}], cert: vi.fn() }))
vi.mock('firebase-admin/auth', () => ({ getAuth: () => ({ verifyIdToken }) }))
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    collection: (c) => ({ doc: (id) => ({ key: `${c}/${id}` }) }),
    runTransaction: async (fn) => fn({
      get: async (ref) => ({ exists: store.has(ref.key), data: () => store.get(ref.key) }),
      set: (ref, data) => store.set(ref.key, data),
    }),
  }),
}))
vi.mock('@sentry/node', () => ({ init: vi.fn(), captureException: vi.fn(), captureMessage: vi.fn(), flush: vi.fn() }))

const { default: handler } = await import('../../api/ai.js')

const call = async ({ token = 'good', body } = {}) => {
  const res = { statusCode: 0, body: null, headers: {} }
  res.setHeader = (k, v) => { res.headers[k] = v }
  res.status = (s) => { res.statusCode = s; return res }
  res.json = (b) => { res.body = b; return res }
  res.end = () => res
  await handler({
    method: 'POST',
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body: body ?? { domain: 'budget', messages: [{ role: 'user', content: '분석해줘' }] },
  }, res)
  return res
}
const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10)

describe('/api/ai', () => {
  beforeEach(() => {
    store.clear()
    verifyIdToken.mockReset().mockImplementation(async (t) => {
      if (t !== 'good') throw new Error('invalid')
      return { uid: 'u1' }
    })
    process.env.ANTHROPIC_API_KEY = 'test-key'
    globalThis.fetch = vi.fn(async () => ({ json: async () => ({ content: [{ text: '{"ok":true}' }] }) }))
  })

  it('토큰이 없거나 잘못되면 401, 횟수도 세지 않는다', async () => {
    expect((await call({ token: null })).statusCode).toBe(401)
    expect((await call({ token: 'bad' })).statusCode).toBe(401)
    expect(store.size).toBe(0)
  })

  it('정상 호출은 서버 전용 aiUsage/{uid}에 오늘 횟수를 올린다', async () => {
    const res = await call()
    expect(res.statusCode).toBe(200)
    expect(store.get('aiUsage/u1')).toMatchObject({ date: today, count: 1 })
  })

  it('하루 50회를 넘으면 429이고 AI를 호출하지 않는다', async () => {
    store.set('aiUsage/u1', { date: today, count: 50 })
    const res = await call()
    expect(res.statusCode).toBe(429)
    expect(globalThis.fetch).not.toHaveBeenCalled()
    expect(store.get('aiUsage/u1').count).toBe(50)
  })

  it('날짜가 바뀌면 횟수가 0부터 다시 센다', async () => {
    store.set('aiUsage/u1', { date: '2000-01-01', count: 50 })
    expect((await call()).statusCode).toBe(200)
    expect(store.get('aiUsage/u1')).toMatchObject({ date: today, count: 1 })
  })

  it('입력이 너무 길면 413, 잘못된 도메인은 400이며 둘 다 횟수에 세지 않는다', async () => {
    expect((await call({ body: { domain: 'budget', messages: [{ content: 'x'.repeat(20001) }] } })).statusCode).toBe(413)
    expect((await call({ body: { domain: 'hack', messages: [{ content: 'x' }] } })).statusCode).toBe(400)
    expect(store.size).toBe(0)
  })

  it('temperature가 범위 밖이면 기본값으로 바꿔 보낸다', async () => {
    await call({ body: { domain: 'budget', temperature: 5, messages: [{ content: 'x' }] } })
    const sent = JSON.parse(globalThis.fetch.mock.calls[0][1].body)
    expect(sent.temperature).toBe(0.7)
  })

  it('AI 응답이 비면 내부 오류 원문 대신 일반 문구를 보낸다', async () => {
    globalThis.fetch = vi.fn(async () => ({ json: async () => ({ error: { message: 'credit balance too low' } }) }))
    const res = await call()
    expect(res.statusCode).toBe(502)
    expect(res.body.content[0].text).not.toMatch(/credit/)
  })
})
