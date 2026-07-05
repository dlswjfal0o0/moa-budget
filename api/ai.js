export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const key = process.env.GROQ_API_KEY
  if (!key) {
    return res.status(200).json({ content: [{ text: 'GROQ_API_KEY가 없어요.' }] })
  }

  const { messages, system, temperature, max_tokens } = req.body || {}

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        // 한국어 품질/지시 준수가 좋은 대형 모델 (비추론 → content가 바로 채워짐).
        // gpt-oss 계열은 추론 모델이라 토큰 소진 시 content가 비어 오류가 났음.
        model: 'llama-3.3-70b-versatile',
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          { role: 'user', content: messages?.[0]?.content || '' }
        ],
        max_tokens: max_tokens || 1024,
        temperature: typeof temperature === 'number' ? temperature : 0.7
      })
    })

    const data = await response.json()
    const msg = data.choices?.[0]?.message || {}
    // content 우선, 비어 있으면 reasoning 필드로 폴백 (추론 모델 대비)
    const text = (msg.content || msg.reasoning || '').trim()

    if (!text) {
      const reason = data.error?.message || JSON.stringify(data).slice(0, 200)
      return res.status(200).json({ content: [{ text: `Groq 오류: ${reason}` }] })
    }

    res.status(200).json({ content: [{ text }] })
  } catch (err) {
    res.status(200).json({ content: [{ text: `연결 오류: ${err.message}` }] })
  }
}