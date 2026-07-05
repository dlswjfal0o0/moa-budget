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
        // 한국어 품질/지시 준수가 좋은 대형 모델로 교체 (기존 8B는 한자·깨진 글자 문제)
        model: 'openai/gpt-oss-120b',
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          { role: 'user', content: messages?.[0]?.content || '' }
        ],
        max_tokens: max_tokens || 1024,
        temperature: typeof temperature === 'number' ? temperature : 0.7
      })
    })

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ''

    if (!text) {
      return res.status(200).json({ content: [{ text: `Groq 오류: ${JSON.stringify(data).slice(0, 100)}` }] })
    }

    res.status(200).json({ content: [{ text }] })
  } catch (err) {
    res.status(200).json({ content: [{ text: `연결 오류: ${err.message}` }] })
  }
}