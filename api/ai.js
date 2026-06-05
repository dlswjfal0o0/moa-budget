export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  if (!process.env.GEMINI_API_KEY) {
    return res.status(200).json({ content: [{ text: 'GEMINI_API_KEY가 설정되지 않았어요.' }] })
  }

  const { messages, system } = req.body || {}

  try {
    const prompt = [system, messages?.[0]?.content].filter(Boolean).join('\n\n')

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
        })
      }
    )

    const data = await response.json()

    if (!response.ok) {
      const errMsg = data?.error?.message || '알 수 없는 오류'
      return res.status(200).json({ content: [{ text: `Gemini 오류: ${errMsg}` }] })
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    if (!text) {
      return res.status(200).json({ content: [{ text: '응답이 비어있어요. 잠시 후 다시 시도해주세요.' }] })
    }

    res.status(200).json({ content: [{ text }] })
  } catch (err) {
    res.status(200).json({ content: [{ text: `연결 오류: ${err.message}` }] })
  }
}