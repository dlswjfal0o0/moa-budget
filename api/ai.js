export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    return res.status(200).json({ content: [{ text: 'ANTHROPIC_API_KEY가 없어요.' }] })
  }

  const { messages, system, temperature, max_tokens } = req.body || {}

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
        ...(system ? { system } : {}),
        messages: [
          { role: 'user', content: messages?.[0]?.content || '' }
        ],
        max_tokens: max_tokens || 1024,
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
