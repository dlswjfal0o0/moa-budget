export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { messages, system } = req.body
    // system + messages를 하나의 프롬프트로 합치기
    const prompt = [system, messages[0]?.content].filter(Boolean).join('\n\n')

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    )
    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Anthropic 형식으로 응답 변환 (기존 코드 수정 최소화)
    res.status(200).json({ content: [{ text }] })
  } catch (err) {
    res.status(500).json({ error: 'AI 호출 실패' })
  }
}